#!/bin/bash

# Script para verificar o status da aplicação Finance
# Mostra informações sobre backend e frontend

echo "📊 Status da Aplicação Finance"
echo "=============================="

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    lsof -ti:$port > /dev/null 2>&1
    return $?
}

# Função para obter informações do processo
get_process_info() {
    local port=$1
    if check_port $port; then
        local pid=$(lsof -ti:$port)
        local cmd=$(ps -p $pid -o comm= 2>/dev/null)
        local start_time=$(ps -p $pid -o lstart= 2>/dev/null)
        echo "   PID: $pid"
        echo "   Comando: $cmd"
        echo "   Iniciado: $start_time"
    fi
}

# Verificar Backend
echo "🔧 Backend (Node.js)"
if check_port 3001; then
    echo "   Status: ✅ Rodando na porta 3001"
    get_process_info 3001
    echo "   URL: http://localhost:3001"
    echo "   Health: http://localhost:3001/health"
    
    # Testar conectividade
    if command -v curl > /dev/null 2>&1; then
        echo "   Testando conectividade..."
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo "   Conectividade: ✅ OK"
        else
            echo "   Conectividade: ❌ Falha"
        fi
    fi
else
    echo "   Status: ❌ Não está rodando"
fi

echo ""

# Verificar Frontend
echo "🎨 Frontend (Flutter)"
if check_port 9100; then
    echo "   Status: ✅ Rodando na porta 9100"
    get_process_info 9100
    echo "   URL: http://localhost:9100"
    
    # Testar conectividade
    if command -v curl > /dev/null 2>&1; then
        echo "   Testando conectividade..."
        if curl -s http://localhost:9100 > /dev/null 2>&1; then
            echo "   Conectividade: ✅ OK"
        else
            echo "   Conectividade: ❌ Falha"
        fi
    fi
else
    echo "   Status: ❌ Não está rodando"
fi

echo ""

# Verificar arquivos de PID
echo "📋 Arquivos de Controle"
if [ -f ".backend_pid" ]; then
    BACKEND_PID=$(cat .backend_pid)
    echo "   Backend PID salvo: $BACKEND_PID"
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "   Status do PID: ✅ Ativo"
    else
        echo "   Status do PID: ❌ Inativo (arquivo desatualizado)"
    fi
else
    echo "   Backend PID: ❌ Arquivo não encontrado"
fi

if [ -f ".frontend_pid" ]; then
    FRONTEND_PID=$(cat .frontend_pid)
    echo "   Frontend PID salvo: $FRONTEND_PID"
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "   Status do PID: ✅ Ativo"
    else
        echo "   Status do PID: ❌ Inativo (arquivo desatualizado)"
    fi
else
    echo "   Frontend PID: ❌ Arquivo não encontrado"
fi

echo ""

# Verificar logs
echo "📄 Arquivos de Log"
if [ -f "backend.log" ]; then
    BACKEND_LOG_SIZE=$(wc -c < backend.log)
    BACKEND_LOG_LINES=$(wc -l < backend.log)
    echo "   backend.log: ✅ Existe ($BACKEND_LOG_SIZE bytes, $BACKEND_LOG_LINES linhas)"
else
    echo "   backend.log: ❌ Não encontrado"
fi

if [ -f "frontend.log" ]; then
    FRONTEND_LOG_SIZE=$(wc -c < frontend.log)
    FRONTEND_LOG_LINES=$(wc -l < frontend.log)
    echo "   frontend.log: ✅ Existe ($FRONTEND_LOG_SIZE bytes, $FRONTEND_LOG_LINES linhas)"
else
    echo "   frontend.log: ❌ Não encontrado"
fi

echo ""

# Resumo
echo "📝 Resumo"
BACKEND_RUNNING=$(check_port 3001 && echo "✅" || echo "❌")
FRONTEND_RUNNING=$(check_port 9100 && echo "✅" || echo "❌")

echo "   Backend: $BACKEND_RUNNING"
echo "   Frontend: $FRONTEND_RUNNING"

if check_port 3001 && check_port 9100; then
    echo "   Status Geral: ✅ Aplicação totalmente funcional"
elif check_port 3001 || check_port 9100; then
    echo "   Status Geral: ⚠️  Aplicação parcialmente funcional"
else
    echo "   Status Geral: ❌ Aplicação parada"
fi

echo ""
echo "💡 Comandos disponíveis:"
echo "   ./start_app.sh  - Iniciar/reiniciar aplicação"
echo "   ./stop_app.sh   - Parar aplicação"
echo "   ./status_app.sh - Verificar status (este script)"