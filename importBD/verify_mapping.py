#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import urllib.request
import urllib.parse
import urllib.error

# Configuração do Supabase
SUPABASE_URL = "https://sxbslulfitfsijqrzljd.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YnNsdWxmaXRmc2lqcXJ6bGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDg4NDksImV4cCI6MjA3MzUyNDg0OX0.ivAdA58zHtj3XNrXKG9DKMX6jynhhv77nz39IvJZjPM"

def make_supabase_request(method, endpoint, params=None, data=None):
    """Faz uma requisição HTTP para o Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    
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
            if response.status in [200, 201, 204]:
                try:
                    return json.loads(response.read().decode('utf-8'))
                except:
                    return {'success': True}
            return None
    except urllib.error.HTTPError as e:
        print(f"Erro HTTP {e.code}: {e.reason}")
        return None
    except Exception as e:
        print(f"Erro inesperado: {e}")
        return None

def main():
    print("🔍 Verificando se o mapeamento foi aplicado corretamente...")
    
    # Números de teste baseados nos logs do mapeamento
    test_numbers = ['5753', '6411', '10548', '5622', '9880', '10425', '3160']
    
    print(f"\n📋 Testando {len(test_numbers)} números de contrato:")
    
    found_count = 0
    not_found_count = 0
    
    for number in test_numbers:
        # Buscar contrato pelo contract_number
        result = make_supabase_request(
            'GET',
            'contracts',
            params={
                'select': 'id,contract_number,description,status,created_at',
                'contract_number': f'eq.{number}'
            }
        )
        
        if result and len(result) > 0:
            contract = result[0]
            print(f"✅ Número {number}: Encontrado!")
            print(f"   ID: {contract['id'][:8]}...")
            print(f"   Descrição: {contract.get('description', 'N/A')}")
            print(f"   Status: {contract.get('status', 'N/A')}")
            found_count += 1
        else:
            print(f"❌ Número {number}: NÃO encontrado")
            not_found_count += 1
        
        print()  # Linha em branco
    
    # Verificar estatísticas gerais
    print("\n📊 Verificando estatísticas gerais...")
    
    # Contar total de contratos
    all_contracts = make_supabase_request(
        'GET',
        'contracts',
        params={
            'select': 'id',
            'limit': '1000'
        }
    )
    
    if all_contracts:
        print(f"📈 Total de contratos no banco: {len(all_contracts)}")
    
    # Contar contratos com números válidos (não "Ativo" ou "Liquidado")
    valid_contracts = make_supabase_request(
        'GET',
        'contracts',
        params={
            'select': 'contract_number',
            'contract_number': 'not.in.(Ativo,Liquidado)',
            'limit': '1000'
        }
    )
    
    if valid_contracts:
        print(f"📋 Contratos com números válidos: {len(valid_contracts)}")
        
        # Mostrar alguns exemplos
        print("\n🔢 Exemplos de números de contrato atualizados:")
        for i, contract in enumerate(valid_contracts[:10]):
            print(f"   {i+1}. {contract['contract_number']}")
    
    # Relatório final
    print("\n" + "="*50)
    print("📊 RELATÓRIO DE VERIFICAÇÃO:")
    print(f"✅ Números encontrados: {found_count}/{len(test_numbers)}")
    print(f"❌ Números não encontrados: {not_found_count}/{len(test_numbers)}")
    
    if found_count == len(test_numbers):
        print("\n🎉 SUCESSO! Todos os números testados foram encontrados.")
        print("O mapeamento foi aplicado corretamente!")
    elif found_count > 0:
        print("\n⚠️  PARCIAL: Alguns números foram encontrados.")
        print("Pode haver um atraso na sincronização do banco.")
    else:
        print("\n❌ ERRO: Nenhum número foi encontrado.")
        print("O mapeamento pode não ter sido aplicado corretamente.")

if __name__ == "__main__":
    main()