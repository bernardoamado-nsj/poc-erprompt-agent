Crie uma entidade em JSON cujo formato de JSON Schema é este:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "entity.schema.json",
  "title": "erprompt-lib Entity Definition",
  "description": "Schema describing entity JSON files consumed by erprompt-lib (data modeling, filters and workflow).",
  "type": "object",
  "required": [
    "escopo",
    "codigo",
    "descricao",
    "json_schema"
  ],
  "additionalProperties": false,
  "properties": {
    "escopo": {
      "type": "string",
      "description": "Namespace of the entity (e.g., dados-mestre)."
    },
    "codigo": {
      "type": "string",
      "description": "Entity code inside the scope."
    },
    "descricao": {
      "type": "string",
      "description": "Human readable description."
    },
    "tenant": {
      "type": "integer"
    },
    "grupo_empresarial": {
      "type": "string"
    },
    "grupo_acesso": {
      "type": "string"
    },
    "created_by": {
      "type": "string"
    },
    "updated_by": {
      "type": "string"
    },
    "json_schema": {
      "$ref": "#/definitions/entityJsonSchema"
    }
  },
  "definitions": {
    "entityJsonSchema": {
      "type": "object",
      "required": [
        "$schema",
        "$id",
        "title",
        "type",
        "properties"
      ],
      "properties": {
        "$schema": {
          "type": "string"
        },
        "$id": {
          "type": "string"
        },
        "title": {
          "type": "string"
        },
        "type": {
          "type": "string",
          "enum": [
            "object"
          ]
        },
        "url": {
          "type": "string",
          "description": "Optional REST endpoint backing the entity."
        },
        "required": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "properties": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/fieldDefinition"
          }
        },
        "components": {
          "$ref": "#/definitions/componentsObject"
        },
        "filters": {
          "$ref": "#/definitions/filtersObject"
        },
        "workflowDefinition": {
          "$ref": "#/definitions/workflowDefinition"
        }
      },
      "additionalProperties": true
    },
    "fieldDefinition": {
      "type": "object",
      "properties": {
        "type": {
          "type": [
            "string",
            "array",
            "object",
            "number"
          ]
        },
        "format": {
          "type": "string",
          "description": "Custom format (date, datetime, currency, domain, etc.)."
        },
        "label": {
          "type": "string"
        },
        "pk": {
          "type": "boolean",
          "description": "Marks the field as primary key."
        },
        "defaultValue": {
          "description": "Default value for the field.",
          "type": [
            "string",
            "number",
            "boolean",
            "object",
            "array",
            "null"
          ]
        },
        "required": {
          "type": "boolean"
        },
        "minItems": {
          "type": "integer"
        },
        "items": {
          "anyOf": [
            {
              "$ref": "#/definitions/fieldDefinition"
            },
            {
              "$ref": "#/definitions/refDefinition"
            }
          ]
        },
        "$ref": {
          "type": "string",
          "description": "Reference to another schema definition."
        },
        "domainConfig": {
          "$ref": "#/definitions/domainConfig"
        },
        "dropdownConfig": {
          "type": "object",
          "additionalProperties": true
        },
        "properties": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/fieldDefinition"
          }
        }
      },
      "additionalProperties": true
    },
    "refDefinition": {
      "type": "object",
      "required": [
        "$ref"
      ],
      "properties": {
        "$ref": {
          "type": "string"
        }
      },
      "additionalProperties": true
    },
    "domainConfig": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "fixed",
            "dynamic",
            "internal"
          ]
        },
        "valueField": {
          "type": "string"
        },
        "labelFields": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "labelSeparator": {
          "type": "string"
        },
        "$ref": {
          "type": "string",
          "description": "Reference to another entity when type is internal."
        },
        "items": {
          "type": "array",
          "items": {
            "type": "object"
          }
        },
        "url": {
          "type": "string"
        }
      },
      "additionalProperties": true
    },
    "componentsObject": {
      "type": "object",
      "properties": {
        "schemas": {
          "type": "object",
          "description": "Nested sub-schemas (reused objects/arrays).",
          "additionalProperties": {
            "$ref": "#/definitions/entityJsonSchema"
          }
        }
      },
      "additionalProperties": true
    },
    "filtersObject": {
      "type": "object",
      "properties": {
        "fields": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/filterField"
          }
        },
        "predicates": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/filterPredicate"
          }
        }
      },
      "additionalProperties": true
    },
    "filterField": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "description": "Filter component type (boolean, date, other entity, etc.)."
        },
        "label": {
          "type": "string"
        },
        "valueField": {
          "type": "string"
        },
        "labelFields": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "sortable": {
          "type": "boolean"
        }
      },
      "additionalProperties": true
    },
    "filterPredicate": {
      "type": "object",
      "properties": {
        "label": {
          "type": "string"
        },
        "performanceTier": {
          "type": "string"
        },
        "exposedAs": {
          "type": "string"
        },
        "field": {
          "type": "string"
        },
        "operator": {
          "type": "string"
        },
        "params": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "type": {
                "type": "string"
              },
              "required": {
                "type": "boolean"
              }
            },
            "additionalProperties": true
          }
        },
        "expr": {
          "type": "object",
          "description": "JsonLogic expression."
        },
        "safeLimits": {
          "type": "object",
          "additionalProperties": true
        }
      },
      "additionalProperties": true
    },
    "workflowDefinition": {
      "type": "object",
      "properties": {
        "workflowFor": {
          "type": "string"
        },
        "workflowStateField": {
          "type": "string"
        },
        "workflow_state_field": {
          "type": "string",
          "description": "Snake_case alias for workflowStateField."
        },
        "workflow": {
          "$ref": "#/definitions/workflowObject"
        },
        "ruleset": {
          "$ref": "#/definitions/ruleSet"
        }
      },
      "additionalProperties": true
    },
    "workflowObject": {
      "type": "object",
      "properties": {
        "initialState": {
          "type": "string"
        },
        "initial_state": {
          "type": "string",
          "description": "Snake_case alias for initialState."
        },
        "states": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/workflowState"
          }
        }
      },
      "additionalProperties": true
    },
    "workflowState": {
      "type": "object",
      "properties": {
        "label": {
          "type": "string"
        },
        "fieldValue": {
          "type": [
            "string",
            "boolean",
            "number"
          ]
        },
        "field_value": {
          "type": [
            "string",
            "boolean",
            "number"
          ],
          "description": "Snake_case alias for fieldValue."
        },
        "entityMode": {
          "type": "string",
          "enum": [
            "readonly",
            "readwrite"
          ]
        },
        "entity_mode": {
          "type": "string",
          "enum": [
            "readonly",
            "readwrite"
          ],
          "description": "Snake_case alias for entityMode."
        },
        "mainColor": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "transitions": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/workflowTransition"
          }
        }
      },
      "additionalProperties": true
    },
    "workflowTransition": {
      "type": "object",
      "properties": {
        "targetState": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "transitionType": {
          "type": "string"
        },
        "buttonType": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "additionalProperties": true
    },
    "ruleSet": {
      "type": "object",
      "properties": {
        "engine": {
          "type": "object",
          "properties": {
            "epsilon": {
              "type": "number"
            },
            "max_iterations": {
              "type": "integer"
            },
            "trace": {
              "type": "boolean"
            },
            "allow_cycles_with_pivot": {
              "type": "boolean"
            },
            "pivot_groups": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "fields": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  },
                  "policy": {
                    "type": "string"
                  }
                },
                "additionalProperties": true
              }
            }
          },
          "additionalProperties": true
        },
        "rules": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/ruleDefinition"
          }
        }
      },
      "additionalProperties": true
    },
    "ruleDefinition": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "compute",
            "validation",
            "guard",
            "field_policy",
            "required_fields"
          ]
        },
        "id": {
          "type": "string"
        },
        "target": {
          "type": "string",
          "description": "Field (supports dotted path) affected by compute/field policy."
        },
        "expr": {
          "type": [
            "object",
            "array",
            "string",
            "number",
            "boolean"
          ],
          "description": "JsonLogic expression."
        },
        "depends_on": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "path": {
          "type": "string",
          "description": "Validation path."
        },
        "severity": {
          "type": "string",
          "enum": [
            "error",
            "warning"
          ]
        },
        "message": {
          "type": "string"
        },
        "error_when": {
          "type": "object"
        },
        "block_when": {
          "type": "object"
        },
        "targets": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "ui": {
          "type": "object",
          "properties": {
            "hidden_when": {
              "type": "object"
            },
            "readonly_when": {
              "type": "object"
            },
            "required_when": {
              "type": "object"
            },
            "disabled_when": {
              "type": "object"
            }
          },
          "additionalProperties": true
        },
        "backend": {
          "type": "object",
          "additionalProperties": true
        },
        "fields": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Used by required_fields rules."
        }
      },
      "additionalProperties": true
    }
  }
}

```

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

## Exemplos canônicos de entidades completas

Use estes exemplos como referência de estrutura completa.
Alguns exemplos incluem `components.schemas` (quando há schemas internos) e/ou `filters` (quando há filtros definidos).

---

### Exemplo 1 — cte/Estabelecimento
Entidade básica: somente `properties`, sem `components` e sem `filters`.
```json
{
    "escopo": "cte",
    "codigo": "Estabelecimento",
    "descricao": "Entidade Estabelecimento do escopo cte",
    "tenant": 0,
    "grupo_empresarial": "00000000-0000-0000-0000-000000000000",
    "grupo_acesso": "00000000-0000-0000-0000-000000000000",
    "created_by": "versionamento@nasajon.com.br",
    "updated_by": "versionamento@nasajon.com.br",
    "json_schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "cte/Estabelecimento",
        "type": "object",
        "required": [
            "id",
            "codigo",
            "descricao",
            "raizcnpj",
            "ordemcnpj"
        ],
        "properties": {
            "id": {
                "type": "string",
                "format": "uuid",
                "pk": true
            },
            "codigo": {
                "type": "string"
            },
            "nomefantasia": {
                "type": "string"
            },
            "descricao": {
                "type": "string"
            },
            "inscricao_estadual": { "type": "string" },
			"raizcnpj": { "type": "string" },
			"ordemcnpj": { "type": "string" },
			"ibge": { "type": "string" },
            "uf": { "type": "string" },
            "empresa": {
                "type": "string",
                "format": "uuid"
            },
			"grupo_empresarial": {
                "type": "string",
                "format": "uuid"
            }
        }
    }
}
```

---

### Exemplo 2 — cte/FormaPagamento
Entidade básica com poucos campos e chave primária; sem `components` e sem `filters`.
```json
{
    "escopo": "cte",
    "codigo": "FormaPagamento",
    "descricao": "Entidade FormaPagamento do escopo cte",
    "tenant": 0,
    "grupo_empresarial": "00000000-0000-0000-0000-000000000000",
    "grupo_acesso": "00000000-0000-0000-0000-000000000000",
    "created_by": "versionamento@nasajon.com.br",
    "updated_by": "versionamento@nasajon.com.br",
    "json_schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "cte/FormaPagamento",
        "type": "object",
        "required": [
            "id",
            "codigo",
            "descricao"
        ],
        "properties": {
            "id": {
                "type": "string",
                "format": "uuid",
                "pk": true
            },
            "codigo": {
                "type": "string"
            },
            "descricao": {
                "type": "string"
            },
            "tipo": {
                "type": "string"
            }
        }
    }
}
```

---

### Exemplo 3 — cte/Cobranca
Entidade com `domainConfig` dinâmico e `components.schemas` (schema interno) com `$ref`.
```json
{
    "escopo": "cte",
    "codigo": "Cobranca",
    "descricao": "Entidade Cobranca do escopo cte",
    "tenant": 0,
    "grupo_empresarial": "00000000-0000-0000-0000-000000000000",
    "grupo_acesso": "00000000-0000-0000-0000-000000000000",
    "created_by": "versionamento@nasajon.com.br",
    "updated_by": "versionamento@nasajon.com.br",
    "json_schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "cte/Cobranca",
        "type": "object",
        "required": [
            "id",
            "forma_pagamento",
            "numero_parcelas",
            "valor"
        ],
        "properties": {
            "id": {
                "type": "string",
                "format": "uuid",
                "pk": true
            },
            "forma_pagamento": {
                "type": "string",
                "format": "domain",
                "domainConfig": {
                    "type": "dynamic",
                    "valueField": "id",
                    "labelFields": ["codigo", "descricao"],
                    "schemaId": "cte/FormaPagamento"
                }
            },
            "numero_parcelas": {
                "type": "number",
                "label": "Parcelas"
            },
            "valor": {
                "type": "string",
                "format": "currency",
                "label": "Valor"
            },
            "parcelas": {
                "type": "array",
                "items": { "$ref": "#/components/schemas/CobrancaParcela" }
            },
            "FormaPagamento": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid",
                        "pk": true
                    },
                    "codigo": {
                        "type": "string"
                    },
                    "descricao": {
                        "type": "string",
                        "label": "Forma de Pagamento"
                    },
                    "tipo": {
                        "type": "string"
                    }
                }
            },
            "vencimento": {
                "type": "string",
                "label": "Vencimento",
                "format": "date"
            }
        },
        "components": {
            "schemas": {
                "CobrancaParcela": {
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "$id": "cte/CobrancaParcela",
                    "type": "object",
                    "required": [
                        "id",
                        "numero",
                        "sequencial",
                        "valor",
                        "vencimento",
                        "competencia",
                        "percentual"
                    ],
                    "properties": {
                        "id": {
                            "type": "string",
                            "format": "uuid",
                            "pk": true
                        },
                        "numero": {
                            "type": "string"
                        },
                        "sequencial": {
                            "type": "number"
                        },
                        "valor": {
                            "type": "string",
                            "format": "currency"
                        },
                        "vencimento": {
                            "type": "string",
                            "format": "date"
                        },
                        "competencia": {
                            "type": "string",
                            "format": "date"
                        },
                        "percentual": {
                            "type": "string"
                        },
                        "intervalo": {
                            "type": "number"
                        }
                    }
                }
            }
        }
    }
}
```

---

### Exemplo 4 — cte/Configuracoes
Entidade com `domainConfig` fixo (`type: "fixed"`) e lista `itens` com valores enumerados.
```json
{
    "escopo": "cte",
    "codigo": "Configuracoes",
    "descricao": "Entidade Configuracoes do escopo cte",
    "tenant": 0,
    "grupo_empresarial": "00000000-0000-0000-0000-000000000000",
    "grupo_acesso": "00000000-0000-0000-0000-000000000000",
    "created_by": "versionamento@nasajon.com.br",
    "updated_by": "versionamento@nasajon.com.br",
    "json_schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "cte/Configuracoes",
        "type": "object",
        "required": [
            "AmbienteEmissorDocumentos",
            "GeraCte",
            "MockEmitirCteApiUrl",
            "MockCancelarCteApiUrl"
        ],
        "properties": {
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
            },
            "GeraCte": { "type": "string" },
            "MockEmitirCteApiUrl": { "type": "string" },
            "MockCancelarCteApiUrl": { "type": "string" }
        }
    }
}
```

---

### Exemplo 5 — cte/NfeParaCte
Entidade complexa com `components.schemas`, `$ref` internos reutilizados, arrays com `minItems` e definição de `filters`.
```json
{
    "escopo": "cte",
    "codigo": "NfeParaCte",
    "descricao": "Entidade NfeParaCte do escopo cte",
    "tenant": 0,
    "grupo_empresarial": "00000000-0000-0000-0000-000000000000",
    "grupo_acesso": "00000000-0000-0000-0000-000000000000",
    "created_by": "versionamento@nasajon.com.br",
    "updated_by": "versionamento@nasajon.com.br",
    "json_schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "cte/NfeParaCte",
        "title": "Nota de mercadoria",
        "type": "object",
        "required": [],
        "properties": {
            "id": {
                "type": "string",
                "format": "uuid",
                "pk": true
            },
            "numero": {
                "type": "string"
            },
            "emissao": {
                "type": "string",
                "format": "date"
            },
            "lancamento": {
                "type": "string",
                "format": "date"
            },
            "estabelecimento": {
                "type": "object",
                "properties": {
                    "id": { "type": "string", "format": "uuid", "pk": true },
                    "cnpj": { "type": "string" },
                    "codigo": { "type": "string" },
                    "descricao": { "type": "string" },
                    "endereco": {
                        "type": "object",
                        "properties": {
                            "cidade": { "type": "string" },
                            "tipologradouro": { "type": "string" },
                            "logradouro": { "type": "string" },
                            "numero": { "type": "string" },
                            "complemento": { "type": "string" },
                            "bairro": { "type": "string" },
                            "ibge": { "type": "string" },
                            "cep": { "type": "string" },
                            "uf": { "type": "string" },
                            "municipio": { "type": "string" }
                        }
                    },
                    "inscricaoestadual": { "type": "string" },
                    "ddd": { "type": "string" },
                    "telefone": { "type": "string" }
                }
            },
            "chave": { "type": "string" },
            "participante": { "$ref": "#/components/schemas/NfeParaCteParticipante" },
            "emitente": { "$ref": "#/components/schemas/NfeParaCteParticipante" },
            "destinatario": { "$ref": "#/components/schemas/NfeParaCteParticipante" },
			"modelo": { "type": "string" },
			"serie": { "type": "string" },
			"sinal": { "type": "string" },
			"situacao": { "type": "string" },
			"subserie": { "type": "string" },
            "valor": {
                "type": "number",
                "format": "currency",
                "description": "Valor da nota"
            },
            "grupoempresarial": { "$ref": "#/components/schemas/StandardEntity" },
			"empresa": { "$ref": "#/components/schemas/StandardEntity" },
            "itens": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "$ref": "#/components/schemas/NfeParaCteItem"
                }
            }
        },
        "filters": {
            "fields": {
                "sinal": {
                    "type": "enum",
                    "label": "Sinal",
                    "values": [
                        "entrada",
                        "saida"
                    ]
                },
                "situacao": {
                    "type": "enum",
                    "label": "Situação",
                    "values": [
                        "aberto",
                        "cancelado",
                        "emitido",
                        "processado",
                        "rejeitado"
                    ]
                }
            }
        },
        "components": {
            "schemas": {
                "NfeParaCteItem": {
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "$id": "cte/NfeParaCteItem",
                    "title": "Item",
                    "type": "object",
                    "required": [
                        "id",
                        "unitario",
                        "quantidade"
                    ],
                    "properties": {
                        "id": { "type": "string", "format": "uuid", "pk": true },
                        "id_docfis": { "type": "string", "format": "uuid" },
                        "unitario": { "type": "string", "format": "currency" },
                        "quantidade": { "type": "number" },
                        "frete": { "type": "string", "format": "currency" },
                        "seguro": { "type": "string", "format": "currency" },
                        "despesas": { "type": "string", "format": "currency" },
                        "desconto": { "type": "string", "format": "currency" },
                        "unidade": {
                            "id": { "type": "string", "format": "uuid", "pk": true },
                            "codigo": { "type": "string" },
                            "descricao": { "type": "string" }
                        }
                    }
                },
                "NfeParaCteParticipante": {
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "$id": "cte/NfeParaCteParticipante",
                    "title": "Participante",
                    "type": "object",
                    "required": [
                        "id",
                        "unitario",
                        "quantidade"
                    ],
                    "properties": {
                        "id": { "type": "string", "format": "uuid", "pk": true },
                        "nome": { "type": "string" },
                        "cnpj": { "type": "string" },
                        "endereco": {
                            "type": "object",
                            "properties": {
                                "tipologradouro": { "type": "string" },
                                "logradouro": { "type": "string" },
                                "numero": { "type": "string" },
                                "complemento": { "type": "string" },
                                "cep": { "type": "string" },
                                "bairro": { "type": "string" },
                                "tipoendereco": { "type": "string" },
                                "uf": { "type": "string" },
                                "pais": { "type": "string" },
                                "ibge": { "type": "string" },
                                "cidade": { "type": "string" },
                                "referencia": { "type": "string" }
                            }
                        }
                    }
                },
                "StandardEntity": {
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "$id": "cte/StandardEntity",
                    "title": "Standard",
                    "type": "object",
                    "required": [
                        "id",
                        "codigo",
                        "descricao"
                    ],
                    "properties": {
                        "id": { "type": "string", "format": "uuid", "pk": true },
                        "codigo": { "type": "string" },
                        "descricao": { "type": "string" }
                    }
                }
            }
        }
    }
}
```

---

Especificação funcional da entidade a ser gerada:

A entidade modela uma Nota Fiscal (NF-e) e deve representar os dados principais do documento fiscal e o seu status.

Campos:
- id: identificador único da nota fiscal (UUID), chave primária (pk).
- numero: número da nota fiscal. Campo obrigário.
- serie: série da nota fiscal. Campo obrigatório.
- data_criacao: data de criação da nota fiscal. Campo obrigatório.
- chave_acesso: chave de acesso (44 dígitos) da NF-e.
- data_emissao: data de emissão da nota fiscal.
- tipo_operacao: indica se é entrada ou saída ("entrada" ou "saida"). Campo obrigatório e filtrável.
- situacao: status da nota fiscal: "aberta", "emitida", "cancelada", "inutilizada". Campo obrigatório e filtrável.
- id_emitente: identificador do emitente (UUID). Campo obrigatório.
- id_destinatario: identificador do destinatário (UUID). Campo obrigatório.
- natureza_operacao: descrição da natureza da operação.
- data_saida_entrada: data de saída/entrada da mercadoria. Campo obrigatório.
- valor: valor total dos produtos/serviços. Campo obrigatório.
- valor_frete: valor do frete.
- valor_seguro: valor do seguro.
- valor_desconto: valor total de descontos.
- valor_impostos: valor total de impostos.
- valor_total: valor total da nota fiscal.
- observacoes: observações adicionais do documento.
- itens: lista de itens da nota fiscal. Cada nota precisa ter pelo menos um item. Cada item deve ser uma estrutura própria (entidade interna reutilizável). Campo obrigatório.
