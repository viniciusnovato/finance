const express = require('express');
const { authenticateToken: authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const { ClientControllerRefactored } = require('../controllers/ClientControllerRefactored');
const { ClientController } = require('../controllers/ClientController');
const router = express.Router();

// @desc    Listar todos os clientes
// @route   GET /api/clients
// @access  Private
router.get('/', authMiddleware, asyncHandler(ClientControllerRefactored.getAllClients));

// @desc    Obter cliente por ID
// @route   GET /api/clients/:id
// @access  Private
router.get('/:id', authMiddleware, asyncHandler(ClientControllerRefactored.getClientById));

// @desc    Criar novo cliente
// @route   POST /api/clients
// @access  Private
router.post('/', authMiddleware, asyncHandler(ClientControllerRefactored.createNewClient));

// @desc    Atualizar cliente
// @route   PUT /api/clients/:id
// @access  Private
router.put('/:id', authMiddleware, asyncHandler(ClientControllerRefactored.updateExistingClient));

// @desc    Desativar/Ativar cliente
// @route   PATCH /api/clients/:id/status
// @access  Private
router.patch('/:id/status', authMiddleware, asyncHandler(ClientController.updateClientStatus));

// @desc    Deletar cliente
// @route   DELETE /api/clients/:id
// @access  Private (Admin only)
router.delete('/:id', authMiddleware, asyncHandler(ClientControllerRefactored.removeClient));

// @desc    Buscar clientes
// @route   GET /api/clients/search
// @access  Private
router.get('/search', authMiddleware, asyncHandler(ClientControllerRefactored.searchClientsByTerm));

// @desc    Buscar clientes por documento
// @route   GET /api/clients/search/document/:document
// @access  Private
router.get('/search/document/:document', authMiddleware, asyncHandler(ClientController.searchByDocument));

// @desc    Obter contratos do cliente
// @route   GET /api/clients/:id/contracts
// @access  Private
router.get('/:id/contracts', authMiddleware, asyncHandler(ClientControllerRefactored.getClientContracts));

// @desc    Obter pagamentos do cliente
// @route   GET /api/clients/:id/payments
// @access  Private
router.get('/:id/payments', authMiddleware, asyncHandler(ClientControllerRefactored.getClientPayments));

// @desc    Obter estatísticas do cliente
// @route   GET /api/clients/:id/stats
// @access  Private
router.get('/:id/stats', authMiddleware, asyncHandler(ClientController.getClientStats));

// @desc    Exportar clientes
// @route   GET /api/clients/export
// @access  Private
router.get('/export', authMiddleware, asyncHandler(ClientController.exportClients));

module.exports = router;