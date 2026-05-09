# TODO — Bolão da Copa

## Setup e Branding
- [x] Gerar logo do aplicativo
- [x] Configurar tema de cores (verde/amarelo Copa)
- [x] Atualizar app.config.ts com nome e logo

## Banco de Dados e Backend
- [x] Definir schema do banco (jogos, apostas, ligas, membros de liga)
- [x] Criar rotas tRPC para autenticação e usuários
- [x] Criar rotas tRPC para jogos (CRUD admin)
- [x] Criar rotas tRPC para apostas (criar/listar)
- [x] Criar rotas tRPC para pontuação (calcular após resultado)
- [x] Criar rotas tRPC para ranking
- [x] Criar rotas tRPC para ligas privadas

## Autenticação
- [x] Tela de login com OAuth Manus
- [x] Proteção de rotas (redirecionar se não logado)
- [x] Suporte a perfil admin vs usuário

## Navegação
- [x] Configurar tab bar (Jogos, Ranking, Ligas, Perfil)
- [x] Tab extra para Admin (Painel) — visível apenas para admins
- [x] Ícones mapeados no icon-symbol.tsx

## Tela de Jogos (Home)
- [x] Lista de jogos com cards
- [x] Filtros: Todos / Abertos / Ao Vivo / Encerrados
- [x] Bandeiras dos países (emoji)
- [x] Status badge (Aberto/Ao Vivo/Encerrado)
- [x] Navegação para tela de aposta

## Tela de Aposta
- [x] Formulário com placar previsto
- [x] Validação: apenas números inteiros
- [x] Travamento após início do jogo
- [x] Exibir aposta existente (somente leitura se travado)
- [x] Feedback de sucesso ao confirmar

## Tela de Ranking
- [x] Pódio visual top 3
- [x] Lista completa com posição, avatar, nome, pontos
- [x] Destaque para posição do usuário logado
- [x] Atualização automática após resultado

## Tela de Ligas
- [x] Lista de ligas do usuário
- [x] Entrar em liga com código
- [x] Ranking interno da liga

## Tela de Perfil
- [x] Avatar + nome + e-mail
- [x] Estatísticas (pontos, apostas certas, placar exato)
- [x] Histórico de apostas
- [x] Botão de logout

## Painel do Administrador
- [x] Cadastrar novo jogo (times, data/hora, fase, estádio)
- [x] Editar jogo existente
- [x] Inserir resultado oficial
- [x] Calcular pontuações automaticamente
- [x] Gerenciar usuários (bloquear/desbloquear, promover/rebaixar)
- [x] Criar e gerenciar ligas privadas com código automático


## Autenticação Email+Senha (Independente de Manus)
- [x] Criar arquivo auth-local.ts com funções de registro/login
- [x] Implementar hash de senha com bcryptjs
- [x] Implementar geração de JWT para sessão local
- [x] Adicionar rotas tRPC: register, login, verifyToken
- [x] Criar hook useLocalAuth para gerenciar estado de autenticação
- [x] Reescrever tela de login com formulário email+senha
- [x] Criar tela de cadastro (register)
- [x] Persistir token em AsyncStorage
- [x] Zero erros de TypeScript
