# Análise Comparativa: Modelos Dart vs Schema do Banco

## 1. TABELA CLIENTS

### Schema do Banco:
```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    tax_id VARCHAR(50) UNIQUE,
    birth_date DATE,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Portugal',
    attention_level attention_level_enum DEFAULT 'normal',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Modelo Dart Atual:
- ✅ Todos os campos estão presentes
- ✅ Tipos corretos (String, DateTime, bool)
- ✅ Enum AttentionLevel implementado corretamente
- ✅ Métodos fromJson/toJson funcionais

**Status: CONFORME** ✅

---

## 2. TABELA CONTRACTS

### Schema do Banco:
```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    treatment_description TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    down_payment DECIMAL(10,2) DEFAULT 0 CHECK (down_payment >= 0),
    installments INTEGER NOT NULL CHECK (installments > 0),
    installment_amount DECIMAL(10,2) NOT NULL CHECK (installment_amount > 0),
    status contract_status_enum DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    legal_validation_date TIMESTAMP WITH TIME ZONE,
    legal_validated_by VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Modelo Dart Atual:
- ✅ Todos os campos básicos presentes
- ✅ Enum ContractStatus implementado corretamente
- ⚠️ **PROBLEMA**: Campos extras não presentes no banco:
  - `paidInstallments`
  - `totalPaid`
  - `percentagePaid`
  - `amountPaid`
  - `amountRemaining`
  - `paymentsMade`
  - `paymentsRemaining`
  - `installmentAmountCalculated`
  - `isFullyPaid`
  - `clientName`

**Status: PRECISA AJUSTE** ⚠️

---

## 3. TABELA PAYMENTS

### Schema do Banco:
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_method payment_method_enum,
    status payment_status_enum DEFAULT 'pending',
    reference_number VARCHAR(100),
    receipt_path VARCHAR(500),
    notes TEXT,
    validated_by VARCHAR(255),
    validated_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Modelo Dart Atual:
- ✅ Todos os campos básicos presentes
- ✅ Enums PaymentStatus e PaymentMethod implementados corretamente
- ⚠️ **PROBLEMA**: Campos extras não presentes no banco:
  - `contractNumber`
  - `clientName`

**Status: PRECISA AJUSTE** ⚠️

---

## 4. ENUMS DO BANCO

### attention_level_enum:
```sql
CREATE TYPE attention_level_enum AS ENUM ('normal', 'risk', 'light_delay', 'severe_delay');
```
✅ **Dart**: Implementado corretamente

### contract_status_enum:
```sql
CREATE TYPE contract_status_enum AS ENUM ('draft', 'validated', 'active', 'defaulting', 'paid_off', 'closed');
```
✅ **Dart**: Implementado corretamente

### payment_status_enum:
```sql
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'overdue', 'failed', 'cancelled');
```
✅ **Dart**: Implementado corretamente

### payment_method_enum:
```sql
CREATE TYPE payment_method_enum AS ENUM ('mbway', 'cash', 'transfer', 'sepa', 'credit_card', 'direct_debit', 'payment_order');
```
✅ **Dart**: Implementado corretamente

---

## 5. RELACIONAMENTOS E CONSTRAINTS

### Identificados no Schema:
1. **clients.id** → **contracts.client_id** (CASCADE DELETE)
2. **contracts.id** → **payments.contract_id** (CASCADE DELETE)
3. **Constraints de valor**: amounts > 0, installments > 0
4. **Unique constraints**: email, tax_id, contract_number
5. **Índices**: Para performance em queries

---

## 6. AÇÕES NECESSÁRIAS

### 6.1 Modelo Contract (ALTA PRIORIDADE)
- ❌ **REMOVER** campos calculados que não existem no banco:
  - `paidInstallments`, `totalPaid`, `percentagePaid`
  - `amountPaid`, `amountRemaining`, `paymentsMade`
  - `paymentsRemaining`, `installmentAmountCalculated`, `isFullyPaid`
- ❌ **REMOVER** campo `clientName` (deve ser obtido via JOIN)
- ✅ **MANTER** apenas campos que existem no schema do banco

### 6.2 Modelo Payment (MÉDIA PRIORIDADE)
- ❌ **REMOVER** campos `contractNumber` e `clientName`
- ✅ **MANTER** apenas campos que existem no schema do banco

### 6.3 Serviços e Repositórios (ALTA PRIORIDADE)
- 🔄 **ATUALIZAR** queries para usar JOINs quando precisar de dados relacionados
- 🔄 **IMPLEMENTAR** cálculos de pagamento em tempo real via queries
- 🔄 **AJUSTAR** métodos CRUD para novos modelos

### 6.4 UI e Formulários (MÉDIA PRIORIDADE)
- 🔄 **ADAPTAR** telas que usam campos removidos
- 🔄 **IMPLEMENTAR** cálculos dinâmicos na UI
- 🔄 **VALIDAR** constraints do banco na interface

---

## 7. PRIORIDADE DE EXECUÇÃO

1. **CRÍTICO**: Atualizar modelos Dart (Contract e Payment)
2. **ALTO**: Ajustar serviços e repositórios
3. **MÉDIO**: Adaptar UI e formulários
4. **BAIXO**: Testes de integração e validação final

---

**Data da Análise**: $(date)
**Status Geral**: REQUER ATUALIZAÇÕES SIGNIFICATIVAS
**Conformidade Atual**: ~70% (Client OK, Contract e Payment precisam ajustes)