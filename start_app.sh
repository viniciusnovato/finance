#!/bin/bash

# Script para iniciar/reiniciar a aplicação Finance
# Backend (Node.js) na porta 3001
# Frontend (Flutter) na porta 9100

echo "🚀 Iniciando aplicação Finance..."

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    lsof -ti:$port > /dev/null 2>&1
    return $?
}

# Função para finalizar processo em uma porta
kill_port() {
    local port=$1
    local service_name=$2
    
    if check_port $port; then
        echo "⚠️  $service_name já está rodando na porta $port. Finalizando..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 2
        
        if check_port $port; then
            echo "❌ Erro: Não foi possível finalizar o processo na porta $port"
            return 1
        else
            echo "✅ Processo na porta $port finalizado com sucesso"
        fi
    fi
    return 0
}

# Verificar se estamos no diretório correto
if [ ! -d "backend" ] || [ ! -d "finance_app" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto finance"
    echo "   Certifique-se de que os diretórios 'backend' e 'finance_app' existem"
    exit 1
fi

# Finalizar processos existentes
echo "🔍 Verificando processos ativos..."
kill_port 3001 "Backend (Node.js)"
kill_port 9100 "Frontend (Flutter)"

# Verificar dependências do backend
echo "📦 Verificando dependências do backend..."
if [ ! -d "backend/node_modules" ]; then
    echo "⚠️  node_modules não encontrado. Instalando dependências..."
    cd backend
    npm install
    cd ..
fi

# Verificar arquivo .env do backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Arquivo .env não encontrado no backend"
    if [ -f "backend/.env.example" ]; then
        echo "📋 Copiando .env.example para .env..."
        cp backend/.env.example backend/.env
        echo "⚠️  IMPORTANTE: Configure as variáveis em backend/.env antes de usar em produção"
    else
        echo "❌ Erro: Arquivo .env.example não encontrado"
        exit 1
    fi
fi

# Verificar dependências do Flutter
echo "📦 Verificando dependências do Flutter..."
cd finance_app
if ! flutter doctor --version > /dev/null 2>&1; then
    echo "❌ Erro: Flutter não está instalado ou não está no PATH"
    exit 1
fi

flutter pub get > /dev/null 2>&1
cd ..

echo "🚀 Iniciando servidores..."

# Iniciar backend em background
echo "🔧 Iniciando backend na porta 3001..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Aguardar backend inicializar
echo "⏳ Aguardando backend inicializar..."
sleep 5

# Verificar se backend está rodando
if ! check_port 3001; then
    echo "❌ Erro: Backend não conseguiu inicializar na porta 3001"
    echo "📋 Verifique o log: tail -f backend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend iniciado com sucesso na porta 3001"

# Iniciar frontend em background
echo "🎨 Iniciando frontend na porta 9100..."
cd finance_app
flutter run -d chrome --web-port=9100 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Aguardar frontend inicializar
echo "⏳ Aguardando frontend inicializar..."
sleep 10

# Verificar se frontend está rodando
if ! check_port 9100; then
    echo "❌ Erro: Frontend não conseguiu inicializar na porta 9100"
    echo "📋 Verifique o log: tail -f frontend.log"
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend iniciado com sucesso na porta 9100"
echo ""
echo "🎉 Aplicação Finance iniciada com sucesso!"
echo "📊 Backend: http://localhost:3001"
echo "🌐 Frontend: http://localhost:9100"
echo "🔍 Health Check: http://localhost:3001/health"
echo ""
echo "📋 Para visualizar os logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "⚠️  Para parar a aplicação, execute: ./stop_app.sh"
echo "   Ou use Ctrl+C nos terminais dos servidores"
echo ""
echo "💡 PIDs dos processos:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"

# Salvar PIDs para script de parada
echo "$BACKEND_PID" > .backend_pid
echo "$FRONTEND_PID" > .frontend_pid

echo "✅ Script concluído. Os servidores estão rodando em background."