#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Testa nomes específicos para identificar problemas de busca
"""

import json
import urllib.request
import urllib.parse
import urllib.error

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

def test_name_search(name):
    """Testa diferentes estratégias de busca para um nome"""
    print(f"\n🔍 Testando: {name}")
    
    # Estratégias de busca
    search_strategies = [
        name,  # Nome completo
        name.split('(')[0].strip(),  # Remove parênteses
        name.split(',')[0].strip(),  # Remove vírgula
        ' '.join(name.split()[:2]),  # Primeiras duas palavras
        name.split()[0] if name.split() else '',  # Primeiro nome
        name.split()[-1] if name.split() else '',  # Último nome
    ]
    
    for i, search_term in enumerate(search_strategies):
        if not search_term or len(search_term) < 3:
            continue
            
        print(f"   Estratégia {i+1}: '{search_term}'")
        
        # Busca por first_name ou last_name
        clients = make_supabase_request('GET', 'clients', params={
            'or': f'first_name.ilike.*{search_term}*,last_name.ilike.*{search_term}*',
            'select': 'id,first_name,last_name',
            'limit': '5'
        })
        
        if clients and len(clients) > 0:
            print(f"      ✅ Encontrados {len(clients)} clientes:")
            for client in clients:
                print(f"         - {client['first_name']} {client['last_name']} (ID: {client['id'][:8]}...)")
                
                # Verificar se tem contratos
                contracts = make_supabase_request('GET', 'contracts', params={
                    'client_id': f'eq.{client["id"]}',
                    'select': 'id,start_date,end_date',
                    'limit': '3'
                })
                
                if contracts and len(contracts) > 0:
                    print(f"            📋 {len(contracts)} contratos encontrados")
                    for contract in contracts:
                        print(f"               - ID: {contract['id'][:8]}... | Datas: {contract['start_date']} - {contract['end_date']}")
                else:
                    print(f"            ❌ Nenhum contrato encontrado")
            break
        else:
            print(f"      ❌ Nenhum cliente encontrado")

def test_specific_cases():
    """Testa casos específicos problemáticos"""
    print("🧪 Testando casos específicos de nomes problemáticos\n")
    
    # Casos de teste baseados na análise
    test_cases = [
        "ADELAIDE MARIA LOPES MILHAZES",  # Caso que deveria funcionar
        "ADRIANE NARCIO MATE  (JOSE BERNARDINO TEIXEIRA DE ABREU)",  # Com parênteses
        "ALAN CARLOS ALFREDO (SEM CONTRATO)",  # Sem contrato
        "AMAIA PINTO GONÇALVES (sem contrato)",  # Sem contrato
        "ALINE DA SILVA MULER",  # Sem datas
        "ANDREA BEZERRA DA SILVA",  # Sem datas
        "ANTÓNIO DAVID PERES RODRIGUES (VALERIA VIEIRA MARTINS 6559)",  # Nome complexo
    ]
    
    for test_name in test_cases:
        test_name_search(test_name)
    
    print(f"\n📊 RESUMO DOS TESTES:")
    print(f"   - Nomes com parênteses podem ter problemas de busca")
    print(f"   - Alguns clientes podem não existir na tabela 'clients'")
    print(f"   - Alguns clientes existem mas não têm contratos")
    print(f"   - Estratégias de busca mais flexíveis podem ajudar")

if __name__ == "__main__":
    test_specific_cases()