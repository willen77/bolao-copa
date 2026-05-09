# Design — Bolão da Copa

## Identidade Visual

**Paleta de Cores:**
- Primary: `#1A6B3C` (verde escuro — futebol/grama)
- Secondary: `#F5C518` (amarelo ouro — Copa do Mundo)
- Accent: `#003087` (azul escuro — seleção)
- Background Light: `#F8F9FA`
- Background Dark: `#0D1117`
- Surface Light: `#FFFFFF`
- Surface Dark: `#161B22`
- Success: `#22C55E`
- Warning: `#F59E0B`
- Error: `#EF4444`

**Tipografia:** Sistema nativo (SF Pro no iOS, Roboto no Android)

---

## Lista de Telas

### Autenticação
1. **Splash / Onboarding** — Logo + botão "Entrar com Manus"
2. **Login** — E-mail + senha, link para cadastro
3. **Cadastro** — Nome, e-mail, senha, foto de perfil (opcional)

### Usuário (tabs principais)
4. **Jogos** (Home) — Lista de jogos por fase/data, status (aberto/encerrado/em andamento)
5. **Minha Aposta** (dentro de Jogos) — Formulário de aposta para jogo selecionado
6. **Ranking** — Lista de usuários ordenada por pontuação, destaque top 3
7. **Ligas** — Ligas privadas que o usuário participa, opção de entrar com código
8. **Perfil** — Foto, nome, pontuação total, histórico de apostas, logout

### Administrador (tab extra)
9. **Painel Admin** — Dashboard com estatísticas
10. **Gerenciar Jogos** — Lista + botão adicionar jogo
11. **Cadastrar Jogo** — Formulário: times, data/hora, fase
12. **Inserir Resultado** — Selecionar jogo + placar final
13. **Gerenciar Usuários** — Lista de usuários, bloquear/desbloquear
14. **Gerenciar Ligas** — Criar e editar ligas privadas

---

## Fluxos Principais

### Fluxo de Aposta
1. Usuário abre aba "Jogos"
2. Vê lista de jogos disponíveis (não iniciados)
3. Toca em um jogo → abre tela de aposta
4. Digita placar previsto (ex: Brasil 2 x 1 Argentina)
5. Confirma aposta → feedback visual de sucesso
6. Após início do jogo → aposta travada (somente leitura)

### Fluxo de Pontuação (Admin)
1. Admin acessa "Inserir Resultado"
2. Seleciona jogo finalizado
3. Digita placar oficial
4. Confirma → sistema calcula pontos automaticamente:
   - Placar exato → 3 pontos
   - Resultado correto (V/E/D) → 1 ponto
   - Errou → 0 pontos
5. Ranking atualizado automaticamente

### Fluxo de Liga Privada
1. Admin cria liga com nome + código de convite
2. Usuário acessa aba "Ligas" → "Entrar com código"
3. Digita código → entra na liga
4. Liga tem ranking próprio apenas com membros

---

## Layout por Tela

### Tela de Jogos (Home)
- Header: Logo + título "Bolão da Copa"
- Filtros horizontais: Todos / Hoje / Abertos / Encerrados
- Cards de jogos: bandeiras dos times, placar (se disponível), data/hora, status badge
- FAB (apenas admin): + Adicionar Jogo

### Card de Jogo
```
┌─────────────────────────────────┐
│  [BRA] Brasil  x  Argentina [ARG]│
│   2  ────────────────  1        │
│  📅 20/11 · 16h00               │
│  🟢 Aberto para apostas         │
└─────────────────────────────────┘
```

### Tela de Ranking
- Pódio visual para top 3 (ouro/prata/bronze)
- Lista com posição, avatar, nome, pontos
- Destaque para posição do usuário logado

### Tela de Perfil
- Avatar circular grande
- Nome + e-mail
- Estatísticas: total de pontos, apostas certas, placar exato
- Histórico de apostas em lista

---

## Componentes Reutilizáveis

- `GameCard` — Card de jogo com times, placar e status
- `BetForm` — Formulário de aposta com inputs numéricos
- `RankingRow` — Linha do ranking com posição e pontos
- `StatusBadge` — Badge colorido (Aberto/Em andamento/Encerrado)
- `TeamFlag` — Bandeira + nome do time
- `LeagueCard` — Card de liga privada
