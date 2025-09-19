Quero que você analise **toda a estrutura atual do banco de dados** e faça todas as alterações necessárias na aplicação **Dart/Flutter** para que ela fique 100% compatível com o banco.  

⚠️ Importante: nada pode ficar quebrado. Nenhum arquivo deve ser deixado para trás. Todos os modelos, serviços, queries e telas precisam estar em total conformidade com o schema do banco.

---

### Etapas obrigatórias

1. **Análise do banco:**
   - Ler a estrutura completa do banco (todas as tabelas, colunas, tipos de dados, chaves primárias, estrangeiras, constraints e enums).
   - Mapear relacionamentos entre tabelas (1:N, N:N).
   - Verificar se há colunas/tabelas novas que ainda não estão refletidas no código da aplicação.

2. **Modelos no Dart:**
   - Atualizar ou recriar todas as classes de modelo (`models`) para refletirem fielmente o schema do banco.  
   - Garantir que todos os tipos (`int`, `double`, `String`, `DateTime`, `bool`, enums) estejam corretos e coerentes.  
   - Se o banco possuir **enums ou domains**, convertê-los em enums do Dart.  
   - Utilizar **geração automática** sempre que possível (`build_runner`, `json_serializable` ou similar) para reduzir erros manuais.  

3. **Serviços e Repositórios:**
   - Revisar todos os métodos de acesso a dados (CRUD).  
   - Ajustar queries, filtros e joins para refletirem os nomes corretos das tabelas e colunas.  
   - Implementar corretamente os relacionamentos (`contract` → `payments`, etc.).  
   - Adaptar métodos para tratar novos campos obrigatórios ou constraints adicionadas no banco.  

4. **UI (Camada de Apresentação):**
   - Conferir todas as telas que exibem dados do banco.  
   - Ajustar para mostrar campos novos, remover campos que não existem mais e adaptar labels/tipos.  
   - Verificar formulários para garantir que os dados enviados sejam aceitos pelo banco (inclusive campos obrigatórios).  

5. **Migrações e Compatibilidade:**
   - Alinhar sistema de migrações (Supabase, Drift/Moor ou outro) ao estado real do banco.  
   - Documentar todas as mudanças de schema e aplicação para manter rastreabilidade.  
   - Garantir que nenhuma versão antiga da aplicação quebre após os ajustes.

6. **Validação e Testes:**
   - Rodar testes unitários e de integração.  
   - Validar que todas as inserções, atualizações e consultas funcionam corretamente.  
   - Confirmar que a integridade referencial é respeitada dentro da aplicação.  
   - Garantir que **nenhum arquivo/modelo/service/UI** permaneça incompatível com o banco.  

---

### Resumo esperado
- Toda a aplicação Dart/Flutter estará em **plena conformidade** com o banco.  
- Nenhum arquivo ou parte do código ficará quebrado ou obsoleto.  
- Todos os modelos, serviços e telas estarão alinhados ao schema atual.  
- A aplicação será capaz de operar de ponta a ponta sem inconsistências entre o banco e o código.  
