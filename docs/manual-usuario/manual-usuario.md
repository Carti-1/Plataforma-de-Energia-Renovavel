# Manual do usuário

Plataforma de Energia Renovável · método TOPSIS

Esta plataforma classifica municípios pelo índice de **vulnerabilidade social energética**. O resultado é o coeficiente **Ci**, entre 0 e 1: **quanto maior o Ci, menor a vulnerabilidade**.

## 1. Acessar o sistema

1. Abra o endereço da plataforma (com Docker: <http://localhost:8080>; em desenvolvimento: <http://localhost:5173>).
2. Informe **e-mail** e **senha** e clique em **Entrar**.
3. Não existe cadastro pela tela de login: o **administrador** cria as contas.

Instalação de teste com Docker: o administrador inicial é `admin@energia.local`, com a senha `trocar-esta-senha-123`. Troque esses valores fora do ambiente de estudo (veja o `README.md`).

Para sair, clique em **Sair**, no rodapé do menu lateral, onde aparecem seu nome e seu perfil. A sessão expira sozinha após 8 horas; nesse caso você volta para a tela de login.

## 2. Perfis de acesso

| Perfil | O que pode fazer |
| --- | --- |
| **Gestor público** | Consultar o painel, executar o TOPSIS, exportar relatórios e ver o histórico. |
| **Pesquisador** | Tudo o que o gestor faz, mais configurar critérios (pela API). |
| **Administrador** | Tudo, incluindo cadastrar municípios e gerenciar usuários (pela API). |

## 3. A tela principal

O menu lateral leva às seções **Visão geral**, **Municípios**, **Mapa de municípios**, **Configuração TOPSIS** e **Histórico**.

### Visão geral

Quatro cartões resumem a análise: **Municípios analisados**, **Índice Ci médio**, **Critérios considerados** e **Município mais vulnerável**. Abaixo, o gráfico **Proximidade da solução ideal** mostra o Ci de cada município.

### Configuração TOPSIS

Cada linha é um critério (indicador), com:

- **Tipo de critério**: *Benefício* (quanto maior, melhor, como renda) ou *Custo* (quanto maior, pior, como tarifa de energia).
- **Peso**: a importância do critério, de 0 a 100%, ajustada no controle deslizante.

A **soma dos pesos precisa ser exatamente 100%**. Enquanto não for, o botão **Executar TOPSIS** fica desativado e a mensagem abaixo da lista informa quantos pontos faltam ou passaram.

Para recalcular:

1. Ajuste tipos e pesos.
2. Confira que a soma é 100%.
3. Clique em **Executar TOPSIS**. Aparece "Calculando..." e depois "TOPSIS executado com sucesso".

Cada execução é **salva no histórico**, em seu nome.

### Mapa de vulnerabilidade energética

Mostra um marcador por município que tenha coordenadas cadastradas. Clique no marcador para ver nome, UF, população, IDH e, se houver cálculo, a **posição no ranking** e o **Ci**. Municípios sem coordenadas não aparecem no mapa.

### Ranking de municípios

Lista os municípios do maior para o menor Ci, com a leitura de cada um (menos vulnerável, intermediário ou mais vulnerável).

- **Buscar município**: filtra a tabela pelo nome.
- **Exportar CSV**: baixa o ranking exibido, já filtrado pela busca.
- **Exportar PDF**: baixa o relatório da simulação atual. O botão só fica ativo depois de você clicar em **Executar TOPSIS** na configuração, porque o relatório pertence a uma simulação salva.

### Histórico de simulações

Mostra as 10 execuções mais recentes: número, data, quem executou e quantos municípios entraram. Em cada linha, os botões **PDF** e **CSV** baixam o relatório daquela execução. Assim é possível reabrir um resultado antigo sem recalcular.

## 4. Como ler o resultado

| Ci | Interpretação |
| --- | --- |
| Próximo de **1** | Município próximo da situação ideal: **menos vulnerável**. |
| Intermediário | Situação intermediária entre o melhor e o pior caso do conjunto. |
| Próximo de **0** | Município próximo da pior situação: **mais vulnerável**. |

O Ci é **relativo ao conjunto analisado**: ele compara os municípios entre si. Mudar os municípios, os pesos ou os tipos pode mudar o ranking. No relatório, **D+** e **D-** são as distâncias do município às soluções ideal positiva e negativa.

## 5. O relatório em PDF

Inclui o número e a data da simulação, o responsável, a tabela de critérios (com tipo e peso) e o ranking completo com Ci, D+ e D-. O CSV tem as mesmas colunas do ranking e abre direto no Excel em português.

## 6. Tarefas do administrador

Cadastro de municípios e de usuários é feito pela documentação interativa da API:

1. Abra `/api/docs` (por exemplo, <http://localhost:8080/api/docs>).
2. Em **Autenticação → POST /api/auth/login**, entre com seu e-mail e senha e copie o `token`.
3. Clique em **Authorize** e cole o token.
4. Use **Municípios → POST /api/municipios** ou **Usuários → POST /api/usuarios** (clique em *Try it out*, preencha e execute).

Para criar o primeiro administrador em uma instalação sem Docker: `npm run usuario:criar -- --email seu@email.com --senha "uma-senha-forte"` (na pasta `backend`).

## 7. Problemas comuns

| Mensagem ou sintoma | O que fazer |
| --- | --- |
| "E-mail ou senha incorretos." | Confira os dados. Se esqueceu a senha, peça ao administrador para redefini-la. |
| "Não foi possível conectar à API. O backend está rodando?" | O servidor não está acessível. Confira se o backend (ou o `docker compose up`) está ativo. |
| Voltou sozinho para a tela de login | A sessão expirou. Entre novamente. |
| Botão **Executar TOPSIS** desativado | A soma dos pesos não é 100%. Ajuste os controles. |
| Botão **Exportar PDF** desativado | Execute o TOPSIS na configuração. Relatórios antigos estão no **Histórico**. |
| Mapa sem marcadores | Os municípios não têm coordenadas. O administrador deve informar latitude e longitude. |
| "Seu perfil não tem permissão para esta ação." | A ação exige outro perfil. Fale com o administrador. |
