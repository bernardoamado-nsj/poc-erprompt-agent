# Questionário SRE
> Esse questionário tem por objetivo ajudar o time de SRE na manutenção do serviço em produção.

## Overview do Serviço
> O que é? O que isso faz? Descreva em alto nível as funcionalidades fornecidas aos clientes (usuários finais, componentes, etc).

Front-end da aplicação WEB para gerenciamento de CT-e. Antes estava como uma funcionalidade do sistema Locações Web.

O objetivo dessa aplicação é possibilitar a criação de CT-es, edição, emissão para a SEFAZ e cancelamento.

##  Descrição da Arquitetura
> Explique como a arquitetura funciona. Descrever os fluxos de dados entre componentes. Considerar adicionando um diagrama de sistema com dependências críticas e solicitações e fluxos de dados.

Nesta primeira versão o sistema vai precisar se comunicar com 5 APIs:

- API do Força de Vendas
  - Para consultar, criar e emitir as CTEs.
- API da Tesouraria
  - Para a criação dos títulos a receber ao emitir uma CTE.
- API de Locações
  - Para consulta das notas fiscais disponíveis para usar numa CTE.
- API de Dados Mestre
  - Para consulta de estabelecimentos, formas de pagamento, municípios e veículos.
- API do ERPrompt
  - Para telas de renderização dinâmicas utilizando a biblioteca do ERPrompt.

## Clientes e Dependências
> Liste todos os clientes upstream (propriedade de outras equipes) que confiar e as relações downstream (propriedade de outras equipes) de que depende. (Esses também pode ser mostrado em um diagrama).

O Locações SQL vai precisar conseguir enviar o usuário para este sistema. No futuro a ideia é que qualquer módulo do ERP desktop consiga direcionar o usuário para uma tela deste sistema sem ele precisar se logar novamente.
O Locações Web deve também conseguir acessar telas deste sistema.

## Códigos e Configurações
> Explique a configuração da produção. Onde é executado? relacione aqui nomes, Workers, Databases e arquivos de configuração ou aponte para localização canônica destes. Forneça também a localização do código e como construir as imagens ou compilar o código, se relevante. Liste e descreva os arquivos de configuração, alterações e portas necessárias para operar este produto ou serviço. Aborde o seguinte: Qual a configuração padrão para este serviço? Quais variáveis de ambiente, secrets e outras informações de setup são importantes.

### Tipo de aplicação

Aplicação web de front-end (sem workers).

### Repositório

- Link: https://github.com/Nasajon/cte-web
- Dockerfile: https://github.com/Nasajon/cte-web/blob/main/Dockerfile (dockerfile padrão dos apps front-end feitos em HTML)

### Variáveis de Build

|       Variável            | Descrição                                                  | Valor em Produção                       | Obrigatória |
| :-----------------------: | ---------------------------------------------------------- | ---------------------------------------------- | ----------- |
| VITE_ERPROMPT_API_URL     | URL da API do ERPPrompt.                                   | https://api.nasajon.app/erprompt-api/1234      | Sim         |
| VITE_CLIENTES_URL         | URL da API de Clientes.                                    | https://api.nasajon.app/forca-venda/4514/ctes  | Sim         |
| VITE_ESTABELECIMENTOS_URL | URL da API de Estabelecimentos.                            | https://api.nasajon.app/dados-mestre/erp3/2531/estabelecimentos  | Sim         |
| VITE_FORMASPAGAMENTO_URL  | URL da API de formas de pagamento.                         | https://api.nasajon.app/dados-mestre/erp3/2531/formas-pagamento  | Sim         |
| VITE_MUNICIPIOS_URL       | URL da API de municípios                                   | https://api.nasajon.app/dados-mestre/erp3/2531/municipios  | Sim         |
| VITE_NFE_URL              | URL da API de notas fiscais.                               | https://api.nasajon.com.br/estoque-api/2711/notas-fiscais  | Sim         |
| VITE_NFE_PARA_CTE_URL     | Endpoint para listar as NFEs que podem ser usadas numa CTE | https://api.nasajon.app/locacoes/451/nfes-para-cte  | Sim         |
| VITE_TITULOSRECEBER_URL   | URL da API de títulos a receber                            | https://api.nasajon.app/tesouraria/erp3/284/titulos/recebimentos  | Sim         |


### Workers

Essa aplicação não contém workers.

### Entrypoint

Entrypoint padrão da imagem base React (sem customização).

## Monitoramento e Gerenciamento
> Cite o que deve ser monitorado e os indicadores para situações de ALARME e CRÍTICO. Coloque os links para os scripts criados e que devem ser utilizados no processo de monitoramento.

Por hora, essa aplicação não contém monitoramento específico.

## Dicionário de Erros e Procedimentos Operacionais
> Coloque os links com os procedimentos comuns que deverão ser utilizados de acordo com as mensagens que aparecem no log da aplicação.

Ainda não há procedimentos específicos a serem aplicados.
