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
