const express = require('express');
const { PaymentControllerRefactored } = require('../controllers/PaymentControllerRefactored');
const { authenticateToken: authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas de pagamentos
router.get('/', PaymentControllerRefactored.getAllPayments);
router.get('/search', PaymentControllerRefactored.searchPaymentsByTerm);
router.get('/overdue', PaymentControllerRefactored.getOverduePayments);
router.get('/due-today', PaymentControllerRefactored.getPaymentsDueToday);
router.get('/stats', PaymentControllerRefactored.getPaymentStats);
// router.get('/revenue-chart', PaymentControllerRefactored.getRevenueChart); // Método não implementado
// router.get('/export', PaymentControllerRefactored.exportPayments); // Método não implementado
// router.get('/contract/:contractId', PaymentControllerRefactored.getPaymentsByContract); // Método não implementado
// router.get('/client/:clientId', PaymentControllerRefactored.getPaymentsByClient); // Método não implementado
router.get('/:id', PaymentControllerRefactored.getPaymentById);
// router.get('/:id/receipt', PaymentControllerRefactored.generateReceipt); // Método não implementado

router.post('/', PaymentControllerRefactored.createNewPayment);
// router.post('/bulk-update', PaymentControllerRefactored.bulkUpdatePayments); // Método não implementado
router.post('/:id/confirm', PaymentControllerRefactored.confirmPayment);
// router.post('/:id/reminder', PaymentControllerRefactored.sendPaymentReminder); // Método não implementado

router.put('/:id', PaymentControllerRefactored.updateExistingPayment);
router.put('/:id/status', PaymentControllerRefactored.updatePaymentStatus);

router.delete('/:id', PaymentControllerRefactored.removePayment);

module.exports = router;