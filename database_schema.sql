-- =====================================================
-- ESQUEMA DE BANCO DE DADOS - GESTÃO DE PAGAMENTOS E CONTRATOS CLÍNICOS
-- Supabase (PostgreSQL)
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

-- Status dos contratos
CREATE TYPE contract_status AS ENUM (
    'draft',
    'validated',
    'active',
    'defaulting',
    'paid_off',
    'closed'
);

-- Status dos pagamentos
CREATE TYPE payment_status AS ENUM (
    'pending',
    'paid',
    'overdue',
    'failed',
    'cancelled'
);

-- Métodos de pagamento
CREATE TYPE payment_method AS ENUM (
    'mbway',
    'cash',
    'transfer',
    'sepa',
    'credit_card',
    'direct_debit',
    'payment_order'
);

-- Perfis de usuário
CREATE TYPE user_role AS ENUM (
    'admin',
    'analyst',
    'reception',
    'client'
);

-- Níveis de atenção para clientes
CREATE TYPE attention_level AS ENUM (
    'normal',
    'risk',
    'light_delay',
    'severe_delay'
);

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Empresas
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Portugal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Filiais
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    manager_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clientes
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    mobile VARCHAR(50),
    tax_id VARCHAR(50),
    birth_date DATE,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Portugal',
    attention_level attention_level DEFAULT 'normal',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usuários do sistema
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    branch_id UUID REFERENCES branches(id),
    client_id UUID REFERENCES clients(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contratos
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    treatment_description TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    down_payment DECIMAL(10,2) NOT NULL CHECK (down_payment >= total_amount * 0.30),
    installments INTEGER NOT NULL CHECK (installments BETWEEN 1 AND 24),
    installment_amount DECIMAL(10,2) NOT NULL CHECK (installment_amount > 0),
    status contract_status DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    legal_validation_date TIMESTAMP WITH TIME ZONE,
    legal_validated_by UUID REFERENCES users(id),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pagamentos
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_method payment_method,
    status payment_status DEFAULT 'pending',
    reference_number VARCHAR(100),
    receipt_path VARCHAR(500),
    notes TEXT,
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contract_id, installment_number)
);

-- Documentos anexados aos contratos
CREATE TABLE contract_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_path VARCHAR(500) NOT NULL,
    document_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notas pré-definidas
CREATE TABLE predefined_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    note_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log de auditoria
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas frequentes
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_branch_id ON contracts(branch_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_number ON contracts(contract_number);

CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_paid_date ON payments(paid_date);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_tax_id ON clients(tax_id);
CREATE INDEX idx_clients_attention_level ON clients(attention_level);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_branch_id ON users(branch_id);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);

-- =====================================================
-- TRIGGERS PARA AUDITORIA
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS PARA CONSULTAS FREQUENTES
-- =====================================================

-- View para clientes inadimplentes
CREATE VIEW defaulting_clients AS
SELECT DISTINCT
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.attention_level,
    COUNT(p.id) as overdue_payments,
    SUM(p.amount) as total_overdue_amount
FROM clients c
JOIN contracts ct ON c.id = ct.client_id
JOIN payments p ON ct.id = p.contract_id
WHERE p.status = 'overdue'
GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.attention_level;

-- View para contratos ativos
CREATE VIEW active_contracts AS
SELECT 
    ct.id,
    ct.contract_number,
    c.first_name || ' ' || c.last_name as client_name,
    c.email as client_email,
    b.name as branch_name,
    ct.treatment_description,
    ct.total_amount,
    ct.down_payment,
    ct.installments,
    ct.status,
    ct.start_date,
    ct.end_date
FROM contracts ct
JOIN clients c ON ct.client_id = c.id
JOIN branches b ON ct.branch_id = b.id
WHERE ct.status = 'active';

-- View para parcelas vencidas por filial
CREATE VIEW overdue_payments_by_branch AS
SELECT 
    b.name as branch_name,
    COUNT(p.id) as overdue_count,
    SUM(p.amount) as total_overdue_amount,
    AVG(CURRENT_DATE - p.due_date) as avg_days_overdue
FROM payments p
JOIN contracts ct ON p.contract_id = ct.id
JOIN branches b ON ct.branch_id = b.id
WHERE p.status = 'overdue'
GROUP BY b.id, b.name
ORDER BY total_overdue_amount DESC;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir notas pré-definidas
INSERT INTO predefined_notes (category, note_text) VALUES
('payment', 'Pagamento recebido via transferência bancária'),
('payment', 'Débito direto processado com sucesso'),
('payment', 'Falha no débito direto - contactar cliente'),
('contract', 'Contrato validado pelo departamento jurídico'),
('contract', 'Aguardando documentação adicional'),
('client', 'Cliente com histórico de atrasos'),
('client', 'Cliente preferencial - prioridade no atendimento');

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE companies IS 'Empresas do grupo';
COMMENT ON TABLE branches IS 'Filiais das empresas';
COMMENT ON TABLE clients IS 'Clientes dos tratamentos';
COMMENT ON TABLE users IS 'Usuários do sistema';
COMMENT ON TABLE contracts IS 'Contratos de tratamento';
COMMENT ON TABLE payments IS 'Pagamentos e parcelas';
COMMENT ON TABLE contract_documents IS 'Documentos anexados aos contratos';
COMMENT ON TABLE predefined_notes IS 'Notas pré-definidas para uso rápido';
COMMENT ON TABLE audit_logs IS 'Log de auditoria de todas as alterações';

COMMENT ON COLUMN contracts.down_payment IS 'Entrada mínima de 30% do valor total';
COMMENT ON COLUMN contracts.installments IS 'Máximo de 24 parcelas';
COMMENT ON COLUMN payments.validated_by IS 'Usuário que validou o pagamento';
COMMENT ON COLUMN clients.attention_level IS 'Nível de atenção para cobrança';