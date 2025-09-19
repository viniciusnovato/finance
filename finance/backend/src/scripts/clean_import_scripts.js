const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Limpa todas as tabelas de dados importados
 */
async function cleanImportedData() {
    console.log('🧹 Iniciando limpeza de dados importados...');
    
    try {
        // 1. Limpar pagamentos primeiro (devido às foreign keys)
        console.log('🗑️  Limpando tabela payments...');
        const { error: paymentsError } = await supabase
            .from('payments')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (paymentsError) {
            console.error('❌ Erro ao limpar payments:', paymentsError);
        } else {
            console.log('✅ Tabela payments limpa');
        }

        // 2. Limpar contratos
        console.log('🗑️  Limpando tabela contracts...');
        const { error: contractsError } = await supabase
            .from('contracts')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (contractsError) {
            console.error('❌ Erro ao limpar contracts:', contractsError);
        } else {
            console.log('✅ Tabela contracts limpa');
        }

        // 3. Limpar clientes
        console.log('🗑️  Limpando tabela clients...');
        const { error: clientsError } = await supabase
            .from('clients')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (clientsError) {
            console.error('❌ Erro ao limpar clients:', clientsError);
        } else {
            console.log('✅ Tabela clients limpa');
        }

        console.log('🎉 Limpeza concluída com sucesso!');
        
        // Verificar se as tabelas estão vazias
        await verifyCleanup();
        
    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error);
        throw error;
    }
}

/**
 * Verifica se a limpeza foi bem-sucedida
 */
async function verifyCleanup() {
    console.log('\n🔍 Verificando limpeza...');
    
    try {
        // Contar registros em cada tabela
        const { data: clientsCount, error: clientsError } = await supabase
            .from('clients')
            .select('id', { count: 'exact', head: true });
        
        const { data: contractsCount, error: contractsError } = await supabase
            .from('contracts')
            .select('id', { count: 'exact', head: true });
        
        const { data: paymentsCount, error: paymentsError } = await supabase
            .from('payments')
            .select('id', { count: 'exact', head: true });

        if (clientsError || contractsError || paymentsError) {
            console.error('❌ Erro ao verificar limpeza');
            return;
        }

        console.log(`📊 Registros restantes:`);
        console.log(`   👥 Clientes: ${clientsCount?.length || 0}`);
        console.log(`   📄 Contratos: ${contractsCount?.length || 0}`);
        console.log(`   💰 Pagamentos: ${paymentsCount?.length || 0}`);
        
        const totalRecords = (clientsCount?.length || 0) + (contractsCount?.length || 0) + (paymentsCount?.length || 0);
        
        if (totalRecords === 0) {
            console.log('✅ Todas as tabelas estão vazias - pronto para nova importação!');
        } else {
            console.log('⚠️  Ainda existem registros nas tabelas');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar limpeza:', error);
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🚀 Iniciando limpeza para nova importação...\n');
        
        // Confirmar se o usuário quer continuar
        console.log('⚠️  ATENÇÃO: Esta operação irá DELETAR TODOS os dados das tabelas:');
        console.log('   - clients');
        console.log('   - contracts'); 
        console.log('   - payments');
        console.log('\n   Esta ação é IRREVERSÍVEL!\n');
        
        // Em ambiente de produção, você pode querer adicionar uma confirmação interativa
        // Por agora, vamos prosseguir automaticamente
        
        await cleanImportedData();
        
        console.log('\n🎯 Sistema pronto para nova importação!');
        
    } catch (error) {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { cleanImportedData, verifyCleanup, main };