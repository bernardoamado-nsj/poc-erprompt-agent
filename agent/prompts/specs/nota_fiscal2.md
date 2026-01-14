A entidade modela uma Nota Fiscal (NF-e) e deve representar os dados principais do documento fiscal e o seu status.

Campos:
- id: identificador único da nota fiscal (UUID). [OBRIGATÓRIO]
- numero: número da nota fiscal. [OBRIGATÓRIO] [FILTRO]
- serie: série da nota fiscal. [OBRIGATÓRIO]
- chave_acesso: chave de acesso (44 dígitos) da NF-e. [OBRIGATÓRIO]
- data_emissao: data de emissão da nota fiscal. [OBRIGATÓRIO] [FILTRO]
- tipo_operacao: indica se é entrada ou saída ("entrada" ou "saida"). [OBRIGATÓRIO] [FILTRO]
- situacao: status da nota fiscal: "aberta", "emitida", "cancelada", "inutilizada". [OBRIGATÓRIO] [FILTRO]
- id_emitente: identificador do emitente (UUID). [OBRIGATÓRIO] [FILTRO]
- id_destinatario: identificador do destinatário (UUID). [OBRIGATÓRIO] [FILTRO]
- natureza_operacao: descrição da natureza da operação.
- data_saida_entrada: data de saída/entrada da mercadoria (quando aplicável).
- valor_produtos: valor total dos produtos/serviços.
- valor_frete: valor do frete.
- valor_seguro: valor do seguro.
- valor_desconto: valor total de descontos.
- valor_impostos: valor total de impostos.
- valor_total: valor total da nota fiscal. [OBRIGATÓRIO]
- observacoes: observações adicionais do documento.

Itens:
- itens: lista de itens da nota fiscal. Cada item deve ser uma estrutura própria (entidade interna reutilizável). Cada item deve conter pelo menos: produto/serviço, quantidade, unidade, valor_unitario e valor_total. [OBRIGATÓRIO]
