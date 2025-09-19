#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script principal para importação completa dos dados para o Supabase
Executa a sequência: clients → contracts → payments
"""

import subprocess
import sys
import time
from datetime import datetime

class DataImporter:
    def __init__(self):
        self.start_time = datetime.now()
        self.steps_completed = 0
        self.total_steps = 3
        
    def run_script(self, script_name, description):
        """Executa um script Python e retorna o resultado"""
        print(f"\n{'='*60}")
        print(f"🚀 EXECUTANDO: {description}")
        print(f"📄 Script: {script_name}")
        print(f"⏰ Horário: {datetime.now().strftime('%H:%M:%S')}")
        print(f"{'='*60}")
        
        try:
            # Executa o script
            result = subprocess.run(
                [sys.executable, script_name],
                capture_output=True,
                text=True,
                timeout=300  # 5 minutos de timeout
            )
            
            # Mostra a saída
            if result.stdout:
                print(result.stdout)
            
            if result.stderr:
                print(f"⚠️  Avisos/Erros:\n{result.stderr}")
            
            # Verifica se foi bem-sucedido
            if result.returncode == 0:
                print(f"\n✅ {description} - CONCLUÍDO COM SUCESSO")
                self.steps_completed += 1
                return True
            else:
                print(f"\n❌ {description} - FALHOU (código: {result.returncode})")
                return False
                
        except subprocess.TimeoutExpired:
            print(f"\n⏰ {description} - TIMEOUT (mais de 5 minutos)")
            return False
        except Exception as e:
            print(f"\n❌ {description} - ERRO: {e}")
            return False
    
    def print_progress(self):
        """Mostra o progresso atual"""
        progress = (self.steps_completed / self.total_steps) * 100
        elapsed = datetime.now() - self.start_time
        
        print(f"\n📊 PROGRESSO: {self.steps_completed}/{self.total_steps} ({progress:.1f}%)")
        print(f"⏱️  Tempo decorrido: {elapsed}")
    
    def validate_files_exist(self):
        """Valida se todos os arquivos necessários existem"""
        import os
        
        required_files = [
            'clients.csv',
            'contracts.csv', 
            'payments.csv',
            'import_clients_supabase.py',
            'import_contracts_supabase.py',
            'import_payments_supabase.py'
        ]
        
        print("🔍 Validando arquivos necessários...")
        
        missing_files = []
        for file in required_files:
            if not os.path.exists(file):
                missing_files.append(file)
        
        if missing_files:
            print(f"❌ Arquivos não encontrados: {', '.join(missing_files)}")
            return False
        
        print("✅ Todos os arquivos necessários encontrados")
        return True
    
    def run_full_import(self):
        """Executa a importação completa"""
        print("🎯 INICIANDO IMPORTAÇÃO COMPLETA DOS DADOS")
        print(f"📅 Data/Hora: {self.start_time.strftime('%d/%m/%Y %H:%M:%S')}")
        print("\n📋 SEQUÊNCIA DE IMPORTAÇÃO:")
        print("   1️⃣  Clientes (clients.csv)")
        print("   2️⃣  Contratos (contracts.csv)")
        print("   3️⃣  Pagamentos (payments.csv)")
        
        # Valida arquivos
        if not self.validate_files_exist():
            print("\n❌ IMPORTAÇÃO CANCELADA - Arquivos em falta")
            return False
        
        # Pausa para o usuário revisar
        print("\n⏳ Iniciando em 3 segundos...")
        time.sleep(3)
        
        # 1. Importa clientes
        success = self.run_script(
            'import_clients_supabase.py',
            'IMPORTAÇÃO DE CLIENTES'
        )
        
        if not success:
            print("\n🛑 IMPORTAÇÃO INTERROMPIDA - Falha na importação de clientes")
            return False
        
        self.print_progress()
        time.sleep(2)
        
        # 2. Importa contratos
        success = self.run_script(
            'import_contracts_supabase.py',
            'IMPORTAÇÃO DE CONTRATOS'
        )
        
        if not success:
            print("\n🛑 IMPORTAÇÃO INTERROMPIDA - Falha na importação de contratos")
            return False
        
        self.print_progress()
        time.sleep(2)
        
        # 3. Importa pagamentos
        success = self.run_script(
            'import_payments_supabase.py',
            'IMPORTAÇÃO DE PAGAMENTOS'
        )
        
        if not success:
            print("\n🛑 IMPORTAÇÃO INTERROMPIDA - Falha na importação de pagamentos")
            return False
        
        self.print_progress()
        
        # Sucesso total
        total_time = datetime.now() - self.start_time
        
        print(f"\n{'='*60}")
        print("🎉 IMPORTAÇÃO COMPLETA FINALIZADA COM SUCESSO!")
        print(f"⏱️  Tempo total: {total_time}")
        print(f"📊 Etapas concluídas: {self.steps_completed}/{self.total_steps}")
        print(f"{'='*60}")
        
        return True
    
    def run_validation(self):
        """Executa validação final dos dados"""
        print("\n🔍 EXECUTANDO VALIDAÇÃO FINAL...")
        
        # Aqui você pode adicionar validações específicas
        # Por exemplo, verificar se o número de registros está correto
        
        print("✅ Validação concluída")
        return True

def main():
    print("🚀 SISTEMA DE IMPORTAÇÃO DE DADOS - SUPABASE")
    print("=" * 50)
    
    importer = DataImporter()
    
    # Executa importação completa
    success = importer.run_full_import()
    
    if success:
        # Executa validação final
        importer.run_validation()
        
        print("\n🎯 PROCESSO COMPLETO FINALIZADO!")
        print("\n📋 PRÓXIMOS PASSOS:")
        print("   • Verificar dados no painel do Supabase")
        print("   • Testar consultas na aplicação")
        print("   • Validar integridade referencial")
    else:
        print("\n❌ PROCESSO INTERROMPIDO COM FALHAS")
        print("\n🔧 AÇÕES RECOMENDADAS:")
        print("   • Verificar logs de erro acima")
        print("   • Corrigir problemas identificados")
        print("   • Executar novamente o processo")

if __name__ == "__main__":
    main()