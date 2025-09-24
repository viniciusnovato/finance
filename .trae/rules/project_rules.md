# PROJECT_RULES.md

## Regras Gerais do Projeto

1. **Reinício após alterações**
   - Sempre que uma alteração significativa no código for feita (backend, frontend ou configuração), o MCP deve instruir a **reiniciar a aplicação** imediatamente para garantir que a modificação seja refletida e validada.
   - Reiniciar deve incluir:
     - Encerrar o processo atual.
     - Subir novamente o servidor da aplicação.
     - Confirmar que a aplicação voltou a rodar sem erros.

2. **Validação pós-reinício**
   - Após o reinício, validar se:
     - O servidor está ativo.
     - A API responde nas rotas principais.
     - O frontend (se aplicável) carrega corretamente.

3. **Logs e Erros**
   - Sempre verificar logs imediatamente após reiniciar.
   - Se houver erros, interromper a sequência e sugerir diagnóstico.

4. **Boas Práticas**
   - Manter consistência em commits: cada alteração relevante deve ser acompanhada de um commit claro e objetivo.
   - Seguir princípios de **Clean Code** e **Separação de Responsabilidades**.
   - Evitar alterações que quebrem funcionalidades já existentes.

5. **Testes Rápidos**
   - Sempre que possível, rodar testes unitários ou de integração relacionados ao trecho alterado.
   - Confirmar que os testes passam antes de prosseguir.

---

## Fluxo Resumido

1. Alteração realizada.  
2. Reiniciar aplicação.  
3. Validar logs e funcionamento.  
4. Executar testes rápidos.  
5. Confirmar estabilidade.  