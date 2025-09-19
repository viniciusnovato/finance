import os
import requests
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env do backend
env_path = '/Users/insitutoareluna/Documents/finance/backend/.env'
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def check_payments_table():
    """Verifica se a tabela payments é acessível"""
    print("🔍 Verificando acesso à tabela payments...")
    
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/payments?limit=1",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
        }
    )
    
    if response.status_code == 200:
        print("✅ Tabela payments é acessível")
        return True
    else:
        print(f"❌ Erro ao acessar tabela payments: {response.status_code} - {response.text}")
        return False

def test_payment_insertion():
    """Testa inserção com campos básicos para descobrir a estrutura"""
    print("🧪 Testando inserção com campos básicos...")
    
    # Campos comuns que podem existir na tabela payments
    test_fields = [
        'payment_date',
        'amount', 
        'contract_id',
        'client_id',
        'status',
        'payment_method',
        'installment_number',
        'due_date'
    ]
    
    for field in test_fields:
        test_data = {}
        
        if field == 'payment_date':
            test_data[field] = '2024-01-15'
        elif field == 'due_date':
            test_data[field] = '2024-01-15'
        elif field == 'amount':
            test_data[field] = 100.00
        elif field == 'contract_id':
            test_data[field] = 'test-contract-id'
        elif field == 'client_id':
            test_data[field] = 'test-client-id'
        elif field == 'status':
            test_data[field] = 'pending'
        elif field == 'payment_method':
            test_data[field] = 'credit_card'
        elif field == 'installment_number':
            test_data[field] = 1
        else:
            test_data[field] = f'test_{field}'
        
        print(f"\n🔍 Testando campo: {field}")
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/payments",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            json=test_data
        )
        
        if response.status_code == 201:
            print(f"✅ Inserção com '{field}' bem-sucedida!")
            
            # Obter a estrutura da tabela
            inserted_data = response.json()[0]
            print("📋 Estrutura da tabela payments:")
            for key, value in inserted_data.items():
                print(f"   - {key}: {type(value).__name__} = {value}")
            
            # Remover o registro de teste
            record_id = inserted_data.get('id')
            if record_id:
                delete_response = requests.delete(
                    f"{SUPABASE_URL}/rest/v1/payments?id=eq.{record_id}",
                    headers={
                        "apikey": SUPABASE_SERVICE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                    }
                )
                if delete_response.status_code == 204:
                    print("🗑️  Registro de teste removido")
            
            return True
        else:
            print(f"❌ Falha com '{field}': {response.status_code} - {response.text}")
    
    return False

def main():
    print("🚀 Verificando estrutura da tabela payments...")
    
    if not check_payments_table():
        return
    
    if not test_payment_insertion():
        print("❌ Não foi possível descobrir a estrutura da tabela payments")
    else:
        print("\n✅ Estrutura da tabela payments descoberta com sucesso!")

if __name__ == "__main__":
    main()