const { spawn } = require('child_process');

// Função para executar comando MCP
function executeMCP(toolName, args) {
    return new Promise((resolve, reject) => {
        const mcpArgs = [
            'run_mcp',
            '--server-name', 'mcp.config.usrlocalmcp.supabase-mcp-finance',
            '--tool-name', toolName,
            '--args', JSON.stringify(args)
        ];
        
        console.log(`🔄 Executando MCP: ${toolName}`);
        
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
                    console.log('Raw stdout:', stdout);
                    reject(new Error(`Erro ao parsear resposta MCP: ${error.message}`));
                }
            } else {
                reject(new Error(`MCP falhou com código ${code}: ${stderr}`));
            }
        });
    });
}
const fs = require('fs');
const path = require('path');

async function importAllClients() {
    console.log('🚀 Iniciando importação completa de clientes...');
    
    // Ler o arquivo SQL completo
    const sqlFile = path.join(__dirname, '../../clients_import_full.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Dividir em lotes (cada lote começa com "-- Lote")
    const batches = sqlContent.split(/-- Lote \d+\/\d+ - \d+ clientes/);
    
    // Remover o primeiro elemento vazio
    batches.shift();
    
    console.log(`📦 Encontrados ${batches.length} lotes para importar`);
    
    let totalImported = 0;
    
    for (let i = 0; i < batches.length; i++) {
        const batchNumber = i + 1;
        let batch = batches[i].trim();
        
        // Remover o último ponto e vírgula duplo se existir
        batch = batch.replace(/;;\s*$/, ';');
        
        if (batch && batch.includes('INSERT INTO clients')) {
            console.log(`\n📥 Importando lote ${batchNumber}/${batches.length}...`);
            
            try {
                const result = await executeMCP('execute_sql', {
                    project_id: 'sxbslulfitfsijqrzljd',
                    query: batch
                });
                
                console.log(`✅ Lote ${batchNumber} importado com sucesso`);
                totalImported += 50; // Cada lote tem 50 clientes (exceto possivelmente o último)
                
                // Pausa entre lotes para não sobrecarregar
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.error(`❌ Erro no lote ${batchNumber}:`, error.message);
            }
        }
    }
    
    console.log(`\n🎉 Importação concluída! Tentativa de importar ~${totalImported} clientes`);
    
    // Verificar quantos foram realmente importados
    try {
        const countResult = await executeMCP('execute_sql', {
            project_id: 'sxbslulfitfsijqrzljd',
            query: `SELECT 
                COUNT(*) as total_clients,
                COUNT(CASE WHEN external_id LIKE 'bd_%' THEN 1 END) as imported_clients
            FROM clients;`
        });
        
        console.log('\n📊 Status final do banco:');
        console.log(JSON.stringify(countResult, null, 2));
        
    } catch (error) {
        console.error('❌ Erro ao verificar status final:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    importAllClients().catch(console.error);
}

module.exports = { importAllClients };