# Desafio de testes: Truco Paulista (2 duplas)

Este repositório tem **apenas os casos de teste** (Jest). O desafio é implementar `src/truco.js` até que todos passem.

```bash
npm install
npm test
```

> Sem a implementação, os testes falham com `Cannot find module '../src/truco'`, e isso é esperado.

## Regras adotadas

- Baralho de **40 cartas** (sem 8, 9, 10 e coringas).
- Força das cartas comuns, em ordem crescente: `4 5 6 7 Q J K A 2 3`.
- **Vira**: a manilha é o valor logo acima da vira, de forma cíclica (vira `3` → manilha `4`).
- Força das manilhas: `ouros` (pica-fumo) < `espadas` < `copas` < `paus` (zap).
- Cartas comuns de mesmo valor empatam, seja qual for o naipe.
- 4 jogadores. **Time 0 = jogadores 0 e 2**, **time 1 = jogadores 1 e 3**. A ordem de jogada é 0 → 1 → 2 → 3.
- Abre a mão o jogador `(dealer + 1) % 4`. O dealer avança uma posição a cada nova mão.
- A mão é disputada em melhor de 3 rodadas:
  - quem vence a rodada começa a próxima;
  - se a rodada empatar, começa de novo quem a iniciou;
  - se a carta mais forte empatar entre **parceiros**, o time deles vence a rodada;
  - empatou a 1ª rodada: leva a mão quem vencer a 2ª;
  - venceu a 1ª e empatou a 2ª ou a 3ª: leva quem venceu a 1ª;
  - três rodadas empatadas: ninguém pontua.
- Apostas: a mão vale **1 → 3 (truco) → 6 → 9 → 12**.
  - Só o jogador da vez pede, e o mesmo time não pede duas vezes seguidas.
  - Qualquer jogador do time adversário pode `aceitar`, `correr` ou `aumentar`.
  - Quem corre entrega ao time que pediu o valor que a mão tinha **antes** do pedido.
- **Mão de onze**: o time com 11 pontos decide se joga (a mão vale 3) ou corre (o adversário ganha 1). Não se pode pedir truco.
- **Mão de ferro** (11 x 11): a mão vale 1, sem truco.
- Vence a partida o time que chegar a **12 pontos**.

## API esperada (`src/truco.js`, CommonJS)

| Export | Descrição |
|---|---|
| `VALORES`, `NAIPES` | Arrays em ordem crescente de força |
| `criarBaralho()` | 40 cartas `{ valor, naipe }` |
| `embaralhar(baralho, rng?)` | Devolve um novo array e não altera o original |
| `calcularManilha(vira)` | Valor da manilha (string) |
| `ehManilha(carta, vira)` | `boolean` |
| `forcaCarta(carta, vira)` | Número usado para comparar cartas |
| `compararCartas(a, b, vira)` | `1`, `-1` ou `0` |
| `timeDoJogador(j)` | `0` ou `1` |
| `vencedorRodada(jogadas, vira)` | `{ time, jogador }`, com `null` nos dois campos em caso de empate |
| `vencedorMao(resultados)` | `{ finalizada, vencedor }` |
| `proximoValorAposta(v)` | 1→3→6→9→12→`null` |
| `PartidaTruco` | Classe da partida (veja abaixo) |

`new PartidaTruco({ dealer = 0, rng = Math.random, placar = [0, 0] })`

- Métodos: `novaMao(distribuicao?)`, `jogarCarta(jogador, carta)`, `pedirTruco(jogador)`, `responderTruco(jogador, 'aceitar' | 'correr' | 'aumentar')`, `decidirMaoDeOnze(time, jogar)`, `maoDoJogador(j)`.
- Getters: `placar`, `dealer`, `vez`, `vira`, `manilha`, `valorMao`, `vencedor`, `maoFinalizada`, `vencedorUltimaMao`, `resultadosRodadas`, `mesa`, `apostaPendente`, `maoDeOnze`, `maoDeFerro`.
- `distribuicao = { maos: [[c,c,c] x4], vira }` fixa as cartas, o que é útil nos testes.
- Ações inválidas (fora da vez, carta que não está na mão, aposta pendente, partida encerrada) lançam erro.

## Arquivos de teste

- `__tests__/cartas.test.js`: baralho, manilha e força das cartas
- `__tests__/rodada.test.js`: vencedor da rodada e da mão
- `__tests__/partida.test.js`: fluxo da partida, truco, mão de onze, mão de ferro e fim de jogo
