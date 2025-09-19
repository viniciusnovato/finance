const AuthService = require('../services/AuthService');
const asyncHandler = require('express-async-handler');

class AuthController {
  // @desc    Login de usuário
  // @route   POST /api/auth/login
  // @access  Public
  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    const result = await AuthService.login(email, password);
    
    res.json({
      message: 'Login realizado com sucesso',
      user: result.user,
      token: result.token,
      expires_in: result.expires_in
    });
  });

  // @desc    Logout de usuário
  // @route   POST /api/auth/logout
  // @access  Private
  static logout = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    await AuthService.logout(token);
    
    res.json({
      message: 'Logout realizado com sucesso'
    });
  });

  // @desc    Registrar novo usuário
  // @route   POST /api/auth/register
  // @access  Private (Admin only)
  static register = asyncHandler(async (req, res) => {
    const userData = req.body;
    const adminUser = req.user;
    
    const result = await AuthService.register(userData, adminUser);
    
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: result.user
    });
  });

  // @desc    Obter perfil do usuário atual
  // @route   GET /api/auth/profile
  // @access  Private
  static getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const profile = await AuthService.getProfile(userId);
    
    res.json({
      user: profile
    });
  });

  // @desc    Atualizar perfil do usuário
  // @route   PUT /api/auth/profile
  // @access  Private
  static updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const updateData = req.body;
    
    const updatedProfile = await AuthService.updateProfile(userId, updateData);
    
    res.json({
      message: 'Perfil atualizado com sucesso',
      user: updatedProfile
    });
  });

  // @desc    Alterar senha
  // @route   PUT /api/auth/change-password
  // @access  Private
  static changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    await AuthService.changePassword(userId, currentPassword, newPassword);
    
    res.json({
      message: 'Senha alterada com sucesso'
    });
  });

  // @desc    Solicitar reset de senha
  // @route   POST /api/auth/forgot-password
  // @access  Public
  static forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    await AuthService.forgotPassword(email);
    
    res.json({
      message: 'Se o email existir, você receberá instruções para redefinir sua senha'
    });
  });

  // @desc    Reset de senha
  // @route   POST /api/auth/reset-password
  // @access  Public
  static resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    
    await AuthService.resetPassword(token, newPassword);
    
    res.json({
      message: 'Senha redefinida com sucesso'
    });
  });

  // @desc    Verificar token
  // @route   GET /api/auth/verify
  // @access  Private
  static verifyToken = asyncHandler(async (req, res) => {
    const user = req.user;
    
    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        branch_id: user.branch_id
      }
    });
  });

  // @desc    Listar usuários
  // @route   GET /api/auth/users
  // @access  Private (Admin only)
  static getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, role, is_active } = req.query;
    const adminUser = req.user;
    
    const result = await AuthService.getUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      role,
      is_active: is_active !== undefined ? is_active === 'true' : undefined
    }, adminUser);
    
    res.json(result);
  });

  // @desc    Obter usuário por ID
  // @route   GET /api/auth/users/:id
  // @access  Private (Admin only)
  static getUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminUser = req.user;
    
    const user = await AuthService.getUserById(id, adminUser);
    
    res.json({
      user
    });
  });

  // @desc    Atualizar usuário
  // @route   PUT /api/auth/users/:id
  // @access  Private (Admin only)
  static updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const adminUser = req.user;
    
    const updatedUser = await AuthService.updateUser(id, updateData, adminUser);
    
    res.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });
  });

  // @desc    Ativar/Desativar usuário
  // @route   PATCH /api/auth/users/:id/status
  // @access  Private (Admin only)
  static updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    const adminUser = req.user;
    
    const updatedUser = await AuthService.updateUserStatus(id, is_active, adminUser);
    
    res.json({
      message: `Usuário ${is_active ? 'ativado' : 'desativado'} com sucesso`,
      user: updatedUser
    });
  });

  // @desc    Deletar usuário
  // @route   DELETE /api/auth/users/:id
  // @access  Private (Admin only)
  static deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminUser = req.user;
    
    await AuthService.deleteUser(id, adminUser);
    
    res.json({
      message: 'Usuário deletado com sucesso'
    });
  });

  // @desc    Refresh token
  // @route   POST /api/auth/refresh
  // @access  Public
  static refreshToken = asyncHandler(async (req, res) => {
    const { refresh_token } = req.body;
    
    const result = await AuthService.refreshToken(refresh_token);
    
    res.json({
      message: 'Token renovado com sucesso',
      token: result.token,
      expires_in: result.expires_in
    });
  });
}

module.exports = AuthController;