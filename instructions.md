# Prompt de Análise e Correção de Bug – Filtro Persistente nas Telas de Pagamentos e Contratos

## Contexto
Temos um ERP com três telas principais:
1. **Clientes**  
2. **Contratos**  
3. **Pagamentos**

### Fluxo Atual
- Na tela de **Clientes**, ao clicar em um cliente, o sistema transiciona para a tela de **Contratos** com um filtro aplicado (mostrado como um **badge azul** com o nome do cliente).  
- Na tela de **Contratos**, ao clicar em um contrato, o sistema transiciona para a tela de **Pagamentos** com os filtros aplicados (cliente e contrato).  
- Quando clico no **X** (fechar badge) na tela de **Pagamentos**, o filtro é removido corretamente nessa tela.  
- Porém, ao retornar para a tela de **Contratos**, o **badge azul com o nome do cliente ainda permanece ativo** e a listagem continua filtrada. O esperado é que, ao fechar o filtro, a tela de Contratos também mostre todos os contratos.

## Problema
O filtro de cliente **não está sendo removido da tela de Contratos** quando o usuário fecha o badge na tela de Pagamentos.  
Isso gera inconsistência entre as telas, pois o badge azul permanece ativo e impede que todos os contratos sejam exibidos.

## Objetivo
Corrigir esse comportamento para que, ao remover o filtro (fechar badge), a tela de Contratos também atualize e mostre todos os contratos, sem continuar filtrando pelo cliente anterior.

---

## Roteiro de Análise Antes da Correção

1. **Verificar a lógica de passagem de filtros entre telas**  
   - Como o filtro do cliente é armazenado e transferido da tela de Clientes para Contratos.  
   - Como o filtro é repassado da tela de Contratos para Pagamentos.  

2. **Analisar o mecanismo de remoção do filtro (badge azul)**  
   - Onde está sendo disparado o evento de remover filtro ao clicar no X.  
   - Confirmar se a ação de remover filtro está propagando corretamente para todas as telas relacionadas.  

3. **Checar estados globais ou locais**  
   - Verificar se existe algum `state`, `store` (Redux, Zustand, Vuex, etc.), ou `context` responsável por manter o filtro de cliente.  
   - Confirmar se o estado realmente é limpo ou se continua armazenado em memória após fechar o badge.  

4. **Validar a renderização da tela de Contratos**  
   - Se a tela de Contratos está escutando corretamente a mudança do estado de filtro.  
   - Se existe algum problema de re-renderização que impede de atualizar a lista de contratos.  

5. **Identificar inconsistência**  
   - O filtro é removido apenas visualmente (no badge), mas não no estado interno?  
   - O filtro é removido na tela de Pagamentos, mas não sincronizado com Contratos?  

---

## Tarefa para o TRAE
1. Seguir o roteiro de análise acima para identificar onde está a falha.  
2. Corrigir o fluxo de filtros entre as telas, garantindo que:  
   - Ao fechar o badge azul na tela de Pagamentos, o filtro seja removido globalmente.  
   - A tela de Contratos reflita essa remoção, exibindo todos os contratos novamente.  

## Critério de Aceite
- Fechar o badge azul na tela de Pagamentos remove o filtro corretamente.  
- Ao retornar para a tela de Contratos, o badge azul deve desaparecer.  
- Todos os contratos devem ser exibidos, sem o filtro persistente do cliente.