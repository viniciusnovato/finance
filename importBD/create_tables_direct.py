import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Carregar variáveis do arquivo .env do backend
env_path = '/Users/insitutoareluna/Documents/finance/backend/.env'
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Criar cliente Supabase com service role key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def create_tables():
    print("🚀 Criando tabelas companies e branches no Supabase...")
    print()
    
    # SQL para criar as tabelas
    companies_sql = """
    CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        document VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    branches_sql = """
    CREATE TABLE IF NOT EXISTS branches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        phone VARCHAR(20),
        email VARCHAR(255),
        manager_name VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    try:
        print("🔧 Criando tabela companies...")
        result = supabase.rpc('exec_sql', {'sql': companies_sql}).execute()
        print("✅ Tabela companies criada com sucesso")
    except Exception as e:
        print(f"❌ Erro ao criar tabela companies: {str(e)}")
        return False
    
    try:
        print("🔧 Criando tabela branches...")
        result = supabase.rpc('exec_sql', {'sql': branches_sql}).execute()
        print("✅ Tabela branches criada com sucesso")
    except Exception as e:
        print(f"❌ Erro ao criar tabela branches: {str(e)}")
        return False
    
    print()
    print("✅ Tabelas criadas com sucesso!")
    return True

def create_default_data():
    print("🏢 Criando empresa padrão...")
    
    # Verificar se já existe empresa
    try:
        existing = supabase.table('companies').select('*').eq('document', '12345678000199').execute()
        if existing.data:
            company_id = existing.data[0]['id']
            print(f"✅ Empresa já existe (ID: {company_id})")
        else:
            # Criar empresa
            company_data = {
                "name": "Instituto Areluna",
                "document": "12345678000199",
                "email": "contato@institutoareluna.com",
                "phone": "(11) 99999-9999",
                "address": "Rua Principal, 123",
                "city": "São Paulo",
                "state": "SP",
                "zip_code": "01234-567",
                "is_active": True
            }
            
            result = supabase.table('companies').insert(company_data).execute()
            company_id = result.data[0]['id']
            print(f"✅ Empresa criada: {result.data[0]['name']} (ID: {company_id})")
    except Exception as e:
        print(f"❌ Erro ao criar empresa: {str(e)}")
        return False
    
    print("🏪 Criando filial padrão...")
    
    try:
        # Verificar se já existe filial
        existing = supabase.table('branches').select('*').eq('code', 'PRIN').execute()
        if existing.data:
            print(f"✅ Filial já existe (ID: {existing.data[0]['id']})")
        else:
            # Criar filial
            branch_data = {
                "company_id": company_id,
                "name": "Filial Principal",
                "code": "PRIN",
                "address": "Rua Principal, 123",
                "city": "São Paulo",
                "state": "SP",
                "zip_code": "01234-567",
                "phone": "(11) 99999-9999",
                "email": "principal@institutoareluna.com",
                "manager_name": "Gerente Principal",
                "is_active": True
            }
            
            result = supabase.table('branches').insert(branch_data).execute()
            print(f"✅ Filial criada: {result.data[0]['name']} (ID: {result.data[0]['id']})")
    except Exception as e:
        print(f"❌ Erro ao criar filial: {str(e)}")
        return False
    
    return True

def main():
    if create_tables():
        create_default_data()
        print()
        print("📋 Dados criados:")
        print("   • Empresa: Instituto Areluna")
        print("   • Filial: Filial Principal")
        print()
        print("🎯 Agora você pode importar os clientes!")
    else:
        print("❌ Falha ao criar tabelas")

if __name__ == "__main__":
    main()