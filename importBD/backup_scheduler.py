#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import urllib.request
import urllib.parse
import urllib.error
import csv
import os
import shutil
from datetime import datetime, timedelta
import time

# Configuração do Supabase
SUPABASE_URL = "https://sxbslulfitfsijqrzljd.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YnNsdWxmaXRmc2lqcXJ6bGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDg4NDksImV4cCI6MjA3MzUyNDg0OX0.ivAdA58zHtj3XNrXKG9DKMX6jynhhv77nz39IvJZjPM"

# Configurações de backup
BACKUP_RETENTION_DAYS = 30  # Manter backups por 30 dias
MAX_BACKUP_FOLDERS = 10     # Máximo de pastas de backup

def make_supabase_request(method, endpoint, params=None):
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
    
    req = urllib.request.Request(url, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status in [200, 201, 204]:
                try:
                    return json.loads(response.read().decode('utf-8'))
                except:
                    return {'success': True}
            return None
    except Exception as e:
        print(f"Erro na requisição: {e}")
        return None

def create_incremental_backup(backup_dir, last_backup_time=None):
    """Cria backup incremental baseado na última data de backup"""
    print("📊 Criando backup incremental...")
    
    tables = ['clients', 'contracts', 'payments']
    total_new_records = 0
    
    for table in tables:
        print(f"\n🔍 Verificando novos registros em '{table}'...")
        
        # Parâmetros para buscar registros novos/atualizados
        params = {'select': '*', 'limit': '1000'}
        
        if last_backup_time:
            # Buscar apenas registros criados/atualizados após o último backup
            params['created_at'] = f'gte.{last_backup_time}'
        
        data = make_supabase_request('GET', table, params)
        
        if data and len(data) > 0:
            # Salvar dados incrementais
            filename = f"{table}_incremental_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            filepath = os.path.join(backup_dir, filename)
            
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = data[0].keys()
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)
            
            print(f"✅ {len(data)} novos registros salvos em {filename}")
            total_new_records += len(data)
        else:
            print(f"ℹ️  Nenhum registro novo em '{table}'")
    
    return total_new_records

def cleanup_old_backups(base_dir):
    """Remove backups antigos para economizar espaço"""
    print("\n🧹 Limpando backups antigos...")
    
    backup_folders = []
    
    # Encontrar todas as pastas de backup
    for item in os.listdir(base_dir):
        if item.startswith('backup_supabase_') and os.path.isdir(os.path.join(base_dir, item)):
            folder_path = os.path.join(base_dir, item)
            folder_time = os.path.getctime(folder_path)
            backup_folders.append((folder_path, folder_time))
    
    # Ordenar por data (mais recente primeiro)
    backup_folders.sort(key=lambda x: x[1], reverse=True)
    
    # Remover backups antigos
    cutoff_date = datetime.now() - timedelta(days=BACKUP_RETENTION_DAYS)
    removed_count = 0
    
    for folder_path, folder_time in backup_folders:
        folder_date = datetime.fromtimestamp(folder_time)
        
        # Remover se for muito antigo OU se exceder o limite máximo
        if folder_date < cutoff_date or len(backup_folders) - removed_count > MAX_BACKUP_FOLDERS:
            try:
                shutil.rmtree(folder_path)
                print(f"🗑️  Removido: {os.path.basename(folder_path)}")
                removed_count += 1
            except Exception as e:
                print(f"❌ Erro ao remover {folder_path}: {e}")
    
    if removed_count == 0:
        print("ℹ️  Nenhum backup antigo para remover")
    else:
        print(f"✅ {removed_count} backups antigos removidos")

def get_database_stats():
    """Obtém estatísticas do banco de dados"""
    stats = {}
    tables = ['clients', 'contracts', 'payments']
    
    for table in tables:
        data = make_supabase_request('GET', table, {'select': '*', 'limit': '10000'})
        stats[table] = len(data) if data else 0
    
    return stats

def create_backup_report(backup_dir, stats, backup_type="full"):
    """Cria relatório detalhado do backup"""
    report = {
        'timestamp': datetime.now().isoformat(),
        'backup_type': backup_type,
        'database_stats': stats,
        'backup_location': backup_dir,
        'supabase_url': SUPABASE_URL,
        'retention_policy': f"{BACKUP_RETENTION_DAYS} dias",
        'max_backups': MAX_BACKUP_FOLDERS
    }
    
    report_file = os.path.join(backup_dir, 'backup_report.json')
    
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    return report_file

def main():
    print("🔄 Iniciando sistema de backup automatizado...")
    print(f"🕒 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    base_dir = "/Users/insitutoareluna/Documents/finance/importBD"
    
    # Criar diretório de backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = os.path.join(base_dir, f"backup_supabase_{timestamp}")
    os.makedirs(backup_dir, exist_ok=True)
    
    print(f"📁 Diretório de backup: {backup_dir}")
    
    # Obter estatísticas do banco
    print("\n📊 Coletando estatísticas do banco...")
    stats = get_database_stats()
    
    for table, count in stats.items():
        print(f"   • {table}: {count:,} registros")
    
    # Executar backup completo
    print("\n🚀 Executando backup completo...")
    os.system(f"cd {base_dir} && python3 backup_supabase.py")
    
    # Mover arquivos para o diretório organizado
    latest_backup = None
    for item in os.listdir(base_dir):
        if item.startswith('backup_supabase_') and os.path.isdir(os.path.join(base_dir, item)):
            item_path = os.path.join(base_dir, item)
            if latest_backup is None or os.path.getctime(item_path) > os.path.getctime(latest_backup):
                latest_backup = item_path
    
    # Criar relatório
    if latest_backup:
        report_file = create_backup_report(latest_backup, stats)
        print(f"📋 Relatório criado: {os.path.basename(report_file)}")
    
    # Limpeza de backups antigos
    cleanup_old_backups(base_dir)
    
    print("\n✅ Sistema de backup executado com sucesso!")
    print(f"📦 Backup salvo em: {latest_backup}")
    print(f"📊 Total de registros: {sum(stats.values()):,}")

if __name__ == "__main__":
    main()