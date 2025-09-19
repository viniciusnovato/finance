// Middleware para rotas não encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware para tratamento de erros
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let code = err.code || 'INTERNAL_ERROR';

  // Erro de validação do Joi
  if (err.isJoi) {
    statusCode = 400;
    message = 'Dados inválidos';
    code = 'VALIDATION_ERROR';
    
    return res.status(statusCode).json({
      error: message,
      code,
      details: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })),
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  }

  // Erro do Supabase
  if (err.code && err.code.startsWith('PGRST')) {
    statusCode = 400;
    message = 'Erro na operação do banco de dados';
    code = 'DATABASE_ERROR';
  }

  // Erro de token JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
    code = 'EXPIRED_TOKEN';
  }

  // Erro de arquivo muito grande
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'Arquivo muito grande';
    code = 'FILE_TOO_LARGE';
  }

  // Log do erro em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Stack:', err.stack);
  }

  res.status(statusCode).json({
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
};

// Middleware para capturar erros assíncronos
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler
};