REM node render-template.cjs prompts\gerar_entidade.md --json_schema schemas/entity.schema.json --field_types_definitions prompts/includes/definicoes_campos2.md -o final_prompt.md

REM node render-template.cjs prompts\gerar_entidade_full_user.md --json_schema schemas/entity.schema.json --field_types_definitions prompts/includes/definicoes_campos2.md -o final_prompt_web.md

REM ------------ ENTITIES -------------


node render-template.cjs prompts\gerar_entidade.md ^
    --json_schema schemas/entity.schema.json ^
    --field_types_definitions prompts/includes/definicoes_campos_entidades.md ^
    --filters_definitions prompts/includes/definicoes_filtros_entidades.md ^
    --entity_examples prompts/includes/exemplos_canonicos_entidades.md ^
    --spec prompts/specs/nota_fiscal3.md ^
    -o prompts\final\prompt_entidade_nota_fiscal.md

node render-template.cjs prompts\gerar_entidade_full_agent_prompt.md ^
    --json_schema schemas/entity.schema.json ^
    --field_types_definitions prompts/includes/definicoes_campos_entidades.md ^
    --filters_definitions prompts/includes/definicoes_filtros_entidades.md ^
    --entity_examples prompts/includes/exemplos_canonicos_entidades.md ^
    --spec prompts/specs/nota_fiscal3.md ^
    -o prompts\agent_final\prompt_nota_fiscal_20260113.md

REM ------------ LAYOUTS ---------------
node render-template.cjs prompts\gerar_layout.md ^
    --layout_json_schema schemas/layout.schema.json ^
    --layout_component_definitions prompts/includes/definicoes_componentes.md ^
    --layout_examples prompts/includes/exemplos_canonicos_layouts.md ^
    --spec prompts/specs/listagem-notas.md ^
    -o prompts\final\prompt_listagem_nota_fiscal.md

node render-template.cjs prompts\gerar_layout_full_agent_prompt.md ^
    --layout_json_schema schemas/layout.schema.json ^
    --layout_component_definitions prompts/includes/definicoes_componentes.md ^
    --layout_examples prompts/includes/exemplos_canonicos_layouts.md ^
    --spec prompts/specs/layout_lista_nota_fiscal.md ^
    -o prompts\agent_final\prompt_listagem_nota_fiscal_20260113.md

REM ------------- PLANNER ------------------
node render-template.cjs prompts/planner/gerar_planner.md ^
    --user_spec prompts/specs/user_funcionalidade_nfe.md ^
    -o prompts/agent_final/prompt_planner_nfe_20260115.md
