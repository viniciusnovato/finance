-- Migração inicial do sistema de gestão financeira
-- Este arquivo contém toda a estrutura do banco de dados

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de filiais
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Referência ao auth.users do Supabase
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'user', 'viewer'))
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20) NOT NULL,
    document_type VARCHAR(10) NOT NULL DEFAULT 'CPF',
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    birth_date DATE,
    address TEXT,
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    occupation VARCHAR(100),
    monthly_income DECIMAL(15,2),
    marital_status VARCHAR(20),
    spouse_name VARCHAR(255),
    spouse_document VARCHAR(20),
    spouse_phone VARCHAR(20),
    reference_name VARCHAR(255),
    reference_phone VARCHAR(20),
    reference_relationship VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_document_type CHECK (document_type IN ('CPF', 'CNPJ')),
    CONSTRAINT valid_marital_status CHECK (marital_status IN ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel')),
    UNIQUE(company_id, document)
);

-- Tabela de contratos
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contract_number VARCHAR(50) NOT NULL,
    product_description TEXT NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    down_payment DECIMAL(15,2) NOT NULL DEFAULT 0,
    financed_amount DECIMAL(15,2) NOT NULL,
    installments INTEGER NOT NULL,
    installment_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,4) DEFAULT 0,
    start_date DATE NOT NULL,
    first_due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    payment_method VARCHAR(20) NOT NULL DEFAULT 'boleto',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'cancelled', 'suspended')),
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('boleto', 'cartao', 'dinheiro', 'pix', 'transferencia')),
    CONSTRAINT positive_amounts CHECK (total_amount > 0 AND financed_amount > 0 AND installment_amount > 0),
    CONSTRAINT valid_installments CHECK (installments > 0),
    UNIQUE(company_id, contract_number)
);

-- Tabela de pagamentos/parcelas
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_date DATE,
    payment_method VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    late_fee DECIMAL(15,2) DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    receipt_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    CONSTRAINT valid_payment_method_payments CHECK (payment_method IN ('boleto', 'cartao', 'dinheiro', 'pix', 'transferencia') OR payment_method IS NULL),
    CONSTRAINT positive_payment_amounts CHECK (amount > 0 AND paid_amount >= 0),
    UNIQUE(contract_id, installment_number)
);

-- Tabela de documentos de contratos
CREATE TABLE IF NOT EXISTS contract_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_document_type_docs CHECK (document_type IN ('contract', 'identity', 'proof_income', 'proof_residence', 'other'))
);

-- Tabela de notas predefinidas
CREATE TABLE IF NOT EXISTS predefined_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_note_category CHECK (category IN ('client', 'contract', 'payment', 'general'))
);

-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_audit_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_branches_company_id ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_branch_id ON clients(branch_id);
CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document);
CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_branch_id ON contracts(branch_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_branch_id ON payments(branch_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_contract_documents_contract_id ON contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_predefined_notes_company_id ON predefined_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Triggers para atualização automática do updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predefined_notes_updated_at BEFORE UPDATE ON predefined_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views para consultas frequentes
CREATE OR REPLACE VIEW defaulting_clients AS
SELECT DISTINCT
    c.id,
    c.name,
    c.document,
    c.phone,
    c.branch_id,
    b.name as branch_name,
    COUNT(p.id) as overdue_payments,
    SUM(p.amount - p.paid_amount) as total_overdue
FROM clients c
JOIN contracts ct ON c.id = ct.client_id
JOIN payments p ON ct.id = p.contract_id
JOIN branches b ON c.branch_id = b.id
WHERE p.status = 'overdue'
GROUP BY c.id, c.name, c.document, c.phone, c.branch_id, b.name;

CREATE OR REPLACE VIEW active_contracts AS
SELECT 
    ct.id,
    ct.contract_number,
    ct.product_description,
    ct.total_amount,
    ct.installments,
    ct.start_date,
    c.name as client_name,
    c.document as client_document,
    b.name as branch_name,
    COUNT(p.id) as total_installments,
    COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as paid_installments,
    COUNT(CASE WHEN p.status = 'overdue' THEN 1 END) as overdue_installments
FROM contracts ct
JOIN clients c ON ct.client_id = c.id
JOIN branches b ON ct.branch_id = b.id
LEFT JOIN payments p ON ct.id = p.contract_id
WHERE ct.status = 'active'
GROUP BY ct.id, ct.contract_number, ct.product_description, ct.total_amount, ct.installments, ct.start_date, c.name, c.document, b.name;

CREATE OR REPLACE VIEW overdue_payments_by_branch AS
SELECT 
    b.id as branch_id,
    b.name as branch_name,
    COUNT(p.id) as overdue_count,
    SUM(p.amount - p.paid_amount) as total_overdue_amount,
    AVG(CURRENT_DATE - p.due_date) as avg_days_overdue
FROM branches b
JOIN payments p ON b.id = p.branch_id
WHERE p.status = 'overdue'
GROUP BY b.id, b.name
ORDER BY total_overdue_amount DESC;

-- Inserir dados iniciais de notas predefinidas
INSERT INTO predefined_notes (company_id, category, title, content) VALUES
(uuid_generate_v4(), 'client', 'Cliente Inadimplente', 'Cliente com histórico de atraso nos pagamentos. Requer acompanhamento especial.'),
(uuid_generate_v4(), 'client', 'Bom Pagador', 'Cliente pontual nos pagamentos. Perfil de baixo risco.'),
(uuid_generate_v4(), 'contract', 'Contrato Renegociado', 'Contrato passou por processo de renegociação de valores e prazos.'),
(uuid_generate_v4(), 'payment', 'Pagamento em Atraso', 'Parcela paga com atraso. Aplicada multa conforme contrato.'),
(uuid_generate_v4(), 'general', 'Contato Realizado', 'Contato telefônico realizado com sucesso.');

-- Comentários nas tabelas e colunas
COMMENT ON TABLE companies IS 'Empresas do sistema';
COMMENT ON TABLE branches IS 'Filiais das empresas';
COMMENT ON TABLE users IS 'Usuários do sistema';
COMMENT ON TABLE clients IS 'Clientes das empresas';
COMMENT ON TABLE contracts IS 'Contratos de financiamento';
COMMENT ON TABLE payments IS 'Parcelas dos contratos';
COMMENT ON TABLE contract_documents IS 'Documentos anexados aos contratos';
COMMENT ON TABLE predefined_notes IS 'Notas predefinidas para uso no sistema';
COMMENT ON TABLE audit_logs IS 'Log de auditoria das operações';

COMMENT ON COLUMN users.auth_user_id IS 'Referência ao usuário no auth.users do Supabase';
COMMENT ON COLUMN contracts.down_payment IS 'Valor da entrada (mínimo 30% do valor total)';
COMMENT ON COLUMN payments.late_fee IS 'Multa por atraso';
COMMENT ON COLUMN payments.discount IS 'Desconto aplicado no pagamento';