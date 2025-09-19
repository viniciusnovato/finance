#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import urllib.request
import urllib.parse
import csv

# Configuração do Supabase
SUPABASE_URL = "https://sxbslulfitfsijqrzljd.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YnNsdWxmaXRmc2lqcXJ6bGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDg4NDksImV4cCI6MjA3MzUyNDg0OX0.ivAdA58zHtj3XNrXKG9DKMX6jynhhv77nz39IvJZjPM"

def make_supabase_request(method, table, params=None, data=None):
    """Faz uma requisição para a API do Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    
    if params:
        query_string = urllib.parse.urlencode(params)
        url += f"?{query_string}"
    
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
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Erro na requisição: {e}")
        return None
    except Exception as e:
        print(f"Erro inesperado: {e}")
        return None

def main():
    print("🔍 Verificando formato dos números de contrato...")
    
    # Ler alguns números do CSV
    csv_file = 'contratosAtivosFinal.csv'
    csv_numbers = []
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for i, row in enumerate(reader):
                if i >= 10:  # Pegar apenas os primeiros 10
                    break
                csv_numbers.append(row['N'])
    except Exception as e:
        print(f"Erro ao ler CSV: {e}")
        return
    
    print(f"\n📋 Primeiros 10 números do CSV: {csv_numbers}")
    
    # Buscar alguns contratos no banco para ver o formato
    print("\n🔍 Buscando primeiros 10 contratos no banco:")
    contracts = make_supabase_request(
        'GET',
        'contracts',
        params={
            'select': 'id,contract_number',
            'limit': '10'
        }
    )
    
    if contracts:
        print("📋 Contratos encontrados no banco:")
        for contract in contracts:
            print(f"   ID: {contract['id']}, Número: {contract['contract_number']}")
    else:
        print("❌ Nenhum contrato encontrado no banco")
    
    # Testar busca por alguns números específicos do CSV
    print("\n🔍 Testando busca por números específicos do CSV:")
    for csv_num in csv_numbers[:5]:  # Testar apenas os primeiros 5
        # Converter para int se for float
        if '.' in str(csv_num):
            test_num = str(int(float(csv_num)))
        else:
            test_num = str(csv_num)
        
        print(f"\n   Testando número: {test_num}")
        
        # Busca exata
        result = make_supabase_request(
            'GET',
            'contracts',
            params={
                'select': 'id,contract_number',
                'contract_number': f'eq.{test_num}'
            }
        )
        
        if result and len(result) > 0:
            print(f"   ✅ Encontrado: {result[0]}")
        else:
            print(f"   ❌ Não encontrado com busca exata")
            
            # Tentar busca com LIKE
            result_like = make_supabase_request(
                'GET',
                'contracts',
                params={
                    'select': 'id,contract_number',
                    'contract_number': f'like.*{test_num}*'
                }
            )
            
            if result_like and len(result_like) > 0:
                print(f"   ✅ Encontrado com LIKE: {result_like[0]}")
            else:
                print(f"   ❌ Não encontrado nem com LIKE")

if __name__ == "__main__":
    main()