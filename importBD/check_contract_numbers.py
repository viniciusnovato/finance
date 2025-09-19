#!/usr/bin/env python3

import json
import urllib.request
import urllib.parse
import urllib.error
import pandas as pd

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
    print("🔍 Verificando formato dos números de contrato...")
    
    # Buscar alguns contratos do banco para ver o formato
    print("\n📋 Primeiros 10 contratos no banco:")
    contracts_db = make_supabase_request(
        'GET',
        'contratos',
        params={
            'select': 'id,contract_number,client_name',
            'limit': '10'
        }
    )
    
    if contracts_db:
        for contract in contracts_db:
            print(f"   ID: {contract.get('id')}, Número: '{contract.get('contract_number')}', Cliente: {contract.get('client_name')}")
    else:
        print("   ❌ Erro ao buscar contratos do banco")
    
    # Verificar CSV
    print("\n📋 Primeiros 10 números de contrato no CSV:")
    try:
        df = pd.read_csv("contratosAtivosFinal.csv")
        print(f"   Total de linhas no CSV: {len(df)}")
        print(f"   Colunas disponíveis: {list(df.columns)}")
        
        if 'N' in df.columns:
            print("\n   Primeiros 10 valores da coluna 'N':")
            for i, value in enumerate(df['N'].head(10)):
                print(f"   Linha {i+1}: '{value}' (tipo: {type(value)})")
        else:
            print("   ❌ Coluna 'N' não encontrada no CSV")
            
    except Exception as e:
        print(f"   ❌ Erro ao ler CSV: {str(e)}")
    
    # Tentar buscar um contrato específico com diferentes formatos
    print("\n🔍 Testando busca de contrato específico:")
    test_number = "6235"
    
    # Teste 1: Como string
    result1 = make_supabase_request(
        'GET',
        'contratos',
        params={
            'select': 'id,contract_number',
            'contract_number': f'eq.{test_number}'
        }
    )
    print(f"   Busca por '{test_number}' (string): {len(result1) if result1 else 0} resultados")
    
    # Teste 2: Como número inteiro
    result2 = make_supabase_request(
        'GET',
        'contratos',
        params={
            'select': 'id,contract_number',
            'contract_number': f'eq.{int(float(test_number))}'
        }
    )
    print(f"   Busca por {int(float(test_number))} (int): {len(result2) if result2 else 0} resultados")
    
    # Teste 3: Busca com LIKE para ver se há padrões
    result3 = make_supabase_request(
        'GET',
        'contratos',
        params={
            'select': 'id,contract_number',
            'contract_number': f'like.*{test_number}*'
        }
    )
    print(f"   Busca com LIKE '*{test_number}*': {len(result3) if result3 else 0} resultados")
    
    if result3:
        for contract in result3[:3]:
            print(f"      Encontrado: '{contract.get('contract_number')}'")

if __name__ == "__main__":
    main()