#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import urllib.request
import urllib.parse
import urllib.error
import csv
import os
from datetime import datetime

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

def backup_table(table_name, backup_dir):
    """Faz backup de uma tabela específica"""
    print(f"📦 Fazendo backup da tabela '{table_name}'...")
    
    # Buscar todos os dados da tabela
    data = make_supabase_request(
        'GET',
        table_name,
        params={
            'select': '*',
            'limit': '10000'  # Ajustar conforme necessário
        }
    )
    
    if not data:
        print(f"❌ Erro ao buscar dados da tabela '{table_name}'")
        return False
    
    if len(data) == 0:
        print(f"⚠️  Tabela '{table_name}' está vazia")
        return True
    
    # Criar arquivo CSV
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{table_name}_backup_{timestamp}.csv"
    filepath = os.path.join(backup_dir, filename)
    
    try:
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            if len(data) > 0:
                fieldnames = data[0].keys()
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)
        
        print(f"✅ Backup da tabela '{table_name}' salvo: {filename} ({len(data)} registros)")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao salvar backup da tabela '{table_name}': {e}")
        return False

def create_backup_metadata(backup_dir, tables_backed_up, total_records):
    """Cria arquivo de metadados do backup"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    metadata = {
        'backup_date': timestamp,
        'supabase_url': SUPABASE_URL,
        'tables_backed_up': tables_backed_up,
        'total_records': total_records,
        'backup_type': 'full_database_backup',
        'status': 'completed'
    }
    
    metadata_file = os.path.join(backup_dir, f"backup_metadata_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    
    try:
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        print(f"📋 Metadados do backup salvos: {os.path.basename(metadata_file)}")
        return True
    except Exception as e:
        print(f"❌ Erro ao salvar metadados: {e}")
        return False

def main():
    print("🚀 Iniciando backup do banco de dados Supabase...")
    print(f"🔗 URL: {SUPABASE_URL}")
    
    # Criar diretório de backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"backup_supabase_{timestamp}"
    
    try:
        os.makedirs(backup_dir, exist_ok=True)
        print(f"📁 Diretório de backup criado: {backup_dir}")
    except Exception as e:
        print(f"❌ Erro ao criar diretório de backup: {e}")
        return
    
    # Lista das tabelas principais para backup
    tables_to_backup = [
        'clients',
        'contracts', 
        'payments',
        'users',
        'categories',
        'reports'
    ]
    
    print(f"\n📊 Tabelas para backup: {', '.join(tables_to_backup)}")
    
    successful_backups = []
    failed_backups = []
    total_records = 0
    
    # Fazer backup de cada tabela
    for table in tables_to_backup:
        print(f"\n{'='*50}")
        
        # Verificar se a tabela existe
        test_data = make_supabase_request(
            'GET',
            table,
            params={'select': 'count', 'limit': '1'}
        )
        
        if test_data is None:
            print(f"⚠️  Tabela '{table}' não encontrada ou sem acesso")
            failed_backups.append(table)
            continue
        
        # Fazer backup da tabela
        if backup_table(table, backup_dir):
            successful_backups.append(table)
            
            # Contar registros
            count_data = make_supabase_request(
                'GET',
                table,
                params={'select': '*', 'limit': '10000'}
            )
            if count_data:
                total_records += len(count_data)
        else:
            failed_backups.append(table)
    
    # Criar metadados do backup
    print(f"\n{'='*50}")
    create_backup_metadata(backup_dir, successful_backups, total_records)
    
    # Relatório final
    print(f"\n{'='*60}")
    print("📊 RELATÓRIO FINAL DO BACKUP")
    print(f"{'='*60}")
    print(f"📁 Diretório: {backup_dir}")
    print(f"✅ Tabelas com backup bem-sucedido: {len(successful_backups)}")
    if successful_backups:
        for table in successful_backups:
            print(f"   • {table}")
    
    print(f"❌ Tabelas com falha: {len(failed_backups)}")
    if failed_backups:
        for table in failed_backups:
            print(f"   • {table}")
    
    print(f"📊 Total de registros salvos: {total_records:,}")
    print(f"🕒 Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if len(successful_backups) > 0:
        print(f"\n🎉 Backup concluído com sucesso!")
        print(f"📦 Arquivos salvos em: {os.path.abspath(backup_dir)}")
    else:
        print(f"\n❌ Backup falhou completamente!")
        print("Verifique as credenciais e permissões do Supabase.")

if __name__ == "__main__":
    main()