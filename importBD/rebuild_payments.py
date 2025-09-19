#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para recalcular e converter todos os payments do CSV original de contratos ativos
Gera payments_rebuilt.csv no formato correto para importação futura
"""

import pandas as pd
import uuid
import re
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('payments_rebuilt_inconsistencies.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def normalize_monetary_value(value_str):
    """
    Normaliza valores monetários removendo € e espaços, trocando vírgula por ponto
    Retorna valor absoluto como float
    """
    if pd.isna(value_str) or value_str == '' or str(value_str).strip() in ['#NAME?', '#ERROR!', '#REF!', 'ß', '-']:
        return 0.0
    
    # Converter para string se não for
    value_str = str(value_str).strip()
    
    # Remover € e espaços
    value_str = value_str.replace('€', '').replace(' ', '')
    
    # Lidar com formato brasileiro/europeu: 1.000,00 -> 1000.00
    if ',' in value_str and '.' in value_str:
        # Se tem tanto vírgula quanto ponto, assumir que ponto é separador de milhares
        parts = value_str.split(',')
        if len(parts) == 2 and len(parts[1]) <= 2:  # Vírgula como separador decimal
            value_str = parts[0].replace('.', '') + '.' + parts[1]
    elif ',' in value_str:
        # Se só tem vírgula, trocar por ponto (separador decimal)
        value_str = value_str.replace(',', '.')
    
    try:
        # Converter para float e retornar valor absoluto
        return abs(float(value_str))
    except ValueError:
        logger.warning(f"Valor monetário inválido: {value_str}")
        return 0.0

def parse_date_header(date_header):
    """
    Converte cabeçalhos de data como 'mar./23' para '2023-03-01'
    Suporta meses abreviados e completos em PT
    """
    if pd.isna(date_header) or date_header == '':
        return None
    
    date_header = str(date_header).strip()
    
    # Mapeamento de meses em português
    months_pt = {
        'jan': '01', 'janeiro': '01',
        'fev': '02', 'fevereiro': '02',
        'mar': '03', 'março': '03', 'marco': '03',
        'abr': '04', 'abril': '04',
        'mai': '05', 'maio': '05',
        'jun': '06', 'junho': '06',
        'jul': '07', 'julho': '07',
        'ago': '08', 'agosto': '08',
        'set': '09', 'setembro': '09',
        'out': '10', 'outubro': '10',
        'nov': '11', 'novembro': '11',
        'dez': '12', 'dezembro': '12'
    }
    
    # Padrões para parsing
    patterns = [
        r'([a-z]+)\.?/([0-9]{2})$',  # mar./23, jan/24
        r'([a-z]+)/([0-9]{2})$',     # Nov/31
        r'([a-z]+)\.?([0-9]{2})$'   # Nov31
    ]
    
    for pattern in patterns:
        match = re.match(pattern, date_header.lower())
        if match:
            month_str = match.group(1)
            year_str = match.group(2)
            
            # Encontrar mês
            month_num = None
            for pt_month, num in months_pt.items():
                if month_str.startswith(pt_month[:3]):
                    month_num = num
                    break
            
            if month_num:
                # Determinar ano completo
                year_int = int(year_str)
                if year_int <= 30:  # Assumir 2030 como limite
                    full_year = 2000 + year_int
                else:
                    full_year = 1900 + year_int
                
                return f"{full_year}-{month_num}-01"
    
    logger.warning(f"Não foi possível parsear a data: {date_header}")
    return None

def load_contract_mapping():
    """
    Carrega mapeamento de contratos para obter contract_ids corretos
    """
    try:
        contracts_df = pd.read_csv('contracts.csv')
        # Criar mapeamento baseado no external_id
        mapping = {}
        for _, row in contracts_df.iterrows():
            if pd.notna(row['external_id']):
                mapping[row['external_id']] = row['id']
        return mapping
    except Exception as e:
        logger.error(f"Erro ao carregar mapeamento de contratos: {e}")
        return {}

def process_payments():
    """
    Processa o CSV original e gera payments_rebuilt.csv
    """
    logger.info("Iniciando processamento de payments...")
    
    # Carregar CSV original
    try:
        df = pd.read_csv('contratosAtivosFinal.csv')
        logger.info(f"Carregado CSV com {len(df)} contratos")
    except Exception as e:
        logger.error(f"Erro ao carregar CSV: {e}")
        return
    
    # Carregar mapeamento de contratos
    contract_mapping = load_contract_mapping()
    
    payments_data = []
    
    for idx, row in df.iterrows():
        try:
            # Identificar contrato
            nome = row['Nome']
            contrato = row['Contrato']
            external_id = f"{nome}_{contrato}"
            
            contract_id = contract_mapping.get(external_id)
            if not contract_id:
                logger.warning(f"Contract_id não encontrado para: {external_id}")
                contract_id = str(uuid.uuid4())  # Gerar UUID temporário
            
            inicio_date = row['Início']
            
            # Processar Down Payments (colunas 13 e 14 - Comp I e Comp II)
            comp_i = row.get(' Comp I ', '')
            comp_ii = row.get(' Comp II ', '')
            
            # Down Payment 1 (Comp I)
            if comp_i and str(comp_i).strip() != '':
                amount = normalize_monetary_value(comp_i)
                if amount > 0:
                    payment = {
                        'id': str(uuid.uuid4()),
                        'contract_id': contract_id,
                        'amount': amount,
                        'due_date': inicio_date,
                        'paid_date': inicio_date,
                        'status': 'paid',
                        'payment_method': '',
                        'notes': '',
                        'external_id': f"{external_id}_comp1",
                        'created_at': datetime.now().isoformat(),
                        'updated_at': datetime.now().isoformat(),
                        'payment_type': 'downPayment'
                    }
                    payments_data.append(payment)
            
            # Down Payment 2 (Comp II)
            if comp_ii and str(comp_ii).strip() != '':
                amount = normalize_monetary_value(comp_ii)
                if amount > 0:
                    payment = {
                        'id': str(uuid.uuid4()),
                        'contract_id': contract_id,
                        'amount': amount,
                        'due_date': inicio_date,
                        'paid_date': inicio_date,
                        'status': 'paid',
                        'payment_method': '',
                        'notes': '',
                        'external_id': f"{external_id}_comp2",
                        'created_at': datetime.now().isoformat(),
                        'updated_at': datetime.now().isoformat(),
                        'payment_type': 'downPayment'
                    }
                    payments_data.append(payment)
            
            # Processar parcelas mensais (colunas a partir da 30)
            installment_number = 1
            
            # Obter todas as colunas de data (a partir da coluna 30)
            date_columns = df.columns[29:]  # Índice 29 = coluna 30
            
            for col in date_columns:
                value = row.get(col, '')
                if pd.isna(value) or str(value).strip() == '':
                    continue
                
                # Normalizar valor
                original_value = str(value).strip()
                amount = normalize_monetary_value(original_value)
                
                if amount == 0:
                    continue
                
                # Determinar status baseado no sinal original
                is_negative = '-' in original_value
                status = 'paid' if is_negative else 'pending'
                
                # Parsear data do cabeçalho
                due_date = parse_date_header(col)
                if not due_date:
                    logger.warning(f"Data inválida na coluna: {col}")
                    continue
                
                # Paid date
                paid_date = due_date if status == 'paid' else ''
                
                payment = {
                    'id': str(uuid.uuid4()),
                    'contract_id': contract_id,
                    'amount': amount,
                    'due_date': due_date,
                    'paid_date': paid_date,
                    'status': status,
                    'payment_method': '',
                    'notes': str(installment_number),
                    'external_id': f"{external_id}_installment_{installment_number}",
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                    'payment_type': 'normalPayment'
                }
                payments_data.append(payment)
                installment_number += 1
        
        except Exception as e:
            logger.error(f"Erro ao processar linha {idx}: {e}")
            continue
    
    # Gerar CSV de saída
    if payments_data:
        payments_df = pd.DataFrame(payments_data)
        payments_df.to_csv('payments_rebuilt.csv', index=False)
        logger.info(f"Gerado payments_rebuilt.csv com {len(payments_data)} payments")
    else:
        logger.error("Nenhum payment foi processado")

if __name__ == "__main__":
    process_payments()
    logger.info("Processamento concluído!")