export type Estabelecimento = {
  nomefantasia: string;
  raizcnpj: string;
  ordemcnpj: string;
  cnpj: string;
  pk: string;
  id: string;
  inscricao_estadual: string;
  ibge: string;
  uf: string;
  cep?: string;
  logradouro: string;
  tipo_logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
};

export type Municipio = {
  uf: string;
  nome: string;
  id: string;
};

export type ConfigLocacoes = {
  AmbienteEmissorDocumentos: string;
  MockCancelarCteApiUrl: string;
  MockEmitirCteApiUrl: string;
  GeraCte: string;
};
