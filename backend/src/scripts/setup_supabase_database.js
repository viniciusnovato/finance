#!/usr/bin/env node

/**
 * Script para criar tabelas e políticas no Supabase
 * Este script executa o SQL necessário para configurar o banco de dados
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar service role para operações administrativas

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    console.log('\n📝 Configure o arquivo .env com:');
    console.log('SUPABASE_URL=sua_url_do_supabase');
    console.log('SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase');
    process.exit(1);
}

// Inicializar cliente Supabase com service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Executa comandos SQL individuais
 */
async function executeSQLCommand(sql, description) {
    try {
        console.log(`🔄 Executando: ${description}`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
            // Tentar método alternativo se rpc não funcionar
            const { data: altData, error: altError } = await supabase
                .from('_temp_table_that_does_not_exist')
                .select('*')
                .limit(0);
            
            if (altError && altError.message.includes('relation "_temp_table_that_does_not_exist" does not exist')) {
                console.log('⚠️  Método RPC não disponível. Use o SQL Editor do Supabase Dashboard.');
                return false;
            }
            
            console.error(`❌ Erro ao executar: ${description}`);
            console.error('Detalhes:', error.message);
            return false;
        }
        
        console.log(`✅ Concluído: ${description}`);
        return true;
        
    } catch (err) {
        console.error(`❌ Erro crítico ao executar: ${description}`);
        console.error('Detalhes:', err.message);
        return false;
    }
}

/**
 * Verifica se as tabelas já existem
 */
async function checkTablesExist() {
    try {
        console.log('🔍 Verificando se as tabelas já existem...');
        
        const tables = ['clients', 'contracts', 'payments'];
        const existingTables = [];
        
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('count', { count: 'exact', head: true });
            
            if (!error) {
                existingTables.push(table);
                console.log(`✅ Tabela '${table}' já existe`);
            }
        }
        
        return existingTables;
        
    } catch (error) {
        console.log('ℹ️  Não foi possível verificar tabelas existentes');
        return [];
    }
}

/**
 * Cria as tabelas usando comandos SQL individuais
 */
async function createTables() {
    console.log('\n📋 === Criando Tabelas ===');
    
    // SQL para criar tabela clients
    const createClientsSQL = `
        CREATE TABLE IF NOT EXISTS public.clients (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
            attention_level VARCHAR(20) DEFAULT 'normal',
            notes TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;
    
    // SQL para criar tabela contracts
    const createContractsSQL = `
        CREATE TABLE IF NOT EXISTS public.contracts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            contract_number VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
            start_date DATE NOT NULL,
            end_date DATE,
            status VARCHAR(20) DEFAULT 'active',
            payment_frequency VARCHAR(20) DEFAULT 'monthly',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;
    
    // SQL para criar tabela payments
    const createPaymentsSQL = `
        CREATE TABLE IF NOT EXISTS public.payments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
            amount DECIMAL(12,2) NOT NULL,
            due_date DATE NOT NULL,
            paid_date DATE,
            status VARCHAR(20) DEFAULT 'pending',
            payment_method VARCHAR(50) DEFAULT 'bank_transfer',
            transaction_id VARCHAR(255),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;
    
    // Executar criação das tabelas
    const success1 = await executeSQLCommand(createClientsSQL, 'Criando tabela clients');
    const success2 = await executeSQLCommand(createContractsSQL, 'Criando tabela contracts');
    const success3 = await executeSQLCommand(createPaymentsSQL, 'Criando tabela payments');
    
    return success1 && success2 && success3;
}

/**
 * Cria índices para otimização
 */
async function createIndexes() {
    console.log('\n📊 === Criando Índices ===');
    
    const indexes = [
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);',
            description: 'Índice para email de clientes'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(first_name, last_name);',
            description: 'Índice para nome de clientes'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);',
            description: 'Índice para client_id em contratos'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON public.payments(contract_id);',
            description: 'Índice para contract_id em pagamentos'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);',
            description: 'Índice para status de pagamentos'
        }
    ];
    
    let allSuccess = true;
    for (const index of indexes) {
        const success = await executeSQLCommand(index.sql, index.description);
        if (!success) allSuccess = false;
    }
    
    return allSuccess;
}

/**
 * Habilita RLS e cria políticas básicas
 */
async function setupRLS() {
    console.log('\n🔒 === Configurando Row Level Security ===');
    
    const rlsCommands = [
        {
            sql: 'ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;',
            description: 'Habilitando RLS para clients'
        },
        {
            sql: 'ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;',
            description: 'Habilitando RLS para contracts'
        },
        {
            sql: 'ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;',
            description: 'Habilitando RLS para payments'
        },
        {
            sql: `CREATE POLICY IF NOT EXISTS "clients_policy" ON public.clients FOR ALL USING (true);`,
            description: 'Criando política para clients'
        },
        {
            sql: `CREATE POLICY IF NOT EXISTS "contracts_policy" ON public.contracts FOR ALL USING (true);`,
            description: 'Criando política para contracts'
        },
        {
            sql: `CREATE POLICY IF NOT EXISTS "payments_policy" ON public.payments FOR ALL USING (true);`,
            description: 'Criando política para payments'
        }
    ];
    
    let allSuccess = true;
    for (const command of rlsCommands) {
        const success = await executeSQLCommand(command.sql, command.description);
        if (!success) allSuccess = false;
    }
    
    return allSuccess;
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 === Configuração do Banco de Dados Supabase ===');
    console.log(`📁 URL: ${supabaseUrl}`);
    
    try {
        // Verificar tabelas existentes
        const existingTables = await checkTablesExist();
        
        if (existingTables.length === 3) {
            console.log('\n✅ Todas as tabelas já existem!');
            console.log('Você pode prosseguir com a importação dos dados.');
            return;
        }
        
        // Tentar criar as tabelas usando método direto
        console.log('\n⚠️  Algumas tabelas não existem. Tentando criar...');
        
        // Método alternativo: usar inserção direta para testar permissões
        try {
            const { data, error } = await supabase
                .from('clients')
                .insert({
                    first_name: 'Teste',
                    last_name: 'Sistema',
                    email: 'teste@sistema.com'
                })
                .select();
            
            if (!error) {
                console.log('✅ Tabela clients já existe e está acessível');
                
                // Remover registro de teste
                await supabase
                    .from('clients')
                    .delete()
                    .eq('email', 'teste@sistema.com');
            }
        } catch (testError) {
            console.log('ℹ️  Tabelas precisam ser criadas');
        }
        
        console.log('\n📋 === INSTRUÇÕES MANUAIS ===');
        console.log('Como o Supabase não permite execução direta de DDL via API,');
        console.log('você precisa executar o SQL manualmente:');
        console.log('');
        console.log('1. Acesse o Supabase Dashboard: https://app.supabase.com');
        console.log('2. Vá para seu projeto');
        console.log('3. Clique em "SQL Editor" no menu lateral');
        console.log('4. Cole e execute o conteúdo do arquivo:');
        console.log('   /Users/pedro/Documents/finance/backend/src/scripts/create_supabase_tables.sql');
        console.log('');
        console.log('Após executar o SQL, rode novamente este script para verificar.');
        
    } catch (error) {
        console.error('❌ Erro durante a configuração:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };