## Exemplos canônicos de entidades completas

Use estes exemplos como referência de estrutura completa.
Alguns exemplos incluem `components.schemas` (quando há schemas internos) e/ou `filters` (quando há filtros definidos).

---

### Exemplo 1 — cte/Estabelecimento
Entidade básica: somente `properties`, sem `components` e sem `filters`.
```json
@include ./examples/entities/cte.Estabelecimento.json
```

---

### Exemplo 2 — cte/FormaPagamento
Entidade básica com poucos campos e chave primária; sem `components` e sem `filters`.
```json
@include ./examples/entities/cte.FormaPagamento.json
```

---

### Exemplo 3 — cte/Cobranca
Entidade com `domainConfig` dinâmico e `components.schemas` (schema interno) com `$ref`.
```json
@include ./examples/entities/cte.Cobranca.json
```

---

### Exemplo 4 — cte/Configuracoes
Entidade com `domainConfig` fixo (`type: "fixed"`) e lista `itens` com valores enumerados.
```json
@include ./examples/entities/cte.Configuracoes.json
```

---

### Exemplo 5 — cte/NfeParaCte
Entidade complexa com `components.schemas`, `$ref` internos reutilizados, arrays com `minItems` e definição de `filters`.
```json
@include ./examples/entities/cte.NfeParaCte.json
```
