# 📌 Contexto do Projeto – Gestão de Pagamentos e Contratos Clínicos

## 🎯 Objetivo
Criar um **modelo de banco de dados relacional em Supabase (PostgreSQL)** para gerir contratos e pagamentos de tratamentos clínicos (dentários, estéticos, entre outros).  
O banco substituirá o controle atual em **planilhas Excel** e deve estar preparado para integração com um **app em Flutter** e automações externas (Zoho CRM, My Blue Bee, etc.).

---

## 📝 Fontes de Informação
1. **Notas da reunião de requisitos**.  
2. **Planilha atual**: `MACRO_PAGAMENTOS INSTITUTO ARELUNA - Editável.xlsm`.  

---

## 🔑 Regras de Negócio
### Contratos
- Cada contrato está vinculado a um **cliente** e a uma **empresa/filial**.  
- Entrada obrigatória de **30%** do valor total.  
- Parcelamento de até **24 meses**.  
- Entrada pode ser dividida em **múltiplos pagamentos**.  
- Contratos passam por **fases de vida**: rascunho, validado (jurídico), ativo, inadimplente, quitado.  
- Anexos/documentos vinculados ao contrato (via Zoho ou upload).  

### Pagamentos
- Métodos aceitos: **MBWay, numerário, transferência, SEPA, cartão de crédito, débito direto, ordem de pagamento**.  
- Registrar cenários em que o **débito direto falhou**.  
- Cada parcela pode ser **alterada individualmente**, sem modificar todo o contrato.  
- Pagamentos lançados pela receção só ficam válidos após **validação de um perfil autorizado**.  

### Usuários
- **Administrador** → controla tudo (configurações, relatórios, gestão de usuários).  
- **Analista/Financeiro** → valida pagamentos, emite relatórios, acompanha inadimplência.  
- **Receção** → sobe comprovativos (aguardam validação).  
- **Cliente (usuário final)** → acompanha contrato, parcelas e envia comprovativos.  

### Gestão e Monitoramento
- Identificar **quem está devendo**.  
- Atribuir **níveis/perfis de atenção** (risco, atraso leve, atraso grave).  
- Permitir **notas pré-definidas** em contratos e pagamentos.  
- Suporte a **empresas e filiais**.  

---

## 🛠️ Requisitos Técnicos do Banco
- Banco: **Supabase (Postgres)**.  

### Tabelas Principais
- **Clientes** → dados pessoais, contacto, estado, perfil de atenção.  
- **Empresas** → razão social, NIF, dados fiscais.  
- **Filiais** → ligadas a uma empresa.  
- **Contratos** → cliente, empresa/filial, valor total, entrada, prazo, status, fase jurídica, datas.  
- **Pagamentos** → contrato, parcela, valor, método, data prevista, data paga, status, comprovativo, nota.  
- **Usuários** → papéis: admin, analista, receção, cliente.  
- **Notas** → pré-definidas e personalizadas.  
- **Logs** → histórico de alterações (auditoria).  

### Relacionamentos
- 1 cliente → N contratos.  
- 1 contrato → N pagamentos.  
- 1 empresa → N filiais.  
- 1 filial → N contratos.  
- 1 contrato → N documentos anexados.  

### Constraints e Validações
- Entrada **≥ 30%** do valor do contrato.  
- Status enumerados para contratos: `Draft`, `Validado`, `Ativo`, `Encerrado`, `Inadimplente`, `Quitado`.  
- Status enumerados para pagamentos: `Pendente`, `Pago`, `Atrasado`, `Falhou`, `Cancelado`.  

---

## 🔗 Integrações Futuras
- **Zoho CRM** → anexar contratos validados pelo jurídico.  
- **My Blue Bee** → gestão de contratos.  
- **Flutter App** → API REST/GraphQL para clientes acompanharem.  
- **n8n/Zapier** → automação de fluxos.  

---

## 📊 Consultas Prioritárias
- Listar **clientes inadimplentes**.  
- Consultar **contratos ativos**.  
- Relatório de **parcelas vencidas por filial**.  
- Alteração da **forma de pagamento em uma parcela específica**.  

---

## ✅ Tarefas do TRAE
1. **Analisar a planilha Excel** para mapear colunas atuais.  
2. **Mapear colunas → tabelas relacionais** em Supabase.  
3. Gerar **DDL SQL completo** (tabelas, relacionamentos, enums, constraints).  
4. Propor **índices e otimizações de performance**.  
5. Criar **queries SQL de exemplo** para os casos de uso listados.  

---

## 🧾 Instrução Final
> “Usando as notas de requisitos e a planilha Excel como referência, gere o **esquema de banco relacional em PostgreSQL** para Supabase, com tabelas, chaves estrangeiras, enums, constraints, índices e queries de exemplo. Estruture o modelo para **escalabilidade, multiempresa, multifilial** e integração futura com API em Flutter.”

