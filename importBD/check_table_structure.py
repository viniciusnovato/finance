import os
import requests
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env do backend
env_path = '/Users/insitutoareluna/Documents/finance/backend/.env'
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def check_table_structure():
    print("🔍 Verificando estrutura da tabela clients...")
    print()
    
    # Tentar fazer uma consulta simples para ver quais colunas existem
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/clients?limit=0",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
            }
        )
        
        if response.status_code == 200:
            print("✅ Tabela clients acessível")
            print("📋 Estrutura da resposta (headers):")
            for header, value in response.headers.items():
                if 'content-range' in header.lower():
                    print(f"   {header}: {value}")
            print()
            
            # Tentar inserir um registro de teste para ver quais campos são obrigatórios
            test_data = {
                "name": "Teste Cliente",
                "document": "12345678901",
                "document_type": "CPF"
            }
            
            print("🧪 Testando inserção com campos mínimos...")
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
                print("✅ Inserção bem-sucedida com campos mínimos")
                result = response.json()
                if result:
                    print("📋 Campos criados automaticamente:")
                    for key, value in result[0].items():
                        print(f"   {key}: {value}")
                    
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
                        print("🗑️  Registro de teste removido")
            else:
                print(f"❌ Erro na inserção: {response.status_code}")
                print(f"   Resposta: {response.text}")
                
                # Isso nos dirá quais campos são obrigatórios
                if "violates not-null constraint" in response.text:
                    print("📋 Campos obrigatórios identificados no erro")
                    
        else:
            print(f"❌ Erro ao acessar tabela: {response.status_code}")
            print(f"   Resposta: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro: {str(e)}")

def main():
    check_table_structure()

if __name__ == "__main__":
    main()