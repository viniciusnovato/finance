require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Usar service_role key para ter permissões administrativas
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] || null;
    });
    
    return obj;
  });
}

async function importPaymentsTest() {
  console.log('📥 IMPORTAÇÃO DE PAGAMENTOS (TESTE - 5 LINHAS)');
  console.log('==================================================');
  
  try {
    // Ler arquivo CSV
    const csvPath = path.join(__dirname, '../../../importBD/payments.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV
    const payments = parseCSV(csvContent);
    console.log(`📊 Total de pagamentos no CSV: ${payments.length}`);
    
    // Processar apenas os primeiros 5 para teste
    const testPayments = payments.slice(0, 5);
    console.log(`🧪 Processando ${testPayments.length} pagamentos para teste`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const payment of testPayments) {
      try {
        // Verificar se o contract_id existe
        const { data: contractExists } = await supabase
          .from('contracts')
          .select('id')
          .eq('id', payment.contract_id)
          .single();
        
        if (!contractExists) {
          console.log(`⚠️  Contrato ${payment.contract_id} não encontrado para pagamento ${payment.id}`);
          errorCount++;
          continue;
        }
        
        // Preparar dados do pagamento (criar external_id único e truncado)
        const uniqueExternalId = `PAY_${payment.id.substring(0, 8)}`;
        
        const paymentData = {
          id: payment.id,
          contract_id: payment.contract_id,
          amount: payment.amount ? parseFloat(payment.amount) : null,
          due_date: payment.due_date || null,
          paid_date: payment.paid_date || null,
          status: payment.status || 'pending',
          payment_method: (payment.payment_method || '').substring(0, 20),
          notes: payment.notes || null,
          external_id: uniqueExternalId.substring(0, 50),
          created_at: payment.created_at || new Date().toISOString(),
          updated_at: payment.updated_at || new Date().toISOString()
        };
        
        // Inserir no Supabase
        const { error } = await supabase
          .from('payments')
          .insert(paymentData);
        
        if (error) {
          console.log(`❌ Erro ao inserir pagamento ${payment.id}: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Pagamento inserido: ${payment.amount} (Contrato: ${payment.contract_id})`);
          successCount++;
        }
        
      } catch (err) {
        console.log(`❌ Erro ao processar pagamento: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    
    // Verificar total na tabela
    const { count } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📋 Total de pagamentos na tabela: ${count}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

importPaymentsTest().catch(console.error);