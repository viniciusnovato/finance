const Joi = require('joi');

// Schema para validação de clientes
const clientSchema = Joi.object({
  first_name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 255 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  last_name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Sobrenome deve ter pelo menos 2 caracteres',
    'string.max': 'Sobrenome deve ter no máximo 255 caracteres',
    'any.required': 'Sobrenome é obrigatório'
  }),
  email: Joi.string().email().max(255).messages({
    'string.email': 'Email deve ter um formato válido',
    'string.max': 'Email deve ter no máximo 255 caracteres'
  }),
  phone: Joi.string().max(50).allow('', null),
  mobile: Joi.string().max(50).allow('', null),
  tax_id: Joi.string().max(50).allow('', null),
  birth_date: Joi.date().iso().allow(null),
  address: Joi.string().allow('', null),
  city: Joi.string().max(100).allow('', null),
  postal_code: Joi.string().max(20).allow('', null),
  country: Joi.string().max(100).default('Portugal'),
  notes: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'inactive').default('active')
});

// Schema para validação de contratos
const contractSchema = Joi.object({
  contract_number: Joi.string().max(50).required().messages({
    'any.required': 'Número do contrato é obrigatório'
  }),
  client_id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID do cliente deve ser um UUID válido',
    'any.required': 'Cliente é obrigatório'
  }),
  // Removido branch_id - tabela branches não existe mais
  treatment_description: Joi.string().min(10).required().messages({
    'string.min': 'Descrição do tratamento deve ter pelo menos 10 caracteres',
    'any.required': 'Descrição do tratamento é obrigatória'
  }),
  total_amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Valor total deve ser positivo',
    'any.required': 'Valor total é obrigatório'
  }),
  down_payment: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Entrada deve ser positiva',
    'any.required': 'Entrada é obrigatória'
  }),
  installments: Joi.number().integer().min(1).max(24).required().messages({
    'number.min': 'Número de parcelas deve ser pelo menos 1',
    'number.max': 'Número de parcelas deve ser no máximo 24',
    'any.required': 'Número de parcelas é obrigatório'
  }),
  installment_amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Valor da parcela deve ser positivo',
    'any.required': 'Valor da parcela é obrigatório'
  }),
  status: Joi.string().valid('draft', 'validated', 'active', 'defaulting', 'paid_off', 'closed').default('draft'),
  start_date: Joi.date().iso().allow(null),
  end_date: Joi.date().iso().allow(null),
  notes: Joi.string().allow('', null)
}).custom((value, helpers) => {
  // Validar que a entrada é pelo menos 30% do valor total
  if (value.down_payment < value.total_amount * 0.30) {
    return helpers.error('custom.downPaymentMinimum');
  }
  
  // Validar que as datas fazem sentido
  if (value.start_date && value.end_date && new Date(value.start_date) >= new Date(value.end_date)) {
    return helpers.error('custom.invalidDateRange');
  }
  
  return value;
}, 'Validação customizada do contrato').messages({
  'custom.downPaymentMinimum': 'Entrada deve ser pelo menos 30% do valor total',
  'custom.invalidDateRange': 'Data de início deve ser anterior à data de fim'
});

// Schema para validação de pagamentos
const paymentSchema = Joi.object({
  contract_id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID do contrato deve ser um UUID válido',
    'any.required': 'Contrato é obrigatório'
  }),
  installment_number: Joi.number().integer().min(1).required().messages({
    'number.min': 'Número da parcela deve ser pelo menos 1',
    'any.required': 'Número da parcela é obrigatório'
  }),
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Valor deve ser positivo',
    'any.required': 'Valor é obrigatório'
  }),
  due_date: Joi.date().iso().required().messages({
    'any.required': 'Data de vencimento é obrigatória'
  }),
  paid_date: Joi.date().iso().allow(null),
  payment_method: Joi.string().valid(
    'mbway', 'cash', 'transfer', 'sepa', 'credit_card', 'direct_debit', 'payment_order'
  ).allow(null),
  status: Joi.string().valid('pending', 'paid', 'overdue', 'failed', 'cancelled').default('pending'),
  reference_number: Joi.string().max(100).allow('', null),
  notes: Joi.string().allow('', null)
});

// Schema removido - tabela companies não existe mais
// const companySchema = ...

// Schema removido - tabela branches não existe mais
// const branchSchema = ...

// Schema removido - tabela users não existe mais
// const userSchema = ...

// Schema para login
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter um formato válido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Senha é obrigatória'
  })
});

// Schema para atualização de senha
const changePasswordSchema = Joi.object({
  current_password: Joi.string().required().messages({
    'any.required': 'Senha atual é obrigatória'
  }),
  new_password: Joi.string().min(8).required().messages({
    'string.min': 'Nova senha deve ter pelo menos 8 caracteres',
    'any.required': 'Nova senha é obrigatória'
  })
});

// Schema para validação de usuários
const userSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter um formato válido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Senha deve ter pelo menos 8 caracteres',
    'any.required': 'Senha é obrigatória'
  }),
  first_name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 255 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  last_name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Sobrenome deve ter pelo menos 2 caracteres',
    'string.max': 'Sobrenome deve ter no máximo 255 caracteres',
    'any.required': 'Sobrenome é obrigatório'
  }),
  role: Joi.string().valid('admin', 'user', 'manager').default('user'),
  branch_id: Joi.string().uuid().allow(null),
  client_id: Joi.string().uuid().allow(null)
});

module.exports = {
  clientSchema,
  contractSchema,
  paymentSchema,
  userSchema,
  loginSchema,
  changePasswordSchema
};