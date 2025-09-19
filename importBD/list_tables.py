#!/usr/bin/env python3

import json
import urllib.request
import urllib.parse
import urllib.error

# Configuração do Supabase
SUPABASE_URL = "https://sxbslulfitfsijqrzljd.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YnNsdWxmaXRmc2lqcXJ6bGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDg4NDksImV4cCI6MjA3MzUyNDg0OX0.ivAdA58zHtj3XNrXKG9DKMX6jynhhv77nz39IvJZjPM"

def make_supabase_request(method, endpoint, params=None, data=None):
    """Faz uma requisição HTTP para o Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    
    if params:
        url += "?" + urllib.parse.urlencode(params)
    
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
    }
    
    if data:
        data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status in [200, 201, 204]:
                content = response.read().decode('utf-8')
                return json.loads(content) if content else []
            else:
                print(f"Erro HTTP {response.status}: {response.read().decode('utf-8')}")
                return None
    except Exception as e:
        print(f"Erro na requisição: {str(e)}")
        return None

def main():
    print("🔍 Listando tabelas disponíveis no banco...")
    
    # Lista de tabelas comuns para testar
    possible_tables = [
        'clients',
        'clientes', 
        'contracts',
        'contratos',
        'payments',
        'pagamentos',
        'users',
        'usuarios'
    ]
    
    existing_tables = []
    
    for table in possible_tables:
        print(f"\n🔍 Testando tabela '{table}':")
        
        # Tentar fazer uma consulta simples
        result = make_supabase_request(
            'GET',
            table,
            params={
                'select': 'count',
                'limit': '1'
            }
        )
        
        if result is not None:
            print(f"   ✅ Tabela '{table}' existe!")
            existing_tables.append(table)
            
            # Tentar obter estrutura da tabela
            structure = make_supabase_request(
                'GET',
                table,
                params={
                    'limit': '1'
                }
            )
            
            if structure and len(structure) > 0:
                print(f"   📋 Colunas da tabela '{table}':")
                for column in structure[0].keys():
                    print(f"      - {column}")
                    
                # Contar registros
                count_result = make_supabase_request(
                    'GET',
                    table,
                    params={'select': '*'}
                )
                
                if count_result is not None:
                    print(f"   📊 Total de registros: {len(count_result)}")
            else:
                print(f"   📋 Tabela '{table}' existe mas está vazia")
        else:
            print(f"   ❌ Tabela '{table}' não existe ou não acessível")
    
    print("\n" + "="*50)
    print("📊 RESUMO:")
    print("="*50)
    
    if existing_tables:
        print(f"✅ Tabelas encontradas: {', '.join(existing_tables)}")
    else:
        print("❌ Nenhuma tabela encontrada")
        print("\n💡 Possíveis causas:")
        print("   - As tabelas ainda não foram criadas")
        print("   - Problemas de permissão")
        print("   - Nomes de tabelas diferentes dos testados")
        print("   - Configuração incorreta do Supabase")

if __name__ == "__main__":
    main()