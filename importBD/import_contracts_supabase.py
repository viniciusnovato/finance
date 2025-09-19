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

def prepare_contract_data(contract_row):
    """Prepara os dados do contrato para inserção no Supabase"""
    # Usar o ID original do CSV nas notes para mapeamento posterior
    original_id = contract_row.get('id', '').strip()
    notes_content = contract_row.get('notes', '').strip()
    
    # Combinar notes originais com ID para mapeamento
    if notes_content and original_id:
        combined_notes = f"{notes_content} [ID:{original_id}]"
    elif original_id:
        combined_notes = f"[ID:{original_id}]"
    else:
        combined_notes = notes_content or None
    
    return {
        'client_id': contract_row.get('client_id', '').strip() or None,
        'contract_number': contract_row.get('contract_number', '').strip() or f"CONTRACT_{original_id[:8]}",
        'description': contract_row.get('description', '').strip() or None,
        'value': parse_decimal(contract_row.get('total_amount')),
        'start_date': parse_date(contract_row.get('start_date')),
        'end_date': parse_date(contract_row.get('end_date')),
        'status': contract_row.get('status', '').strip() or 'active',
        'payment_frequency': contract_row.get('payment_frequency', '').strip() or 'monthly',
        'notes': combined_notes,
        'down_payment': parse_decimal(contract_row.get('installment_amount')),
        'number_of_payments': None  # Não disponível no CSV
    }

def clear_existing_contracts():
    """Remove todos os contratos existentes"""
    print("🗑️  Limpando contratos existentes...")
    
    # Primeiro, contar quantos existem
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/contracts?select=count",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Prefer": "count=exact"
        }
    )
    
    if response.status_code == 200:
        count = response.headers.get('Content-Range', '0').split('/')[-1]
        print(f"📊 Encontrados {count} contratos existentes")
    
    # Remover todos
    response = requests.delete(
        f"{SUPABASE_URL}/rest/v1/contracts?id=neq.00000000-0000-0000-0000-000000000000",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
        }
    )
    
    if response.status_code == 204:
        print("✅ Contratos existentes removidos com sucesso")
    else:
        print(f"⚠️  Aviso ao limpar contratos: {response.status_code}")

def load_contracts_from_csv():
    """Carrega contratos do arquivo CSV"""
    print("📋 Carregando contratos de contracts.csv...")
    contracts = []
    
    with open('contracts.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            contract_data = prepare_contract_data(row)
            contracts.append(contract_data)
    
    print(f"✅ {len(contracts)} contratos carregados do CSV")
    return contracts

def import_contracts_batch(contracts_batch):
    """Importa um lote de contratos"""
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/contracts",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        json=contracts_batch
    )
    
    return response.status_code == 201, response

def import_all_contracts(contracts):
    """Importa todos os contratos em lotes"""
    print(f"📤 Iniciando importação de {len(contracts)} contratos...")
    
    batch_size = 100
    total_batches = (len(contracts) + batch_size - 1) // batch_size
    successful_imports = 0
    failed_imports = 0
    
    for i in range(0, len(contracts), batch_size):
        batch_num = (i // batch_size) + 1
        batch = contracts[i:i + batch_size]
        
        print(f"📦 Processando lote {batch_num}/{total_batches} ({len(batch)} contratos)...")
        
        success, response = import_contracts_batch(batch)
        
        if success:
            print(f"✅ Lote {batch_num} importado com sucesso")
            successful_imports += len(batch)
        else:
            print(f"❌ Erro no lote: {response.status_code} - {response.text}")
            print(f"❌ Falha no lote {batch_num}")
            failed_imports += len(batch)
    
    return successful_imports, failed_imports

def verify_import():
    """Verifica se a importação foi bem-sucedida"""
    print("🔍 Verificando importação...")
    
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/contracts?select=count",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Prefer": "count=exact"
        }
    )
    
    if response.status_code == 200:
        count = response.headers.get('Content-Range', '0').split('/')[-1]
        print(f"📊 Total de contratos no banco: {count}")
        return int(count)
    else:
        print(f"❌ Erro ao verificar: {response.status_code}")
        return 0

def main():
    print("🚀 Iniciando importação de contratos para o Supabase...")
    
    try:
        # Limpar contratos existentes
        clear_existing_contracts()
        
        # Carregar contratos do CSV
        contracts = load_contracts_from_csv()
        
        if not contracts:
            print("❌ Nenhum contrato encontrado no CSV")
            return
        
        # Importar contratos
        successful, failed = import_all_contracts(contracts)
        
        # Verificar importação
        total_in_db = verify_import()
        
        # Resumo
        print()
        print("📊 RESUMO DA IMPORTAÇÃO DE CONTRATOS:")
        print(f"   Contratos importados: {successful}")
        print(f"   Erros: {failed}")
        print(f"   Taxa de sucesso: {(successful / len(contracts) * 100):.1f}%")
        
        if successful == len(contracts):
            print("\n🎉 Importação de contratos concluída com sucesso!")
        elif successful > 0:
            print(f"\n⚠️  Importação parcial: {successful}/{len(contracts)} contratos")
        else:
            print("\n❌ Falha na importação de contratos")
            
    except FileNotFoundError:
        print("❌ Arquivo contracts.csv não encontrado")
    except Exception as e:
        print(f"❌ Erro durante a importação: {str(e)}")

if __name__ == "__main__":
    main()