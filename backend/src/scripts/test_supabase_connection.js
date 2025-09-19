#!/usr/bin/env node

/**
 * Script para testar a conexão com o Supabase e verificar as tabelas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 === Teste de Conexão com Supabase ===');
console.log(`URL: ${supabaseUrl ? 'Configurada' : 'NÃO CONFIGURADA'}`);
console.log(`Key: ${supabaseKey ? 'Configurada' : 'NÃO CONFIGURADA'}`);

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
    console.log('\n📝 Configure o arquivo .env com:');
    console.log('SUPABASE_URL=sua_url_do_supabase');
    console.log('SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase');
    process.exit(1);
}

// Inicializar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('\n🔗 Testando conexão com Supabase...');
        
        // Testar conexão básica
        const { data, error } = await supabase.from('clients').select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ Erro ao conectar com Supabase:', error.message);
            
            if (error.message.includes('relation "public.clients" does not exist')) {
                console.log('\n📋 A tabela "clients" não existe. Você precisa criar as tabelas primeiro.');
                console.log('Execute as migrações do banco de dados ou crie as tabelas manualmente.');
            } else if (error.message.includes('Invalid API key')) {
                console.log('\n🔑 Chave da API inválida. Verifique suas credenciais do Supabase.');
            } else {
                console.log('\n🔍 Detalhes do erro:', error);
            }
            return false;
        }
        
        console.log('✅ Conexão com Supabase estabelecida com sucesso!');
        console.log(`📊 Tabela "clients" existe e contém ${data?.[0]?.count || 0} registros`);
        
        // Testar outras tabelas
        const tables = ['contracts', 'payments'];
        
        for (const table of tables) {
            try {
                const { data: tableData, error: tableError } = await supabase
                    .from(table)
                    .select('count', { count: 'exact', head: true });
                
                if (tableError) {
                    console.log(`❌ Tabela "${table}" não existe ou não é acessível:`, tableError.message);
                } else {
                    console.log(`✅ Tabela "${table}" existe e contém ${tableData?.[0]?.count || 0} registros`);
                }
            } catch (err) {
                console.log(`❌ Erro ao verificar tabela "${table}":`, err.message);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro crítico:', error.message);
        return false;
    }
}

async function main() {
    const success = await testConnection();
    
    if (success) {
        console.log('\n🎉 Teste de conexão concluído com sucesso!');
        console.log('Você pode prosseguir com a importação dos dados.');
    } else {
        console.log('\n⚠️  Teste de conexão falhou.');
        console.log('Resolva os problemas acima antes de tentar importar os dados.');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };