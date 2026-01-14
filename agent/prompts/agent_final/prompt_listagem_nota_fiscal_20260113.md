FUNÇÃO: Gerador de JSONs de layouts para telas.

INSTRUÇÕES (obrigatórias):
- Gere somente um único objeto JSON válido.
- Não use Markdown, não use blocos de código, não inclua explicações ou texto extra.
- Siga rigorosamente o JSON Schema fornecido e os exemplos.
- Não invente componentes fora do schema.


Crie um layout em JSON seguindo estritamente o JSON Schema abaixo.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "layout.schema.json",
  "title": "erprompt-lib Layout Definition",
  "description": "Schema that describes dynamic layout JSON files consumed by erprompt-lib.",
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
      "description": "Logical scope (namespace) of the layout."
    },
    "codigo": {
      "type": "string",
      "description": "Unique identifier of the layout inside its scope."
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
    "resumo_prompt_origem": {
      "type": "string",
      "description": "Optional summary of the AI prompt that generated the layout."
    },
    "json_schema": {
      "$ref": "#/definitions/layoutDefinition"
    }
  },
  "definitions": {
    "layoutDefinition": {
      "type": "object",
      "required": [
        "id",
        "type",
        "transaction",
        "children"
      ],
      "properties": {
        "id": {
          "type": "string"
        },
        "type": {
          "type": "string",
          "enum": [
            "div"
          ],
          "description": "Root node type. Currently only div containers are supported at the top level."
        },
        "transaction": {
          "$ref": "#/definitions/transaction"
        },
        "app_bar": {
          "$ref": "#/definitions/appBar"
        },
        "children": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/componentNode"
          }
        }
      },
      "additionalProperties": true
    },
    "transaction": {
      "type": "object",
      "required": [
        "name",
        "entities"
      ],
      "properties": {
        "name": {
          "type": "string",
          "description": "Transaction store name."
        },
        "entities": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/definitions/entityBinding"
          }
        }
      },
      "additionalProperties": false
    },
    "entityBinding": {
      "type": "object",
      "required": [
        "name",
        "schema"
      ],
      "properties": {
        "name": {
          "type": "string",
          "description": "Logical alias used inside the layout (dataRef)."
        },
        "schema": {
          "type": "string",
          "description": "Reference to the entity file (e.g. fluxus/ordem_pagamento)."
        },
        "cardinality": {
          "type": "string",
          "enum": [
            "one",
            "many"
          ]
        },
        "load": {
          "type": "boolean"
        },
        "main": {
          "type": "boolean"
        },
        "loadingMessage": {
          "type": "string"
        },
        "showCreate": {
          "type": "boolean"
        },
        "lazy": {
          "type": "boolean"
        },
        "useLocalCache": {
          "type": "boolean"
        }
      },
      "additionalProperties": true
    },
    "appBar": {
      "type": "object",
      "properties": {
        "pageTitle": {
          "type": "string"
        },
        "subtitle": {
          "type": "string"
        },
        "useContextualHeader": {
          "type": "boolean"
        },
        "navigateBackRoute": {
          "type": "string"
        },
        "actions": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/componentNode"
          }
        }
      },
      "additionalProperties": true
    },
    "componentNode": {
      "type": "object",
      "required": [
        "type"
      ],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "Browser",
            "BuiltInView",
            "Button",
            "Card",
            "CardActions",
            "CardBody",
            "CardSubtitle",
            "CardTitle",
            "Chip",
            "DatePicker",
            "Field",
            "FiltersGroup",
            "FilterableGrid",
            "FilterPanel",
            "GridColumn",
            "GridToolbar",
            "GenericConditionalRender",
            "GenericForm",
            "GenericGrid",
            "GenericList",
            "GenericTitle",
            "ItensList",
            "NewFilter",
            "NewItensList",
            "NumericTextBox",
            "Row",
            "SearchInput",
            "StateAvailableActions",
            "Stepper",
            "Step",
            "TabStrip",
            "TabStripTab",
            "TaskBoard",
            "TextBox",
            "TitleDivider",
            "TwoLinesItem",
            "XmlViewer",
            "div",
            "p",
            "span",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6"
          ]
        },
        "props": {
          "type": "object",
          "description": "Component specific properties.",
          "additionalProperties": true
        },
        "children": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/componentChild"
          }
        }
      },
      "additionalProperties": false
    },
    "componentChild": {
      "description": "A child can be another component node or a literal string (text node).",
      "oneOf": [
        {
          "type": "string"
        },
        {
          "$ref": "#/definitions/componentNode"
        }
      ]
    }
  }
}

```

## Definição de layouts (padrão erprompt-lib)

O layout deve obedecer ao JSON Schema fornecido e usar apenas componentes listados no schema.

---

### Estrutura base obrigatória

Todo layout deve conter:
- metadados: `escopo`, `codigo`, `descricao`, `json_schema`
- `json_schema.id` (string)
- `json_schema.type` deve ser `"div"`
- `json_schema.transaction` com pelo menos uma entidade
- `json_schema.children` (array)

---

### Transaction e bindings de entidades

Use `json_schema.transaction` para declarar os bindings de dados.

Padrão mínimo para listagem:
~~~json
"transaction": {
  "name": "nome-da-transacao",
  "entities": [
    {
      "name": "alias",
      "schema": "escopo/Entidade",
      "load": true,
      "loadingMessage": "Carregando ...",
      "cardinality": "many"
    }
  ]
}
~~~

Regras:
- `entities[0].name` deve ser usado como `dataRef` em grids/listas.
- Use `cardinality: "many"` em telas de listagem.
- Use `load: true` quando a especificação pedir carregar automaticamente.
- Use `loadingMessage` quando for uma listagem.

---

### Transaction store e múltiplas entidades

Cada tela possui uma `transaction store` declarada em `json_schema.transaction`.
A transaction pode conter múltiplas entidades em `transaction.entities`.

Exemplo de transaction store com duas entidades:
~~~json
"transaction": {
  "name": "list-notas",
  "entities": [
    { "name": "notas", "schema": "fiscal/NotaFiscal", "cardinality": "many", "load": true, "main": true },
    { "name": "emitente", "schema": "cadastro/Participante", "cardinality": "one", "load": false, "lazy": true }
  ]
}
~~~

Regras:
- Não assuma que existe apenas uma entidade por tela.
- Inclua no array `entities` todas as entidades necessárias para atender a especificação funcional.
- Cada entidade deve ter um `name` (alias) único, usado como `dataRef` nos componentes.
- Quando houver uma entidade principal da tela, marque-a com `"main": true`.
- Não inclua entidades que não forem mencionadas ou necessárias na especificação.

---

### Cardinality (carregamento de dados)

`transaction.entities[].cardinality` define como a biblioteca busca dados:
- `"many"`: endpoint de listagem (coleção)
- `"one"`: endpoint de get-one (registro) usando o id selecionado no contexto

`cardinality` não altera as regras de `dataRef` dos componentes. Siga sempre o contrato do componente (GenericGrid/GenericForm/ItensList).

---

### Padrão para listagem: `GenericGrid` + `GridColumn`

Para listagens/tabular:
- Use `GenericGrid` com `props.dataRef` apontando para o alias da entidade.
- Use `children` com vários `GridColumn`.

Padrão:
~~~json
{
  "type": "GenericGrid",
  "props": {
    "dataRef": "alias",
    "style": { "maxHeight": "300px" },
    "resizable": true
  },
  "children": [
    { "type": "GridColumn", "props": { "field": "numero", "title": "Número" } }
  ]
}
~~~

Regras:
- `GridColumn.props.field` deve referenciar campos existentes na entidade (pode usar dotted notation).
- Use `props.width` quando especificado ou para colunas curtas.
- Use `"cell": "ChipCell"` em colunas de status/situação quando aplicável.
- Para colunas monetárias, mantenha o campo como string/currency e não use edição.


---

### Cards (agrupamento visual)

Use `Card` para agrupar conteúdos relacionados (ex.: configurações, detalhes, resumo).
Estrutura típica:
~~~json
{
  "type": "Card",
  "children": [
    { "type": "CardTitle", "children": ["Título"] },
    { "type": "CardBody", "children": [ /* componentes */ ] }
  ]
}
~~~

---

### Exibição de dados de um único registro (sem formulário): `ItensList`

Use `ItensList` para exibir pares campo/valor de um único registro selecionado.

Padrão:
~~~json
{
  "type": "ItensList",
  "props": {
    "dataRef": "alias.selected",
    "includeItems": ["campo1", "campo2"]
  }
}
~~~

Regras:
- `ItensList.props.dataRef` deve apontar para `<alias>.selected`.
- `includeItems` deve listar campos existentes na entidade referenciada por `alias`.
- Use `ItensList` quando a especificação pedir “mostrar informações”, “exibir detalhes”, “painel de configuração”, etc., SEM EDIÇÃO.


---

### Formulários de edição: `GenericForm` + `Field`

Para edição de um único registro, use `GenericForm` e campos `Field`.

Regras obrigatórias:
- `Field` deve ser usado **somente** dentro de `GenericForm` (restrição do KendoReact Form).
- `GenericForm.props.dataRef` deve ser o alias da entidade (ex.: `"cte"`), sem `.selected`.

Padrão mínimo:
~~~json
{
  "type": "GenericForm",
  "props": {
    "dataRef": "alias"
  },
  "children": [
    { "type": "Field", "props": { "field": "descricao", "label": "Descrição" } }
  ]
}
~~~


Regras:
- Use `GenericForm` quando a especificação pedir “editar”, “cadastrar”, “formulário”, “manutenção”.
- Não use `Field` fora do `GenericForm`.
- `Field.props.field` deve referenciar um campo existente na entidade.
- Se o tipo do input não for especificado, use `Field` (padrão) e deixe detalhes de componente (TextBox/DatePicker/NumericTextBox) para quando houver orientação explícita.


---

### dataRef: regras por componente (padrão erprompt-lib)

A transaction store mantém estado por entidade (alias). O `dataRef` deve seguir o contrato do componente.

Regras:
- `GenericGrid.props.dataRef` deve ser o alias da entidade: `"<alias>"`.
- `GenericForm.props.dataRef` deve ser o alias da entidade: `"<alias>"`.
- `ItensList.props.dataRef` deve apontar para o registro selecionado: `"<alias>.selected"`.

Observações:
- Não use `"<alias>.selected"` em `GenericGrid` ou `GenericForm`.
- Use `ItensList` quando precisar exibir um registro único fora de formulário.

---

### Observação prática: listar vs editar (decisão)

- “Listar”, “tabela”, “grid”, “pesquisar”, “listagem” => `GenericGrid` com `dataRef: "<alias>"`.
- “Editar”, “cadastrar”, “formulário”, “preencher dados” => `GenericForm` com `dataRef: "<alias>.selected"`.
- “Exibir informações”, “mostrar detalhes”, “resumo” (sem edição) => `ItensList` com `dataRef: "<alias>.selected"`.


---


### Regras de geração (para evitar excesso)

- Se a especificação pedir listagem, gere `GenericGrid` (não invente forms).
- Se a especificação pedir edição/cadastro, gere `GenericForm` + `Field`.
- Se a especificação pedir exibir informações (SEM EDIÇÃO), use `ItensList` (preferencialmente dentro de `Card`).
- Não inclua `FilterPanel`, `NewFilter` ou busca a menos que a especificação peça explicitamente.
- Não inclua `app_bar` a menos que a especificação peça título, subtítulo ou ações.
- Prefira hierarquia simples: `div` -> `Card/GenericGrid/GenericForm` -> componentes filhos.


## Exemplos canônicos de layouts

Use estes exemplos como referência de estrutura completa de layouts.
Nem todos os layouts usam `app_bar` ou filtros; inclua somente quando a especificação pedir.

---

### Exemplo 1 — Listagem simples com `GenericGrid`
Layout básico com `transaction` e `GenericGrid`.
~~~json
{
    "escopo": "cte",
    "codigo": "list-notas",
    "descricao": "Layout de listagem de notas fiscais para o escopo cte",
    "tenant": 0,
    "grupo_empresarial": "00000000-0000-0000-0000-000000000000",
    "grupo_acesso": "00000000-0000-0000-0000-000000000000",
    "created_by": "versionamento@nasajon.com.br",
    "updated_by": "versionamento@nasajon.com.br",
    "json_schema": {
        "id": "cte_list-notas",
        "type": "div",
        "transaction": {
            "name": "list-nfes",
            "entities": [
                {
                    "name": "nfes",
                    "schema": "cte/Nfe",
                    "load": true,
                    "loadingMessage": "Carregando notas fiscais",
                    "cardinality": "many"
                }
            ]
        },
        "children": [
            {
                "type": "div",
                "children": [
                    {
                        "type": "GenericGrid",
                        "props": {
                            "dataRef": "nfes",
                            "style": {
                                "maxHeight": "300px"
                            },
                            "resizable": true
                        },
                        "children": [
                            {
                                "type": "GridColumn",
                                "props": {
                                    "field": "serie",
                                    "title": "Série"
                                }
                            },
                            {
                                "type": "GridColumn",
                                "props": {
                                    "field": "numero",
                                    "title": "Número",
                                    "width": "80px"
                                }
                            },
                            {
                                "type": "GridColumn",
                                "props": {
                                    "field": "modelo",
                                    "title": "Modelo"
                                }
                            },
                            {
                                "type": "GridColumn",
                                "props": {
                                    "field": "emissao",
                                    "title": "Data de emissão"
                                }
                            },
                            {
                                "type": "GridColumn",
                                "props": {
                                    "field": "sinal",
                                    "title": "Sinal",
                                    "cell": "ChipCell"
                                }
                            },
                            {
                                "type": "GridColumn",
                                "props": {
                                    "field": "emitente_dados.nomefantasia",
                                    "title": "Emitente"
                                }
                            },
                            {
                                "type": "GridColumn",
                                "props": {
                                    "field": "cliente_fornecedor_dados.nome",
                                    "title": "Participante"
                                }
                            },
                            {
                                "type": "GridColumn",
                                "props": {
                                    "field": "valor",
                                    "title": "Valor Total"
                                }
                            },
                            {
                                "type": "GridColumn",
                                "props": {
                                    "field": "frete",
                                    "title": "Frete"
                                }
                            },
                            {
                                "type": "GridColumn",
                                "props": {
                                    "field": "situacao",
                                    "title": "Situação",
                                    "cell": "ChipCell"
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
~~~

---

### Exemplo 2 — Listagem com grid contendo mais funcionalidades e um botão de ação na tela.
Layout com colunas de status usando `ChipCell`, dotted fields, colunas redimensionáveis, seleção de visibilidade das colunas e botão de ação principal da tela.
~~~json
{
    "escopo": "cte",
    "codigo": "list-notas-para-cte",
    "descricao": "Layout de listagem de notas fiscais para o escopo cte",
    "tenant": 0,
    "grupo_empresarial": "00000000-0000-0000-0000-000000000000",
    "grupo_acesso": "00000000-0000-0000-0000-000000000000",
    "created_by": "versionamento@nasajon.com.br",
    "updated_by": "versionamento@nasajon.com.br",
    "json_schema": {
        "id": "cte_list-notas-para-cte",
        "type": "div",
        "transaction": {
            "name": "list-nfes-para-cte",
            "entities": [
                {
                    "name": "nfes",
                    "schema": "cte/NfeParaCte",
                    "load": true,
                    "loadingMessage": "Carregando notas fiscais",
                    "cardinality": "many"
                }
            ]
        },
        "app_bar": {
            "pageTitle": "Notas fiscais disponíveis para criar uma CT-e"
        },
        "children": [
            {
                "type": "div",
                "children": [
                    {
                        "type": "Row",
                        "props": {
                            "horizontalAlignment": "space-between",
                            "verticalAlignment": "center"
                        },
                        "children": [
                            {
                                "type": "FilterPanel",
                                "props": {
                                    "dataRef": "nfes"
                                }
                            },
                            {
                                "type": "Button",
                                "props": {
                                    "buttonType": "primary",
                                    "onClick": {
                                        "type": "Navigate",
                                        "props": {
                                            "navigateTo": "/new?nfes=nfes.selected"
                                        }
                                    }
                                },
                                "children": [
                                    "Selecionar"
                                ]
                            }
                        ]
                    },
                    {
                        "type": "div",
                        "props": {
                            "style": {
                                "height": "2rem"
                            }
                        }
                    },
                    {
                        "type": "Row",
                        "horizontalAlignment": "center",
                        "props": {
                            "liClassName": "max-width "
                        },
                        "children": [
                            {
                                "type": "GenericGrid",
                                "props": {
                                    "dataRef": "nfes",
                                    "style": {
                                        "maxHeight": "400px"
                                    },
                                    "enableColumnSelector": true,
                                    "resizable": true
                                },
                                "children": [
                                    {
                                        "type": "GridColumn",
                                        "props": {
                                            "field": "sinal",
                                            "title": "Sinal",
                                            "cell": "ChipCell"
                                        }
                                    },
                                    {
                                        "type": "GridColumn",
                                        "props": {
                                            "field": "emissao",
                                            "title": "Data de emissão"
                                        }
                                    },
                                    {
                                        "type": "GridColumn",
                                        "props": {
                                            "field": "numero",
                                            "title": "Número"
                                        }
                                    },
                                    {
                                        "type": "GridColumn",
                                        "props": {
                                            "field": "serie",
                                            "title": "Série"
                                        }
                                    },
                                    {
                                        "type": "GridColumn",
                                        "props": {
                                            "field": "modelo",
                                            "title": "Modelo"
                                        }
                                    },
                                    {
                                        "type": "GridColumn",
                                        "props": {
                                            "field": "estabelecimento.nomefantasia",
                                            "title": "Estabelecimento",
                                            "className": "overflown-column"
                                        }
                                    },
                                    {
                                        "type": "GridColumn",
                                        "props": {
                                            "field": "participante.nome",
                                            "title": "Participante",
                                            "className": "overflown-column"
                                        }
                                    },
                                    {
                                        "type": "GridColumn",
                                        "props": {
                                            "field": "valor",
                                            "title": "Valor"
                                        }
                                    },
                                    {
                                        "type": "GridColumn",
                                        "props": {
                                            "field": "situacao",
                                            "title": "Situação",
                                            "cell": "ChipCell"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
~~~

---

Especificação funcional da tela a ser gerada:

Crie uma tela de listagem de notas fiscais.

A tela deve carregar dados da entidade fiscal/NotaFiscal e exibir uma tabela com colunas:
- Número
- Série
- Data de emissão
- Tipo de operação (exibir como chip)
- Situação (exibir como chip)
- Valor total

A tabela deve ter altura máxima de 300px e permitir redimensionamento horizontal das colunas.

Este é o JSON da entidade fiscal/NotaFiscal:
```json
{
  "escopo": "fiscal",
  "codigo": "Nfe",
  "descricao": "Entidade Nota Fiscal eletrônica (NF-e) com dados principais do documento e status",
  "tenant": 0,
  "grupo_empresarial": "00000000-0000-0000-0000-000000000000",
  "grupo_acesso": "00000000-0000-0000-0000-000000000000",
  "created_by": "versionamento@nasajon.com.br",
  "updated_by": "versionamento@nasajon.com.br",
  "json_schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "fiscal/Nfe",
    "title": "Nota Fiscal eletrônica (NF-e)",
    "type": "object",
    "required": [
      "id",
      "numero",
      "serie",
      "data_criacao",
      "tipo_operacao",
      "situacao",
      "id_emitente",
      "id_destinatario",
      "data_saida_entrada",
      "valor",
      "itens"
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
      "serie": {
        "type": "string"
      },
      "data_criacao": {
        "type": "string",
        "format": "date"
      },
      "chave_acesso": {
        "type": "string"
      },
      "data_emissao": {
        "type": "string",
        "format": "date"
      },
      "tipo_operacao": {
        "type": "string"
      },
      "situacao": {
        "type": "string"
      },
      "id_emitente": {
        "type": "string",
        "format": "uuid"
      },
      "id_destinatario": {
        "type": "string",
        "format": "uuid"
      },
      "natureza_operacao": {
        "type": "string"
      },
      "data_saida_entrada": {
        "type": "string",
        "format": "date"
      },
      "valor": {
        "type": "string",
        "format": "currency",
        "label": "Valor"
      },
      "valor_frete": {
        "type": "string",
        "format": "currency",
        "label": "Valor do frete"
      },
      "valor_seguro": {
        "type": "string",
        "format": "currency",
        "label": "Valor do seguro"
      },
      "valor_desconto": {
        "type": "string",
        "format": "currency",
        "label": "Valor total de descontos"
      },
      "valor_impostos": {
        "type": "string",
        "format": "currency",
        "label": "Valor total de impostos"
      },
      "valor_total": {
        "type": "string",
        "format": "currency",
        "label": "Valor total da nota fiscal"
      },
      "observacoes": {
        "type": "string"
      },
      "itens": {
        "type": "array",
        "minItems": 1,
        "items": {
          "$ref": "#/components/schemas/NfeItem"
        }
      }
    },
    "filters": {
      "fields": {
        "tipo_operacao": {
          "type": "enum",
          "label": "Tipo de operação",
          "values": [
            "entrada",
            "saida"
          ]
        },
        "situacao": {
          "type": "enum",
          "label": "Situação",
          "values": [
            "aberta",
            "emitida",
            "cancelada",
            "inutilizada"
          ]
        }
      }
    },
    "components": {
      "schemas": {
        "NfeItem": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "$id": "fiscal/NfeItem",
          "title": "Item da NF-e",
          "type": "object",
          "required": [
            "id",
            "descricao",
            "quantidade",
            "valor_unitario",
            "valor_total"
          ],
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid",
              "pk": true
            },
            "codigo_produto": {
              "type": "string"
            },
            "descricao": {
              "type": "string"
            },
            "quantidade": {
              "type": "number"
            },
            "valor_unitario": {
              "type": "string",
              "format": "currency"
            },
            "valor_total": {
              "type": "string",
              "format": "currency"
            }
          }
        }
      }
    }
  }
}
```

---
CONTRATO DE SAÍDA (obrigatório):
1) Responda SOMENTE com um único objeto JSON válido.
2) Não use Markdown, não use blocos de código, não inclua explicações ou texto extra.
3) Use apenas componentes listados no JSON Schema de layout fornecido.
4) O JSON deve estar em conformidade com o JSON Schema de layout fornecido.
