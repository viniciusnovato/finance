const { DashboardService } = require('../services/DashboardService');
const { asyncHandler } = require('../middleware/errorMiddleware');

class DashboardController {
  /**
   * Obter estatísticas gerais do dashboard
   * @route GET /api/dashboard/stats
   * @access Public (temporário para desenvolvimento)
   */
  static getStats = asyncHandler(async (req, res) => {
    const { period = '30' } = req.query;
    
    try {
      const stats = await DashboardService.getStats(period);
      res.json({ stats });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'STATS_FETCH_ERROR'
      });
    }
  });

  /**
   * Obter gráfico de receita por período
   * @route GET /api/dashboard/revenue-chart
   * @access Private
   */
  static getRevenueChart = asyncHandler(async (req, res) => {
    const { period = '12', type = 'monthly' } = req.query;
    
    try {
      const chartData = await DashboardService.getRevenueChart(period, type);
      res.json(chartData);
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'CHART_FETCH_ERROR'
      });
    }
  });

  /**
   * Obter gráfico de pagamentos por status
   * @route GET /api/dashboard/payments-chart
   * @access Private
   */
  static getPaymentsChart = asyncHandler(async (req, res) => {
    const { period = '30' } = req.query;
    
    try {
      const chartData = await DashboardService.getPaymentsChart(period);
      res.json(chartData);
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico de pagamentos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'PAYMENTS_CHART_FETCH_ERROR'
      });
    }
  });

  /**
   * Obter atividades recentes
   * @route GET /api/dashboard/recent-activities
   * @access Private
   */
  static getRecentActivities = asyncHandler(async (req, res) => {
    const { limit = '10' } = req.query;
    
    try {
      const activities = await DashboardService.getRecentActivities(limit);
      res.json({ activities });
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'ACTIVITIES_FETCH_ERROR'
      });
    }
  });
}

module.exports = { DashboardController };