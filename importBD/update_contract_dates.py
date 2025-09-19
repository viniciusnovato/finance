#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para atualizar as datas de início e fim dos contratos no banco de dados
a partir do arquivo contratosAtivosFinal.csv
"""

import csv
import json
import os
from datetime import datetime
import urllib.request
import urllib.parse
import urllib.error

# Configuração do Supabase
SUPABASE_URL = "https://sxbslulfitfsijqrzljd.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YnNsdWxmaXRmc2lqcXJ6bGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDg4NDksImV4cCI6MjA3MzUyNDg0OX0.ivAdA58zHtj3XNrXKG9DKMX6jynhhv77nz39IvJZjPM"

def make_supabase_request(method, endpoint, data=None, params=None):
    """Faz uma requisição HTTP para o Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    
    if params:
        url += "?" + urllib.parse.urlencode(params)
    
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    request_data = None
    if data:
        request_data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=request_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"❌ Erro HTTP {e.code}: {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return None

def parse_date(date_str):
    """Converte string de data no formato YYYY-MM-DD para objeto datetime"""
    if not date_str or date_str.strip() == '':
        return None
    try:
        return datetime.strptime(date_str.strip(), '%Y-%m-%d').date()
    except ValueError:
        print(f"⚠️  Formato de data inválido: {date_str}")
        return None

def find_contract_by_client_name(client_name):
    """Busca contrato pelo nome do cliente"""
    try:
        # Primeiro, buscar o cliente pelo nome
        first_name = client_name.split()[0] if client_name.split() else client_name
        last_name = client_name.split()[-1] if len(client_name.split()) > 1 else ""
        
        # Buscar cliente por primeiro nome
        clients = make_supabase_request('GET', 'clients', params={
            'first_name': f'ilike.*{first_name}*',
            'select': 'id'
        })
        
        if not clients:
            return None
            
        client_id = clients[0]['id']
        
        # Buscar contratos do cliente
        contracts = make_supabase_request('GET', 'contracts', params={
            'client_id': f'eq.{client_id}',
            'select': 'id'
        })
        
        if contracts and len(contracts) > 0:
            return contracts[0]['id']
            
        return None
    except Exception as e:
        print(f"❌ Erro ao buscar contrato para {client_name}: {e}")
        return None

def update_contract_dates():
    """Atualiza as datas de início e fim dos contratos"""
    csv_file = 'contratosAtivosFinal.csv'
    
    print(f"🔍 Verificando se o arquivo {csv_file} existe...")
    if not os.path.exists(csv_file):
        print(f"❌ Arquivo {csv_file} não encontrado")
        return
    
    print(f"✅ Arquivo {csv_file} encontrado")
    
    updated_count = 0
    not_found_count = 0
    error_count = 0
    
    print("🚀 Iniciando atualização das datas dos contratos...")
    print(f"🔗 URL do Supabase: {SUPABASE_URL}")
    
    with open(csv_file, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        
        for row_num, row in enumerate(csv_reader, start=2):
            client_name = row.get('Nome', '').strip()
            start_date_str = row.get('Início', '').strip()
            end_date_str = row.get('Fim', '').strip()
            
            if not client_name:
                continue
                
            print(f"\n📋 Processando linha {row_num}: {client_name}")
            
            # Buscar contrato
            contract_id = find_contract_by_client_name(client_name)
            
            if not contract_id:
                print(f"⚠️  Contrato não encontrado para: {client_name}")
                not_found_count += 1
                continue
            
            # Converter datas
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            
            if not start_date and not end_date:
                print(f"⚠️  Nenhuma data válida encontrada para: {client_name}")
                continue
            
            # Preparar dados para atualização
            update_data = {}
            if start_date:
                update_data['start_date'] = start_date.isoformat()
                print(f"📅 Data de início: {start_date}")
            if end_date:
                update_data['end_date'] = end_date.isoformat()
                print(f"📅 Data de fim: {end_date}")
            
            # Atualizar contrato
            try:
                response = make_supabase_request('PATCH', 'contracts', 
                                               data=update_data, 
                                               params={'id': f'eq.{contract_id}'})
                
                if response:
                    print(f"✅ Contrato {contract_id} atualizado com sucesso")
                    updated_count += 1
                else:
                    print(f"❌ Falha ao atualizar contrato {contract_id}")
                    error_count += 1
                    
            except Exception as e:
                print(f"❌ Erro ao atualizar contrato {contract_id}: {e}")
                error_count += 1
    
    print(f"\n📊 Resumo da atualização:")
    print(f"✅ Contratos atualizados: {updated_count}")
    print(f"⚠️  Contratos não encontrados: {not_found_count}")
    print(f"❌ Erros: {error_count}")
    print(f"📋 Total processado: {updated_count + not_found_count + error_count}")

if __name__ == "__main__":
    update_contract_dates()