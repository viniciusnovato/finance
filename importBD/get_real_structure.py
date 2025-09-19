import os
import requests
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env do backend
env_path = '/Users/insitutoareluna/Documents/finance/backend/.env'
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def get_real_structure():
    print("🔍 Descobrindo estrutura real da tabela clients...")
    print()
    
    # Baseado no erro anterior, sabemos que existe 'first_name' obrigatório
    # Vamos testar campos comuns de uma tabela de clientes
    possible_fields = [
        'first_name', 'last_name', 'full_name', 'name',
        'email', 'phone', 'mobile', 'birth_date', 'address', 'city', 'state',
        'notes', 'created_at', 'updated_at', 'id'
    ]
    
    # Primeiro, vamos tentar inserir apenas com first_name
    print("🧪 Testando inserção com first_name...")
    test_data = {'first_name': 'João'}
    
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
        print("✅ Inserção com first_name bem-sucedida!")
        result = response.json()
        if result:
            print("📋 Estrutura completa da tabela:")
            print()
            for key, value in result[0].items():
                print(f"   {key}: {value} ({type(value).__name__})")
            
            # Remover o registro de teste
            client_id = result[0]['id']
            delete_response = requests.delete(
                f"{SUPABASE_URL}/rest/v1/clients?id=eq.{client_id}",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                }
            )
            if delete_response.status_code == 204:
                print("\n🗑️  Registro de teste removido")
                
    else:
        print(f"❌ Erro: {response.status_code}")
        print(f"   Resposta: {response.text}")
        
        # Se ainda há campos obrigatórios, vamos tentar descobrir
        if "violates not-null constraint" in response.text:
            import re
            # Extrair o nome do campo obrigatório do erro
            match = re.search(r'column "([^"]+)"', response.text)
            if match:
                missing_field = match.group(1)
                print(f"\n📋 Campo obrigatório encontrado: {missing_field}")
                
                # Tentar novamente com este campo
                test_data[missing_field] = 'Teste'
                print(f"🧪 Testando com {missing_field}...")
                
                response2 = requests.post(
                    f"{SUPABASE_URL}/rest/v1/clients",
                    headers={
                        "apikey": SUPABASE_SERVICE_KEY,
                        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=representation"
                    },
                    json=test_data
                )
                
                if response2.status_code == 201:
                    print("✅ Inserção bem-sucedida!")
                    result = response2.json()
                    if result:
                        print("📋 Estrutura completa da tabela:")
                        print()
                        for key, value in result[0].items():
                            print(f"   {key}: {value} ({type(value).__name__})")
                        
                        # Remover o registro de teste
                        client_id = result[0]['id']
                        requests.delete(
                            f"{SUPABASE_URL}/rest/v1/clients?id=eq.{client_id}",
                            headers={
                                "apikey": SUPABASE_SERVICE_KEY,
                                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                            }
                        )
                else:
                    print(f"❌ Ainda com erro: {response2.status_code}")
                    print(f"   {response2.text}")

def main():
    get_real_structure()

if __name__ == "__main__":
    main()