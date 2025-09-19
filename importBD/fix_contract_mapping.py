#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script simplificado para resolver problemas de mapeamento de contratos
"""

import json
import urllib.request
import urllib.parse
import urllib.error
import csv
import re
from datetime import datetime

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
            if response.status == 204:  # No content for updates
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

def fix_contract_mapping():
    """Corrige o mapeamento de contratos"""
    print("🔧 Iniciando correção do mapeamento de contratos\n")
    
    # Carregar todos os clientes uma vez
    all_clients = get_all_clients()
    
    stats = {
        'processed': 0,
        'found_clients': 0,
        'found_contracts': 0,
        'updated_contracts': 0,
        'skipped_liquidated': 0,
        'skipped_no_dates': 0,
        'skipped_no_client': 0,
        'errors': 0
    }
    
    print("\n📋 Processando arquivo CSV...\n")
    
    with open('contratosAtivosFinal.csv', 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        header = next(reader)  # Pular cabeçalho
        
        for line_num, row in enumerate(reader, start=2):
            if len(row) < 11:
                continue
            
            stats['processed'] += 1
            
            client_name = row[0].strip() if row[0] else ''
            contract_status = row[2].strip() if row[2] else ''
            start_date_str = row[9].strip() if len(row) > 9 and row[9] else ''
            end_date_str = row[10].strip() if len(row) > 10 and row[10] else ''
            
            # Pular contratos liquidados
            if contract_status.lower() == 'liquidado':
                stats['skipped_liquidated'] += 1
                continue
            
            # Pular se não tem nome
            if not client_name:
                stats['skipped_no_client'] += 1
                continue
            
            # Pular se não tem datas válidas
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            
            if not start_date or not end_date:
                stats['skipped_no_dates'] += 1
                continue
            
            # Buscar cliente na lista
            client = find_client_in_list(client_name, all_clients)
            
            if not client:
                if stats['processed'] <= 20:  # Log apenas os primeiros casos
                    print(f"❌ Cliente não encontrado (linha {line_num}): {clean_name(client_name)}")
                stats['skipped_no_client'] += 1
                continue
            
            stats['found_clients'] += 1
            client_full_name = f"{client['first_name']} {client['last_name']}"
            
            # Buscar contratos do cliente
            contracts = make_supabase_request('GET', 'contracts', params={
                'client_id': f'eq.{client["id"]}',
                'select': 'id,start_date,end_date'
            })
            
            if not contracts or len(contracts) == 0:
                if stats['processed'] <= 20:
                    print(f"❌ Nenhum contrato encontrado para: {client_full_name}")
                continue
            
            stats['found_contracts'] += 1
            
            # Atualizar contratos
            updated_any = False
            for contract in contracts:
                needs_update = False
                update_data = {}
                
                if not contract['start_date'] or contract['start_date'] != start_date:
                    update_data['start_date'] = start_date
                    needs_update = True
                
                if not contract['end_date'] or contract['end_date'] != end_date:
                    update_data['end_date'] = end_date
                    needs_update = True
                
                if needs_update:
                    result = make_supabase_request('PATCH', 'contracts', 
                                                 params={'id': f'eq.{contract["id"]}'},
                                                 data=update_data)
                    
                    if result is not None:
                        updated_any = True
                        if stats['processed'] <= 10:  # Log detalhado apenas para os primeiros
                            print(f"✅ Atualizado: {client_full_name} | {start_date} - {end_date}")
                    else:
                        stats['errors'] += 1
            
            if updated_any:
                stats['updated_contracts'] += 1
            
            # Progress indicator
            if stats['processed'] % 100 == 0:
                print(f"📊 Processados: {stats['processed']} | Atualizados: {stats['updated_contracts']}")
    
    # Relatório final
    print(f"\n📊 RELATÓRIO FINAL DA CORREÇÃO:")
    print(f"   Linhas processadas: {stats['processed']}")
    print(f"   Contratos liquidados (ignorados): {stats['skipped_liquidated']}")
    print(f"   Sem datas válidas (ignorados): {stats['skipped_no_dates']}")
    print(f"   Clientes encontrados: {stats['found_clients']}")
    print(f"   Clientes com contratos: {stats['found_contracts']}")
    print(f"   Contratos atualizados: {stats['updated_contracts']}")
    print(f"   Clientes não encontrados: {stats['skipped_no_client']}")
    print(f"   Erros: {stats['errors']}")
    
    processable = stats['processed'] - stats['skipped_liquidated'] - stats['skipped_no_dates']
    success_rate = (stats['updated_contracts'] / processable) * 100 if processable > 0 else 0
    print(f"\n🎯 Taxa de sucesso: {success_rate:.1f}%")
    
    improvement = stats['updated_contracts'] - 243
    if improvement > 0:
        print(f"🚀 Melhoria: +{improvement} contratos mapeados em relação ao resultado anterior")
    elif improvement < 0:
        print(f"📉 Resultado: {improvement} contratos em relação ao resultado anterior")
    else:
        print(f"📊 Resultado igual ao anterior: {stats['updated_contracts']} contratos")
    
if __name__ == "__main__":
    fix_contract_mapping()