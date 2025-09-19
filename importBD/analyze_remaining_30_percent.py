#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Análise dos 30% de contratos que não foram mapeados
Apenas análise, sem ações corretivas
"""

import json
import urllib.request
import urllib.parse
import urllib.error
import csv
import re
from datetime import datetime
from collections import Counter

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
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    request_data = None
    if data:
        request_data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=request_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 204:
                return True
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return None

def clean_name(name):
    """Limpa o nome removendo informações extras"""
    if not name:
        return ""
    
    # Remove conteúdo entre parênteses
    name = re.sub(r'\([^)]*\)', '', name)
    
    # Remove espaços extras
    name = ' '.join(name.split())
    
    return name.strip()

def get_all_clients():
    """Busca todos os clientes do banco"""
    print("📥 Carregando todos os clientes do banco...")
    
    all_clients = []
    offset = 0
    limit = 1000
    
    while True:
        clients = make_supabase_request('GET', 'clients', params={
            'select': 'id,first_name,last_name',
            'limit': str(limit),
            'offset': str(offset)
        })
        
        if not clients or len(clients) == 0:
            break
            
        all_clients.extend(clients)
        offset += limit
        
        if len(clients) < limit:
            break
    
    print(f"✅ Carregados {len(all_clients)} clientes")
    return all_clients

def find_client_in_list(name, clients_list):
    """Busca cliente na lista carregada"""
    if not name:
        return None
    
    clean_name_str = clean_name(name).upper()
    
    # Busca exata primeiro
    for client in clients_list:
        client_full_name = f"{client['first_name']} {client['last_name']}".upper()
        if clean_name_str == client_full_name:
            return client
    
    # Busca por partes do nome
    name_parts = clean_name_str.split()
    if len(name_parts) >= 2:
        for client in clients_list:
            client_first = client['first_name'].upper()
            client_last = client['last_name'].upper()
            
            # Verifica se primeiro e último nome batem
            if (name_parts[0] == client_first and name_parts[-1] == client_last):
                return client
            
            # Verifica se alguma parte do nome bate
            if (name_parts[0] in client_first or client_first in name_parts[0]) and \
               (name_parts[-1] in client_last or client_last in name_parts[-1]):
                return client
    
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

def analyze_unmapped_contracts():
    """Analisa os contratos que não foram mapeados"""
    print("🔍 ANÁLISE DOS 30% DE CONTRATOS NÃO MAPEADOS\n")
    
    # Carregar todos os clientes uma vez
    all_clients = get_all_clients()
    
    # Criar índice de nomes para busca rápida
    client_names = set()
    for client in all_clients:
        full_name = f"{client['first_name']} {client['last_name']}".upper()
        client_names.add(full_name)
    
    unmapped_reasons = {
        'liquidated': [],
        'invalid_dates': [],
        'client_not_found': [],
        'no_contracts': [],
        'empty_name': []
    }
    
    stats = {
        'total_processed': 0,
        'liquidated': 0,
        'invalid_dates': 0,
        'client_not_found': 0,
        'no_contracts': 0,
        'empty_name': 0,
        'successfully_mapped': 0
    }
    
    print("📋 Analisando arquivo CSV...\n")
    
    with open('contratosAtivosFinal.csv', 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        header = next(reader)  # Pular cabeçalho
        
        for line_num, row in enumerate(reader, start=2):
            if len(row) < 11:
                continue
            
            stats['total_processed'] += 1
            
            client_name = row[0].strip() if row[0] else ''
            contract_status = row[2].strip() if row[2] else ''
            start_date_str = row[9].strip() if len(row) > 9 and row[9] else ''
            end_date_str = row[10].strip() if len(row) > 10 and row[10] else ''
            
            # Analisar razões para não mapeamento
            if contract_status.lower() == 'liquidado':
                stats['liquidated'] += 1
                unmapped_reasons['liquidated'].append({
                    'line': line_num,
                    'name': client_name,
                    'status': contract_status
                })
                continue
            
            if not client_name:
                stats['empty_name'] += 1
                unmapped_reasons['empty_name'].append({
                    'line': line_num,
                    'reason': 'Nome vazio'
                })
                continue
            
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            
            if not start_date or not end_date:
                stats['invalid_dates'] += 1
                unmapped_reasons['invalid_dates'].append({
                    'line': line_num,
                    'name': client_name,
                    'start_date': start_date_str,
                    'end_date': end_date_str,
                    'parsed_start': start_date,
                    'parsed_end': end_date
                })
                continue
            
            # Buscar cliente
            client = find_client_in_list(client_name, all_clients)
            
            if not client:
                stats['client_not_found'] += 1
                unmapped_reasons['client_not_found'].append({
                    'line': line_num,
                    'name': client_name,
                    'cleaned_name': clean_name(client_name)
                })
                continue
            
            # Verificar se cliente tem contratos
            contracts = make_supabase_request('GET', 'contracts', params={
                'client_id': f'eq.{client["id"]}',
                'select': 'id,start_date,end_date'
            })
            
            if not contracts or len(contracts) == 0:
                stats['no_contracts'] += 1
                client_full_name = f"{client['first_name']} {client['last_name']}"
                unmapped_reasons['no_contracts'].append({
                    'line': line_num,
                    'csv_name': client_name,
                    'db_name': client_full_name,
                    'client_id': client['id']
                })
                continue
            
            stats['successfully_mapped'] += 1
    
    # Relatório detalhado
    print("📊 ESTATÍSTICAS GERAIS:")
    print(f"   Total de linhas processadas: {stats['total_processed']}")
    print(f"   Contratos mapeados com sucesso: {stats['successfully_mapped']}")
    print(f"   Contratos não mapeados: {stats['total_processed'] - stats['successfully_mapped']}")
    print(f"   Taxa de sucesso: {(stats['successfully_mapped'] / stats['total_processed']) * 100:.1f}%\n")
    
    print("🔍 ANÁLISE DETALHADA DOS NÃO MAPEADOS:\n")
    
    # 1. Contratos liquidados
    print(f"1️⃣ CONTRATOS LIQUIDADOS: {stats['liquidated']} casos")
    print("   ➤ Razão: Contratos com status 'liquidado' são ignorados intencionalmente")
    if stats['liquidated'] > 0:
        print("   ➤ Exemplos:")
        for i, case in enumerate(unmapped_reasons['liquidated'][:5]):
            print(f"      • Linha {case['line']}: {case['name']} (Status: {case['status']})")
        if len(unmapped_reasons['liquidated']) > 5:
            print(f"      ... e mais {len(unmapped_reasons['liquidated']) - 5} casos")
    print()
    
    # 2. Datas inválidas
    print(f"2️⃣ DATAS INVÁLIDAS: {stats['invalid_dates']} casos")
    print("   ➤ Razão: Datas em branco, formato inválido ou não parseáveis")
    if stats['invalid_dates'] > 0:
        print("   ➤ Exemplos:")
        for i, case in enumerate(unmapped_reasons['invalid_dates'][:5]):
            print(f"      • Linha {case['line']}: {case['name']}")
            print(f"        Data início: '{case['start_date']}' → {case['parsed_start']}")
            print(f"        Data fim: '{case['end_date']}' → {case['parsed_end']}")
        if len(unmapped_reasons['invalid_dates']) > 5:
            print(f"      ... e mais {len(unmapped_reasons['invalid_dates']) - 5} casos")
    print()
    
    # 3. Nomes vazios
    print(f"3️⃣ NOMES VAZIOS: {stats['empty_name']} casos")
    print("   ➤ Razão: Campo nome do cliente está vazio ou em branco")
    print()
    
    # 4. Clientes não encontrados
    print(f"4️⃣ CLIENTES NÃO ENCONTRADOS: {stats['client_not_found']} casos")
    print("   ➤ Razão: Nome do cliente no CSV não corresponde a nenhum cliente no banco")
    if stats['client_not_found'] > 0:
        print("   ➤ Exemplos de nomes problemáticos:")
        for i, case in enumerate(unmapped_reasons['client_not_found'][:10]):
            print(f"      • Linha {case['line']}: '{case['name']}' → '{case['cleaned_name']}'")
        if len(unmapped_reasons['client_not_found']) > 10:
            print(f"      ... e mais {len(unmapped_reasons['client_not_found']) - 10} casos")
        
        # Análise de padrões nos nomes não encontrados
        print("\n   📋 PADRÕES NOS NOMES NÃO ENCONTRADOS:")
        patterns = {
            'com_parenteses': 0,
            'com_numeros': 0,
            'com_virgulas': 0,
            'muito_longos': 0,
            'com_caracteres_especiais': 0
        }
        
        for case in unmapped_reasons['client_not_found']:
            name = case['name']
            if '(' in name or ')' in name:
                patterns['com_parenteses'] += 1
            if any(char.isdigit() for char in name):
                patterns['com_numeros'] += 1
            if ',' in name:
                patterns['com_virgulas'] += 1
            if len(name) > 50:
                patterns['muito_longos'] += 1
            if any(char in name for char in ['@', '#', '$', '%', '&', '*']):
                patterns['com_caracteres_especiais'] += 1
        
        for pattern, count in patterns.items():
            if count > 0:
                percentage = (count / stats['client_not_found']) * 100
                print(f"      • {pattern.replace('_', ' ').title()}: {count} casos ({percentage:.1f}%)")
    print()
    
    # 5. Clientes sem contratos
    print(f"5️⃣ CLIENTES SEM CONTRATOS: {stats['no_contracts']} casos")
    print("   ➤ Razão: Cliente existe no banco mas não possui contratos cadastrados")
    if stats['no_contracts'] > 0:
        print("   ➤ Exemplos:")
        for i, case in enumerate(unmapped_reasons['no_contracts'][:5]):
            print(f"      • Linha {case['line']}: CSV='{case['csv_name']}' → DB='{case['db_name']}' (ID: {case['client_id']})")
        if len(unmapped_reasons['no_contracts']) > 5:
            print(f"      ... e mais {len(unmapped_reasons['no_contracts']) - 5} casos")
    print()
    
    # Resumo das causas
    total_unmapped = stats['total_processed'] - stats['successfully_mapped']
    print("📈 RESUMO DAS CAUSAS DOS 30% NÃO MAPEADOS:")
    print(f"   Total não mapeados: {total_unmapped} contratos")
    print(f"   1. Contratos liquidados: {stats['liquidated']} ({(stats['liquidated']/total_unmapped)*100:.1f}%)")
    print(f"   2. Datas inválidas: {stats['invalid_dates']} ({(stats['invalid_dates']/total_unmapped)*100:.1f}%)")
    print(f"   3. Clientes não encontrados: {stats['client_not_found']} ({(stats['client_not_found']/total_unmapped)*100:.1f}%)")
    print(f"   4. Clientes sem contratos: {stats['no_contracts']} ({(stats['no_contracts']/total_unmapped)*100:.1f}%)")
    print(f"   5. Nomes vazios: {stats['empty_name']} ({(stats['empty_name']/total_unmapped)*100:.1f}%)")
    
    print("\n🎯 CONCLUSÕES:")
    print("   • A maioria dos não mapeados são casos intencionais (liquidados) ou problemas de dados")
    print("   • Problemas de qualidade de dados são a principal causa técnica")
    print("   • Inconsistências entre CSV e banco de dados impedem mapeamento automático")
    print("   • Alguns clientes existem no banco mas não possuem contratos cadastrados")
    
if __name__ == "__main__":
    analyze_unmapped_contracts()