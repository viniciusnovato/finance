const express = require('express');
const { authenticateToken: authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { validateLogin, validateUser, validateChangePassword } = require('../middleware/validationMiddleware');
const AuthController = require('../controllers/AuthController');
const asyncHandler = require('express-async-handler');

const router = express.Router();

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, AuthController.login);

// @desc    Logout de usuário
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authMiddleware, AuthController.logout);

// @desc    Registrar novo usuário
// @route   POST /api/auth/register
// @access  Private (Admin only)
router.post('/register', authMiddleware, requireRole(['admin']), validateUser, AuthController.register);

// @desc    Obter perfil do usuário atual
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', authMiddleware, AuthController.getProfile);

// @desc    Atualizar perfil do usuário
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', authMiddleware, AuthController.updateProfile);

// @desc    Alterar senha
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', authMiddleware, validateChangePassword, AuthController.changePassword);

// @desc    Solicitar reset de senha
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', AuthController.forgotPassword);

// @desc    Reset de senha
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', AuthController.resetPassword);

// @desc    Verificar token
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', authMiddleware, AuthController.verifyToken);

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', AuthController.refreshToken);

// Rotas de gerenciamento de usuários (Admin only)
// @desc    Listar usuários
// @route   GET /api/auth/users
// @access  Private (Admin only)
router.get('/users', authMiddleware, requireRole(['admin']), AuthController.getUsers);

// @desc    Obter usuário por ID
// @route   GET /api/auth/users/:id
// @access  Private (Admin only)
router.get('/users/:id', authMiddleware, requireRole(['admin']), AuthController.getUser);

// @desc    Atualizar usuário
// @route   PUT /api/auth/users/:id
// @access  Private (Admin only)
router.put('/users/:id', authMiddleware, requireRole(['admin']), validateUser, AuthController.updateUser);

// @desc    Ativar/Desativar usuário
// @route   PATCH /api/auth/users/:id/status
// @access  Private (Admin only)
router.patch('/users/:id/status', authMiddleware, requireRole(['admin']), AuthController.updateUserStatus);

// @desc    Deletar usuário
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin only)
router.delete('/users/:id', authMiddleware, requireRole(['admin']), AuthController.deleteUser);

module.exports = router;