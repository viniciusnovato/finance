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

### Backend
```bash
cd backend
npm install
npm start
```

### Flutter App
```bash
cd finance_app
flutter pub get
flutter run
```

### Scripts Python
```bash
cd importBD
pip install -r requirements.txt
python import_all_data.py
```

## Configuração

1. Configure as variáveis de ambiente no arquivo `.env`
2. Execute as migrações do banco de dados
3. Importe os dados iniciais usando os scripts Python

## Contribuição

Este é um projeto de sistema financeiro em desenvolvimento.