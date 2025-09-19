const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { validateLogin, validateUser, validateChangePassword } = require('../middleware/validationMiddleware');

const router = express.Router();

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Autenticar com Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Buscar dados completos do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return res.status(401).json({
        error: 'Usuário não encontrado no sistema',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar se o usuário está ativo (assumindo que todos os perfis são ativos por padrão)
    // if (!userData.is_active) {
    //   return res.status(401).json({
    //     error: 'Usuário inativo',
    //     code: 'USER_INACTIVE'
    //   });
    // }

    // Atualizar último login
    await supabaseAdmin
      .from('user_profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userData.id);

    // Remover dados sensíveis
    const { password_hash, ...userResponse } = userData;

    res.json({
      message: 'Login realizado com sucesso',
      user: userResponse,
      session: authData.session,
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
}));

// @desc    Registro de novo usuário
// @route   POST /api/auth/register
// @access  Private (Admin only)
router.post('/register', authenticateToken, requireRole('admin'), validateUser, asyncHandler(async (req, res) => {
  const { email, password, first_name, last_name, role, branch_id, client_id } = req.body;

  try {
    // Verificar se o email já existe
    const { data: existingUser } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        error: 'Email já está em uso',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({
        error: 'Erro ao criar usuário na autenticação',
        code: 'AUTH_CREATE_ERROR',
        details: authError.message
      });
    }

    // Hash da senha para armazenar na tabela users
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Criar usuário na tabela user_profiles
    const { data: userData, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        branch_id,
        client_id,
        created_by: req.user.id
      })
      .select(`
        *,
        client:clients(*)
      `)
      .single();

    if (userError) {
      // Se falhar ao criar na tabela users, remover do Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return res.status(400).json({
        error: 'Erro ao criar usuário no sistema',
        code: 'USER_CREATE_ERROR',
        details: userError.message
      });
    }

    // Remover dados sensíveis
    const { password_hash: _, ...userResponse } = userData;

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: userResponse
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
}));

// @desc    Logout de usuário
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({
        error: 'Erro ao fazer logout',
        code: 'LOGOUT_ERROR'
      });
    }

    res.json({
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
}));

// @desc    Obter perfil do usuário atual
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  // Remover dados sensíveis
  const { password_hash, ...userResponse } = req.user;
  
  res.json({
    user: userResponse
  });
}));

// @desc    Atualizar perfil do usuário atual
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const { first_name, last_name, phone, mobile } = req.body;
  const userId = req.user.id;

  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        email: req.user.email, // manter email
        role: req.user.role, // manter role
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({
        error: 'Erro ao atualizar perfil',
        code: 'PROFILE_UPDATE_ERROR',
        details: error.message
      });
    }

    // Remover dados sensíveis
    const { password_hash, ...userResponse } = data;

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: userResponse
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
}));

// @desc    Alterar senha
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', authenticateToken, validateChangePassword, asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  const userId = req.user.id;

  try {
    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(current_password, req.user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Senha atual incorreta',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Atualizar senha no Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: new_password
    });

    if (authError) {
      return res.status(400).json({
        error: 'Erro ao atualizar senha na autenticação',
        code: 'AUTH_PASSWORD_UPDATE_ERROR',
        details: authError.message
      });
    }

    // Atualizar hash da senha na tabela users
    const saltRounds = 12;
    const new_password_hash = await bcrypt.hash(new_password, saltRounds);

    // Atualizar timestamp no perfil do usuário
    const { error: userError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (userError) {
      console.log('Aviso: Não foi possível atualizar timestamp do perfil:', userError.message);
    }

    res.json({
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
}));

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      error: 'Refresh token é obrigatório',
      code: 'MISSING_REFRESH_TOKEN'
    });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({
        error: 'Refresh token inválido',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    res.json({
      message: 'Token renovado com sucesso',
      session: data.session,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
}));

module.exports = router;