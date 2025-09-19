-- Script para criar tabelas e políticas no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Habilitar Row Level Security (RLS)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELA: clients (Clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    tax_id VARCHAR(50),
    birth_date DATE,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Portugal',
    attention_level VARCHAR(20) DEFAULT 'normal' CHECK (attention_level IN ('low', 'normal', 'high', 'urgent')),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_clients_active ON public.clients(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);

-- =====================================================
-- TABELA: contracts (Contratos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'suspended', 'completed', 'cancelled')),
    payment_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (payment_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly', 'one_time')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_number ON public.contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON public.contracts(start_date, end_date);

-- =====================================================
-- TABELA: payments (Pagamentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')),
    payment_method VARCHAR(50) DEFAULT 'bank_transfer' CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'pix', 'check', 'other')),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON public.payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_paid_date ON public.payments(paid_date);

-- =====================================================
-- TRIGGERS para updated_at automático
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA CLIENTS
-- =====================================================

-- Política para SELECT (leitura)
CREATE POLICY "clients_select_policy" ON public.clients
    FOR SELECT
    USING (true); -- Permitir leitura para todos os usuários autenticados

-- Política para INSERT (criação)
CREATE POLICY "clients_insert_policy" ON public.clients
    FOR INSERT
    WITH CHECK (true); -- Permitir inserção para todos os usuários autenticados

-- Política para UPDATE (atualização)
CREATE POLICY "clients_update_policy" ON public.clients
    FOR UPDATE
    USING (true)
    WITH CHECK (true); -- Permitir atualização para todos os usuários autenticados

-- Política para DELETE (exclusão)
CREATE POLICY "clients_delete_policy" ON public.clients
    FOR DELETE
    USING (true); -- Permitir exclusão para todos os usuários autenticados

-- =====================================================
-- POLÍTICAS PARA CONTRACTS
-- =====================================================

-- Política para SELECT (leitura)
CREATE POLICY "contracts_select_policy" ON public.contracts
    FOR SELECT
    USING (true);

-- Política para INSERT (criação)
CREATE POLICY "contracts_insert_policy" ON public.contracts
    FOR INSERT
    WITH CHECK (true);

-- Política para UPDATE (atualização)
CREATE POLICY "contracts_update_policy" ON public.contracts
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Política para DELETE (exclusão)
CREATE POLICY "contracts_delete_policy" ON public.contracts
    FOR DELETE
    USING (true);

-- =====================================================
-- POLÍTICAS PARA PAYMENTS
-- =====================================================

-- Política para SELECT (leitura)
CREATE POLICY "payments_select_policy" ON public.payments
    FOR SELECT
    USING (true);

-- Política para INSERT (criação)
CREATE POLICY "payments_insert_policy" ON public.payments
    FOR INSERT
    WITH CHECK (true);

-- Política para UPDATE (atualização)
CREATE POLICY "payments_update_policy" ON public.payments
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Política para DELETE (exclusão)
CREATE POLICY "payments_delete_policy" ON public.payments
    FOR DELETE
    USING (true);

-- =====================================================
-- VIEWS ÚTEIS PARA RELATÓRIOS
-- =====================================================

-- View para contratos com informações do cliente
CREATE OR REPLACE VIEW public.contracts_with_clients AS
SELECT 
    c.*,
    cl.first_name,
    cl.last_name,
    cl.email,
    cl.phone,
    cl.mobile
FROM public.contracts c
JOIN public.clients cl ON c.client_id = cl.id;

-- View para pagamentos com informações do contrato e cliente
CREATE OR REPLACE VIEW public.payments_with_details AS
SELECT 
    p.*,
    c.contract_number,
    c.description as contract_description,
    cl.first_name,
    cl.last_name,
    cl.email
FROM public.payments p
JOIN public.contracts c ON p.contract_id = c.id
JOIN public.clients cl ON c.client_id = cl.id;

-- View para resumo financeiro por cliente
CREATE OR REPLACE VIEW public.client_financial_summary AS
SELECT 
    cl.id as client_id,
    cl.first_name,
    cl.last_name,
    cl.email,
    COUNT(DISTINCT c.id) as total_contracts,
    SUM(c.total_amount) as total_contracted_value,
    COUNT(p.id) as total_payments,
    SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as total_pending,
    SUM(CASE WHEN p.status = 'overdue' THEN p.amount ELSE 0 END) as total_overdue
FROM public.clients cl
LEFT JOIN public.contracts c ON cl.id = c.client_id
LEFT JOIN public.payments p ON c.id = p.contract_id
GROUP BY cl.id, cl.first_name, cl.last_name, cl.email;

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função para atualizar status de pagamentos em atraso
CREATE OR REPLACE FUNCTION update_overdue_payments()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.payments 
    SET status = 'overdue', updated_at = NOW()
    WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE public.clients IS 'Tabela de clientes do sistema';
COMMENT ON TABLE public.contracts IS 'Tabela de contratos vinculados aos clientes';
COMMENT ON TABLE public.payments IS 'Tabela de pagamentos vinculados aos contratos';

COMMENT ON COLUMN public.clients.attention_level IS 'Nível de atenção: low, normal, high, urgent';
COMMENT ON COLUMN public.contracts.status IS 'Status do contrato: draft, active, suspended, completed, cancelled';
COMMENT ON COLUMN public.contracts.payment_frequency IS 'Frequência de pagamento: weekly, monthly, quarterly, yearly, one_time';
COMMENT ON COLUMN public.payments.status IS 'Status do pagamento: pending, paid, overdue, cancelled, refunded';

-- =====================================================
-- GRANTS DE PERMISSÃO
-- =====================================================

-- Conceder permissões para usuários autenticados
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.contracts TO authenticated;
GRANT ALL ON public.payments TO authenticated;

-- Conceder permissões para usuários anônimos (apenas leitura se necessário)
GRANT SELECT ON public.clients TO anon;
GRANT SELECT ON public.contracts TO anon;
GRANT SELECT ON public.payments TO anon;

-- Conceder permissões nas views
GRANT SELECT ON public.contracts_with_clients TO authenticated, anon;
GRANT SELECT ON public.payments_with_details TO authenticated, anon;
GRANT SELECT ON public.client_financial_summary TO authenticated, anon;

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================

-- Inserir dados de exemplo (opcional - remover em produção)
/*
INSERT INTO public.clients (first_name, last_name, email, country) VALUES 
('João', 'Silva', 'joao.silva@email.com', 'Portugal'),
('Maria', 'Santos', 'maria.santos@email.com', 'Portugal');
*/

SELECT 'Tabelas e políticas criadas com sucesso!' as status;