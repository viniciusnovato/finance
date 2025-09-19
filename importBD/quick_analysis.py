#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Análise rápida dos problemas de mapeamento
"""

import csv
from datetime import datetime

def parse_date(date_str):
    """Converte string de data para formato ISO"""
    if not date_str or date_str.strip() == '':
        return None
    
    try:
        date_obj = datetime.strptime(date_str.strip(), '%Y-%m-%d')
        return date_obj.strftime('%Y-%m-%d')
    except ValueError:
        return None

def quick_analysis():
    """Análise rápida dos dados do CSV"""
    print("🔍 Análise rápida dos problemas de mapeamento\n")
    
    stats = {
        'total_lines': 0,
        'liquidated': 0,
        'active': 0,
        'empty_names': 0,
        'valid_dates': 0,
        'invalid_dates': 0,
        'no_start_date': 0,
        'no_end_date': 0,
        'problematic_names': [],
        'date_issues': []
    }
    
    with open('contratosAtivosFinal.csv', 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        header = next(reader)  # Pular cabeçalho
        
        for line_num, row in enumerate(reader, start=2):
            if len(row) < 11:
                continue
                
            stats['total_lines'] += 1
            
            client_name = row[0].strip() if row[0] else ''
            contract_status = row[2].strip() if row[2] else ''
            start_date_str = row[9].strip() if len(row) > 9 and row[9] else ''
            end_date_str = row[10].strip() if len(row) > 10 and row[10] else ''
            
            # Verificar status do contrato
            if contract_status.lower() == 'liquidado':
                stats['liquidated'] += 1
                continue
            elif contract_status.lower() == 'ativo':
                stats['active'] += 1
            
            # Verificar nome
            if not client_name:
                stats['empty_names'] += 1
                continue
            
            # Verificar nomes problemáticos
            if '(' in client_name or 'sem contrato' in client_name.lower():
                stats['problematic_names'].append({
                    'line': line_num,
                    'name': client_name
                })
            
            # Verificar datas
            if not start_date_str:
                stats['no_start_date'] += 1
            if not end_date_str:
                stats['no_end_date'] += 1
                
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            
            if start_date and end_date:
                stats['valid_dates'] += 1
            else:
                stats['invalid_dates'] += 1
                if line_num <= 50:  # Mostrar apenas os primeiros casos
                    stats['date_issues'].append({
                        'line': line_num,
                        'name': client_name,
                        'start': start_date_str,
                        'end': end_date_str
                    })
    
    # Exibir resultados
    print("📊 ESTATÍSTICAS GERAIS:")
    print(f"   Total de linhas: {stats['total_lines']}")
    print(f"   Contratos ativos: {stats['active']}")
    print(f"   Contratos liquidados: {stats['liquidated']}")
    print(f"   Nomes vazios: {stats['empty_names']}")
    
    print(f"\n📅 ANÁLISE DE DATAS:")
    print(f"   Datas válidas: {stats['valid_dates']}")
    print(f"   Datas inválidas: {stats['invalid_dates']}")
    print(f"   Sem data de início: {stats['no_start_date']}")
    print(f"   Sem data de fim: {stats['no_end_date']}")
    
    print(f"\n👤 NOMES PROBLEMÁTICOS ({len(stats['problematic_names'])} casos):")
    for i, problem in enumerate(stats['problematic_names'][:10]):
        print(f"   {i+1}. Linha {problem['line']}: {problem['name']}")
    if len(stats['problematic_names']) > 10:
        print(f"   ... e mais {len(stats['problematic_names']) - 10} casos")
    
    print(f"\n📅 EXEMPLOS DE PROBLEMAS DE DATA:")
    for issue in stats['date_issues'][:10]:
        print(f"   Linha {issue['line']}: {issue['name']}")
        print(f"      Início: '{issue['start']}' | Fim: '{issue['end']}'")
    
    # Calcular expectativa
    processable = stats['active'] - stats['empty_names']
    expected_with_dates = min(processable, stats['valid_dates'])
    
    print(f"\n📈 EXPECTATIVA DE MAPEAMENTO:")
    print(f"   Contratos ativos processáveis: {processable}")
    print(f"   Com datas válidas: {expected_with_dates}")
    print(f"   Mapeados atualmente: 243")
    print(f"   Taxa de sucesso: {(243/expected_with_dates)*100:.1f}% (se {expected_with_dates} era o esperado)")
    
    # Principais causas de não mapeamento
    not_mapped = expected_with_dates - 243
    print(f"\n❌ POSSÍVEIS CAUSAS DOS {not_mapped} NÃO MAPEADOS:")
    print(f"   1. Nomes com caracteres especiais ou formatação diferente")
    print(f"   2. Clientes não existem na tabela 'clients'")
    print(f"   3. Clientes existem mas não têm contratos na tabela 'contracts'")
    print(f"   4. Problemas de encoding ou caracteres especiais")
    print(f"   5. Nomes com texto adicional (parênteses, vírgulas, etc.)")

if __name__ == "__main__":
    quick_analysis()