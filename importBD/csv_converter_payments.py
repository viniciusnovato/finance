#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de conversão de CSV para importação no banco de dados - Versão Payments
Converte dados de contratos em três tabelas relacionais: clients, contracts e payments
Versão modificada para gerar corretamente a planilha payments conforme instruções
"""

import pandas as pd
import uuid
import re
from datetime import datetime, date
import os
from collections import defaultdict

def clean_currency_value(value):
    """Limpa valores monetários e converte para float"""
    if pd.isna(value) or value == '' or value == 'ß':
        return 0.0
    
    # Remove símbolos de moeda, espaços e converte vírgulas para pontos
    cleaned = str(value).replace('€', '').replace(' ', '').replace(',', '.')
    # Remove parênteses (valores negativos)
    cleaned = cleaned.replace('(', '').replace(')', '')
    
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def is_valid_row(row):
    """Verifica se uma linha contém dados válidos suficientes"""
    # Verificar se Nome está presente e não é NaN
    if pd.isna(row.get('Nome')) or str(row.get('Nome')).strip() == '':
        return False
    
    # Verificar se pelo menos um dos campos essenciais está presente
    essential_fields = ['Contrato', 'Total', 'Valor de Parcela']
    has_essential_data = any(
        not pd.isna(row.get(field)) and str(row.get(field)).strip() != '' 
        for field in essential_fields
    )
    
    return has_essential_data

def clean_nan_value(value, default=''):
    """Substitui valores NaN por valores padrão"""
    if pd.isna(value) or str(value).lower() == 'nan':
        return default
    return str(value).strip()

def parse_date_column(date_str):
    """Converte string de data do cabeçalho (ex: 'jan./24') para data"""
    if pd.isna(date_str) or date_str == '':
        return None
    
    # Mapear meses em português para números
    month_map = {
        'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
        'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12,
        'maio': 5  # Variação encontrada no CSV
    }
    
    # Extrair mês e ano da string
    match = re.match(r'([a-z]+)\.?/(\d+)', date_str.lower())
    if match:
        month_str, year_str = match.groups()
        month = month_map.get(month_str)
        if month:
            # Assumir que anos de 2 dígitos são 20xx
            year = int(year_str)
            if year < 100:
                year += 2000
            return date(year, month, 1)
    
    return None

def generate_clients_csv(df):
    """Gera arquivo clients.csv removendo duplicatas e filtrando dados inválidos"""
    clients = []
    seen_clients = set()
    client_counter = defaultdict(int)
    
    # Filtrar linhas válidas
    valid_rows = [row for _, row in df.iterrows() if is_valid_row(row)]
    print(f"Filtradas {len(df) - len(valid_rows)} linhas inválidas")
    
    for row in valid_rows:
        name = clean_nan_value(row.get('Nome', ''), '').strip()
        if name and name not in seen_clients:
            # Dividir nome em primeiro e último nome
            name_parts = name.split()
            first_name = name_parts[0] if name_parts else ''
            last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            
            # Gerar external_id único com contador
            client_counter[name] += 1
            external_id = f"{name}_{client_counter[name]:03d}" if client_counter[name] > 1 else name
            
            client = {
                'id': str(uuid.uuid4()),
                'first_name': first_name,
                'last_name': last_name,
                'email': clean_nan_value(row.get('Email', '')),
                'phone': clean_nan_value(row.get('Telefone', '')),
                'address': clean_nan_value(row.get('Endereço', '')),
                'city': clean_nan_value(row.get('Cidade', '')),
                'postal_code': clean_nan_value(row.get('CEP', '')),
                'country': clean_nan_value(row.get('País', 'Portugal')),
                'tax_id': clean_nan_value(row.get('NIF', '')),
                'external_id': external_id,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            clients.append(client)
            seen_clients.add(name)
    
    return pd.DataFrame(clients)

def generate_contracts_csv(df, clients_df):
    """Gera arquivo contracts.csv com external_id único"""
    contracts = []
    
    # Criar mapeamento de nome para client_id
    client_map = dict(zip(clients_df['external_id'], clients_df['id']))
    
    # Filtrar linhas válidas
    valid_rows = [row for _, row in df.iterrows() if is_valid_row(row)]
    
    for row in valid_rows:
        name = clean_nan_value(row.get('Nome', ''), '').strip()
        contract_number = clean_nan_value(row.get('Contrato', ''), 'SEM_NUMERO')
        
        # Buscar client_id correspondente
        client_id = client_map.get(name)
        
        if client_id:
            # Gerar external_id único para o contrato
            contract_external_id = f"{name}_{contract_number}"
            
            contract = {
                'id': str(uuid.uuid4()),
                'client_id': client_id,
                'contract_number': contract_number,
                'description': clean_nan_value(row.get('Descrição', '')),
                'total_amount': clean_currency_value(row.get('Total', 0)),
                'installment_amount': clean_currency_value(row.get('Valor de Parcela', 0)),
                'start_date': clean_nan_value(row.get('Data Início', '')),
                'end_date': clean_nan_value(row.get('Data Fim', '')),
                'status': clean_nan_value(row.get('Status', 'active')),
                'payment_frequency': clean_nan_value(row.get('Frequência', 'monthly')),
                'notes': clean_nan_value(row.get('Observações', '')),
                'external_id': contract_external_id,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            contracts.append(contract)
    
    return pd.DataFrame(contracts)

def generate_payments_csv(df, contracts_df):
    """Gera arquivo payments.csv com modificações conforme instruções"""
    payments = []
    payment_counter = 0
    
    # Criar mapeamento de external_id para contract_id
    contract_map = dict(zip(contracts_df['external_id'], contracts_df['id']))
    
    # Filtrar linhas válidas
    valid_rows = [row for _, row in df.iterrows() if is_valid_row(row)]
    
    for row in valid_rows:
        name = clean_nan_value(row.get('Nome', ''), '').strip()
        contract_number = clean_nan_value(row.get('Contrato', ''), 'SEM_NUMERO')
        contract_external_id = f"{name}_{contract_number}"
        contract_id = contract_map.get(contract_external_id)
        
        if contract_id:
            # Obter valor total do contrato da coluna 12 (índice 11)
            total_amount = clean_currency_value(row.iloc[11]) if len(row) > 11 else 0.0
            
            # Processar parcelas a partir da coluna 20 (índice 19)
            if len(row) > 19:  # Verificar se há colunas suficientes
                # Começar da coluna 20 (índice 19)
                for col_index in range(19, len(row)):
                    col_name = df.columns[col_index] if col_index < len(df.columns) else f"Col_{col_index + 1}"
                    value = row.iloc[col_index]
                    
                    if not pd.isna(value) and str(value).strip() != '':
                        cleaned_value = clean_currency_value(value)
                        
                        # Pular valores zero
                        if cleaned_value == 0:
                            continue
                        
                        # Determinar status baseado no sinal do valor
                        # Se negativo = paid, se positivo = pending
                        original_str = str(value).strip()
                        is_negative = original_str.startswith('(') or original_str.startswith('-') or cleaned_value < 0
                        status = 'paid' if is_negative else 'pending'
                        
                        # Converter data da coluna
                        due_date = parse_date_column(col_name)
                        
                        # Gerar external_id único sequencial
                        payment_counter += 1
                        external_id = f"PAYMENT_{payment_counter:06d}"
                        
                        # Calcular número da parcela (coluna 20 = parcela 1)
                        installment_number = col_index - 18  # col_index 19 = parcela 1
                        
                        payment = {
                            'id': str(uuid.uuid4()),
                            'contract_id': contract_id,
                            'amount': abs(cleaned_value),  # Sempre positivo
                            'due_date': due_date.isoformat() if due_date else '',
                            'paid_date': due_date.isoformat() if status == 'paid' and due_date else '',
                            'status': status,
                            'payment_method': clean_nan_value(row.get('Método', '')),
                            'notes': f"Parcela {installment_number}",  # Número da parcela nas notes
                            'external_id': external_id,
                            'created_at': datetime.now().isoformat(),
                            'updated_at': datetime.now().isoformat(),
                            'payment_type': 'normal'  # Valor padrão conforme instruções
                        }
                        payments.append(payment)
    
    return pd.DataFrame(payments)

def main():
    """Função principal com validações e estatísticas melhoradas"""
    # Ler arquivo CSV
    input_file = 'contratosAtivosFinal.csv'
    
    if not os.path.exists(input_file):
        print(f"Erro: Arquivo {input_file} não encontrado!")
        return
    
    print(f"Lendo arquivo {input_file}...")
    df = pd.read_csv(input_file, encoding='utf-8')
    
    print(f"Processando {len(df)} registros totais...")
    
    # Contar linhas válidas
    valid_rows = [row for _, row in df.iterrows() if is_valid_row(row)]
    invalid_count = len(df) - len(valid_rows)
    print(f"Encontradas {invalid_count} linhas inválidas que serão filtradas")
    
    # Gerar CSVs
    print("\nGerando clients.csv...")
    clients_df = generate_clients_csv(df)
    clients_df.to_csv('clients.csv', index=False, encoding='utf-8')
    print(f"Gerados {len(clients_df)} clientes únicos")
    
    print("\nGerando contracts.csv...")
    contracts_df = generate_contracts_csv(df, clients_df)
    contracts_df.to_csv('contracts.csv', index=False, encoding='utf-8')
    print(f"Gerados {len(contracts_df)} contratos")
    
    print("\nGerando payments.csv...")
    payments_df = generate_payments_csv(df, contracts_df)
    payments_df.to_csv('payments.csv', index=False, encoding='utf-8')
    print(f"Geradas {len(payments_df)} parcelas")
    
    # Verificar duplicatas de external_id
    print("\n=== Verificação de External IDs ===")
    client_duplicates = clients_df['external_id'].duplicated().sum()
    contract_duplicates = contracts_df['external_id'].duplicated().sum()
    payment_duplicates = payments_df['external_id'].duplicated().sum()
    
    print(f"Duplicatas de external_id em clients: {client_duplicates}")
    print(f"Duplicatas de external_id em contracts: {contract_duplicates}")
    print(f"Duplicatas de external_id em payments: {payment_duplicates}")
    
    print("\n=== Conversão concluída com sucesso! ===")
    print("Arquivos gerados:")
    print("- clients.csv")
    print("- contracts.csv")
    print("- payments.csv")
    
    if client_duplicates == 0 and contract_duplicates == 0 and payment_duplicates == 0:
        print("\n✅ Nenhuma duplicata de external_id encontrada!")
    else:
        print("\n⚠️  Ainda existem duplicatas de external_id. Verifique os dados de origem.")
    
    print("\n=== MODIFICAÇÕES APLICADAS ===")
    print("✅ Adicionada coluna payment_type com valor padrão 'normal'")
    print("✅ Valor total do contrato obtido da coluna 12")
    print("✅ Parcelas processadas a partir da coluna 20")
    print("✅ Status baseado no sinal: negativo = paid, positivo = pending")
    print("✅ Número da parcela registrado na coluna notes")

if __name__ == '__main__':
    main()