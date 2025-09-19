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
    print("🔍 Verificando todas as colunas da tabela contracts...")
    
    # Buscar alguns contratos com todas as colunas
    print("\n📋 Buscando primeiros 5 contratos com todas as colunas:")
    contracts = make_supabase_request(
        'GET',
        'contracts',
        params={
            'select': '*',
            'limit': '5'
        }
    )
    
    if contracts:
        print("📋 Contratos encontrados no banco:")
        for i, contract in enumerate(contracts, 1):
            print(f"\n   Contrato {i}:")
            for key, value in contract.items():
                print(f"      {key}: {value}")
    else:
        print("❌ Nenhum contrato encontrado no banco")
        return
    
    # Ler alguns números do CSV para comparar
    csv_file = 'contratosAtivosFinal.csv'
    csv_numbers = []
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for i, row in enumerate(reader):
                if i >= 5:  # Pegar apenas os primeiros 5
                    break
                csv_numbers.append({
                    'N': row['N'],
                    'Área': row['Área'],
                    'Contrato': row['Contrato']
                })
    except Exception as e:
        print(f"Erro ao ler CSV: {e}")
        return
    
    print(f"\n📋 Primeiros 5 registros do CSV:")
    for i, row in enumerate(csv_numbers, 1):
        print(f"   Linha {i}: N={row['N']}, Área={row['Área']}, Contrato={row['Contrato']}")
    
    # Tentar buscar por diferentes campos que possam conter números
    print("\n🔍 Testando busca por números do CSV em diferentes campos:")
    
    test_number = csv_numbers[0]['N']
    if '.' in str(test_number):
        test_number = str(int(float(test_number)))
    else:
        test_number = str(test_number)
    
    print(f"\n   Testando com número: {test_number}")
    
    # Campos possíveis para buscar
    possible_fields = ['contract_number', 'id', 'external_id', 'description']
    
    for field in possible_fields:
        print(f"\n   Buscando no campo '{field}':")
        
        # Busca exata
        result = make_supabase_request(
            'GET',
            'contracts',
            params={
                'select': f'id,{field}',
                field: f'eq.{test_number}'
            }
        )
        
        if result and len(result) > 0:
            print(f"   ✅ Encontrado: {result[0]}")
        else:
            # Tentar busca com LIKE se for campo de texto
            if field in ['contract_number', 'description']:
                result_like = make_supabase_request(
                    'GET',
                    'contracts',
                    params={
                        'select': f'id,{field}',
                        field: f'like.*{test_number}*'
                    }
                )
                
                if result_like and len(result_like) > 0:
                    print(f"   ✅ Encontrado com LIKE: {result_like[0]}")
                else:
                    print(f"   ❌ Não encontrado")
            else:
                print(f"   ❌ Não encontrado")

if __name__ == "__main__":
    main()