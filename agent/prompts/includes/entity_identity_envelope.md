## Identidade da entidade (OBRIGATÓRIO quando fornecida)

Se os valores abaixo estiverem presentes, você DEVE usá-los exatamente:
- escopo: @include $entity_scope
- codigo: @include $entity_code

Regras:
- NÃO invente, traduza, abrevie ou modifique o codigo.
- Preserve o formato original do codigo (ex.: kebab-case, PascalCase) conforme fornecido.
- No campo json_schema.$id use exatamente "<escopo>/<codigo>" (com barra).

Se este bloco estiver ausente (execução standalone), você pode inferir escopo/codigo normalmente.

