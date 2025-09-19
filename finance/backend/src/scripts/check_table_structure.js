const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
    console.log('🔍 Verificando estrutura das tabelas...');
    
    try {
        // Query para obter informações das colunas da tabela clients
        const { data, error } = await supabase.rpc('sql', {
            query: `
                SELECT 
                    column_name,
                    data_type,
                    character_maximum_length,
                    is_nullable,
                    column_default
                FROM information_schema.columns 
                WHERE table_name = 'clients' 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
            `
        });
        
        if (error) {
            console.error('❌ Erro ao consultar estrutura:', error);
            return;
        }
        
        console.log('\n📋 Estrutura da tabela clients:');
        console.log('================================');
        data.forEach(col => {
            const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
            console.log(`${col.column_name}: ${col.data_type}${maxLength} - Nullable: ${col.is_nullable}`);
        });
        
        // Verificar campos com limite de 50 caracteres
        const fieldsWithLimit50 = data.filter(col => col.character_maximum_length === 50);
        if (fieldsWithLimit50.length > 0) {
            console.log('\n⚠️ Campos com limite de 50 caracteres:');
            fieldsWithLimit50.forEach(col => {
                console.log(`- ${col.column_name}`);
            });
        }
        
    } catch (error) {
        console.error('💥 Erro:', error.message);
    }
}

checkTableStructure();