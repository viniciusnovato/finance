#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para gerar payments.csv com regras específicas:
- Colunas 14-15: downPayment (sempre paid)
- Colunas 20+: normalPayment (negativo=paid, positivo=pending)
"""

import csv
import uuid
from datetime import datetime
import re

class PaymentsGenerator:
    def __init__(self):
        self.contracts_map = {}  # external_id -> contract_id
        self.payments = []
        
    def load_contracts(self, contracts_file):
        """Carrega mapeamento de external_id para contract_id"""
        print("📋 Carregando contratos...")
        with open(contracts_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                external_id = row['external_id']
                contract_id = row['id']
                self.contracts_map[external_id] = contract_id
        print(f"✅ {len(self.contracts_map)} contratos carregados")
    
    def clean_currency_value(self, value_str):
        """Limpa e converte valores monetários"""
        if not value_str or value_str.strip() == '':
            return 0.0
        
        # Remove símbolos de moeda, espaços e vírgulas como separadores de milhares
        cleaned = re.sub(r'[€\s]', '', value_str)
        cleaned = cleaned.replace('.', '').replace(',', '.')
        
        try:
            return float(cleaned)
        except ValueError:
            return 0.0
    
    def generate_payments_from_csv(self, original_csv_file):
        """Gera payments a partir do CSV original"""
        print("💰 Gerando payments...")
        
        with open(original_csv_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader)  # Pula o cabeçalho
            
            payment_counter = 0
            
            for row_idx, row in enumerate(reader, 1):
                if len(row) < 30:  # Verifica se há colunas suficientes
                    continue
                
                client_name = row[0]
                contract_number = row[2]
                external_id = f"{client_name}_{contract_number}"
                
                # Verifica se o contrato existe
                if external_id not in self.contracts_map:
                    print(f"⚠️  Contrato não encontrado: {external_id}")
                    continue
                
                contract_id = self.contracts_map[external_id]
                
                # Processa entrada - Comp I (coluna 13, índice 13)
                comp1_value = self.clean_currency_value(row[13]) if len(row) > 13 else 0.0
                if comp1_value > 0:
                    payment_counter += 1
                    payment = {
                        'id': str(uuid.uuid4()),
                        'contract_id': contract_id,
                        'amount': abs(comp1_value),
                        'due_date': datetime.now().strftime('%Y-%m-%d'),
                        'payment_date': datetime.now().strftime('%Y-%m-%d'),
                        'status': 'paid',
                        'payment_type': 'downPayment',
                        'notes': '1',
                        'created_at': datetime.now().isoformat(),
                        'updated_at': datetime.now().isoformat()
                    }
                    self.payments.append(payment)
                
                # Processa entrada - Comp II (coluna 14, índice 14)
                comp2_value = self.clean_currency_value(row[14]) if len(row) > 14 else 0.0
                if comp2_value > 0:
                    payment_counter += 1
                    payment = {
                        'id': str(uuid.uuid4()),
                        'contract_id': contract_id,
                        'amount': abs(comp2_value),
                        'due_date': datetime.now().strftime('%Y-%m-%d'),
                        'payment_date': datetime.now().strftime('%Y-%m-%d'),
                        'status': 'paid',
                        'payment_type': 'downPayment',
                        'notes': '2',
                        'created_at': datetime.now().isoformat(),
                        'updated_at': datetime.now().isoformat()
                    }
                    self.payments.append(payment)
                
                # Processa parcelas normais (a partir da coluna 20, índice 29)
                parcela_num = 3  # Começa da parcela 3 (após as duas entradas)
                
                for col_idx in range(29, len(row)):  # A partir da coluna 30 (índice 29)
                    value_str = row[col_idx].strip()
                    if not value_str or value_str == '':
                        continue
                    
                    # Limpa o valor
                    clean_value = self.clean_currency_value(value_str)
                    if clean_value == 0:
                        continue
                    
                    # Determina status baseado no sinal original
                    is_negative = '-' in value_str
                    status = 'paid' if is_negative else 'pending'
                    
                    payment_counter += 1
                    payment = {
                        'id': str(uuid.uuid4()),
                        'contract_id': contract_id,
                        'amount': abs(clean_value),
                        'due_date': datetime.now().strftime('%Y-%m-%d'),
                        'payment_date': datetime.now().strftime('%Y-%m-%d') if status == 'paid' else '',
                        'status': status,
                        'payment_type': 'normalPayment',
                        'notes': str(parcela_num),
                        'created_at': datetime.now().isoformat(),
                        'updated_at': datetime.now().isoformat()
                    }
                    self.payments.append(payment)
                    parcela_num += 1
                
                if row_idx % 50 == 0:
                    print(f"📊 Processadas {row_idx} linhas, {payment_counter} payments gerados")
        
        print(f"✅ Total de {len(self.payments)} payments gerados")
    
    def save_payments_csv(self, output_file):
        """Salva os payments em CSV"""
        print(f"💾 Salvando payments em {output_file}...")
        
        fieldnames = [
            'id', 'contract_id', 'amount', 'due_date', 'payment_date',
            'status', 'payment_type', 'notes', 'created_at', 'updated_at'
        ]
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.payments)
        
        print(f"✅ Arquivo {output_file} criado com {len(self.payments)} registros")
    
    def print_summary(self):
        """Imprime resumo dos payments gerados"""
        down_payments = [p for p in self.payments if p['payment_type'] == 'downPayment']
        normal_payments = [p for p in self.payments if p['payment_type'] == 'normalPayment']
        paid_payments = [p for p in self.payments if p['status'] == 'paid']
        pending_payments = [p for p in self.payments if p['status'] == 'pending']
        
        print("\n📊 RESUMO DOS PAYMENTS GERADOS:")
        print(f"   Total de payments: {len(self.payments)}")
        print(f"   Down payments: {len(down_payments)} (sempre paid)")
        print(f"   Normal payments: {len(normal_payments)}")
        print(f"   Status paid: {len(paid_payments)}")
        print(f"   Status pending: {len(pending_payments)}")
        
        # Valor total
        total_amount = sum(float(p['amount']) for p in self.payments)
        print(f"   Valor total: €{total_amount:,.2f}")

def main():
    print("🚀 Iniciando geração do payments.csv...")
    
    generator = PaymentsGenerator()
    
    # Carrega contratos
    generator.load_contracts('contracts.csv')
    
    # Gera payments
    generator.generate_payments_from_csv('contratosAtivosFinal.csv')
    
    # Salva CSV
    generator.save_payments_csv('payments.csv')
    
    # Mostra resumo
    generator.print_summary()
    
    print("\n🎉 Geração do payments.csv concluída!")

if __name__ == "__main__":
    main()