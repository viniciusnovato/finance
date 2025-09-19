#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para importar clients.csv para o Supabase
"""

import csv
import requests
import json
import time
from datetime import datetime

class ClientsImporter:
    def __init__(self, supabase_url, supabase_key):
        self.supabase_url = supabase_url.rstrip('/')
        self.supabase_key = supabase_key
        self.headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        self.batch_size = 100
        self.imported_count = 0
        self.error_count = 0
        
    def clear_existing_clients(self):
        """Limpa todos os clientes existentes"""
        print("🗑️  Limpando clientes existentes...")
        
        try:
            # Primeiro, conta quantos registros existem
            count_response = requests.get(
                f"{self.supabase_url}/rest/v1/clients",
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}',
                    'Prefer': 'count=exact'
                }
            )
            
            if count_response.status_code == 200:
                count = count_response.headers.get('Content-Range', '0').split('/')[-1]
                print(f"📊 Encontrados {count} clientes existentes")
            
            # Deleta todos os registros
            delete_response = requests.delete(
                f"{self.supabase_url}/rest/v1/clients",
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}'
                },
                params={'id': 'not.is.null'}  # Deleta todos os registros
            )
            
            if delete_response.status_code in [200, 204]:
                print("✅ Clientes existentes removidos com sucesso")
            else:
                print(f"⚠️  Aviso ao limpar clientes: {delete_response.status_code} - {delete_response.text}")
                
        except Exception as e:
            print(f"⚠️  Erro ao limpar clientes: {e}")
    
    def load_clients_from_csv(self, csv_file):
        """Carrega clientes do CSV"""
        print(f"📋 Carregando clientes de {csv_file}...")
        clients = []
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                client = {
                    'id': row['id'],
                    'first_name': row['first_name'],
                    'last_name': row['last_name'],
                    'email': row['email'] if row['email'] else None,
                    'phone': row['phone'] if row['phone'] else None,
                    'tax_id': row['external_id'] if row['external_id'] else None,
                    'address': row['address'] if row['address'] else None,
                    'city': row['city'] if row['city'] else None,
                    'postal_code': row['postal_code'] if row['postal_code'] else None,
                    'country': 'Brasil',
                    'notes': row['external_id'] if row['external_id'] else None,
                    'status': 'active',
                    'external_id': row['external_id'] if row['external_id'] else None,
                    'created_at': row['created_at'],
                    'updated_at': row['updated_at']
                }
                clients.append(client)
        
        print(f"✅ {len(clients)} clientes carregados do CSV")
        return clients
    
    def import_clients_batch(self, clients_batch):
        """Importa um lote de clientes"""
        try:
            response = requests.post(
                f"{self.supabase_url}/rest/v1/clients",
                headers=self.headers,
                json=clients_batch
            )
            
            if response.status_code in [200, 201]:
                self.imported_count += len(clients_batch)
                return True
            else:
                print(f"❌ Erro no lote: {response.status_code} - {response.text}")
                self.error_count += len(clients_batch)
                return False
                
        except Exception as e:
            print(f"❌ Exceção no lote: {e}")
            self.error_count += len(clients_batch)
            return False
    
    def import_all_clients(self, clients):
        """Importa todos os clientes em lotes"""
        print(f"📤 Iniciando importação de {len(clients)} clientes...")
        
        total_batches = (len(clients) + self.batch_size - 1) // self.batch_size
        
        for i in range(0, len(clients), self.batch_size):
            batch_num = (i // self.batch_size) + 1
            batch = clients[i:i + self.batch_size]
            
            print(f"📦 Processando lote {batch_num}/{total_batches} ({len(batch)} clientes)...")
            
            success = self.import_clients_batch(batch)
            
            if success:
                print(f"✅ Lote {batch_num} importado com sucesso")
            else:
                print(f"❌ Falha no lote {batch_num}")
            
            # Pequena pausa entre lotes para não sobrecarregar a API
            if batch_num < total_batches:
                time.sleep(0.5)
    
    def verify_import(self):
        """Verifica se a importação foi bem-sucedida"""
        print("🔍 Verificando importação...")
        
        try:
            response = requests.get(
                f"{self.supabase_url}/rest/v1/clients",
                headers={
                    'apikey': self.supabase_key,
                    'Authorization': f'Bearer {self.supabase_key}',
                    'Prefer': 'count=exact'
                }
            )
            
            if response.status_code == 200:
                count = response.headers.get('Content-Range', '0').split('/')[-1]
                print(f"📊 Total de clientes no banco: {count}")
                return int(count)
            else:
                print(f"❌ Erro na verificação: {response.status_code}")
                return 0
                
        except Exception as e:
            print(f"❌ Erro na verificação: {e}")
            return 0
    
    def print_summary(self):
        """Imprime resumo da importação"""
        print("\n📊 RESUMO DA IMPORTAÇÃO DE CLIENTES:")
        print(f"   Clientes importados: {self.imported_count}")
        print(f"   Erros: {self.error_count}")
        print(f"   Taxa de sucesso: {(self.imported_count / (self.imported_count + self.error_count) * 100):.1f}%" if (self.imported_count + self.error_count) > 0 else "   Taxa de sucesso: N/A")

def main():
    print("🚀 Iniciando importação de clientes para o Supabase...")
    
    # Configuração para importação de clientes
    SUPABASE_URL = "https://sxbslulfitfsijqrzljd.supabase.co"
    SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YnNsdWxmaXRmc2lqcXJ6bGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDg4NDksImV4cCI6MjA3MzUyNDg0OX0.ivAdA58zHtj3XNrXKG9DKMX6jynhhv77nz39IvJZjPM"
    
    # Inicializa o importador
    importer = ClientsImporter(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Limpa clientes existentes
    importer.clear_existing_clients()
    
    # Carrega clientes do CSV
    clients = importer.load_clients_from_csv('clients.csv')
    
    if not clients:
        print("❌ Nenhum cliente encontrado no CSV")
        return
    
    # Importa clientes
    importer.import_all_clients(clients)
    
    # Verifica importação
    final_count = importer.verify_import()
    
    # Mostra resumo
    importer.print_summary()
    
    if final_count == len(clients):
        print("\n🎉 Importação de clientes concluída com sucesso!")
    else:
        print(f"\n⚠️  Importação parcial: {final_count}/{len(clients)} clientes")

if __name__ == "__main__":
    main()