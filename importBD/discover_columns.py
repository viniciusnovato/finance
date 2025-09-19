import os
import requests
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env do backend
env_path = '/Users/insitutoareluna/Documents/finance/backend/.env'
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def discover_columns():
    print("🔍 Descobrindo estrutura da tabela clients...")
    print()
    
    # Lista de campos possíveis baseados no CSV e na migração
    possible_fields = [
        'id', 'name', 'document', 'document_type', 'email', 'phone', 'mobile',
        'birth_date', 'address', 'neighborhood', 'city', 'state', 'zip_code',
        'occupation', 'monthly_income', 'marital_status', 'spouse_name',
        'spouse_document', 'spouse_phone', 'reference_name', 'reference_phone',
        'reference_relationship', 'notes', 'is_active', 'created_at', 'updated_at',
        'company_id', 'branch_id'
    ]
    
    # Testar cada campo individualmente
    existing_fields = []
    
    for field in possible_fields:
        test_data = {field: "test_value" if field != 'is_active' else True}
        
        try:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/clients",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                json=test_data
            )
            
            if response.status_code == 201:
                print(f"✅ Campo '{field}' existe e aceita valores")
                existing_fields.append(field)
                
                # Remover o registro de teste
                result = response.json()
                if result and 'id' in result[0]:
                    client_id = result[0]['id']
                    delete_response = requests.delete(
                        f"{SUPABASE_URL}/rest/v1/clients?id=eq.{client_id}",
                        headers={
                            "apikey": SUPABASE_SERVICE_KEY,
                            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                        }
                    )
            elif "Could not find the" in response.text and "column" in response.text:
                print(f"❌ Campo '{field}' não existe")
            else:
                # Pode ser um erro de constraint, mas o campo existe
                if "violates" in response.text or "invalid" in response.text:
                    print(f"⚠️  Campo '{field}' existe mas tem restrições")
                    existing_fields.append(field)
                else:
                    print(f"❓ Campo '{field}': {response.status_code} - {response.text[:100]}...")
                    
        except Exception as e:
            print(f"❌ Erro testando campo '{field}': {str(e)}")
    
    print()
    print("📋 RESUMO - Campos que existem na tabela:")
    for field in existing_fields:
        print(f"   ✅ {field}")
    
    print()
    print(f"📊 Total de campos encontrados: {len(existing_fields)}")
    
    # Tentar uma inserção com campos mínimos conhecidos
    if existing_fields:
        print()
        print("🧪 Testando inserção com campos básicos...")
        
        basic_data = {}
        if 'name' in existing_fields:
            basic_data['name'] = 'Cliente Teste'
        if 'email' in existing_fields:
            basic_data['email'] = 'teste@email.com'
            
        if basic_data:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/clients",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                json=basic_data
            )
            
            if response.status_code == 201:
                print("✅ Inserção básica bem-sucedida")
                result = response.json()
                if result:
                    print("📋 Registro criado:")
                    for key, value in result[0].items():
                        print(f"   {key}: {value}")
                    
                    # Remover o registro
                    client_id = result[0]['id']
                    requests.delete(
                        f"{SUPABASE_URL}/rest/v1/clients?id=eq.{client_id}",
                        headers={
                            "apikey": SUPABASE_SERVICE_KEY,
                            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                        }
                    )
            else:
                print(f"❌ Erro na inserção básica: {response.status_code}")
                print(f"   {response.text}")

def main():
    discover_columns()

if __name__ == "__main__":
    main()