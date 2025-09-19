Quero que você **crie um script** (Python 3.12 + pandas) que leia o arquivo **`ContratosAtivosFinal.csv`** e gere **`payments.csv`** no **formato exato da tabela `payments` do banco**. Faça com calma, revise cada etapa e valide tudo antes de concluir.

## Objetivo
Transformar cada **célula preenchida** de parcelas (da coluna **S** em diante = **coluna 20, inclusive**) em **uma linha** na saída `payments.csv`.  
- **Célula vazia** → ignorar.  
- **Valor negativo** → parcela **paga**.  
- **Valor positivo** → parcela **pendente**.

## Regras de origem (colunas importantes)
- **Col. 14 = "Comp I"** → **entrada 1** (downPayment).
- **Col. 15 = "Comp II"** → **entrada 2** (downPayment).
- **Col. 20 em diante (S…)** → **parcelas mensais** (normalPayment).  
  O **cabeçalho de cada coluna** (ex.: `mar./23`, `abr./24`, `Nov/31`, `maio/27`) indica o **vencimento (due_date)** daquela parcela.

## Normalização de valores monetários (obrigatório)
Antes de usar qualquer valor:
- Remover **"€"** e **espaços**.
- Trocar **vírgula** por **ponto**.
- Converter para decimal.
- Sempre salvar **valor absoluto** em `amount`.

Ex.: `" €  5.100,00 "` → `5100.00`; `"-269,17"` → `269.17`.

## Status, tipos e observações
- **Down payments (col. 14 e 15)**:
  - `payment_type = "downPayment"`.
  - **Exceção**: mesmo se o valor vier **positivo**, marque `status = "paid"`.
  - `due_date`: usar a **data da coluna "Início"** do contrato; se ausente, deixe vazio e registre no log.
  - `paid_date`: usar `due_date` (fallback).
  - `notes`: **vazio** (não numerar).

- **Parcelas mensais (col. 20+)**:
  - `payment_type = "normalPayment"`.
  - `status`: **negativo → "paid"** | **positivo → "pending"**.
  - `notes`: **apenas o número sequencial da parcela** (1, 2, 3, …) contando a partir da coluna 20.
  - `due_date`: **do cabeçalho da coluna** convertido para ISO `YYYY-MM-DD`.
  - `paid_date`: se `status = "paid"`, usar `due_date` como fallback; se `pending`, deixar vazio.

## Parser de datas (cabeçalhos → due_date)
Implementar parser **robusto** que aceite:
- Abreviações PT/BR: `jan, fev, mar, abr, mai, jun, jul, ago, set, out, nov, dez` (com e sem ponto, caixa mista).
- Formatos: `mar./23`, `jan./24`, `maio/27`, `Nov/31`, `Nov/2031`, `03/2025`, `03/25`.
- Se vier **mês/ano** sem dia, usar **dia = 01**.
- Em caso de falha, **não gere** a linha e registre no **log de inconsistências** com: identificador do contrato, nome do cabeçalho, valor bruto, motivo do erro.

## Integridade referencial (fundamental)
- **`contract_id` deve apontar para o contrato correto**.
- Carregar **`contracts.csv`** (ou a fonte de contratos vigente) e montar um **mapa de referência** → `contract_key` → `contract_id`.
  - Use como `contract_key` um identificador estável existente no CSV (ex.: a coluna **N** do contrato ou combinação **Nome + Início**), escolhendo a **chave que já foi usada** no processo anterior.
- **Não criar novos `contract_id`**. Se não for possível mapear, **pular a linha** e registrar no log.
- A saída **não deve conter registros órfãos**.

## Schema de saída (payments.csv)
Gerar exatamente estas colunas, nesta ordem (mesmo que algumas fiquem vazias):
1. `id` (uuid) — gere novos UUIDs v4 para cada linha de pagamento.
2. `contract_id` (uuid) — do mapeamento com `contracts`.
3. `amount` (numeric) — valor absoluto, já normalizado.
4. `due_date` (date, `YYYY-MM-DD`)
5. `paid_date` (date, `YYYY-MM-DD` ou vazio)
6. `status` (text: `"paid"` | `"pending"`)
7. `payment_method` (text) — se houver na linha de origem, propagar; caso contrário, pode deixar vazio.
8. `notes` (text) — **número da parcela** para col. 20+; vazio para downPayment.
9. `external_id` (text) — se existir na origem; senão, vazio.
10. `created_at` (timestamptz) — opcional: preencher com timestamp atual (`UTC`) ou deixar vazio se não for um requisito.
11. `updated_at` (timestamptz) — idem.
12. `payment_type` (enum): `"downPayment"` para col. 14/15; `"normalPayment"` para col. 20+.

## Lógica de processamento (linha por linha, célula por célula)
1. Para cada **linha** do `ContratosAtivosFinal.csv`:
   - Identificar o **contract_key** e obter o **`contract_id`** via mapa; se falhar, registrar no log e **pular** a linha inteira.
   - Gerar **0, 1 ou N** linhas em `payments.csv`, conforme **células preenchidas** a partir da **coluna 20** (inclusive) + col. 14/15 (downPayment).
2. Para cada **célula**:
   - Se **vazia** → **ignorar**.
   - Se **preenchida**:
     - Normalizar valor → `amount`.
     - Definir `status` conforme regras (com exceção das entradas).
     - Definir `payment_type`.
     - Calcular `due_date`.
     - Definir `paid_date` conforme regra.
     - Preencher `notes` (numeração só nas parcelas mensais).
     - Em caso de erro (valor inválido, data imparseável, sem `contract_id`), **não emitir** a linha e registrar no log.

## Qualidade e validação
- **Dry-run**: antes de salvar, mostre um **preview (10 primeiras linhas)** da saída.
- Gerar **`payments.csv`** e um **`payments_build_log.json`** contendo:
  - Total processado por contrato,
  - Linhas geradas,
  - Linhas ignoradas e motivos (ex.: data imparseável, contrato sem `contract_id`, valor inválido),
  - Estatística por `status` e `payment_type`.

## Cautela
- Leia e **entenda** a estrutura antes de rodar.  
- **Faça com calma e valide**: nada de colunas trocadas, datas invertidas ou valores sem normalização.  
- O arquivo final **não será importado agora**; ele precisa sair **perfeito** e **compatível** com o schema do banco para futura importação.

