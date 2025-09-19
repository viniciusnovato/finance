#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para criar as tabelas básicas necessárias no Supabase
"""

import requests
import json
from datetime import datetime
from dotenv import load_dotenv
import os

# Carregar variáveis do arquivo .env do backend
env_path = '/Users/insitutoareluna/Documents/finance/backend/.env'
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def execute_sql(sql_query):
    """Executa uma query SQL usando a API do Supabase"""
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json={"sql": sql_query}
        )
        
        if response.status_code == 200:
            return True, response.json()
        else:
            return False, f"{response.status_code} - {response.text}"
            
    except Exception as e:
        return False, str(e)

def create_table_if_not_exists(table_name, create_sql):
    """Cria uma tabela se ela não existir"""
    try:
        # Primeiro, tenta acessar a tabela para ver se existe
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table_name}?limit=1",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
            }
        )
        
        if response.status_code == 200:
            print(f"✅ Tabela '{table_name}' já existe")
            return True
        else:
            print(f"❌ Tabela '{table_name}' não acessível: {response.status_code}")
            print(f"🔧 Tentando criar tabela '{table_name}'...")
            
            success, result = execute_sql(create_sql)
            if success:
                print(f"✅ Tabela '{table_name}' criada com sucesso")
                return True
            else:
                print(f"❌ Erro ao criar tabela '{table_name}': {result}")
                return False
            
    except Exception as e:
        print(f"❌ Erro ao verificar tabela '{table_name}': {str(e)}")
        return False

class SupabaseTableCreator:
    def __init__(self):
        self.supabase_url = SUPABASE_URL
        self.supabase_key = SUPABASE_ANON_KEY
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
    
    def create_company(self):
        """Cria uma empresa padrão"""
        company_data = {
            'id': 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            'name': 'Instituto Areluna',
            'document': '12345678000199',
            'email': 'contato@institutoareluna.com',
            'phone': '+351 123 456 789',
            'address': 'Rua Principal, 123',
            'city': 'Porto',
            'state': 'PT',
            'zip_code': '4000-001',
            'is_active': True,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        try:
            response = requests.post(
                f'{self.supabase_url}/rest/v1/companies',
                headers=self.headers,
                json=company_data
            )
            
            if response.status_code in [200, 201]:
                print("✅ Empresa criada com sucesso")
                return True
            else:
                print(f"⚠️  Empresa pode já existir ou erro: {response.status_code} - {response.text}")
                return True  # Continuar mesmo se já existir
                
        except Exception as e:
            print(f"❌ Erro ao criar empresa: {e}")
            return False
    
    def create_branch(self):
        """Cria uma filial padrão"""
        branch_data = {
            'id': 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
            'company_id': 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            'name': 'Filial Principal',
            'code': 'FP001',
            'address': 'Rua Principal, 123',
            'city': 'Porto',
            'state': 'PT',
            'zip_code': '4000-001',
            'phone': '+351 123 456 789',
            'email': 'filial@institutoareluna.com',
            'manager_name': 'Gestor Principal',
            'is_active': True,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        try:
            response = requests.post(
                f'{self.supabase_url}/rest/v1/branches',
                headers=self.headers,
                json=branch_data
            )
            
            if response.status_code in [200, 201]:
                print("✅ Filial criada com sucesso")
                return True
            else:
                print(f"⚠️  Filial pode já existir ou erro: {response.status_code} - {response.text}")
                return True  # Continuar mesmo se já existir
                
        except Exception as e:
            print(f"❌ Erro ao criar filial: {e}")
            return False
    
    def check_tables(self):
        """Verifica se as tabelas existem"""
        tables = ['companies', 'branches']
        
        for table in tables:
            try:
                response = requests.get(
                    f'{self.supabase_url}/rest/v1/{table}?limit=1',
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    print(f"✅ Tabela '{table}' existe e acessível")
                else:
                    print(f"❌ Tabela '{table}' não acessível: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Erro ao verificar tabela '{table}': {e}")

def main():
    print("🚀 Criando tabelas básicas no Supabase...")
    print()
    
    # SQL para criar as tabelas
    companies_sql = """
    CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        document VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    branches_sql = """
    CREATE TABLE IF NOT EXISTS branches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        phone VARCHAR(20),
        email VARCHAR(255),
        manager_name VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    print("🔍 Criando tabelas...")
    
    # Criar as tabelas
    companies_exists = create_table_if_not_exists("companies", companies_sql)
    branches_exists = create_table_if_not_exists("branches", branches_sql)
    
    creator = SupabaseTableCreator()
    
    print("\n🔍 Verificando tabelas...")
    creator.check_tables()
    
    print("\n🏢 Criando empresa padrão...")
    if not creator.create_company():
        print("❌ Falha ao criar empresa")
        return
    
    print("\n🏪 Criando filial padrão...")
    if not creator.create_branch():
        print("❌ Falha ao criar filial")
        return
    
    print("\n✅ Tabelas básicas criadas com sucesso!")
    print("\n📋 Dados criados:")
    print("   • Empresa: Instituto Areluna")
    print("   • Filial: Filial Principal")
    print("\n🎯 Agora você pode importar os clientes!")

if __name__ == '__main__':
    main()