import os
import requests
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env do backend
env_path = '/Users/insitutoareluna/Documents/finance/backend/.env'
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def check_contracts_structure():
    print("🔍 Verificando estrutura da tabela contracts...")
    print()
    
    # Primeiro, verificar se a tabela existe e está acessível
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/contracts?limit=0",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
            }
        )
        
        if response.status_code == 200:
            print("✅ Tabela contracts acessível")
            
            # Tentar inserir um registro mínimo para descobrir a estrutura
            print("🧪 Testando inserção para descobrir campos obrigatórios...")
            
            # Campos básicos que uma tabela de contratos pode ter
            test_fields = [
                {'contract_number': 'TEST001'},
                {'number': 'TEST001'},
                {'contract_id': 'TEST001'},
                {'title': 'Contrato Teste'},
                {'name': 'Contrato Teste'},
                {'description': 'Teste'},
                {'amount': 1000.00},
                {'value': 1000.00},
                {'total_amount': 1000.00},
                {'status': 'active'},
                {'type': 'loan'},
                {'contract_type': 'loan'}
            ]
            
            for test_data in test_fields:
                print(f"   Testando com: {list(test_data.keys())[0]}")
                
                response = requests.post(
                    f"{SUPABASE_URL}/rest/v1/contracts",
                    headers={
                        "apikey": SUPABASE_SERVICE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=representation"
                    },
                    json=test_data
                )
                
                if response.status_code == 201:
                    print(f"   ✅ Sucesso! Descobrindo estrutura completa...")
                    result = response.json()
                    if result:
                        print("\n📋 Estrutura completa da tabela contracts:")
                        print()
                        for key, value in result[0].items():
                            print(f"   {key}: {value} ({type(value).__name__})")
                        
                        # Remover o registro de teste
                        contract_id = result[0]['id']
                        delete_response = requests.delete(
                            f"{SUPABASE_URL}/rest/v1/contracts?id=eq.{contract_id}",
                            headers={
                                "apikey": SUPABASE_SERVICE_KEY,
                                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                            }
                        )
                        if delete_response.status_code == 204:
                            print("\n🗑️  Registro de teste removido")
                    break
                else:
                    print(f"   ❌ Erro: {response.status_code}")
                    if "violates not-null constraint" in response.text:
                        import re
                        match = re.search(r'column "([^"]+)"', response.text)
                        if match:
                            missing_field = match.group(1)
                            print(f"   📋 Campo obrigatório: {missing_field}")
                            
                            # Tentar com o campo obrigatório
                            test_data[missing_field] = 'Teste'
                            print(f"   🔄 Tentando novamente com {missing_field}...")
                            
                            response2 = requests.post(
                                f"{SUPABASE_URL}/rest/v1/contracts",
                                headers={
                                    "apikey": SUPABASE_SERVICE_KEY,
                                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                                    "Content-Type": "application/json",
                                    "Prefer": "return=representation"
                                },
                                json=test_data
                            )
                            
                            if response2.status_code == 201:
                                print(f"   ✅ Sucesso com {missing_field}!")
                                result = response2.json()
                                if result:
                                    print("\n📋 Estrutura completa da tabela contracts:")
                                    print()
                                    for key, value in result[0].items():
                                        print(f"   {key}: {value} ({type(value).__name__})")
                                    
                                    # Remover o registro de teste
                                    contract_id = result[0]['id']
                                    requests.delete(
                                        f"{SUPABASE_URL}/rest/v1/contracts?id=eq.{contract_id}",
                                        headers={
                                            "apikey": SUPABASE_SERVICE_KEY,
                                            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                                        }
                                    )
                                break
                            else:
                                print(f"   ❌ Ainda com erro: {response2.text[:200]}...")
                    else:
                        print(f"   Resposta: {response.text[:200]}...")
            
        else:
            print(f"❌ Erro ao acessar tabela contracts: {response.status_code}")
            print(f"   Resposta: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro: {str(e)}")

def main():
    check_contracts_structure()

if __name__ == "__main__":
    main()