#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar se as datas dos contratos foram atualizadas com sucesso
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
    except urllib.error.HTTPError as e:
        print(f"❌ Erro HTTP {e.code}: {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return None

def verify_contract_dates():
    """Verifica quantos contratos têm datas de início e fim definidas"""
    print("🔍 Verificando contratos com datas atualizadas...")
    
    # Buscar contratos com datas definidas
    contracts_with_dates = make_supabase_request('GET', 'contracts', params={
        'start_date': 'not.is.null',
        'end_date': 'not.is.null',
        'select': 'id,start_date,end_date,client_id'
    })
    
    if contracts_with_dates is None:
        print("❌ Erro ao buscar contratos")
        return
    
    print(f"✅ Encontrados {len(contracts_with_dates)} contratos com datas de início e fim definidas")
    
    # Buscar total de contratos
    all_contracts = make_supabase_request('GET', 'contracts', params={
        'select': 'id'
    })
    
    if all_contracts is None:
        print("❌ Erro ao buscar total de contratos")
        return
    
    total_contracts = len(all_contracts)
    contracts_with_dates_count = len(contracts_with_dates)
    
    print(f"📊 Estatísticas:")
    print(f"   Total de contratos: {total_contracts}")
    print(f"   Contratos com datas: {contracts_with_dates_count}")
    print(f"   Percentual atualizado: {(contracts_with_dates_count/total_contracts)*100:.1f}%")
    
    # Mostrar alguns exemplos
    print(f"\n📋 Exemplos de contratos atualizados:")
    for i, contract in enumerate(contracts_with_dates[:5]):
        print(f"   {i+1}. ID: {contract['id'][:8]}... | Início: {contract['start_date']} | Fim: {contract['end_date']}")
    
    if len(contracts_with_dates) > 5:
        print(f"   ... e mais {len(contracts_with_dates) - 5} contratos")

if __name__ == "__main__":
    verify_contract_dates()