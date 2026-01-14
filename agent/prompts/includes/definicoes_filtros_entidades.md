## Definição de filtros (`json_schema.filters`)

Filtros são definidos dentro de `json_schema.filters.fields`.
Cada entrada em `filters.fields.<campo>` descreve um filtro para UI/pesquisa.

---

### Quando criar filtros (regra obrigatória)

Crie `json_schema.filters` **somente** quando a especificação funcional pedir explicitamente filtros/pesquisa/listagem.

Considere que a especificação pediu filtros quando usar expressões como:
- "Filtros: <lista de campos>"
- "Permitir pesquisar por <lista de campos>"
- "Pode filtrar por <lista de campos>"
- "Critérios de pesquisa: <lista de campos>"
- "Campos de busca: <lista de campos>"

Se a especificação NÃO pedir filtros explicitamente, **não inclua** a seção `filters` no JSON.

---

### Tipos de filtros (`filters.fields.<campo>`)

#### 1) Filtro `enum`

Use `type: "enum"` quando o campo possui um conjunto finito de valores possíveis.
Declare os valores em `values` (array de strings).
Inclua um `label` para exibição na UI.

Exemplo real:
```json
"filters": {
  "fields": {
    "sinal": {
      "type": "enum",
      "label": "Sinal",
      "values": ["entrada", "saida"]
    },
    "situacao": {
      "type": "enum",
      "label": "Situação",
      "values": ["aberto", "cancelado", "emitido", "processado", "rejeitado"]
    }
  }
}
```

---

### Regra obrigatória: não inventar tipos de filtro

No momento, use apenas filtros do tipo `enum` (conforme exemplos reais).
Não crie outros tipos de filtro sem que haja exemplo explícito nos exemplos canônicos.
