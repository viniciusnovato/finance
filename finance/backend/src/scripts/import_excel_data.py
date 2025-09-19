#!/usr/bin/env python3
"""
Script para importar dados da planilha Excel do Instituto Areluna para o Supabase
"""

import pandas as pd
import os
import sys
from supabase import create_client, Client
from datetime import datetime
import json
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias")
    sys.exit(1)

# Inicializar cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def read_excel_file(file_path):
    """
    Lê a planilha Excel e retorna os dados
    """
    try:
        # Ler todas as abas da planilha
        excel_file = pd.ExcelFile(file_path)
        print(f"Abas encontradas: {excel_file.sheet_names}")
        
        sheets_data = {}
        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            sheets_data[sheet_name] = df
            print(f"\nAba '{sheet_name}': {len(df)} linhas, {len(df.columns)} colunas")
            print(f"Colunas: {list(df.columns)}")
            
        return sheets_data
    except Exception as e:
        print(f"Erro ao ler planilha: {e}")
        return None

def clean_data(df):
    """
    Limpa e padroniza os dados
    """
    # Remover linhas completamente vazias
    df = df.dropna(how='all')
    
    # Converter datas para formato ISO
    for col in df.columns:
        if df[col].dtype == 'datetime64[ns]':
            df[col] = df[col].dt.strftime('%Y-%m-%d')
    
    # Substituir NaN por None
    df = df.where(pd.notnull(df), None)
    
    return df

def process_clients_data(df):
    """
    Processa dados de clientes
    """
    clients = []
    
    for _, row in df.iterrows():
        # Mapear colunas da planilha para campos do banco
        client = {
            'first_name': str(row.get('Nome', '')).strip() if pd.notna(row.get('Nome')) else 'Cliente',
            'last_name': str(row.get('Sobrenome', '')).strip() if pd.notna(row.get('Sobrenome')) else '',
            'email': str(row.get('Email', '')).strip() if pd.notna(row.get('Email')) else None,
            'phone': str(row.get('Telefone', '')).strip() if pd.notna(row.get('Telefone')) else None,
            'mobile': str(row.get('Celular', '')).strip() if pd.notna(row.get('Celular')) else None,
            'tax_id': str(row.get('CPF', '')).strip() if pd.notna(row.get('CPF')) else None,
            'birth_date': row.get('Data_Nascimento') if pd.notna(row.get('Data_Nascimento')) else None,
            'address': str(row.get('Endereco', '')).strip() if pd.notna(row.get('Endereco')) else None,
            'city': str(row.get('Cidade', '')).strip() if pd.notna(row.get('Cidade')) else None,
            'postal_code': str(row.get('CEP', '')).strip() if pd.notna(row.get('CEP')) else None,
            'country': 'Portugal',
            'attention_level': 'normal',
            'notes': str(row.get('Observacoes', '')).strip() if pd.notna(row.get('Observacoes')) else None,
            'is_active': True,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Validar dados obrigatórios
        if client['first_name']:
            clients.append(client)
    
    return clients

def process_contracts_data(df, clients_map):
    """
    Processa dados de contratos
    """
    contracts = []
    
    for _, row in df.iterrows():
        # Encontrar cliente pelo nome ou email
        client_id = None
        client_name = str(row.get('Cliente', '')).strip() if pd.notna(row.get('Cliente')) else ''
        
        if client_name and client_name in clients_map:
            client_id = clients_map[client_name]
        
        if not client_id:
            continue
            
        contract = {
            'client_id': client_id,
            'contract_number': str(row.get('Numero_Contrato', '')).strip() if pd.notna(row.get('Numero_Contrato')) else f"CONT-{datetime.now().strftime('%Y%m%d')}-{len(contracts)+1:03d}",
            'description': str(row.get('Descricao', '')).strip() if pd.notna(row.get('Descricao')) else 'Contrato de Serviços',
            'total_amount': float(row.get('Valor_Total', 0)) if pd.notna(row.get('Valor_Total')) else 0.0,
            'start_date': row.get('Data_Inicio') if pd.notna(row.get('Data_Inicio')) else datetime.now().strftime('%Y-%m-%d'),
            'end_date': row.get('Data_Fim') if pd.notna(row.get('Data_Fim')) else None,
            'status': str(row.get('Status', 'active')).lower() if pd.notna(row.get('Status')) else 'active',
            'payment_frequency': str(row.get('Frequencia_Pagamento', 'monthly')).lower() if pd.notna(row.get('Frequencia_Pagamento')) else 'monthly',
            'notes': str(row.get('Observacoes', '')).strip() if pd.notna(row.get('Observacoes')) else None,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        contracts.append(contract)
    
    return contracts

def process_payments_data(df, contracts_map):
    """
    Processa dados de pagamentos
    """
    payments = []
    
    for _, row in df.iterrows():
        # Encontrar contrato pelo número
        contract_id = None
        contract_number = str(row.get('Numero_Contrato', '')).strip() if pd.notna(row.get('Numero_Contrato')) else ''
        
        if contract_number and contract_number in contracts_map:
            contract_id = contracts_map[contract_number]
        
        if not contract_id:
            continue
            
        payment = {
            'contract_id': contract_id,
            'amount': float(row.get('Valor', 0)) if pd.notna(row.get('Valor')) else 0.0,
            'due_date': row.get('Data_Vencimento') if pd.notna(row.get('Data_Vencimento')) else datetime.now().strftime('%Y-%m-%d'),
            'paid_date': row.get('Data_Pagamento') if pd.notna(row.get('Data_Pagamento')) else None,
            'status': str(row.get('Status_Pagamento', 'pending')).lower() if pd.notna(row.get('Status_Pagamento')) else 'pending',
            'payment_method': str(row.get('Metodo_Pagamento', 'bank_transfer')).lower() if pd.notna(row.get('Metodo_Pagamento')) else 'bank_transfer',
            'notes': str(row.get('Observacoes', '')).strip() if pd.notna(row.get('Observacoes')) else None,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        payments.append(payment)
    
    return payments

def insert_data_to_supabase(table_name, data):
    """
    Insere dados no Supabase
    """
    try:
        if not data:
            print(f"Nenhum dado para inserir na tabela {table_name}")
            return []
            
        print(f"Inserindo {len(data)} registros na tabela {table_name}...")
        
        # Inserir em lotes de 100
        batch_size = 100
        inserted_records = []
        
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            result = supabase.table(table_name).insert(batch).execute()
            
            if result.data:
                inserted_records.extend(result.data)
                print(f"Lote {i//batch_size + 1}: {len(result.data)} registros inseridos")
            else:
                print(f"Erro ao inserir lote {i//batch_size + 1}: {result}")
        
        print(f"Total de {len(inserted_records)} registros inseridos na tabela {table_name}")
        return inserted_records
        
    except Exception as e:
        print(f"Erro ao inserir dados na tabela {table_name}: {e}")
        return []

def main():
    """
    Função principal
    """
    excel_file_path = "/Users/insitutoareluna/Documents/finance/MACRO_PAGAMENTOS INSTITUTO ARELUNA - Editável (1).xlsm"
    
    if not os.path.exists(excel_file_path):
        print(f"Arquivo não encontrado: {excel_file_path}")
        return
    
    print("Iniciando importação de dados da planilha Excel...")
    
    # Ler planilha
    sheets_data = read_excel_file(excel_file_path)
    if not sheets_data:
        return
    
    # Processar cada aba
    clients_map = {}
    contracts_map = {}
    
    for sheet_name, df in sheets_data.items():
        print(f"\n=== Processando aba: {sheet_name} ===")
        
        # Limpar dados
        df_clean = clean_data(df)
        
        # Mostrar amostra dos dados
        print("\nPrimeiras 3 linhas:")
        print(df_clean.head(3).to_string())
        
        # Processar baseado no nome da aba ou conteúdo
        if 'client' in sheet_name.lower() or 'cliente' in sheet_name.lower():
            clients_data = process_clients_data(df_clean)
            inserted_clients = insert_data_to_supabase('clients', clients_data)
            
            # Criar mapeamento de clientes
            for client in inserted_clients:
                full_name = f"{client['first_name']} {client['last_name']}".strip()
                clients_map[full_name] = client['id']
                
        elif 'contract' in sheet_name.lower() or 'contrato' in sheet_name.lower():
            contracts_data = process_contracts_data(df_clean, clients_map)
            inserted_contracts = insert_data_to_supabase('contracts', contracts_data)
            
            # Criar mapeamento de contratos
            for contract in inserted_contracts:
                contracts_map[contract['contract_number']] = contract['id']
                
        elif 'payment' in sheet_name.lower() or 'pagamento' in sheet_name.lower():
            payments_data = process_payments_data(df_clean, contracts_map)
            insert_data_to_supabase('payments', payments_data)
        
        else:
            print(f"Aba '{sheet_name}' não reconhecida. Tentando processar como dados gerais...")
            # Tentar identificar pelo conteúdo das colunas
            columns = [col.lower() for col in df_clean.columns]
            
            if any(col in ['nome', 'email', 'telefone', 'cpf'] for col in columns):
                print("Detectados dados de clientes")
                clients_data = process_clients_data(df_clean)
                inserted_clients = insert_data_to_supabase('clients', clients_data)
                
                for client in inserted_clients:
                    full_name = f"{client['first_name']} {client['last_name']}".strip()
                    clients_map[full_name] = client['id']
    
    print("\n=== Importação concluída ===")
    print(f"Clientes mapeados: {len(clients_map)}")
    print(f"Contratos mapeados: {len(contracts_map)}")

if __name__ == "__main__":
    main()