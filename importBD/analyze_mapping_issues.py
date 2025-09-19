#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para analisar problemas de mapeamento entre CSV e banco de dados
"""

import csv
import json
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime

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
    except urllib.error.HTTPError as e:
        return None
    except Exception as e:
        return None

def parse_date(date_str):
    """Converte string de data para formato ISO"""
    if not date_str or date_str.strip() == '':
        return None
    
    try:
        date_obj = datetime.strptime(date_str.strip(), '%Y-%m-%d')
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        return None

def analyze_mapping_issues():
    """Analisa problemas de mapeamento entre CSV e banco"""
    print("🔍 Analisando problemas de mapeamento...\n")
    
    # Estatísticas
    stats = {
        'total_lines': 0,
        'valid_dates': 0,
        'invalid_dates': 0,
        'clients_found': 0,
        'clients_not_found': 0,
        'contracts_found': 0,
        'contracts_not_found': 0,
        'liquidated_contracts': 0,
        'empty_names': 0,
        'problematic_lines': []
    }
    
    # Ler CSV
    with open('contratosAtivosFinal.csv', 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        header = next(reader)  # Pular cabeçalho
        
        for line_num, row in enumerate(reader, start=2):
            stats['total_lines'] += 1
            
            if len(row) < 11:  # Verificar se tem colunas suficientes
                stats['problematic_lines'].append({
                    'line': line_num,
                    'issue': 'Linha com poucas colunas',
                    'data': row[:3] if len(row) >= 3 else row
                })
                continue
            
            client_name = row[0].strip() if row[0] else ''
            contract_status = row[2].strip() if row[2] else ''
            start_date_str = row[9].strip() if len(row) > 9 and row[9] else ''
            end_date_str = row[10].strip() if len(row) > 10 and row[10] else ''
            
            # Verificar nome vazio
            if not client_name:
                stats['empty_names'] += 1
                stats['problematic_lines'].append({
                    'line': line_num,
                    'issue': 'Nome do cliente vazio',
                    'data': row[:3]
                })
                continue
            
            # Verificar contratos liquidados
            if contract_status.lower() == 'liquidado':
                stats['liquidated_contracts'] += 1
                continue
            
            # Verificar datas
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            
            if not start_date or not end_date:
                stats['invalid_dates'] += 1
                stats['problematic_lines'].append({
                    'line': line_num,
                    'issue': 'Datas inválidas ou vazias',
                    'data': {
                        'name': client_name,
                        'start_date': start_date_str,
                        'end_date': end_date_str
                    }
                })
                continue
            else:
                stats['valid_dates'] += 1
            
            # Buscar cliente no banco
            client_search_terms = [
                client_name,
                client_name.split('(')[0].strip(),  # Remove texto entre parênteses
                client_name.split(',')[0].strip(),   # Remove texto após vírgula
            ]
            
            client_found = False
            for search_term in client_search_terms:
                if not search_term:
                    continue
                    
                clients = make_supabase_request('GET', 'clients', params={
                    'or': f'first_name.ilike.*{search_term}*,last_name.ilike.*{search_term}*',
                    'select': 'id,first_name,last_name'
                })
                
                if clients and len(clients) > 0:
                    client_found = True
                    client_id = clients[0]['id']
                    
                    # Buscar contratos do cliente
                    contracts = make_supabase_request('GET', 'contracts', params={
                        'client_id': f'eq.{client_id}',
                        'select': 'id,start_date,end_date'
                    })
                    
                    if contracts and len(contracts) > 0:
                        stats['contracts_found'] += 1
                    else:
                        stats['contracts_not_found'] += 1
                        stats['problematic_lines'].append({
                            'line': line_num,
                            'issue': 'Cliente encontrado mas sem contratos',
                            'data': {
                                'name': client_name,
                                'client_id': client_id,
                                'client_name_db': f"{clients[0]['first_name']} {clients[0]['last_name']}"
                            }
                        })
                    break
            
            if client_found:
                stats['clients_found'] += 1
            else:
                stats['clients_not_found'] += 1
                stats['problematic_lines'].append({
                    'line': line_num,
                    'issue': 'Cliente não encontrado no banco',
                    'data': {
                        'name': client_name,
                        'search_terms': client_search_terms
                    }
                })
    
    # Exibir estatísticas
    print("📊 ESTATÍSTICAS DE MAPEAMENTO:")
    print(f"   Total de linhas processadas: {stats['total_lines']}")
    print(f"   Contratos liquidados (ignorados): {stats['liquidated_contracts']}")
    print(f"   Nomes vazios: {stats['empty_names']}")
    print(f"   Datas válidas: {stats['valid_dates']}")
    print(f"   Datas inválidas: {stats['invalid_dates']}")
    print(f"   Clientes encontrados: {stats['clients_found']}")
    print(f"   Clientes não encontrados: {stats['clients_not_found']}")
    print(f"   Contratos encontrados: {stats['contracts_found']}")
    print(f"   Contratos não encontrados: {stats['contracts_not_found']}")
    
    # Calcular taxa de sucesso esperada
    processable_lines = stats['total_lines'] - stats['liquidated_contracts'] - stats['empty_names']
    expected_updates = min(stats['valid_dates'], stats['clients_found'], stats['contracts_found'])
    
    print(f"\n📈 ANÁLISE:")
    print(f"   Linhas processáveis: {processable_lines}")
    print(f"   Atualizações esperadas: {expected_updates}")
    print(f"   Taxa de sucesso atual: {(243/processable_lines)*100:.1f}%")
    
    # Mostrar problemas mais comuns
    print(f"\n❌ PRINCIPAIS PROBLEMAS ({len(stats['problematic_lines'])} casos):")
    
    issue_counts = {}
    for problem in stats['problematic_lines']:
        issue = problem['issue']
        issue_counts[issue] = issue_counts.get(issue, 0) + 1
    
    for issue, count in sorted(issue_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"   {issue}: {count} casos")
    
    # Mostrar alguns exemplos de cada problema
    print(f"\n🔍 EXEMPLOS DE PROBLEMAS:")
    for issue_type in issue_counts.keys():
        examples = [p for p in stats['problematic_lines'] if p['issue'] == issue_type][:3]
        print(f"\n   {issue_type}:")
        for example in examples:
            print(f"     Linha {example['line']}: {example['data']}")

if __name__ == "__main__":
    analyze_mapping_issues()