const {
  clientSchema,
  contractSchema,
  paymentSchema,
  userSchema,
  loginSchema,
  changePasswordSchema
} = require('../validators/schemas');

// Middleware genérico para validação
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retorna todos os erros, não apenas o primeiro
      stripUnknown: true // Remove campos não definidos no schema
    });

    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        })),
        timestamp: new Date().toISOString()
      });
    }

    // Substitui req.body pelos dados validados e limpos
    req.body = value;
    next();
  };
};

// Middleware para validação de parâmetros de query
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Parâmetros de consulta inválidos',
        code: 'QUERY_VALIDATION_ERROR',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        })),
        timestamp: new Date().toISOString()
      });
    }

    req.query = value;
    next();
  };
};

// Middleware para validação de parâmetros de rota
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Parâmetros de rota inválidos',
        code: 'PARAMS_VALIDATION_ERROR',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        })),
        timestamp: new Date().toISOString()
      });
    }

    req.params = value;
    next();
  };
};

// Middlewares específicos para cada entidade
const validateClient = validate(clientSchema);
const validateContract = validate(contractSchema);
const validatePayment = validate(paymentSchema);
const validateUser = validate(userSchema);
const validateLogin = validate(loginSchema);
const validateChangePassword = validate(changePasswordSchema);

// Schema para validação de atualização (campos opcionais)
const createUpdateSchema = (baseSchema) => {
  const updateSchema = {};
  
  Object.keys(baseSchema.describe().keys).forEach(key => {
    const field = baseSchema.extract(key);
    updateSchema[key] = field.optional();
  });
  
  return baseSchema.fork(Object.keys(updateSchema), (schema) => schema.optional());
};

// Middlewares para validação de atualização
const validateClientUpdate = validate(createUpdateSchema(clientSchema));
const validateContractUpdate = validate(createUpdateSchema(contractSchema));
const validatePaymentUpdate = validate(createUpdateSchema(paymentSchema));
const validateUserUpdate = validate(createUpdateSchema(userSchema));

module.exports = {
  validate,
  validateQuery,
  validateParams,
  validateClient,
  validateContract,
  validatePayment,
  validateUser,
  validateLogin,
  validateChangePassword,
  validateClientUpdate,
  validateContractUpdate,
  validatePaymentUpdate,
  validateUserUpdate
};