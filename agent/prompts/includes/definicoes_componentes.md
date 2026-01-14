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

