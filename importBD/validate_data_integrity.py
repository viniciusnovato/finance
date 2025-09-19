import os
import requests
from dotenv import load_dotenv

# Carregar variáveis de ambiente
env_path = '/Users/insitutoareluna/Documents/finance/backend/.env'
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def get_table_count(table_name):
    """Obtém a contagem de registros de uma tabela"""
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table_name}",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "count=exact"
        },
        params={"select": "id"}
    )
    
    if response.status_code in [200, 206]:
        # Extrair contagem do header Content-Range
        content_range = response.headers.get('Content-Range', '')
        if content_range:
            # Formato: "0-99/586" ou "*/586"
            total = content_range.split('/')[-1]
            return int(total) if total.isdigit() else 0
    return 0

def validate_foreign_keys():
    """Valida as chaves estrangeiras entre as tabelas"""
    print("🔗 Validando chaves estrangeiras...")
    
    # Verificar contratos órfãos (sem client_id válido)
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/contracts",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "count=exact"
        },
        params={
            "select": "id",
            "client_id": "is.null"
        }
    )
    
    orphan_contracts = 0
    if response.status_code in [200, 206]:
        content_range = response.headers.get('Content-Range', '')
        if content_range:
            total = content_range.split('/')[-1]
            orphan_contracts = int(total) if total.isdigit() else 0
    
    # Verificar pagamentos órfãos (sem contract_id válido)
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/payments",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "count=exact"
        },
        params={
            "select": "id",
            "contract_id": "is.null"
        }
    )
    
    orphan_payments = 0
    if response.status_code in [200, 206]:
        content_range = response.headers.get('Content-Range', '')
        if content_range:
            total = content_range.split('/')[-1]
            orphan_payments = int(total) if total.isdigit() else 0
    
    return orphan_contracts, orphan_payments

def get_sample_data():
    """Obtém amostras de dados para verificação"""
    print("📋 Coletando amostras de dados...")
    
    samples = {}
    
    # Amostra de clientes
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/clients",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        },
        params={"select": "id,name,email", "limit": "3"}
    )
    
    if response.status_code == 200:
        samples['clients'] = response.json()
    
    # Amostra de contratos
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/contracts",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        },
        params={"select": "id,contract_number,client_id,value", "limit": "3"}
    )
    
    if response.status_code == 200:
        samples['contracts'] = response.json()
    
    # Amostra de pagamentos
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/payments",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        },
        params={"select": "id,contract_id,amount,status", "limit": "3"}
    )
    
    if response.status_code == 200:
        samples['payments'] = response.json()
    
    return samples

def validate_data_consistency():
    """Valida a consistência dos dados"""
    print("🔍 Validando consistência dos dados...")
    
    issues = []
    
    # Verificar contratos com valores inválidos
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/contracts",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "count=exact"
        },
        params={
            "select": "id",
            "value": "is.null"
        }
    )
    
    if response.status_code in [200, 206]:
        content_range = response.headers.get('Content-Range', '')
        if content_range:
            total = content_range.split('/')[-1]
            null_values = int(total) if total.isdigit() else 0
            if null_values > 0:
                issues.append(f"Encontrados {null_values} contratos com valor nulo")
    
    # Verificar pagamentos com valores inválidos
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/payments",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "count=exact"
        },
        params={
            "select": "id",
            "amount": "is.null"
        }
    )
    
    if response.status_code in [200, 206]:
        content_range = response.headers.get('Content-Range', '')
        if content_range:
            total = content_range.split('/')[-1]
            null_amounts = int(total) if total.isdigit() else 0
            if null_amounts > 0:
                issues.append(f"Encontrados {null_amounts} pagamentos com valor nulo")
    
    return issues

def main():
    print("🔍 VALIDAÇÃO DE INTEGRIDADE DOS DADOS")
    print("=" * 50)
    
    try:
        # Contagem de registros
        print("\n📊 CONTAGEM DE REGISTROS:")
        clients_count = get_table_count('clients')
        contracts_count = get_table_count('contracts')
        payments_count = get_table_count('payments')
        
        print(f"   👥 Clientes: {clients_count:,}")
        print(f"   📄 Contratos: {contracts_count:,}")
        print(f"   💰 Pagamentos: {payments_count:,}")
        
        # Validação de chaves estrangeiras
        print("\n🔗 VALIDAÇÃO DE RELACIONAMENTOS:")
        orphan_contracts, orphan_payments = validate_foreign_keys()
        
        if orphan_contracts == 0:
            print("   ✅ Todos os contratos têm client_id válido")
        else:
            print(f"   ❌ {orphan_contracts} contratos órfãos (sem client_id)")
        
        if orphan_payments == 0:
            print("   ✅ Todos os pagamentos têm contract_id válido")
        else:
            print(f"   ❌ {orphan_payments} pagamentos órfãos (sem contract_id)")
        
        # Validação de consistência
        print("\n🔍 VALIDAÇÃO DE CONSISTÊNCIA:")
        issues = validate_data_consistency()
        
        if not issues:
            print("   ✅ Nenhum problema de consistência encontrado")
        else:
            for issue in issues:
                print(f"   ❌ {issue}")
        
        # Amostras de dados
        print("\n📋 AMOSTRAS DE DADOS:")
        samples = get_sample_data()
        
        if 'clients' in samples and samples['clients']:
            print("   👥 Clientes (amostra):")
            for client in samples['clients'][:2]:
                print(f"      - {client.get('name', 'N/A')} ({client.get('email', 'N/A')})")
        
        if 'contracts' in samples and samples['contracts']:
            print("   📄 Contratos (amostra):")
            for contract in samples['contracts'][:2]:
                print(f"      - {contract.get('contract_number', 'N/A')} (R$ {contract.get('value', 0):,.2f})")
        
        if 'payments' in samples and samples['payments']:
            print("   💰 Pagamentos (amostra):")
            for payment in samples['payments'][:2]:
                print(f"      - R$ {payment.get('amount', 0):,.2f} ({payment.get('status', 'N/A')})")
        
        # Resumo final
        print("\n" + "=" * 50)
        total_issues = len(issues) + (1 if orphan_contracts > 0 else 0) + (1 if orphan_payments > 0 else 0)
        
        if total_issues == 0:
            print("🎉 VALIDAÇÃO CONCLUÍDA: Todos os dados estão íntegros!")
        else:
            print(f"⚠️  VALIDAÇÃO CONCLUÍDA: {total_issues} problema(s) encontrado(s)")
        
        print(f"\n📈 ESTATÍSTICAS FINAIS:")
        print(f"   Total de registros importados: {clients_count + contracts_count + payments_count:,}")
        print(f"   Relacionamentos válidos: {(orphan_contracts == 0 and orphan_payments == 0)}")
        print(f"   Consistência dos dados: {len(issues) == 0}")
        
    except Exception as e:
        print(f"❌ Erro durante a validação: {str(e)}")

if __name__ == "__main__":
    main()
