const express = require('express');
const { authenticateToken: authMiddleware } = require('../middleware/authMiddleware');
const { ContractControllerRefactored } = require('../controllers/ContractControllerRefactored');

const router = express.Router();

// @desc    Listar todos os contratos
// @route   GET /api/contracts
// @access  Private
router.get('/', authMiddleware, ContractControllerRefactored.getAllContracts);

// @desc    Obter contrato por ID
// @route   GET /api/contracts/:id
// @access  Private
router.get('/:id', authMiddleware, ContractControllerRefactored.getContractById);

// @desc    Criar novo contrato
// @route   POST /api/contracts
// @access  Private
router.post('/', authMiddleware, ContractControllerRefactored.createNewContract);

// @desc    Atualizar contrato
// @route   PUT /api/contracts/:id
// @access  Private
router.put('/:id', authMiddleware, ContractControllerRefactored.updateExistingContract);

// @desc    Alterar status do contrato
// @route   PATCH /api/contracts/:id/status
// @access  Private
router.patch('/:id/status', authMiddleware, ContractControllerRefactored.updateContractStatus);

// @desc    Deletar contrato
// @route   DELETE /api/contracts/:id
// @access  Private (Admin only)
router.delete('/:id', authMiddleware, ContractControllerRefactored.removeContract);

// @desc    Gerar parcelas do contrato
// @route   POST /api/contracts/:id/generate-installments
// @access  Private
router.post('/:id/generate-installments', authMiddleware, ContractControllerRefactored.generateInstallments);

module.exports = router;