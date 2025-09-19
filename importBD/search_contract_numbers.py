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
    print("🔍 Procurando números de contrato do CSV em todas as tabelas...")
    
    # Ler alguns números do CSV
    csv_file = 'contratosAtivosFinal.csv'
    csv_numbers = []
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for i, row in enumerate(reader):
                if i >= 3:  # Pegar apenas os primeiros 3
                    break
                number = row['N']
                if '.' in str(number):
                    number = str(int(float(number)))
                else:
                    number = str(number)
                csv_numbers.append(number)
    except Exception as e:
        print(f"Erro ao ler CSV: {e}")
        return
    
    print(f"📋 Números do CSV para testar: {csv_numbers}")
    
    # Tabelas para verificar
    tables = ['clients', 'contracts', 'payments']
    
    for table in tables:
        print(f"\n🔍 Verificando tabela '{table}':")
        
        # Buscar alguns registros para ver a estrutura
        records = make_supabase_request(
            'GET',
            table,
            params={
                'select': '*',
                'limit': '3'
            }
        )
        
        if not records:
            print(f"   ❌ Não foi possível acessar a tabela '{table}'")
            continue
            
        print(f"   📋 Estrutura da tabela '{table}':")
        if records:
            for key in records[0].keys():
                print(f"      - {key}")
        
        # Procurar pelos números do CSV em campos que podem conter números
        numeric_fields = []
        text_fields = []
        
        if records:
            for key, value in records[0].items():
                if isinstance(value, (int, float)) or (isinstance(value, str) and value.isdigit()):
                    numeric_fields.append(key)
                elif isinstance(value, str):
                    text_fields.append(key)
        
        print(f"   🔢 Campos numéricos: {numeric_fields}")
        print(f"   📝 Campos de texto: {text_fields}")
        
        # Testar busca pelos números do CSV
        for test_number in csv_numbers:
            print(f"\n   🔍 Testando número {test_number}:")
            found = False
            
            # Buscar em campos numéricos
            for field in numeric_fields:
                if field in ['id']:  # Pular campos UUID
                    continue
                    
                result = make_supabase_request(
                    'GET',
                    table,
                    params={
                        'select': f'id,{field}',
                        field: f'eq.{test_number}'
                    }
                )
                
                if result and len(result) > 0:
                    print(f"      ✅ Encontrado no campo '{field}': {result[0]}")
                    found = True
                    break
            
            # Se não encontrou em campos numéricos, buscar em campos de texto
            if not found:
                for field in text_fields[:3]:  # Limitar a 3 campos de texto
                    if field in ['id', 'created_at', 'updated_at']:  # Pular campos irrelevantes
                        continue
                        
                    result = make_supabase_request(
                        'GET',
                        table,
                        params={
                            'select': f'id,{field}',
                            field: f'like.*{test_number}*'
                        }
                    )
                    
                    if result and len(result) > 0:
                        print(f"      ✅ Encontrado no campo '{field}' com LIKE: {result[0]}")
                        found = True
                        break
            
            if not found:
                print(f"      ❌ Número {test_number} não encontrado na tabela '{table}'")
    
    print("\n" + "="*50)
    print("📊 CONCLUSÃO:")
    print("Os números do CSV (5753, 6411, etc.) não foram encontrados")
    print("em nenhuma tabela do banco de dados.")
    print("\nPossíveis soluções:")
    print("1. Os números podem estar em uma tabela não verificada")
    print("2. Os dados do CSV podem precisar ser importados como novos registros")
    print("3. Pode haver uma correspondência diferente entre CSV e banco")

if __name__ == "__main__":
    main()