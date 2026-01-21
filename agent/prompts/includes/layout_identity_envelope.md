## Identidade do layout (OBRIGATÓRIO quando fornecida)

Se os valores abaixo estiverem presentes, você DEVE usá-los exatamente:
- escopo: @include $layout_scope
- codigo: @include $layout_code

Regras:
- NÃO invente, traduza, abrevie ou modifique o codigo.
- Se o codigo já vier no formato kebab-case, preserve integralmente.
- json_schema.id deve ser "<escopo>_<codigo>" (underscore).

Se este bloco estiver ausente (por execução standalone), você pode inferir escopo/codigo normalmente.
