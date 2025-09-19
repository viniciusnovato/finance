#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de conversão de CSV para importação no banco de dados
Converte dados de contratos em três tabelas relacionais: clients, contracts e payments
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
                'email': '',  # Não disponível no CSV
                'phone': '',  # Não disponível no CSV
                'mobile': '',  # Não disponível no CSV
                'tax_id': '',  # Não disponível no CSV
                'birth_date': '',  # Não disponível no CSV
                'address': '',  # Não disponível no CSV
                'city': '',  # Não disponível no CSV
                'state': '',  # Não disponível no CSV
                'postal_code': '',  # Não disponível no CSV
                'country': 'Portugal',  # Assumindo Portugal baseado na moeda
                'status': 'active',
                'notes': f"Local: {clean_nan_value(row.get('Local', ''))}, Área: {clean_nan_value(row.get('Área', ''))}",
                'external_id': external_id,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            clients.append(client)
            seen_clients.add(name)
    
    return pd.DataFrame(clients)

def generate_contracts_csv(df, clients_df):
    """Gera arquivo contracts.csv com validações e external_id melhorado"""
    contracts = []
    contract_counter = defaultdict(int)
    
    # Criar mapeamento de nome para client_id
    client_map = dict(zip(clients_df['external_id'], clients_df['id']))
    
    # Filtrar linhas válidas
    valid_rows = [row for _, row in df.iterrows() if is_valid_row(row)]
    
    for row in valid_rows:
        name = clean_nan_value(row.get('Nome', ''), '').strip()
        client_id = client_map.get(name)
        
        if client_id:
            # Calcular valor total do contrato (soma absoluta de todas as parcelas)
            total_value = 0.0
            
            # Encontrar colunas de parcelas (a partir da coluna 29)
            payment_columns = df.columns[29:]  # Colunas de parcelas começam na posição 29
            
            for col in payment_columns:
                if col and not pd.isna(row[col]):
                    value = clean_currency_value(row[col])
                    total_value += abs(value)
            
            # Se não houver parcelas, usar o valor total do CSV
            if total_value == 0:
                total_value = clean_currency_value(row.get('Total', 0))
            
            # Gerar external_id único para contrato
            contract_number = clean_nan_value(row.get('N', ''), 'SEM_NUMERO')  # Coluna N tem o número do contrato
            contract_status = clean_nan_value(row.get('Contrato', ''), 'Ativo')  # Coluna Contrato tem o status
            contract_key = f"{name}_{contract_status}"
            contract_counter[contract_key] += 1
            external_id = f"{contract_key}_{contract_counter[contract_key]:03d}" if contract_counter[contract_key] > 1 else contract_key
            
            contract = {
                'id': str(uuid.uuid4()),
                'client_id': client_id,
                'contract_number': contract_number,
                'description': f"Contrato {clean_nan_value(row.get('Área', ''))} - {clean_nan_value(row.get('Método', ''))}",
                'value': total_value,
                'start_date': clean_nan_value(row.get('Início', '')),
                'end_date': clean_nan_value(row.get('Fim', '')),
                'status': 'active' if contract_status.lower() == 'ativo' else 'inactive',
                'payment_frequency': 'monthly',
                'notes': f"Gestora: {clean_nan_value(row.get('Gestora', ''))}, Médico: {clean_nan_value(row.get('Médico - Contrato', ''))}",
                'external_id': external_id,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            contracts.append(contract)
    
    return pd.DataFrame(contracts)

def generate_payments_csv(df, contracts_df):
    """Gera arquivo payments.csv com todas as parcelas e external_id único"""
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
            # Processar todas as colunas de parcelas (a partir da coluna 29)
            payment_columns = df.columns[29:]
            
            for col in payment_columns:
                if col and not pd.isna(row[col]) and str(row[col]).strip() != '':
                    value = clean_currency_value(row[col])
                    
                    # Pular valores zero
                    if value == 0:
                        continue
                    
                    # Determinar status baseado no sinal do valor
                    is_negative = str(row[col]).strip().startswith('(') or str(row[col]).strip().startswith('-')
                    status = 'paid' if is_negative else 'pending'
                    
                    # Converter data da coluna
                    due_date = parse_date_column(col)
                    
                    # Gerar external_id único sequencial
                    payment_counter += 1
                    external_id = f"PAYMENT_{payment_counter:06d}"
                    
                    payment = {
                        'id': str(uuid.uuid4()),
                        'contract_id': contract_id,
                        'amount': abs(value),
                        'due_date': due_date.isoformat() if due_date else '',
                        'paid_date': due_date.isoformat() if status == 'paid' and due_date else '',
                        'status': status,
                        'payment_method': clean_nan_value(row.get('Método', '')),
                        'notes': f"Parcela {col}",
                        'external_id': external_id,
                        'created_at': datetime.now().isoformat(),
                        'updated_at': datetime.now().isoformat()
                    }
                    payments.append(payment)
    
    return pd.DataFrame(payments)

def main():
    """Função principal com validações e estatísticas melhoradas"""
    # Ler arquivo CSV
    input_file = 'contratosAtivosFinal - Contratos Ativos.csv'
    
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

if __name__ == '__main__':
    main()