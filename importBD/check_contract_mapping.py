import os
import csv
import requests
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env do backend
env_path = '/Users/insitutoareluna/Documents/finance/backend/.env'
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def check_contracts_count():
    """Verifica quantos contratos existem no banco"""
    print("🔍 Verificando quantidade de contratos...")
    
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
    elif response.status_code == 206:
        # Status 206 com dados de contagem
        try:
            data = response.json()
            if isinstance(data, list) and len(data) > 0 and 'count' in data[0]:
                count = data[0]['count']
                print(f"📊 Total de contratos no banco: {count}")
                return int(count)
        except:
            pass
        print(f"❌ Erro ao interpretar contagem: {response.status_code} - {response.text}")
        return 0
    else:
        print(f"❌ Erro ao contar contratos: {response.status_code} - {response.text}")
        return 0

def check_contracts_sample():
    """Verifica uma amostra de contratos no banco"""
    print("\n🔍 Buscando amostra de contratos...")
    
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/contracts?limit=5",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
        }
    )
    
    if response.status_code == 200:
        contracts = response.json()
        print(f"📊 Primeiros 5 contratos:")
        for contract in contracts:
            print(f"   ID: {contract.get('id', 'N/A')}")
            print(f"   External ID: {contract.get('external_id', 'N/A')}")
            print(f"   Contract Number: {contract.get('contract_number', 'N/A')}")
            print(f"   ---")
        return contracts
    else:
        print(f"❌ Erro ao buscar contratos: {response.status_code} - {response.text}")
        return []

def check_payments_csv_sample():
    """Verifica uma amostra do CSV de pagamentos"""
    print("\n📋 Verificando amostra do payments.csv...")
    
    contract_ids = set()
    sample_payments = []
    
    with open('payments.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i < 5:  # Mostrar apenas os primeiros 5
                sample_payments.append(row)
                print(f"   Payment ID: {row['id']}")
                print(f"   Contract ID: {row['contract_id']}")
                print(f"   Amount: {row['amount']}")
                print(f"   ---")
            contract_ids.add(row['contract_id'])
    
    print(f"\n📊 Total de contract_ids únicos no CSV: {len(contract_ids)}")
    print(f"📊 Primeiros 5 contract_ids únicos: {list(contract_ids)[:5]}")
    
    return sample_payments, list(contract_ids)

def create_contract_mapping(db_contracts):
    """Cria mapeamento de external_id para id do banco"""
    print("\n🔗 Criando mapeamento de contratos...")
    
    mapping = {}
    for contract in db_contracts:
        external_id = contract.get('external_id')
        db_id = contract.get('id')
        if external_id and db_id:
            mapping[external_id] = db_id
            print(f"   {external_id} -> {db_id}")
    
    print(f"📊 Total de mapeamentos criados: {len(mapping)}")
    return mapping

def test_payment_mapping(sample_payments, contract_mapping):
    """Testa se os pagamentos podem ser mapeados"""
    print("\n🧪 Testando mapeamento de pagamentos...")
    
    for payment in sample_payments:
        csv_contract_id = payment['contract_id']
        if csv_contract_id in contract_mapping:
            db_contract_id = contract_mapping[csv_contract_id]
            print(f"   ✅ Payment {payment['id']}: {csv_contract_id} -> {db_contract_id}")
        else:
            print(f"   ❌ Payment {payment['id']}: {csv_contract_id} não encontrado")

def main():
    print("🚀 Verificando mapeamento de contratos...")
    
    # Verificar quantidade de contratos
    contracts_count = check_contracts_count()
    
    if contracts_count == 0:
        print("❌ Não há contratos no banco. Importe os contratos primeiro.")
        return
    
    # Buscar amostra de contratos
    db_contracts = check_contracts_sample()
    
    # Verificar amostra do CSV de pagamentos
    sample_payments, csv_contract_ids = check_payments_csv_sample()
    
    # Criar mapeamento
    if db_contracts:
        contract_mapping = create_contract_mapping(db_contracts)
        
        # Testar mapeamento
        if contract_mapping and sample_payments:
            test_payment_mapping(sample_payments, contract_mapping)
        else:
            print("❌ Não foi possível criar mapeamento ou não há pagamentos para testar")
    
    print("\n✅ Verificação concluída")

if __name__ == "__main__":
    main()