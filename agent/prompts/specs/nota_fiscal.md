A minha entidade vai modelar notas fiscais e deve ter os seguintes campos
- id: tipo uuid, chave primária
- valor: tipo number, representa o valor total da nota fiscal
- data_criacao: tipo date, representa a data em que a nota fiscal foi criada
- data_emissao: tipo date, representa a data de emissão da nota fiscal
- id_cliente: tipo uuid, representa o cliente que deve receber os produtos da nota fiscal
- id_fornecedor: tipo uuid, representa o fornecedor que disponibiliza os produtos da nota fiscal
- situacao: tipo string, representa a status da nota fiscal podendo ser "aberta", "emitida" ou "cancelada"
- itens: tipo array, representa os itens presente na nota. **Para funcionar precisa que ele seja um array de itens de nota e que item de nota seja outra entidade internamente**.
