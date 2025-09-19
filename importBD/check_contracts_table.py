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
    print("🔍 Verificando tabela contratos...")
    
    # Contar total de contratos
    print("\n📊 Contando contratos no banco:")
    count_result = make_supabase_request(
        'GET',
        'contratos',
        params={
            'select': 'count',
            'limit': '1'
        }
    )
    
    if count_result is not None:
        print(f"   Total de contratos: {len(count_result) if count_result else 0}")
    
    # Buscar alguns contratos para ver a estrutura
    print("\n📋 Primeiros 5 contratos (todas as colunas):")
    contracts = make_supabase_request(
        'GET',
        'contratos',
        params={
            'limit': '5'
        }
    )
    
    if contracts:
        for i, contract in enumerate(contracts):
            print(f"\n   Contrato {i+1}:")
            for key, value in contract.items():
                print(f"      {key}: {value}")
    else:
        print("   ❌ Nenhum contrato encontrado ou erro na consulta")
    
    # Verificar se a coluna contract_number existe
    print("\n🔍 Verificando estrutura da tabela:")
    structure_result = make_supabase_request(
        'GET',
        'contratos',
        params={
            'select': '*',
            'limit': '1'
        }
    )
    
    if structure_result and len(structure_result) > 0:
        print("   Colunas disponíveis na tabela contratos:")
        for column in structure_result[0].keys():
            print(f"      - {column}")
    else:
        print("   ❌ Não foi possível verificar a estrutura da tabela")
    
    # Verificar se existem contratos com números específicos do CSV
    print("\n🔍 Buscando contratos com números do CSV:")
    test_numbers = ['5753', '6411', '8340', '5355', '7043']
    
    for num in test_numbers:
        # Buscar em todas as colunas possíveis
        found = False
        
        # Tentar buscar por ID
        result_id = make_supabase_request(
            'GET',
            'contratos',
            params={
                'select': 'id,client_name',
                'id': f'eq.{num}'
            }
        )
        
        if result_id and len(result_id) > 0:
            print(f"   ✅ Número {num} encontrado como ID: {result_id[0].get('client_name')}")
            found = True
        
        if not found:
            print(f"   ❌ Número {num} não encontrado")

if __name__ == "__main__":
    main()