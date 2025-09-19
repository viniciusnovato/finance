import os
import csv
import requests
from datetime import datetime
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env do backend
env_path = '/Users/insitutoareluna/Documents/finance/backend/.env'
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def parse_date(date_str):
    """Converte string de data para formato ISO"""
    if not date_str or date_str.strip() == '':
        return None
    try:
        # Tentar diferentes formatos de data
        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%Y-%m-%dT%H:%M:%S.%f']:
            try:
                return datetime.strptime(date_str.strip(), fmt).date().isoformat()
            except ValueError:
                continue
        return None
    except:
        return None

def parse_decimal(value_str):
    """Converte string para decimal"""
    if not value_str or value_str.strip() == '':
        return None
    try:
        return float(str(value_str).replace(',', '.'))
    except:
        return None

def create_contract_mapping():
    """Cria mapeamento entre IDs do CSV e IDs do Supabase usando as notes"""
    print("🔗 Criando mapeamento de contratos...")
    
    # Buscar todos os contratos do Supabase
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/contracts",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        },
        params={"select": "id,notes"}
    )
    
    if response.status_code not in [200, 206]:
        print(f"❌ Erro ao buscar contratos: {response.status_code}")
        return {}
    
    contracts = response.json()
    mapping = {}
    
    # Extrair ID original das notes
    import re
    for contract in contracts:
        notes = contract.get('notes', '') or ''
        # Procurar padrão [ID:xxxxx] nas notes
        match = re.search(r'\[ID:([^\]]+)\]', notes)
        if match:
            csv_id = match.group(1)
            supabase_id = contract['id']
            mapping[csv_id] = supabase_id
    
    print(f"✅ Mapeamento criado: {len(mapping)} contratos mapeados")
    return mapping

def prepare_payment_data(payment_row, contract_mapping):
    """Prepara os dados do pagamento para inserção no Supabase"""
    csv_contract_id = payment_row.get('contract_id', '').strip()
    supabase_contract_id = contract_mapping.get(csv_contract_id)
    
    if not supabase_contract_id:
        print(f"⚠️  Contract ID {csv_contract_id} não encontrado no mapeamento")
        return None
    
    return {
        'contract_id': supabase_contract_id,
        'amount': parse_decimal(payment_row.get('amount')),
        'due_date': parse_date(payment_row.get('due_date')),
        'paid_date': parse_date(payment_row.get('payment_date')),  # CSV usa 'payment_date', tabela usa 'paid_date'
        'status': payment_row.get('status', '').strip() or 'pending',
        'payment_method': None,  # Não disponível no CSV
        'notes': payment_row.get('notes', '').strip() or None,
        'external_id': payment_row.get('id', '').strip() or None,  # ID original do CSV
        'payment_type': payment_row.get('payment_type', '').strip() or None
    }

def clear_existing_payments():
    """Remove todos os pagamentos existentes"""
    print("🗑️  Limpando pagamentos existentes...")
    
    # Primeiro, contar quantos existem
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/payments?select=count",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Prefer": "count=exact"
        }
    )
    
    if response.status_code == 200:
        count = response.headers.get('Content-Range', '0').split('/')[-1]
        print(f"📊 Encontrados {count} pagamentos existentes")
    
    # Remover todos
    response = requests.delete(
        f"{SUPABASE_URL}/rest/v1/payments?id=neq.00000000-0000-0000-0000-000000000000",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
        }
    )
    
    if response.status_code == 204:
        print("✅ Pagamentos existentes removidos com sucesso")
    else:
        print(f"⚠️  Aviso ao limpar pagamentos: {response.status_code}")

def load_payments_from_csv():
    """Carrega pagamentos do arquivo CSV"""
    print("📋 Carregando pagamentos de payments.csv...")
    payments = []
    
    with open('payments.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            payments.append(row)
    
    print(f"✅ {len(payments)} pagamentos carregados do CSV")
    return payments

def import_payments_batch(payments_batch, contract_mapping):
    """Importa um lote de pagamentos"""
    # Preparar dados dos pagamentos
    payments_data = []
    for payment_row in payments_batch:
        payment_data = prepare_payment_data(payment_row, contract_mapping)
        if payment_data:  # Só adiciona se os dados são válidos
            payments_data.append(payment_data)
    
    if not payments_data:
        print("⚠️  Nenhum pagamento válido no lote")
        return False, None
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/payments",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        json=payments_data
    )
    
    return response.status_code == 201, response

def import_all_payments(payments, contract_mapping):
    """Importa todos os pagamentos em lotes"""
    print(f"📤 Iniciando importação de {len(payments)} pagamentos...")
    
    batch_size = 100
    total_batches = (len(payments) + batch_size - 1) // batch_size
    successful_imports = 0
    failed_imports = 0
    
    for i in range(0, len(payments), batch_size):
        batch_num = (i // batch_size) + 1
        batch = payments[i:i + batch_size]
        
        print(f"📦 Processando lote {batch_num}/{total_batches} ({len(batch)} pagamentos)...")
        
        success, response = import_payments_batch(batch, contract_mapping)
        
        if success:
            print(f"✅ Lote {batch_num} importado com sucesso")
            successful_imports += len(batch)
        else:
            if response:
                print(f"❌ Erro no lote: {response.status_code} - {response.text}")
            print(f"❌ Falha no lote {batch_num}")
            failed_imports += len(batch)
    
    return successful_imports, failed_imports

def verify_import():
    """Verifica se a importação foi bem-sucedida"""
    print("🔍 Verificando importação...")
    
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/payments?select=count",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Prefer": "count=exact"
        }
    )
    
    if response.status_code == 200:
        count = response.headers.get('Content-Range', '0').split('/')[-1]
        print(f"📊 Total de pagamentos no banco: {count}")
        return int(count)
    else:
        print(f"❌ Erro ao verificar: {response.status_code}")
        return 0

def main():
    print("🚀 Iniciando importação de pagamentos para o Supabase...")
    
    try:
        # Criar mapeamento de contratos
        contract_mapping = create_contract_mapping()
        
        if not contract_mapping:
            print("❌ Nenhum contrato encontrado para mapeamento")
            return
        
        # Limpar pagamentos existentes
        clear_existing_payments()
        
        # Carregar pagamentos do CSV
        payments = load_payments_from_csv()
        
        if not payments:
            print("❌ Nenhum pagamento encontrado no CSV")
            return
        
        # Importar pagamentos
        successful, failed = import_all_payments(payments, contract_mapping)
        
        # Verificar importação
        total_in_db = verify_import()
        
        # Resumo
        print()
        print("📊 RESUMO DA IMPORTAÇÃO DE PAGAMENTOS:")
        print(f"   Pagamentos importados: {successful}")
        print(f"   Erros: {failed}")
        print(f"   Taxa de sucesso: {(successful / len(payments) * 100):.1f}%")
        
        if successful == len(payments):
            print("\n🎉 Importação de pagamentos concluída com sucesso!")
        elif successful > 0:
            print(f"\n⚠️  Importação parcial: {successful}/{len(payments)} pagamentos")
        else:
            print("\n❌ Falha na importação de pagamentos")
            
    except FileNotFoundError:
        print("❌ Arquivo payments_rebuilt.csv não encontrado")
    except Exception as e:
        print(f"❌ Erro durante a importação: {str(e)}")

if __name__ == "__main__":
    main()