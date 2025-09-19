# Backend - Sistema de Gestão Financeira

API REST desenvolvida em Node.js com Express e Supabase para gestão de contratos e pagamentos.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Supabase** - Backend as a Service (PostgreSQL)
- **JWT** - Autenticação
- **Joi** - Validação de dados
- **Multer** - Upload de arquivos
- **Helmet** - Segurança
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - Controle de taxa de requisições

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- NPM ou Yarn

## ⚙️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure as variáveis no arquivo `.env`:

```env
# Configurações do Supabase (OBRIGATÓRIO)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Secret (OBRIGATÓRIO)
JWT_SECRET=your-super-secret-jwt-key-here

# Outras configurações (opcional)
PORT=3001
NODE_ENV=development
```

### 3. Configurar banco de dados

#### Opção 1: Configuração automática (recomendado)
```bash
npm run db:setup
```

#### Opção 2: Passo a passo
```bash
# Executar migrações
npm run migrate

# Inserir dados de exemplo
npm run seed
```

### 4. Iniciar servidor

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

O servidor estará disponível em `http://localhost:3001`

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **companies** - Empresas
- **branches** - Filiais
- **users** - Usuários do sistema
- **clients** - Clientes
- **contracts** - Contratos de financiamento
- **payments** - Parcelas dos contratos
- **contract_documents** - Documentos anexados
- **predefined_notes** - Notas predefinidas
- **audit_logs** - Log de auditoria

### Views

- **defaulting_clients** - Clientes inadimplentes
- **active_contracts** - Contratos ativos
- **overdue_payments_by_branch** - Pagamentos em atraso por filial

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor com hot reload

# Produção
npm start               # Inicia servidor

# Banco de dados
npm run migrate         # Executa migrações
npm run migrate:direct  # Migração direta (método alternativo)
npm run seed            # Insere dados de exemplo
npm run seed:clear      # Remove dados de exemplo
npm run db:reset        # Migra e insere dados
npm run db:setup        # Configuração completa

# Testes
npm test               # Executa testes
```

## 🔐 Autenticação

O sistema usa JWT para autenticação. Todas as rotas (exceto login e registro) requerem token válido.

### Headers necessários:
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Níveis de acesso:
- **admin** - Acesso total
- **manager** - Gestão da filial
- **user** - Operações básicas
- **viewer** - Apenas visualização

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Perfil do usuário
- `PUT /api/auth/profile` - Atualizar perfil
- `POST /api/auth/change-password` - Alterar senha
- `POST /api/auth/refresh` - Renovar token

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Criar cliente
- `GET /api/clients/:id` - Buscar cliente
- `PUT /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Excluir cliente
- `PATCH /api/clients/:id/toggle-status` - Ativar/desativar
- `GET /api/clients/search/:document` - Buscar por documento

### Contratos
- `GET /api/contracts` - Listar contratos
- `POST /api/contracts` - Criar contrato
- `GET /api/contracts/:id` - Buscar contrato
- `PUT /api/contracts/:id` - Atualizar contrato
- `DELETE /api/contracts/:id` - Excluir contrato
- `PATCH /api/contracts/:id/status` - Alterar status
- `POST /api/contracts/:id/generate-installments` - Gerar parcelas

### Pagamentos
- `GET /api/payments` - Listar pagamentos
- `POST /api/payments` - Criar pagamento
- `GET /api/payments/:id` - Buscar pagamento
- `PUT /api/payments/:id` - Atualizar pagamento
- `DELETE /api/payments/:id` - Excluir pagamento
- `PATCH /api/payments/:id/mark-paid` - Marcar como pago
- `PATCH /api/payments/:id/cancel` - Cancelar pagamento
- `GET /api/payments/summary` - Resumo de pagamentos

### Empresas e Filiais
- `GET /api/companies` - Listar empresas
- `POST /api/companies` - Criar empresa
- `GET /api/companies/:id` - Buscar empresa
- `PUT /api/companies/:id` - Atualizar empresa
- `GET /api/companies/:id/branches` - Filiais da empresa
- `POST /api/companies/:id/branches` - Criar filial
- `PUT /api/companies/:companyId/branches/:branchId` - Atualizar filial

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas gerais
- `GET /api/dashboard/revenue-chart` - Gráfico de receita
- `GET /api/dashboard/overdue-payments` - Pagamentos em atraso
- `GET /api/dashboard/upcoming-payments` - Próximos pagamentos
- `GET /api/dashboard/branch-summary` - Resumo por filial (admin)

## 🔍 Filtros e Paginação

Todas as listagens suportam:

```
GET /api/clients?page=1&limit=10&search=João&status=active&branch_id=uuid
```

### Parâmetros:
- `page` - Página (padrão: 1)
- `limit` - Itens por página (padrão: 10, máx: 100)
- `search` - Busca por nome/documento
- `status` - Filtro por status
- `branch_id` - Filtro por filial
- `sort` - Campo para ordenação
- `order` - Direção (asc/desc)

## 🛡️ Segurança

- **Helmet** - Headers de segurança
- **CORS** - Controle de origem
- **Rate Limiting** - Limite de requisições
- **JWT** - Tokens seguros
- **Validação** - Joi para validar dados
- **Sanitização** - Limpeza de inputs
- **Auditoria** - Log de todas as operações

## 📁 Estrutura de Arquivos

```
src/
├── config/
│   └── supabase.js         # Configuração Supabase
├── middleware/
│   ├── authMiddleware.js   # Autenticação
│   ├── errorMiddleware.js  # Tratamento de erros
│   └── validationMiddleware.js # Validação
├── routes/
│   ├── authRoutes.js       # Rotas de autenticação
│   ├── clientRoutes.js     # Rotas de clientes
│   ├── contractRoutes.js   # Rotas de contratos
│   ├── paymentRoutes.js    # Rotas de pagamentos
│   ├── companyRoutes.js    # Rotas de empresas
│   └── dashboardRoutes.js  # Rotas do dashboard
├── validators/
│   └── schemas.js          # Esquemas de validação
├── migrations/
│   └── init.sql           # Migração inicial
├── scripts/
│   ├── migrate.js         # Script de migração
│   └── seed.js            # Script de dados exemplo
└── server.js              # Servidor principal
```

## 🐛 Troubleshooting

### Erro de conexão com Supabase
1. Verifique as variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
2. Confirme se o projeto Supabase está ativo
3. Verifique se as políticas RLS estão configuradas

### Erro de migração
1. Tente o método alternativo: `npm run migrate:parts`
2. Execute manualmente o SQL no painel do Supabase
3. Verifique se as extensões estão habilitadas

### Erro de autenticação
1. Verifique se o `JWT_SECRET` está configurado
2. Confirme se o token não expirou
3. Verifique se o usuário existe na tabela `users`

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Consulte a documentação do Supabase
3. Verifique se todas as dependências estão instaladas

## 🔄 Próximos Passos

1. Configurar o frontend Flutter
2. Implementar notificações
3. Adicionar relatórios avançados
4. Configurar backup automático
5. Implementar webhooks