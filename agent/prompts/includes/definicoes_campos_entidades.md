## Definição de campos em `json_schema.properties` (padrão erprompt-lib)

Siga estritamente estes padrões ao definir campos em `json_schema.properties`.

---

### Campos obrigatórios (`required`) e chave primária (`pk`)

**Obrigatoriedade**: declare campos obrigatórios no array `json_schema.required`.

Exemplo:
```json
"required": ["id", "codigo", "descricao"]
```

**Chave primária**: o campo chave primária deve conter `"pk": true` e normalmente usa `"format": "uuid"`.

Exemplos:
```json
"id": { "type": "string", "format": "uuid", "pk": true }
```

**Política obrigatória para `json_schema.required`:**
- Não inclua automaticamente todos os campos em `required`.
- Por padrão, considere campos como opcionais.
- Inclua em `required` apenas:
  1) a chave primária (campo com `"pk": true`);
  2) campos explicitamente descritos como obrigatórios na especificação da entidade;
  3) campos que são essenciais para identificação ou integridade do registro (ex.: `codigo`, `descricao` em entidades de domínio).
- Se não houver indicação clara, prefira NÃO marcar como required.
- Quando houver dúvida, prefira deixar o campo opcional.

---

### Tipos de campos

#### 1) Tipo `string`

Strings simples:
```json
"descricao": { "type": "string" },
"codigo": { "type": "string" }
```

UUID:
```json
"empresa": { "type": "string", "format": "uuid" }
```

Date:
```json
"vencimento": { "type": "string", "format": "date", "label": "Vencimento" }
```

Currency (padrão observado: valor monetário como string):
```json
"valor": { "type": "string", "format": "currency", "label": "Valor" }
```

---

#### 2) Tipo `number`

Exemplos:
```json
"numero_parcelas": { "type": "number", "label": "Parcelas" },
"sequencial": { "type": "number" },
"intervalo": { "type": "number" }
```

---

#### 3) Tipo `object`

Objetos podem ser definidos de três formas:

1) **Inline**: `type: "object"` com `properties`.
2) **Referência interna**: `"$ref": "#/components/schemas/X"`.
3) **Referência externa**: `"$ref": "<escopo>/<Entidade>"` (mesmo padrão de `schemaId`).

**Objeto inline (exemplo real):**
```json
"FormaPagamento": {
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid", "pk": true },
    "codigo": { "type": "string" },
    "descricao": { "type": "string", "label": "Forma de Pagamento" },
    "tipo": { "type": "string" }
  }
}
```

**Objeto com referência interna (schema interno):**
```json
"endereco": { "$ref": "#/components/schemas/Endereco" }
```

**Objeto com referência externa (outra entidade do projeto):**
```json
"cliente": { "$ref": "cte/Cliente" }
```

Se o objeto referencia `#/components/schemas/X`, então `X` deve existir em `json_schema.components.schemas`.

---

#### 4) Tipo `array`

Arrays são definidos com `type: "array"` e `items`.

O campo `items` pode ser:
1) definição inline de objeto/valor,
2) referência interna (`$ref: "#/components/schemas/X"`),
3) referência externa (`$ref: "<escopo>/<Entidade>"`).

**Array com item referenciado internamente (exemplo real):**
```json
"parcelas": {
  "type": "array",
  "items": { "$ref": "#/components/schemas/CobrancaParcela" }
}
```

**Array com item definido inline:**
```json
"telefones": {
  "type": "array",
  "items": { "type": "string" }
}
```

**Array com item referenciado externamente:**
```json
"itens": {
  "type": "array",
  "items": { "$ref": "cte/ItemNotaFiscal" }
}
```

Se o array referencia `#/components/schemas/X`, então `X` deve existir em `json_schema.components.schemas`.

---

### Campo de domínio (`format: "domain"` + `domainConfig`)

Use `format: "domain"` quando o campo representa uma seleção/lookup (dropdown/autocomplete).

Existem dois padrões principais:

#### 1) Domínio dinâmico (`domainConfig.type: "dynamic"`)
Lookup para outra entidade do projeto. Use `schemaId: "<escopo>/<Entidade>"`.

Exemplo real:
```json
"forma_pagamento": {
  "type": "string",
  "format": "domain",
  "domainConfig": {
    "type": "dynamic",
    "valueField": "id",
    "labelFields": ["codigo", "descricao"],
    "schemaId": "cte/FormaPagamento"
  }
}
```

#### 2) Domínio fixo (`domainConfig.type: "fixed"`)
Lista fixa de valores possíveis. Use `domainConfig.itens` para declarar os valores.

Obs.: Em domínio fixo, a lista deve estar em `domainConfig.itens` (não `items`).

Exemplo real:
```json
"AmbienteEmissorDocumentos": { 
  "type": "string", 
  "format": "domain",
  "domainConfig": {
    "type": "fixed",
    "valueField": "value",
    "labelFields": ["label"],
    "itens": [
      { "label": "Produção", "value": "producao" },
      { "label": "Homologação", "value": "homologacao" }
    ]
  }
}
```

---

### Referências externas: `$ref` vs `domainConfig`

Use `$ref` quando o campo **contém um objeto (ou lista de objetos)** de outra entidade.

Use `format: "domain"` + `domainConfig` quando o campo é uma seleção/lookup:
- `dynamic` quando os valores vêm de outra entidade (`schemaId`)
- `fixed` quando os valores são uma lista enumerada (`itens`)
