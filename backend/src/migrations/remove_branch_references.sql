-- Migração para remover referências à tabela branches da tabela contracts
-- Esta migração remove a coluna branch_id e índices relacionados

-- Remover o índice da coluna branch_id
DROP INDEX IF EXISTS idx_contracts_branch_id;

-- Remover a coluna branch_id da tabela contracts
ALTER TABLE contracts DROP COLUMN IF EXISTS branch_id;

-- Comentário: A tabela branches foi removida do sistema, então todas as referências
-- a ela também devem ser removidas para evitar erros de schema