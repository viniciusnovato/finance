#!/bin/bash
# Script para configurar backup automático do Supabase

echo "🔧 Configurando backup automático do Supabase..."

# Diretório do projeto
PROJECT_DIR="/Users/insitutoareluna/Documents/finance/importBD"
BACKUP_SCRIPT="$PROJECT_DIR/backup_supabase.py"
SCHEDULER_SCRIPT="$PROJECT_DIR/backup_scheduler.py"

# Verificar se os scripts existem
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Script de backup não encontrado: $BACKUP_SCRIPT"
    exit 1
fi

if [ ! -f "$SCHEDULER_SCRIPT" ]; then
    echo "❌ Script scheduler não encontrado: $SCHEDULER_SCRIPT"
    exit 1
fi

echo "✅ Scripts de backup encontrados"

# Tornar scripts executáveis
chmod +x "$BACKUP_SCRIPT"
chmod +x "$SCHEDULER_SCRIPT"

echo "✅ Permissões de execução configuradas"

# Criar script wrapper para cron
WRAPPER_SCRIPT="$PROJECT_DIR/run_backup.sh"

cat > "$WRAPPER_SCRIPT" << EOF
#!/bin/bash
# Wrapper script para executar backup via cron

# Definir PATH para encontrar python3
export PATH="/usr/local/bin:/usr/bin:/bin:\$PATH"

# Mudar para o diretório do projeto
cd "$PROJECT_DIR"

# Executar backup com log
echo "\$(date): Iniciando backup automático" >> backup_cron.log
python3 backup_scheduler.py >> backup_cron.log 2>&1
echo "\$(date): Backup concluído" >> backup_cron.log
echo "----------------------------------------" >> backup_cron.log
EOF

chmod +x "$WRAPPER_SCRIPT"

echo "✅ Script wrapper criado: $WRAPPER_SCRIPT"

# Criar entrada do cron (backup diário às 2:00 AM)
CRON_ENTRY="0 2 * * * $WRAPPER_SCRIPT"

echo "📅 Configurando cron job para backup diário às 2:00 AM..."

# Verificar se já existe uma entrada similar
if crontab -l 2>/dev/null | grep -q "$WRAPPER_SCRIPT"; then
    echo "⚠️  Entrada do cron já existe para este script"
else
    # Adicionar nova entrada ao cron
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    echo "✅ Cron job adicionado com sucesso"
fi

# Mostrar cron jobs atuais
echo "\n📋 Cron jobs atuais:"
crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$"

# Criar script de teste manual
TEST_SCRIPT="$PROJECT_DIR/test_backup.sh"

cat > "$TEST_SCRIPT" << EOF
#!/bin/bash
echo "🧪 Executando teste de backup..."
cd "$PROJECT_DIR"
python3 backup_supabase.py
echo "✅ Teste concluído"
EOF

chmod +x "$TEST_SCRIPT"

echo "\n🎉 Configuração concluída!"
echo "\n📋 Resumo:"
echo "   • Backup automático: Diário às 2:00 AM"
echo "   • Logs salvos em: $PROJECT_DIR/backup_cron.log"
echo "   • Teste manual: $TEST_SCRIPT"
echo "   • Backups salvos em: $PROJECT_DIR/backup_supabase_*"
echo "\n🔧 Comandos úteis:"
echo "   • Ver cron jobs: crontab -l"
echo "   • Editar cron: crontab -e"
echo "   • Ver logs: tail -f $PROJECT_DIR/backup_cron.log"
echo "   • Teste manual: $TEST_SCRIPT"

echo "\n⚠️  IMPORTANTE:"
echo "   • Verifique se o Python3 está no PATH do sistema"
echo "   • Mantenha as credenciais do Supabase seguras"
echo "   • Monitore os logs regularmente"
echo "   • Backups antigos são removidos automaticamente após 30 dias"