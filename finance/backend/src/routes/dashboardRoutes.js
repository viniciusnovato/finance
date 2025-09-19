const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { DashboardController } = require('../controllers/DashboardController');
const asyncHandler = require('express-async-handler');

const router = express.Router();

// @desc    Obter estatísticas gerais do dashboard
// @route   GET /api/dashboard/stats
// @access  Public (temporário para desenvolvimento)
router.get('/stats', DashboardController.getStats);

// @desc    Obter gráfico de receita por período
// @route   GET /api/dashboard/revenue-chart
// @access  Private
router.get('/revenue-chart', authenticateToken, DashboardController.getRevenueChart);

// @desc    Obter lista de pagamentos vencidos
// @route   GET /api/dashboard/overdue-payments
// @access  Private
// router.get('/overdue-payments', authenticateToken, DashboardController.getOverduePayments); // Método não implementado

// @desc    Obter próximos vencimentos
// @route   GET /api/dashboard/upcoming-payments
// @access  Private
// router.get('/upcoming-payments', authenticateToken, DashboardController.getUpcomingPayments); // Método não implementado

// @desc    Obter resumo por filial - REMOVIDO
// @route   GET /api/dashboard/branch-summary
// @access  Private
// Funcionalidade removida pois a tabela 'branches' não existe mais
router.get('/branch-summary', authenticateToken, asyncHandler(async (req, res) => {
  res.status(404).json({
    error: 'Funcionalidade não disponível',
    code: 'FEATURE_REMOVED',
    message: 'O resumo por filial foi removido do sistema'
  });
}));

module.exports = router;