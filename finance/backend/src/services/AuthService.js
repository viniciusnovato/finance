const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { ValidationHelper } = require('../utils/validationHelper');

class AuthService {
  async login(email, password) {
    try {
      // Validar entrada
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }

      if (!validateEmail(email)) {
        throw new Error('Email inválido');
      }

      // Autenticar com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw new Error('Credenciais inválidas');
      }

      // Buscar dados completos do usuário
      const { data: userData, error: userError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        throw new Error('Usuário não encontrado no sistema');
      }

      // Verificar se o usuário está ativo
      if (userData.is_active === false) {
        throw new Error('Usuário inativo');
      }

      // Preparar dados do usuário para o token
      const userPayload = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        branch_id: userData.branch_id
      };

      return {
        user: userPayload,
        token: authData.session.access_token,
        expires_in: authData.session.expires_in
      };
    } catch (error) {
      throw new Error(`Erro no login: ${error.message}`);
    }
  }

  async logout(token) {
    try {
      if (token) {
        await supabase.auth.signOut();
      }
      return true;
    } catch (error) {
      throw new Error(`Erro no logout: ${error.message}`);
    }
  }

  async register(userData, adminUser) {
    try {
      const { email, password, name, role = 'user', branch_id } = userData;

      // Validações
      if (!email || !password || !name) {
        throw new Error('Email, senha e nome são obrigatórios');
      }

      if (!ValidationHelper.isValidEmail(email)) {
        throw new Error('Email inválido');
      }

      if (!ValidationHelper.isValidPassword(password)) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }

      // Verificar se admin pode criar usuário nesta filial
      if (adminUser.role !== 'admin' && branch_id !== adminUser.branch_id) {
        throw new Error('Você só pode criar usuários para sua filial');
      }

      // Verificar se email já existe
      const { data: existingUser } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('Email já está em uso');
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      // Criar perfil do usuário
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email,
          name,
          role,
          branch_id,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (profileError) {
        // Se falhar ao criar perfil, deletar usuário do auth
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Erro ao criar perfil: ${profileError.message}`);
      }

      return {
        user: {
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          role: profileData.role,
          branch_id: profileData.branch_id,
          is_active: profileData.is_active
        }
      };
    } catch (error) {
      throw new Error(`Erro no registro: ${error.message}`);
    }
  }

  async getProfile(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('id, email, name, role, branch_id, is_active, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error || !data) {
        throw new Error('Perfil não encontrado');
      }

      return data;
    } catch (error) {
      throw new Error(`Erro ao obter perfil: ${error.message}`);
    }
  }

  async updateProfile(userId, updateData) {
    try {
      const { name, email } = updateData;
      const updates = {};

      if (name) updates.name = name;
      if (email && ValidationHelper.isValidEmail(email)) {
        // Verificar se email já existe
        const { data: existingUser } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('email', email)
          .neq('id', userId)
          .single();

        if (existingUser) {
          throw new Error('Email já está em uso');
        }

        updates.email = email;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('Nenhum dado válido para atualizar');
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erro ao atualizar perfil: ${error.message}`);
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      if (!currentPassword || !newPassword) {
        throw new Error('Senha atual e nova senha são obrigatórias');
      }

      if (!ValidationHelper.isValidPassword(newPassword)) {
        throw new Error('Nova senha deve ter pelo menos 6 caracteres');
      }

      // Verificar senha atual
      const { data: user } = await supabaseAdmin
        .from('user_profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Tentar fazer login com senha atual para validar
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (loginError) {
        throw new Error('Senha atual incorreta');
      }

      // Atualizar senha
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        throw new Error(`Erro ao alterar senha: ${updateError.message}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Erro ao alterar senha: ${error.message}`);
    }
  }

  async forgotPassword(email) {
    try {
      if (!email || !ValidationHelper.isValidEmail(email)) {
        throw new Error('Email válido é obrigatório');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        throw new Error(`Erro ao enviar email de reset: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Erro ao solicitar reset de senha: ${error.message}`);
    }
  }

  async resetPassword(token, newPassword) {
    try {
      if (!token || !newPassword) {
        throw new Error('Token e nova senha são obrigatórios');
      }

      if (!ValidationHelper.isValidPassword(newPassword)) {
        throw new Error('Nova senha deve ter pelo menos 6 caracteres');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error(`Erro ao redefinir senha: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Erro ao redefinir senha: ${error.message}`);
    }
  }

  async getUsers(filters, adminUser) {
    try {
      const { page, limit, search, role, is_active } = filters;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('user_profiles')
        .select('id, email, name, role, branch_id, is_active, created_at, updated_at', { count: 'exact' });

      // Filtrar por filial se não for admin
      if (adminUser.role !== 'admin' && adminUser.branch_id) {
        query = query.eq('branch_id', adminUser.branch_id);
      }

      // Aplicar filtros
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (role) {
        query = query.eq('role', role);
      }

      if (is_active !== undefined) {
        query = query.eq('is_active', is_active);
      }

      // Paginação
      query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Erro ao buscar usuários: ${error.message}`);
      }

      return {
        users: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar usuários: ${error.message}`);
    }
  }

  async getUserById(id, adminUser) {
    try {
      let query = supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', id);

      // Filtrar por filial se não for admin
      if (adminUser.role !== 'admin' && adminUser.branch_id) {
        query = query.eq('branch_id', adminUser.branch_id);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        throw new Error('Usuário não encontrado');
      }

      return data;
    } catch (error) {
      throw new Error(`Erro ao obter usuário: ${error.message}`);
    }
  }

  async updateUser(id, updateData, adminUser) {
    try {
      // Verificar se usuário existe e se admin tem acesso
      const existingUser = await this.getUserById(id, adminUser);

      const { name, email, role, branch_id, is_active } = updateData;
      const updates = {};

      if (name) updates.name = name;
      if (email && validateEmail(email)) {
        // Verificar se email já existe
        const { data: emailExists } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('email', email)
          .neq('id', id)
          .single();

        if (emailExists) {
          throw new Error('Email já está em uso');
        }

        updates.email = email;
      }

      if (role && adminUser.role === 'admin') {
        updates.role = role;
      }

      if (branch_id && adminUser.role === 'admin') {
        updates.branch_id = branch_id;
      }

      if (is_active !== undefined && adminUser.role === 'admin') {
        updates.is_active = is_active;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('Nenhum dado válido para atualizar');
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar usuário: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }
  }

  async updateUserStatus(id, is_active, adminUser) {
    try {
      if (adminUser.role !== 'admin') {
        throw new Error('Apenas administradores podem alterar status de usuários');
      }

      // Verificar se usuário existe
      const existingUser = await this.getUserById(id, adminUser);

      // Não permitir desativar o próprio usuário
      if (id === adminUser.id && !is_active) {
        throw new Error('Você não pode desativar sua própria conta');
      }

      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .update({
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar status: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Erro ao atualizar status do usuário: ${error.message}`);
    }
  }

  async deleteUser(id, adminUser) {
    try {
      if (adminUser.role !== 'admin') {
        throw new Error('Apenas administradores podem deletar usuários');
      }

      // Verificar se usuário existe
      const existingUser = await this.getUserById(id, adminUser);

      // Não permitir deletar o próprio usuário
      if (id === adminUser.id) {
        throw new Error('Você não pode deletar sua própria conta');
      }

      // Deletar perfil
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', id);

      if (profileError) {
        throw new Error(`Erro ao deletar perfil: ${profileError.message}`);
      }

      // Deletar usuário do auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

      if (authError) {
        throw new Error(`Erro ao deletar usuário do auth: ${authError.message}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Erro ao deletar usuário: ${error.message}`);
    }
  }

  async refreshToken(refresh_token) {
    try {
      if (!refresh_token) {
        throw new Error('Refresh token é obrigatório');
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token
      });

      if (error) {
        throw new Error('Token inválido ou expirado');
      }

      return {
        token: data.session.access_token,
        expires_in: data.session.expires_in
      };
    } catch (error) {
      throw new Error(`Erro ao renovar token: ${error.message}`);
    }
  }
}

module.exports = new AuthService();