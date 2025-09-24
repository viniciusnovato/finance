# Finance Project

Sistema de gestão financeira completo com backend Node.js, aplicativo Flutter e ferramentas de importação de dados.

## Estrutura do Projeto

### 📁 Backend
- **Tecnologia**: Node.js com Express
- **Banco de dados**: Supabase (PostgreSQL)
- **Funcionalidades**: API REST para gestão de clientes, contratos e pagamentos

### 📱 Finance App
- **Tecnologia**: Flutter
- **Plataformas**: iOS, Android, Web, Desktop (Windows, macOS, Linux)
- **Funcionalidades**: Interface móvel para o sistema financeiro

### 🔧 ImportBD
- **Tecnologia**: Python
- **Funcionalidades**: Scripts para importação e manipulação de dados
- **Recursos**: Backup automático, validação de dados, mapeamento de contratos

## Como Executar

### 🚀 Execução Rápida (Recomendado)

Use os scripts automatizados para gerenciar a aplicação:

```bash
# Iniciar/reiniciar toda a aplicação
./start_app.sh

# Verificar status da aplicação
./status_app.sh

# Parar a aplicação
./stop_app.sh
```

### 📋 Execução Manual

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Flutter App
```bash
cd finance_app
flutter pub get
flutter run -d chrome --web-port=9100
```

#### Scripts Python
```bash
cd importBD
pip install -r requirements.txt
python import_all_data.py
```

## Scripts de Gerenciamento

### 🚀 start_app.sh
- Inicia ou reinicia toda a aplicação automaticamente
- Verifica e finaliza processos existentes nas portas 3001 e 9100
- Instala dependências se necessário
- Cria arquivo `.env` a partir do `.env.example` se não existir
- Inicia backend e frontend em paralelo
- Salva PIDs dos processos para controle
- Gera logs em `backend.log` e `frontend.log`

### 📊 status_app.sh
- Verifica o status atual da aplicação
- Mostra informações dos processos (PID, tempo de início)
- Testa conectividade dos serviços
- Exibe informações sobre logs e arquivos de controle
- Fornece resumo do status geral

### 🛑 stop_app.sh
- Para a aplicação de forma limpa
- Finaliza processos usando PIDs salvos ou por porta
- Opção para remover arquivos de log
- Verificação final do status

## Configuração

1. Configure as variáveis de ambiente no arquivo `.env` (será criado automaticamente pelo `start_app.sh`)
2. Execute as migrações do banco de dados
3. Importe os dados iniciais usando os scripts Python

### URLs da Aplicação
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:9100
- **Health Check**: http://localhost:3001/health

## Contribuição

Este é um projeto de sistema financeiro em desenvolvimento.