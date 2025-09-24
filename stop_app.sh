#!/bin/bash

# Script para parar a aplicação Finance
# Finaliza os processos do backend e frontend de forma limpa

echo "🛑 Parando aplicação Finance..."

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    lsof -ti:$port > /dev/null 2>&1
    return $?
}

# Função para finalizar processo por PID
kill_by_pid() {
    local pid=$1
    local service_name=$2
    
    if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
        echo "🔄 Finalizando $service_name (PID: $pid)..."
        kill -TERM $pid 2>/dev/null
        sleep 3
        
        if kill -0 $pid 2>/dev/null; then
            echo "⚠️  Forçando finalização de $service_name..."
            kill -KILL $pid 2>/dev/null
        fi
        
        if ! kill -0 $pid 2>/dev/null; then
            echo "✅ $service_name finalizado com sucesso"
        else
            echo "❌ Erro ao finalizar $service_name"
        fi
    else
        echo "⚠️  $service_name não está rodando ou PID inválido"
    fi
}

# Função para finalizar processo por porta
kill_by_port() {
    local port=$1
    local service_name=$2
    
    if check_port $port; then
        echo "🔄 Finalizando $service_name na porta $port..."
        lsof -ti:$port | xargs kill -TERM 2>/dev/null
        sleep 3
        
        if check_port $port; then
            echo "⚠️  Forçando finalização na porta $port..."
            lsof -ti:$port | xargs kill -KILL 2>/dev/null
        fi
        
        if ! check_port $port; then
            echo "✅ Processo na porta $port finalizado com sucesso"
        else
            echo "❌ Erro ao finalizar processo na porta $port"
        fi
    else
        echo "ℹ️  Nenhum processo rodando na porta $port"
    fi
}

# Tentar finalizar usando PIDs salvos
if [ -f ".backend_pid" ]; then
    BACKEND_PID=$(cat .backend_pid)
    kill_by_pid $BACKEND_PID "Backend"
    rm -f .backend_pid
else
    echo "⚠️  Arquivo .backend_pid não encontrado, tentando por porta..."
    kill_by_port 3001 "Backend"
fi

if [ -f ".frontend_pid" ]; then
    FRONTEND_PID=$(cat .frontend_pid)
    kill_by_pid $FRONTEND_PID "Frontend"
    rm -f .frontend_pid
else
    echo "⚠️  Arquivo .frontend_pid não encontrado, tentando por porta..."
    kill_by_port 9100 "Frontend"
fi

# Verificação final
echo "🔍 Verificação final..."
if check_port 3001; then
    echo "⚠️  Backend ainda está rodando na porta 3001"
else
    echo "✅ Backend parado"
fi

if check_port 9100; then
    echo "⚠️  Frontend ainda está rodando na porta 9100"
else
    echo "✅ Frontend parado"
fi

# Limpar arquivos de log se desejado
read -p "🗑️  Deseja remover os arquivos de log? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f backend.log frontend.log
    echo "✅ Arquivos de log removidos"
fi

echo "✅ Aplicação Finance parada com sucesso!"