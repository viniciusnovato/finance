#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para gerar payments.csv a partir de ContratosAtivosFinal.csv
Seguindo as especificações detalhadas em instrucoesCorrections.md
"""

import pandas as pd
import uuid
import json
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PaymentsGenerator:
    def __init__(self):
        self.contract_mapping = {}
        self.log_data = {
            'total_processed_contracts': 0,
            'total_generated_payments': 0,
            'ignored_lines': [],
            'errors': [],
            'statistics': {
                'by_status': {'paid': 0, 'pending': 0},
                'by_payment_type': {'downPayment': 0, 'normalPayment': 0}
            }
        }
        
        # Mapeamento de meses PT/BR
        self.month_mapping = {
            'jan': 1, 'janeiro': 1,
            'fev': 2, 'fevereiro': 2,
            'mar': 3, 'março': 3, 'marco': 3,
            'abr': 4, 'abril': 4,
            'mai': 5, 'maio': 5,
            'jun': 6, 'junho': 6,
            'jul': 7, 'julho': 7,
            'ago': 8, 'agosto': 8,
            'set': 9, 'setembro': 9,
            'out': 10, 'outubro': 10,
            'nov': 11, 'novembro': 11,
            'dez': 12, 'dezembro': 12
        }
    
    def normalize_monetary_value(self, value_str: str) -> Optional[float]:
        """
        Normaliza valores monetários removendo €, espaços e convertendo vírgula para ponto
        Retorna sempre o valor absoluto
        """
        if pd.isna(value_str) or value_str == '' or value_str is None:
            return None
            
        try:
            # Converter para string se não for
            value_str = str(value_str).strip()
            
            # Remover € e espaços
            value_str = value_str.replace('€', '').replace(' ', '')
            
            # Trocar vírgula por ponto
            value_str = value_str.replace(',', '.')
            
            # Converter para float e retornar valor absoluto
            return abs(float(value_str))
            
        except (ValueError, TypeError) as e:
            logger.warning(f"Erro ao normalizar valor '{value_str}': {e}")
            return None
    
    def parse_date_header(self, header: str) -> Optional[str]:
        """
        Parser robusto para cabeçalhos de data em PT/BR
        Retorna data no formato ISO YYYY-MM-DD
        """
        if pd.isna(header) or header == '' or header is None:
            return None
            
        try:
            header = str(header).strip().lower()
            
            # Padrões de regex para diferentes formatos
            patterns = [
                # mar./23, jan./24, maio/27
                r'^([a-z]+)\.?/([0-9]{2,4})$',
                # Nov/31, Nov/2031
                r'^([a-z]+)/([0-9]{2,4})$',
                # 03/2025, 03/25
                r'^([0-9]{1,2})/([0-9]{2,4})$'
            ]
            
            for pattern in patterns:
                match = re.match(pattern, header)
                if match:
                    part1, part2 = match.groups()
                    
                    # Se part1 é um mês em texto
                    if part1 in self.month_mapping:
                        month = self.month_mapping[part1]
                        year = int(part2)
                        
                        # Ajustar ano se for de 2 dígitos (todos os anos são 20XX)
                        if year < 100:
                            year = 2000 + year
                            
                        return f"{year:04d}-{month:02d}-01"
                    
                    # Se part1 é um número (mês)
                    elif part1.isdigit():
                        month = int(part1)
                        year = int(part2)
                        
                        # Ajustar ano se for de 2 dígitos (todos os anos são 20XX)
                        if year < 100:
                            year = 2000 + year
                            
                        if 1 <= month <= 12:
                            return f"{year:04d}-{month:02d}-01"
            
            return None
            
        except Exception as e:
            logger.warning(f"Erro ao parsear cabeçalho de data '{header}': {e}")
            return None
    
    def load_contract_mapping(self, contracts_file: str) -> bool:
        """
        Carrega o mapeamento de contratos do arquivo contracts.csv
        Usa external_id como chave de mapeamento
        """
        try:
            contracts_df = pd.read_csv(contracts_file)
            
            for _, row in contracts_df.iterrows():
                if pd.notna(row['external_id']):
                    self.contract_mapping[row['external_id']] = row['id']
            
            logger.info(f"Carregados {len(self.contract_mapping)} mapeamentos de contratos")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao carregar mapeamento de contratos: {e}")
            return False
    
    def get_contract_key(self, row: pd.Series) -> str:
        """
        Gera a chave de contrato baseada no padrão usado no external_id
        """
        nome = str(row['Nome']).strip() if pd.notna(row['Nome']) else ''
        contrato = str(row['Contrato']).strip() if pd.notna(row['Contrato']) else ''
        return f"{nome}_{contrato}"
    
    def process_contratos_file(self, input_file: str) -> List[Dict[str, Any]]:
        """
        Processa o arquivo ContratosAtivosFinal.csv e gera os dados de pagamentos
        """
        try:
            df = pd.read_csv(input_file)
            payments_data = []
            
            logger.info(f"Processando {len(df)} linhas do arquivo {input_file}")
            
            for idx, row in df.iterrows():
                self.log_data['total_processed_contracts'] += 1
                
                # Obter contract_id via mapeamento
                contract_key = self.get_contract_key(row)
                contract_id = self.contract_mapping.get(contract_key)
                
                if not contract_id:
                    error_msg = f"Contrato não encontrado no mapeamento: {contract_key}"
                    self.log_data['errors'].append({
                        'line': idx + 2,  # +2 porque idx começa em 0 e temos header
                        'contract_key': contract_key,
                        'error': error_msg
                    })
                    logger.warning(f"Linha {idx + 2}: {error_msg}")
                    continue
                
                # Processar down payments (colunas 14 e 15)
                self._process_down_payments(row, contract_id, payments_data, idx + 2)
                
                # Processar parcelas mensais (coluna 31 em diante)
                self._process_monthly_payments(row, contract_id, payments_data, idx + 2, df.columns)
            
            return payments_data
            
        except Exception as e:
            logger.error(f"Erro ao processar arquivo: {e}")
            raise
    
    def _process_down_payments(self, row: pd.Series, contract_id: str, payments_data: List[Dict], line_num: int):
        """
        Processa down payments das colunas 14 e 15 (Comp I e Comp II)
        Também processa a coluna 'Entrada' se houver valor
        """
        # Obter data de início do contrato
        start_date = None
        if pd.notna(row.get('Início')):
            try:
                start_date = pd.to_datetime(row['Início']).strftime('%Y-%m-%d')
            except:
                self.log_data['errors'].append({
                    'line': line_num,
                    'error': f"Data de início inválida: {row.get('Início')}"
                })
        
        # Processar Entrada (se houver)
        entrada_value = self.normalize_monetary_value(row.get(' Entrada '))
        if entrada_value is not None and entrada_value > 0:
            payment = self._create_payment_record(
                contract_id=contract_id,
                amount=entrada_value,
                due_date=start_date,
                paid_date=start_date,
                status='paid',  # Sempre paid para down payments
                payment_type='downPayment',
                notes='',
                payment_method=row.get('Método', '')
            )
            payments_data.append(payment)
            self.log_data['statistics']['by_payment_type']['downPayment'] += 1
            self.log_data['statistics']['by_status']['paid'] += 1
        
        # Processar Comp I (coluna 14)
        comp1_value = self.normalize_monetary_value(row.get(' Comp I '))
        if comp1_value is not None and comp1_value > 0:
            payment = self._create_payment_record(
                contract_id=contract_id,
                amount=comp1_value,
                due_date=start_date,
                paid_date=start_date,
                status='paid',  # Sempre paid para down payments
                payment_type='downPayment',
                notes='',
                payment_method=row.get('Método', '')
            )
            payments_data.append(payment)
            self.log_data['statistics']['by_payment_type']['downPayment'] += 1
            self.log_data['statistics']['by_status']['paid'] += 1
        
        # Processar Comp II (coluna 15)
        comp2_value = self.normalize_monetary_value(row.get(' Comp II '))
        if comp2_value is not None and comp2_value > 0:
            payment = self._create_payment_record(
                contract_id=contract_id,
                amount=comp2_value,
                due_date=start_date,
                paid_date=start_date,
                status='paid',  # Sempre paid para down payments
                payment_type='downPayment',
                notes='',
                payment_method=row.get('Método', '')
            )
            payments_data.append(payment)
            self.log_data['statistics']['by_payment_type']['downPayment'] += 1
            self.log_data['statistics']['by_status']['paid'] += 1
    
    def _process_monthly_payments(self, row: pd.Series, contract_id: str, payments_data: List[Dict], line_num: int, columns: pd.Index):
        """
        Processa parcelas mensais a partir da coluna 31 (índice 30)
        """
        parcela_num = 1
        
        # Começar da coluna 31 (índice 30)
        for col_idx in range(30, len(columns)):
            col_name = columns[col_idx]
            cell_value = row.iloc[col_idx]
            
            # Ignorar células vazias
            if pd.isna(cell_value) or str(cell_value).strip() == '':
                continue
            
            # Normalizar valor
            amount = self.normalize_monetary_value(cell_value)
            if amount is None or amount == 0:
                self.log_data['errors'].append({
                    'line': line_num,
                    'column': col_name,
                    'value': str(cell_value),
                    'error': 'Valor inválido ou zero'
                })
                continue
            
            # Determinar status baseado no sinal original
            original_value = str(cell_value).strip().replace('€', '').replace(' ', '')
            is_negative = original_value.startswith('-')
            status = 'paid' if is_negative else 'pending'
            
            # Parsear data do cabeçalho
            due_date = self.parse_date_header(col_name)
            if not due_date:
                self.log_data['errors'].append({
                    'line': line_num,
                    'column': col_name,
                    'value': str(cell_value),
                    'error': f'Data imparseável no cabeçalho: {col_name}'
                })
                continue
            
            # Definir paid_date
            paid_date = due_date if status == 'paid' else ''
            
            # Criar registro de pagamento
            payment = self._create_payment_record(
                contract_id=contract_id,
                amount=amount,
                due_date=due_date,
                paid_date=paid_date,
                status=status,
                payment_type='normalPayment',
                notes=str(parcela_num),
                payment_method=row.get('Método', '')
            )
            
            payments_data.append(payment)
            self.log_data['statistics']['by_payment_type']['normalPayment'] += 1
            self.log_data['statistics']['by_status'][status] += 1
            
            parcela_num += 1
    
    def _create_payment_record(self, contract_id: str, amount: float, due_date: str, 
                             paid_date: str, status: str, payment_type: str, 
                             notes: str, payment_method: str = '') -> Dict[str, Any]:
        """
        Cria um registro de pagamento com todas as colunas necessárias
        """
        current_time = datetime.now(timezone.utc).isoformat()
        
        return {
            'id': str(uuid.uuid4()),
            'contract_id': contract_id,
            'amount': amount,
            'due_date': due_date,
            'paid_date': paid_date,
            'status': status,
            'payment_method': payment_method,
            'notes': notes,
            'external_id': '',
            'created_at': current_time,
            'updated_at': current_time,
            'payment_type': payment_type
        }
    
    def save_payments_csv(self, payments_data: List[Dict], output_file: str):
        """
        Salva os dados de pagamentos no arquivo CSV com o schema exato
        """
        if not payments_data:
            logger.warning("Nenhum dado de pagamento para salvar")
            return
        
        # Definir colunas na ordem exata especificada
        columns = [
            'id', 'contract_id', 'amount', 'due_date', 'paid_date', 'status',
            'payment_method', 'notes', 'external_id', 'created_at', 'updated_at', 'payment_type'
        ]
        
        df = pd.DataFrame(payments_data, columns=columns)
        df.to_csv(output_file, index=False)
        
        self.log_data['total_generated_payments'] = len(payments_data)
        logger.info(f"Salvos {len(payments_data)} registros de pagamento em {output_file}")
    
    def save_log(self, log_file: str):
        """
        Salva o log detalhado em formato JSON
        """
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(self.log_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Log salvo em {log_file}")
    
    def show_preview(self, payments_data: List[Dict], num_lines: int = 10):
        """
        Mostra preview dos primeiros registros
        """
        if not payments_data:
            print("Nenhum dado para preview")
            return
        
        print(f"\n=== PREVIEW - Primeiras {min(num_lines, len(payments_data))} linhas ===")
        df_preview = pd.DataFrame(payments_data[:num_lines])
        print(df_preview.to_string(index=False))
        
        print(f"\n=== ESTATÍSTICAS ===")
        print(f"Total de pagamentos gerados: {len(payments_data)}")
        print(f"Por status: {self.log_data['statistics']['by_status']}")
        print(f"Por tipo: {self.log_data['statistics']['by_payment_type']}")
        print(f"Contratos processados: {self.log_data['total_processed_contracts']}")
        print(f"Erros encontrados: {len(self.log_data['errors'])}")

def main():
    """
    Função principal
    """
    # Arquivos de entrada e saída
    contratos_file = 'contratosAtivosFinal.csv'
    contracts_file = 'contracts.csv'
    output_file = 'payments.csv'
    log_file = 'payments_build_log.json'
    
    try:
        # Inicializar gerador
        generator = PaymentsGenerator()
        
        # Carregar mapeamento de contratos
        logger.info("Carregando mapeamento de contratos...")
        if not generator.load_contract_mapping(contracts_file):
            logger.error("Falha ao carregar mapeamento de contratos")
            return False
        
        # Processar arquivo de contratos
        logger.info("Processando arquivo de contratos...")
        payments_data = generator.process_contratos_file(contratos_file)
        
        # Mostrar preview
        generator.show_preview(payments_data)
        
        # Confirmar antes de salvar
        response = input("\nDeseja salvar os arquivos? (s/n): ")
        if response.lower() in ['s', 'sim', 'y', 'yes']:
            # Salvar CSV
            generator.save_payments_csv(payments_data, output_file)
            
            # Salvar log
            generator.save_log(log_file)
            
            logger.info("Processamento concluído com sucesso!")
            return True
        else:
            logger.info("Operação cancelada pelo usuário")
            return False
            
    except Exception as e:
        logger.error(f"Erro durante o processamento: {e}")
        return False

if __name__ == '__main__':
    main()