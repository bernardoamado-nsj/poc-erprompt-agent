## Exemplos canônicos de layouts

Use estes exemplos como referência de estrutura completa de layouts.
Nem todos os layouts usam `app_bar` ou filtros; inclua somente quando a especificação pedir.

---

### Exemplo 1 — Listagem simples com `GenericGrid`
Layout básico com `transaction` e `GenericGrid`.
~~~json
@include ./examples/layouts/cte.list-notas.json
~~~

---

### Exemplo 2 — Listagem com grid contendo mais funcionalidades e um botão de ação na tela.
Layout com colunas de status usando `ChipCell`, dotted fields, colunas redimensionáveis, seleção de visibilidade das colunas e botão de ação principal da tela.
~~~json
@include ./examples/layouts/cte.list-notas-para-cte.json
~~~
