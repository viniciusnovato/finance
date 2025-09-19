-- =====================================================
-- QUERIES DE EXEMPLO - GESTÃO DE PAGAMENTOS E CONTRATOS
-- =====================================================

-- =====================================================
-- 1. LISTAR CLIENTES INADIMPLENTES
-- =====================================================

-- Clientes com pagamentos em atraso
SELECT 
    c.id,
    c.first_name || ' ' || c.last_name as client_name,
    c.email,
    c.phone,
    c.attention_level,
    COUNT(p.id) as overdue_payments,
    SUM(p.amount) as total_overdue_amount,
    MAX(p.due_date) as latest_overdue_date,
    AVG(CURRENT_DATE - p.due_date) as avg_days_overdue
FROM clients c
JOIN contracts ct ON c.id = ct.client_id
JOIN payments p ON ct.id = p.contract_id
WHERE p.status = 'overdue'
GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.attention_level
ORDER BY total_overdue_amount DESC;

-- =====================================================
-- 2. CONSULTAR CONTRATOS ATIVOS
-- =====================================================

-- Todos os contratos ativos com informações do cliente e filial
SELECT 
    ct.id,
    ct.contract_number,
    c.first_name || ' ' || c.last_name as client_name,
    c.email as client_email,
    c.phone as client_phone,
    b.name as branch_name,
    ct.treatment_description,
    ct.total_amount,
    ct.down_payment,
    ct.installments,
    ct.installment_amount,
    ct.start_date,
    ct.end_date,
    -- Calcular progresso do pagamento
    COALESCE(paid_installments.count, 0) as paid_installments,
    COALESCE(paid_installments.total_paid, 0) as total_paid,
    ct.total_amount - COALESCE(paid_installments.total_paid, 0) as remaining_amount
FROM contracts ct
JOIN clients c ON ct.client_id = c.id
JOIN branches b ON ct.branch_id = b.id
LEFT JOIN (
    SELECT 
        contract_id,
        COUNT(*) as count,
        SUM(amount) as total_paid
    FROM payments 
    WHERE status = 'paid'
    GROUP BY contract_id
) paid_installments ON ct.id = paid_installments.contract_id
WHERE ct.status = 'active'
ORDER BY ct.start_date DESC;

-- =====================================================
-- 3. RELATÓRIO DE PARCELAS VENCIDAS POR FILIAL
-- =====================================================

-- Parcelas vencidas agrupadas por filial
SELECT 
    b.name as branch_name,
    b.city as branch_city,
    COUNT(p.id) as overdue_count,
    SUM(p.amount) as total_overdue_amount,
    AVG(CURRENT_DATE - p.due_date) as avg_days_overdue,
    MIN(p.due_date) as oldest_overdue_date,
    MAX(p.due_date) as newest_overdue_date
FROM payments p
JOIN contracts ct ON p.contract_id = ct.id
JOIN branches b ON ct.branch_id = b.id
WHERE p.status = 'overdue'
GROUP BY b.id, b.name, b.city
ORDER BY total_overdue_amount DESC;

-- =====================================================
-- 4. ALTERAR FORMA DE PAGAMENTO DE UMA PARCELA ESPECÍFICA
-- =====================================================

-- Exemplo: Alterar método de pagamento da parcela 3 do contrato 'CT-2024-001'
UPDATE payments 
SET 
    payment_method = 'mbway',
    notes = 'Alterado de débito direto para MBWay a pedido do cliente',
    updated_at = NOW()
WHERE contract_id = (
    SELECT id FROM contracts WHERE contract_number = 'CT-2024-001'
) 
AND installment_number = 3;

-- =====================================================
-- 5. DASHBOARD - RESUMO FINANCEIRO
-- =====================================================

-- Resumo geral por filial
SELECT 
    b.name as branch_name,
    -- Contratos
    COUNT(DISTINCT ct.id) as total_contracts,
    COUNT(DISTINCT CASE WHEN ct.status = 'active' THEN ct.id END) as active_contracts,
    COUNT(DISTINCT CASE WHEN ct.status = 'defaulting' THEN ct.id END) as defaulting_contracts,
    
    -- Valores
    SUM(ct.total_amount) as total_contract_value,
    SUM(CASE WHEN ct.status = 'active' THEN ct.total_amount ELSE 0 END) as active_contract_value,
    
    -- Pagamentos
    COUNT(CASE WHEN p.status = 'paid' THEN p.id END) as paid_installments,
    COUNT(CASE WHEN p.status = 'overdue' THEN p.id END) as overdue_installments,
    SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_received,
    SUM(CASE WHEN p.status = 'overdue' THEN p.amount ELSE 0 END) as total_overdue
    
FROM branches b
LEFT JOIN contracts ct ON b.id = ct.branch_id
LEFT JOIN payments p ON ct.id = p.contract_id
GROUP BY b.id, b.name
ORDER BY total_contract_value DESC;

-- =====================================================
-- 6. HISTÓRICO DE PAGAMENTOS DE UM CLIENTE
-- =====================================================

-- Histórico completo de pagamentos de um cliente específico
SELECT 
    ct.contract_number,
    ct.treatment_description,
    p.installment_number,
    p.amount,
    p.due_date,
    p.paid_date,
    p.payment_method,
    p.status,
    p.reference_number,
    p.notes,
    CASE 
        WHEN p.status = 'overdue' THEN CURRENT_DATE - p.due_date
        ELSE NULL
    END as days_overdue
FROM payments p
JOIN contracts ct ON p.contract_id = ct.id
JOIN clients c ON ct.client_id = c.id
WHERE c.email = 'cliente@exemplo.com' -- Substituir pelo email do cliente
ORDER BY ct.start_date DESC, p.installment_number;

-- =====================================================
-- 7. CLIENTES COM MAIOR RISCO DE INADIMPLÊNCIA
-- =====================================================

-- Identificar clientes com padrões de risco
SELECT 
    c.id,
    c.first_name || ' ' || c.last_name as client_name,
    c.email,
    c.attention_level,
    COUNT(p.id) as total_payments,
    COUNT(CASE WHEN p.status = 'overdue' THEN p.id END) as overdue_payments,
    COUNT(CASE WHEN p.status = 'failed' THEN p.id END) as failed_payments,
    ROUND(
        (COUNT(CASE WHEN p.status = 'overdue' THEN p.id END) * 100.0) / 
        NULLIF(COUNT(p.id), 0), 2
    ) as overdue_percentage,
    AVG(CASE 
        WHEN p.status = 'paid' AND p.paid_date > p.due_date 
        THEN p.paid_date - p.due_date 
        ELSE 0 
    END) as avg_delay_days
FROM clients c
JOIN contracts ct ON c.id = ct.client_id
JOIN payments p ON ct.id = p.contract_id
WHERE ct.status IN ('active', 'defaulting')
GROUP BY c.id, c.first_name, c.last_name, c.email, c.attention_level
HAVING COUNT(p.id) > 0
ORDER BY overdue_percentage DESC, avg_delay_days DESC;

-- =====================================================
-- 8. RELATÓRIO MENSAL DE RECEBIMENTOS
-- =====================================================

-- Recebimentos por mês e método de pagamento
SELECT 
    DATE_TRUNC('month', p.paid_date) as month,
    p.payment_method,
    COUNT(p.id) as payment_count,
    SUM(p.amount) as total_amount,
    AVG(p.amount) as avg_payment_amount
FROM payments p
WHERE p.status = 'paid'
    AND p.paid_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', p.paid_date), p.payment_method
ORDER BY month DESC, total_amount DESC;

-- =====================================================
-- 9. CONTRATOS PRÓXIMOS DO VENCIMENTO
-- =====================================================

-- Contratos que vencem nos próximos 30 dias
SELECT 
    ct.contract_number,
    c.first_name || ' ' || c.last_name as client_name,
    c.email,
    c.phone,
    b.name as branch_name,
    ct.end_date,
    ct.end_date - CURRENT_DATE as days_to_expiry,
    COUNT(p.id) as total_installments,
    COUNT(CASE WHEN p.status = 'paid' THEN p.id END) as paid_installments,
    COUNT(CASE WHEN p.status IN ('pending', 'overdue') THEN p.id END) as pending_installments
FROM contracts ct
JOIN clients c ON ct.client_id = c.id
JOIN branches b ON ct.branch_id = b.id
JOIN payments p ON ct.id = p.contract_id
WHERE ct.status = 'active'
    AND ct.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
GROUP BY ct.id, ct.contract_number, c.first_name, c.last_name, c.email, c.phone, b.name, ct.end_date
ORDER BY ct.end_date;

-- =====================================================
-- 10. PERFORMANCE DE COBRANÇA POR USUÁRIO
-- =====================================================

-- Análise de performance dos usuários na validação de pagamentos
SELECT 
    u.first_name || ' ' || u.last_name as user_name,
    u.role,
    b.name as branch_name,
    COUNT(p.id) as payments_validated,
    SUM(p.amount) as total_amount_validated,
    AVG(p.validated_at - p.created_at) as avg_validation_time,
    COUNT(CASE WHEN p.status = 'paid' THEN p.id END) as successful_validations
FROM users u
JOIN payments p ON u.id = p.validated_by
LEFT JOIN branches b ON u.branch_id = b.id
WHERE p.validated_at >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY u.id, u.first_name, u.last_name, u.role, b.name
ORDER BY payments_validated DESC;