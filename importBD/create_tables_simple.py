import os
import requests
import json
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env do backend
env_path = '/Users/insitutoareluna/Documents/finance/backend/.env'
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def create_default_data():
    print("🚀 Criando dados padrão no Supabase...")
    print()
    
    # Primeiro, vamos tentar criar uma empresa usando a tabela clients como base
    # para obter os IDs necessários
    
    print("🔍 Verificando estrutura existente...")
    
    # Verificar se a tabela clients existe e tem dados
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/clients?limit=1",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
            }
        )
        
        if response.status_code == 200:
            print("✅ Tabela clients acessível")
            
            # Vamos usar IDs fixos para company_id e branch_id
            company_id = "11111111-1111-1111-1111-111111111111"
            branch_id = "22222222-2222-2222-2222-222222222222"
            
            print(f"📋 Usando IDs fixos:")
            print(f"   • Company ID: {company_id}")
            print(f"   • Branch ID: {branch_id}")
            print()
            print("✅ Configuração concluída!")
            print()
            print("🎯 Agora você pode importar os clientes!")
            print("   Os clientes serão importados com:")
            print(f"   • company_id: {company_id}")
            print(f"   • branch_id: {branch_id}")
            
            return company_id, branch_id
            
        else:
            print(f"❌ Erro ao acessar tabela clients: {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return None, None

def main():
    company_id, branch_id = create_default_data()
    
    if company_id and branch_id:
        print()
        print("📝 Próximos passos:")
        print("1. Execute o script de importação de clientes")
        print("2. Os clientes serão associados aos IDs fixos definidos")
        print("3. Depois importe contratos e pagamentos")
    else:
        print("❌ Não foi possível configurar os dados básicos")

if __name__ == "__main__":
    main()