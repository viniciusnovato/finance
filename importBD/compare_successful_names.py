#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Compara nomes que foram mapeados com sucesso vs os que falharam
"""

import json
import urllib.request
import urllib.parse
import urllib.error
import csv

# Configuração do Supabase
SUPABASE_URL = "https://sxbslulfitfsijqrzljd.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YnNsdWxmaXRmc2lqcXJ6bGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDg4NDksImV4cCI6MjA3MzUyNDg0OX0.ivAdA58zHtj3XNrXKG9DKMX6jynhhv77nz39IvJZjPM"

def make_supabase_request(method, endpoint, params=None):
    """Faz uma requisição HTTP para o Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    
    if params:
        url += "?" + urllib.parse.urlencode(params)
    
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
    }
    
    req = urllib.request.Request(url, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return None

def get_contracts_with_dates():
    """Busca contratos que têm datas definidas"""
    contracts = make_supabase_request('GET', 'contracts', params={
        'start_date': 'not.is.null',
        'end_date': 'not.is.null',
        'select': 'id,client_id,start_date,end_date',
        'limit': '10'
    })
    return contracts or []

def get_client_name(client_id):
    """Busca o nome do cliente pelo ID"""
    client = make_supabase_request('GET', 'clients', params={
        'id': f'eq.{client_id}',
        'select': 'first_name,last_name'
    })
    if client and len(client) > 0:
        return f"{client[0]['first_name']} {client[0]['last_name']}"
    return None

def analyze_successful_vs_failed():
    """Analisa diferenças entre nomes mapeados e não mapeados"""
    print("🔍 Analisando diferenças entre nomes mapeados e não mapeados\n")
    
    # 1. Buscar alguns contratos que foram mapeados com sucesso
    print("✅ NOMES QUE FORAM MAPEADOS COM SUCESSO:")
    contracts = get_contracts_with_dates()
    successful_names = []
    
    for contract in contracts[:5]:
        client_name = get_client_name(contract['client_id'])
        if client_name:
            successful_names.append(client_name)
            print(f"   - {client_name}")
            print(f"     Datas: {contract['start_date']} - {contract['end_date']}")
    
    # 2. Analisar padrões nos nomes do CSV
    print(f"\n❌ ANÁLISE DE NOMES NÃO MAPEADOS DO CSV:")
    
    failed_patterns = {
        'with_parentheses': 0,
        'with_sem_contrato': 0,
        'very_long': 0,
        'with_numbers': 0,
        'with_special_chars': 0,
        'normal_looking': []
    }
    
    with open('contratosAtivosFinal.csv', 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        header = next(reader)  # Pular cabeçalho
        
        for line_num, row in enumerate(reader, start=2):
            if len(row) < 11:
                continue
                
            client_name = row[0].strip() if row[0] else ''
            contract_status = row[2].strip() if row[2] else ''
            
            if contract_status.lower() != 'ativo' or not client_name:
                continue
            
            # Analisar padrões problemáticos
            if '(' in client_name:
                failed_patterns['with_parentheses'] += 1
            elif 'sem contrato' in client_name.lower():
                failed_patterns['with_sem_contrato'] += 1
            elif len(client_name) > 50:
                failed_patterns['very_long'] += 1
            elif any(char.isdigit() for char in client_name):
                failed_patterns['with_numbers'] += 1
            elif any(char in client_name for char in ['@', '#', '$', '%', '&']):
                failed_patterns['with_special_chars'] += 1
            else:
                # Nomes que parecem normais mas não foram mapeados
                if len(failed_patterns['normal_looking']) < 10:
                    failed_patterns['normal_looking'].append({
                        'line': line_num,
                        'name': client_name
                    })
    
    print(f"   Nomes com parênteses: {failed_patterns['with_parentheses']}")
    print(f"   Nomes com 'sem contrato': {failed_patterns['with_sem_contrato']}")
    print(f"   Nomes muito longos (>50 chars): {failed_patterns['very_long']}")
    print(f"   Nomes com números: {failed_patterns['with_numbers']}")
    print(f"   Nomes com caracteres especiais: {failed_patterns['with_special_chars']}")
    
    print(f"\n🤔 NOMES QUE PARECEM NORMAIS MAS NÃO FORAM MAPEADOS:")
    for item in failed_patterns['normal_looking']:
        print(f"   Linha {item['line']}: {item['name']}")
    
    # 3. Comparar características
    print(f"\n📊 COMPARAÇÃO DE CARACTERÍSTICAS:")
    print(f"\n   NOMES MAPEADOS:")
    for name in successful_names:
        print(f"   - Comprimento: {len(name)} chars")
        print(f"   - Palavras: {len(name.split())}")
        print(f"   - Tem parênteses: {'(' in name}")
        print(f"   - Tem números: {any(char.isdigit() for char in name)}")
        print()
    
    print(f"\n💡 POSSÍVEIS CAUSAS DOS PROBLEMAS:")
    print(f"   1. {failed_patterns['with_parentheses']} nomes têm informações extras em parênteses")
    print(f"   2. {failed_patterns['with_sem_contrato']} nomes indicam explicitamente 'sem contrato'")
    print(f"   3. Muitos clientes do CSV podem não existir na tabela 'clients'")
    print(f"   4. Diferenças de formatação entre CSV e banco (acentos, espaços, etc.)")
    print(f"   5. Clientes existem mas não têm contratos na tabela 'contracts'")
    
    print(f"\n🎯 RECOMENDAÇÕES:")
    print(f"   1. Limpar nomes removendo parênteses e texto extra")
    print(f"   2. Implementar busca fuzzy para lidar com pequenas diferenças")
    print(f"   3. Verificar se todos os clientes do CSV existem no banco")
    print(f"   4. Considerar criar clientes/contratos faltantes se necessário")

if __name__ == "__main__":
    analyze_successful_vs_failed()