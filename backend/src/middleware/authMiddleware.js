const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/supabase');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    // Em desenvolvimento, bypass da autenticação
    if (process.env.NODE_ENV === 'development') {
      req.user = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        role: 'admin'
      };
      return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso requerido',
        code: 'MISSING_TOKEN'
      });
    }

    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('Erro na verificação do token:', error);
      return res.status(401).json({ 
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      });
    }

    console.log('Usuário do token:', user.id, user.email);

    // Buscar dados completos do usuário usando user_id
    const { data: userData, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('Resultado da busca user_profiles:', { userData, userError });

    if (userError || !userData) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado no sistema',
        code: 'USER_NOT_FOUND'
      });
    }

    // Comentado: campo is_active não existe na tabela user_profiles
    // if (!userData.is_active) {
    //   return res.status(401).json({ 
    //     error: 'Usuário inativo',
    //     code: 'USER_INACTIVE'
    //   });
    // }

    req.user = userData;
    req.supabaseUser = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado. Permissões insuficientes.',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: userRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware removido - tabela branches não existe mais
// const requireBranchAccess = ...

// Middleware para verificar se o usuário pode acessar dados de um cliente específico
const requireClientAccess = async (req, res, next) => {
  try {
    const clientId = req.params.clientId || req.body.client_id;
    
    if (!clientId) {
      return next(); // Se não há clientId, prosseguir
    }

    // Admins e analistas podem acessar qualquer cliente
    if (['admin', 'analyst'].includes(req.user.role)) {
      return next();
    }

    // Clientes só podem acessar seus próprios dados
    if (req.user.role === 'client' && req.user.client_id !== clientId) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você só pode acessar seus próprios dados.',
        code: 'CLIENT_ACCESS_DENIED'
      });
    }

    // Verificação de filial removida - tabela branches não existe mais
    // Recepção pode acessar todos os clientes

    next();
  } catch (error) {
    console.error('Erro na verificação de acesso ao cliente:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  // requireBranchAccess removido - tabela branches não existe mais
  requireClientAccess
};