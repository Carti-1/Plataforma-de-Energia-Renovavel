# Documento de Requisitos

Plataforma de Energia Renovável com TOPSIS · baseado no Capítulo 2 do roteiro (ISO/IEC 12207 e 25010).

## 1. Objetivo

Mensurar indicadores multicritério de vulnerabilidade social energética de municípios com o método TOPSIS, apoiando gestores públicos e pesquisadores (ODS 7). Maior coeficiente de proximidade (Ci) indica **menor** vulnerabilidade.

## 2. Stakeholders

| Stakeholder | Papel | Interesse | Perfil no sistema |
| --- | --- | --- | --- |
| Gestor público | Usuário primário | Identificar comunidades vulneráveis para políticas públicas | `gestor` |
| Pesquisador | Usuário especialista | Analisar correlações entre indicadores | `pesquisador` |
| Administrador | Operação | Cadastrar municípios e usuários | `administrador` |
| Comunidade | Beneficiária | Acesso a energia limpa e acessível | — |
| Equipe de desenvolvimento | Produtora | Entregar software funcional e documentado | — |
| Professor orientador | Validador | Garantir rigor metodológico e acadêmico | — |

## 3. Requisitos funcionais

Status: **Atendido** (funciona de ponta a ponta), **Parcial** (existe, com a limitação indicada) ou **Pendente**.

| ID | Descrição | Prioridade | Status | Como é atendido / limitação |
| --- | --- | --- | --- | --- |
| RF01 | Cadastrar municípios/comunidades com dados socioeconômicos | Alta | Parcial | API completa (`/api/municipios`: nome, UF, população, IDH, coordenadas), restrita ao administrador. **Não há tela de cadastro**, e os valores da matriz de decisão entram só pelo seed/SQL (não há endpoint para eles). |
| RF02 | Cadastrar indicadores e critérios de vulnerabilidade | Alta | Parcial | API completa (`/api/criterios`) para administrador e pesquisador. **Não há tela de cadastro.** |
| RF03 | Configurar pesos dos critérios TOPSIS | Alta | Atendido | Painel "Configuração TOPSIS": tipo (benefício/custo) e peso por critério; a soma precisa ser 100%. |
| RF04 | Executar o cálculo TOPSIS e gerar o ranking | Alta | Atendido | `POST /api/topsis/executar`; botão "Executar TOPSIS". Exemplo 7.3 reproduzido (B > A > C) e coberto por teste. |
| RF05 | Visualizar resultados em dashboard com gráficos | Média | Atendido | Cards de resumo, gráfico de barras do Ci e tabela de ranking. |
| RF06 | Exportar relatórios em PDF/CSV | Média | Atendido | PDF e CSV por simulação (`/api/relatorios/:id/pdf` e `/csv`); a tela também exporta o ranking exibido em CSV. |
| RF07 | Visualização georreferenciada (mapa) | Média | Atendido | Mapa Leaflet com um marcador por município **que tenha coordenadas**; o popup mostra população, IDH, posição e Ci. Não há camada de calor nem cores por faixa. |
| RF08 | Gerenciar usuários e perfis de acesso | Alta | Parcial | API de usuários (`/api/usuarios`, só administrador) e três perfis com permissões. **Não há tela de administração**; o primeiro administrador é criado por `npm run usuario:criar`. |
| RF09 | Importar dados de fontes externas (IBGE, ANEEL) | Baixa | Pendente | Não implementado. |
| RF10 | Histórico de simulações TOPSIS | Baixa | Atendido | `GET /api/simulacoes`, `GET /api/simulacoes/:id` e painel "Histórico de simulações" com download de PDF/CSV. |

## 4. Requisitos não funcionais

| ID | Descrição | Categoria ISO 25010 | Status | Evidência |
| --- | --- | --- | --- | --- |
| RNF01 | Cálculo TOPSIS < 3 s para 500 alternativas | Eficiência de desempenho | Atendido | Teste automático `topsis.desempenho.test.js`; o cálculo de 500 × 7 leva da ordem de 10 ms. |
| RNF02 | Interface responsiva (desktop, tablet, mobile) | Usabilidade | Parcial | O CSS tem regras para telas menores (`@media`), mas não foi validado em dispositivos reais. |
| RNF03 | Disponibilidade ≥ 99,5% | Confiabilidade | Não medido | Depende da hospedagem; o projeto não tem monitoramento. |
| RNF04 | Autenticação via JWT com bcrypt | Segurança | Atendido | Login em `/api/auth/login`; senhas com hash bcrypt; todas as demais rotas exigem token. Testes de integração em `auth.test.js`. |
| RNF05 | Cobertura de testes ≥ 80% | Manutenibilidade | Atendido | `npm run test:coverage` falha abaixo de 80%; o último resultado foi de cerca de 88% (instruções) e 87% (linhas). Executado no CI. |
| RNF06 | Documentação via Swagger/OpenAPI | Portabilidade | Atendido | Interface em `/api/docs`; a especificação é validada nos testes. |

## 5. Qualidade (ISO/IEC 25010)

| Característica | Sub-característica | Métrica | Meta | Situação |
| --- | --- | --- | --- | --- |
| Adequação funcional | Completude | % de requisitos funcionais atendidos | ≥ 90% | 6 de 10 atendidos e 3 parciais (ver seção 3). **Meta não atingida.** |
| Eficiência de desempenho | Tempo de resposta | Tempo do cálculo TOPSIS | < 3 s | Atendida (RNF01). |
| Usabilidade | Aprendizado | Tempo para a primeira tarefa | < 5 min | Não medida (exigiria teste com usuários). |
| Confiabilidade | Disponibilidade | Uptime mensal | ≥ 99,5% | Não medida. |
| Segurança | Confidencialidade | Dados protegidos por autenticação | 100% | Atendida: só o login e a documentação são públicos. |
| Manutenibilidade | Modularidade | Acoplamento entre módulos | Baixo | Rotas, controladores, serviços e repositórios separados; a lógica do TOPSIS não depende de Express nem do banco. |
| Portabilidade | Adaptabilidade | Funciona em 3+ navegadores | Chrome, Firefox, Safari | Não verificada. |

## 6. Rastreabilidade

| Requisito | Código principal | Testes |
| --- | --- | --- |
| RF03, RF04 | `backend/src/services/topsis.service.js`, `frontend/src/App.jsx` | `topsis.service.test.js`, `simulacoes.test.js` |
| RF01, RF02 | `backend/src/routes/municipios.routes.js`, `criterios.routes.js` | `auth.test.js`, `criterios-dados.test.js` |
| RF06, RF10 | `backend/src/services/relatorio.service.js`, `routes/simulacoes.routes.js` | `relatorio.service.test.js`, `simulacoes.test.js` |
| RF08, RNF04 | `backend/src/middlewares/auth.middleware.js`, `routes/usuarios.routes.js` | `auth.service.test.js`, `auth.test.js` |
| RF07 | `frontend/src/components/MapaVulnerabilidade.jsx` | Verificação manual |
| RNF06 | `backend/src/docs/openapi.js` | `openapi.test.js`, `docs.test.js` |

## 7. Limitações conhecidas

- **Matriz de decisão sem endpoint de escrita.** Um município novo só entra no TOPSIS se tiver valores em `matriz_decisao`, hoje inseridos apenas pelo seed ou por SQL. A matriz é lida por posição: se um município não tiver valor para algum critério, a lista de valores fica menor que a de critérios e o cálculo é recusado.
- **Critérios C6 e C7** (extrema pobreza e projetos ativos) do roteiro não estão no seed; a matriz de exemplo usa C1 a C5.
- **Sem testes E2E** (Cypress) e sem validação em dispositivos e navegadores reais.
- **JWT sem revogação:** o token vale até expirar (`JWT_EXPIRES_IN`, padrão 8 h) e não há limite de tentativas de login.
