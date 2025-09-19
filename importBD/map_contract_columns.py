#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import json
import urllib.request
import urllib.parse
import urllib.error
import os

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
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
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
    print("🔄 Iniciando mapeamento de colunas do contratosAtivosFinal.csv...")
    
    # Carregar o CSV
    csv_path = "contratosAtivosFinal.csv"
    if not os.path.exists(csv_path):
        print(f"❌ Arquivo {csv_path} não encontrado!")
        return
    
    df = pd.read_csv(csv_path)
    print(f"📊 Carregadas {len(df)} linhas do CSV")
    
    # Verificar se as colunas necessárias existem
    required_columns = ['N', 'Área', 'Contrato']
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        print(f"❌ Colunas não encontradas no CSV: {missing_columns}")
        return
    
    print("\n📋 Mapeamento de colunas na tabela 'contracts':")
    print("   N → contract_number (NOVO NÚMERO)")
    print("   Área → description")
    print("   Contrato → status")
    print("\n⚠️  IMPORTANTE: Como os números do CSV não existem no banco,")
    print("   vamos ATUALIZAR os contratos existentes com os novos números.")
    
    # Buscar contratos existentes no banco
    print("\n🔍 Buscando contratos existentes no banco...")
    existing_contracts = make_supabase_request(
        'GET',
        'contracts',
        params={
            'select': 'id,contract_number,description,status',
            'order': 'created_at.asc'
        }
    )
    
    if not existing_contracts:
        print("❌ Não foi possível buscar contratos existentes")
        return
    
    print(f"📊 Encontrados {len(existing_contracts)} contratos no banco")
    
    # Processar cada linha do CSV
    updated_count = 0
    error_count = 0
    
    print("\n🔄 Processando linhas do CSV...")
    
    for index, row in df.iterrows():
        # Converter número para string sem decimais
        contract_number = str(int(float(row['N']))) if pd.notna(row['N']) else None
        description = str(row['Área']) if pd.notna(row['Área']) else None
        status_csv = str(row['Contrato']) if pd.notna(row['Contrato']) else None
        
        # Mapear status do CSV para status do banco
        status_mapping = {
            'Ativo': 'active',
            'Liquidado': 'completed',
            'Cancelado': 'cancelled'
        }
        status = status_mapping.get(status_csv, 'active')
        
        if not contract_number:
            print(f"⚠️  Linha {index + 1}: Número de contrato vazio, pulando...")
            continue
        
        # Usar um contrato existente se disponível
        if index < len(existing_contracts):
            contract_id = existing_contracts[index]['id']
            
            # Preparar dados para atualização
            update_data = {
                'contract_number': contract_number,
                'description': description,
                'status': status
            }
            
            # Atualizar contrato
            result = make_supabase_request(
                'PATCH',
                'contracts',
                params={'id': f'eq.{contract_id}'},
                data=update_data
            )
            
            if result is not None:
                print(f"✅ Linha {index + 1}: Contrato {contract_id[:8]}... atualizado com número {contract_number}")
                updated_count += 1
            else:
                print(f"❌ Linha {index + 1}: Erro ao atualizar contrato {contract_id[:8]}...")
                error_count += 1
        else:
            # Se não há mais contratos existentes, criar novo
            # Buscar um client_id válido para o novo contrato
            clients = make_supabase_request(
                'GET',
                'clients',
                params={
                    'select': 'id',
                    'limit': '1'
                }
            )
            
            if not clients:
                print(f"❌ Linha {index + 1}: Não foi possível encontrar cliente para novo contrato")
                error_count += 1
                continue
            
            client_id = clients[0]['id']
            
            # Criar novo contrato
            new_contract_data = {
                'client_id': client_id,
                'contract_number': contract_number,
                'description': description,
                'status': status,
                'value': 0.0,
                'payment_frequency': 'monthly'
            }
            
            result = make_supabase_request(
                'POST',
                'contracts',
                data=new_contract_data
            )
            
            if result is not None:
                print(f"✅ Linha {index + 1}: Novo contrato criado com número {contract_number}")
                updated_count += 1
            else:
                print(f"❌ Linha {index + 1}: Erro ao criar novo contrato com número {contract_number}")
                error_count += 1
    
    # Relatório final
    print("\n" + "="*50)
    print("📊 RELATÓRIO FINAL:")
    print(f"✅ Contratos atualizados/criados: {updated_count}")
    print(f"❌ Erros: {error_count}")
    print(f"📊 Total processado: {len(df)} linhas")
    
    if updated_count > 0:
        print("\n🎉 Mapeamento concluído com sucesso!")
        print("Os números de contrato do CSV foram aplicados aos contratos no banco.")
    else:
        print("\n⚠️  Nenhum contrato foi atualizado. Verifique os logs de erro acima.")

if __name__ == "__main__":
    main()