import os
import requests
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env do backend
env_path = '/Users/insitutoareluna/Documents/finance/backend/.env'
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def get_table_columns():
    print("🔍 Obtendo informações das colunas da tabela clients...")
    print()
    
    # Consultar o information_schema para ver as colunas da tabela
    query = """
    SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
    FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND table_schema = 'public'
    ORDER BY ordinal_position;
    """
    
    try:
        # Usar a função rpc para executar SQL
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json={"sql": query}
        )
        
        if response.status_code == 200:
            columns = response.json()
            if columns:
                print("📋 Colunas da tabela clients:")
                print()
                for col in columns:
                    nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                    default = f" DEFAULT {col['column_default']}" if col['column_default'] else ""
                    print(f"   {col['column_name']}: {col['data_type']} {nullable}{default}")
            else:
                print("❌ Nenhuma coluna encontrada")
        else:
            print(f"❌ Erro ao consultar colunas: {response.status_code}")
            print(f"   Resposta: {response.text}")
            
            # Tentar método alternativo - consulta direta na tabela
            print("\n🔄 Tentando método alternativo...")
            response2 = requests.get(
                f"{SUPABASE_URL}/rest/v1/clients?select=*&limit=1",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
                }
            )
            
            if response2.status_code == 200:
                print("✅ Tabela acessível via REST API")
                data = response2.json()
                if data:
                    print("📋 Exemplo de registro:")
                    for key, value in data[0].items():
                        print(f"   {key}: {value}")
                else:
                    print("📋 Tabela vazia, mas estrutura acessível")
            else:
                print(f"❌ Erro no método alternativo: {response2.status_code}")
                print(f"   Resposta: {response2.text}")
                
    except Exception as e:
        print(f"❌ Erro: {str(e)}")

def main():
    get_table_columns()

if __name__ == "__main__":
    main()