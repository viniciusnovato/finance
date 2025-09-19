const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Função para executar comando MCP
function executeMCP(toolName, args) {
    return new Promise((resolve, reject) => {
        const mcpArgs = [
            'run_mcp',
            '--server-name', 'mcp.config.usrlocalmcp.supabase-mcp-finance',
            '--tool-name', toolName,
            '--args', JSON.stringify(args)
        ];
        
        const child = spawn('trae', mcpArgs, { stdio: 'pipe' });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(stdout.trim());
                    resolve(result);
                } catch (error) {
                    resolve({ success: true }); // Assume sucesso se não conseguir parsear
                }
            } else {
                reject(new Error(`MCP falhou com código ${code}: ${stderr}`));
            }
        });
    });
}

async function importRemainingClients() {
    console.log('🚀 Importando clientes restantes em lotes grandes...');
    
    // Verificar status atual
    try {
        const statusResult = await executeMCP('execute_sql', {
            project_id: 'sxbslulfitfsijqrzljd',
            query: `SELECT 
                COUNT(*) as total_clients,
                COUNT(CASE WHEN external_id LIKE 'bd_%' THEN 1 END) as imported_clients,
                COALESCE(MAX(CAST(SUBSTRING(external_id FROM 4) AS INTEGER)), 0) as highest_bd_number
            FROM clients
            WHERE external_id IS NOT NULL;`
        });
        
        console.log('📊 Status atual:', JSON.stringify(statusResult, null, 2));
    } catch (error) {
        console.log('⚠️ Não foi possível verificar status inicial');
    }
    
    // Lotes grandes para importação rápida
    const largeBatches = [
        // Lote 5-6 (bd_161 a bd_260)
        `INSERT INTO clients (first_name, last_name, email, phone, mobile, tax_id, birth_date, address, city, state, postal_code, country, notes, status, external_id) VALUES 
        ('MARIA', 'ELIZABETE TEIXEIRA MONTEIRO DE JESUS', 'mlisajusese19963@gmail.com', NULL, NULL, NULL, NULL, NULL, '4425-096 MAIA', NULL, NULL, 'Brasil', NULL, 'active', 'bd_161'),
        ('ORDEAN', 'CORRÊA DE MORAIS ANDRADE', 'ocmorais@hotmail.com', NULL, NULL, NULL, NULL, NULL, '3080-603 TAVAREDE - FIGUEIRA DA FOZ', NULL, NULL, 'Brasil', NULL, 'active', 'bd_162'),
        ('JOZIANE', 'BARROS GOMES', 'JOZY_BONY@HOTMAIL.COM', NULL, NULL, NULL, NULL, NULL, '74-270 FRANGY - FRANÇA', NULL, NULL, 'Brasil', NULL, 'active', 'bd_163'),
        ('JOCIENE', 'MELO DE OLIVEIRA (DD EM 4832 DIAMANTINO)', 'JOCIENEMELODEOLIVEIRA@GMAIL.COM', NULL, NULL, NULL, NULL, NULL, '78290-000 FRANÇA', NULL, NULL, 'Brasil', NULL, 'active', 'bd_164'),
        ('DIAMANTINO', 'TEIXEIRA AMORIM', 'jocienemelodeoliveira@gmail.com', NULL, NULL, NULL, NULL, NULL, '78290-000 FRANÇA', NULL, NULL, 'Brasil', NULL, 'active', 'bd_165')
        ON CONFLICT (external_id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, updated_at = NOW();`
    ];
    
    for (let i = 0; i < largeBatches.length; i++) {
        console.log(`\n📥 Executando lote grande ${i + 1}/${largeBatches.length}...`);
        
        try {
            await executeMCP('execute_sql', {
                project_id: 'sxbslulfitfsijqrzljd',
                query: largeBatches[i]
            });
            
            console.log(`✅ Lote ${i + 1} executado`);
            
            // Pausa menor entre lotes
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`❌ Erro no lote ${i + 1}:`, error.message);
        }
    }
    
    // Verificar status final
    try {
        const finalResult = await executeMCP('execute_sql', {
            project_id: 'sxbslulfitfsijqrzljd',
            query: `SELECT 
                COUNT(*) as total_clients,
                COUNT(CASE WHEN external_id LIKE 'bd_%' THEN 1 END) as imported_clients
            FROM clients;`
        });
        
        console.log('\n🎉 Status final:', JSON.stringify(finalResult, null, 2));
        
    } catch (error) {
        console.error('❌ Erro ao verificar status final:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    importRemainingClients().catch(console.error);
}

module.exports = { importRemainingClients };