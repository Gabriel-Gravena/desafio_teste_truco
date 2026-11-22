/**
 * Truco Paulista — quem vence cada rodada (vaza) e quem vence a mão.
 *
 * Jogadores 0, 1, 2 e 3 sentados em sentido anti-horário.
 * Time 0 = jogadores 0 e 2 | Time 1 = jogadores 1 e 3.
 */
const { timeDoJogador, vencedorRodada, vencedorMao } = require('../src/truco');

const c = (valor, naipe) => ({ valor, naipe });
const vira = c('4', 'ouros'); // manilha = 5

describe('timeDoJogador', () => {
  test('jogadores 0 e 2 são do time 0; 1 e 3 do time 1', () => {
    expect(timeDoJogador(0)).toBe(0);
    expect(timeDoJogador(2)).toBe(0);
    expect(timeDoJogador(1)).toBe(1);
    expect(timeDoJogador(3)).toBe(1);
  });

  test('lança erro para jogador inexistente', () => {
    expect(() => timeDoJogador(4)).toThrow();
    expect(() => timeDoJogador(-1)).toThrow();
  });
});

describe('vencedorRodada', () => {
  test('a carta mais forte vence e retorna time e jogador', () => {
    const jogadas = [
      { jogador: 0, carta: c('7', 'copas') },
      { jogador: 1, carta: c('3', 'paus') },
      { jogador: 2, carta: c('K', 'copas') },
      { jogador: 3, carta: c('Q', 'paus') },
    ];
    expect(vencedorRodada(jogadas, vira)).toEqual({ time: 1, jogador: 1 });
  });

  test('manilha vence o 3', () => {
    const jogadas = [
      { jogador: 0, carta: c('3', 'copas') },
      { jogador: 1, carta: c('3', 'paus') },
      { jogador: 2, carta: c('5', 'ouros') },
      { jogador: 3, carta: c('2', 'paus') },
    ];
    expect(vencedorRodada(jogadas, vira)).toEqual({ time: 0, jogador: 2 });
  });

  test('zap vence as outras manilhas', () => {
    const jogadas = [
      { jogador: 2, carta: c('5', 'copas') },
      { jogador: 3, carta: c('5', 'paus') },
      { jogador: 0, carta: c('5', 'espadas') },
      { jogador: 1, carta: c('5', 'ouros') },
    ];
    expect(vencedorRodada(jogadas, vira)).toEqual({ time: 1, jogador: 3 });
  });

  test('empate entre times adversários na carta mais forte => empate (time null)', () => {
    const jogadas = [
      { jogador: 0, carta: c('3', 'copas') },
      { jogador: 1, carta: c('3', 'paus') },
      { jogador: 2, carta: c('7', 'ouros') },
      { jogador: 3, carta: c('A', 'paus') },
    ];
    expect(vencedorRodada(jogadas, vira)).toEqual({ time: null, jogador: null });
  });

  test('empate entre parceiros na carta mais forte => o time deles vence (primeiro a jogar é o vencedor)', () => {
    const jogadas = [
      { jogador: 1, carta: c('2', 'copas') },
      { jogador: 2, carta: c('K', 'paus') },
      { jogador: 3, carta: c('2', 'ouros') },
      { jogador: 0, carta: c('J', 'paus') },
    ];
    expect(vencedorRodada(jogadas, vira)).toEqual({ time: 1, jogador: 1 });
  });

  test('empate em carta mais fraca não importa', () => {
    const jogadas = [
      { jogador: 0, carta: c('4', 'copas') },
      { jogador: 1, carta: c('4', 'paus') },
      { jogador: 2, carta: c('A', 'ouros') },
      { jogador: 3, carta: c('6', 'paus') },
    ];
    expect(vencedorRodada(jogadas, vira)).toEqual({ time: 0, jogador: 2 });
  });
});

describe('vencedorMao (melhor de 3 rodadas; null = rodada empatada)', () => {
  test.each([
    [[0], false, null],
    [[1], false, null],
    [[null], false, null],
    [[0, 1], false, null],
    [[1, 0], false, null],
    [[null, null], false, null],
  ])('%j => ainda não finalizada', (rodadas, finalizada, vencedor) => {
    expect(vencedorMao(rodadas)).toEqual({ finalizada, vencedor });
  });

  test.each([
    [[0, 0], 0],
    [[1, 1], 1],
    [[0, 1, 0], 0],
    [[1, 0, 1], 1],
    [[0, 1, 1], 1],
  ])('%j => vence quem ganhou 2 rodadas (time %s)', (rodadas, vencedor) => {
    expect(vencedorMao(rodadas)).toEqual({ finalizada: true, vencedor });
  });

  test.each([
    [[null, 0], 0],
    [[null, 1], 1],
  ])('empatou a 1ª: quem vence a 2ª leva a mão — %j', (rodadas, vencedor) => {
    expect(vencedorMao(rodadas)).toEqual({ finalizada: true, vencedor });
  });

  test.each([
    [[0, null], 0],
    [[1, null], 1],
  ])('venceu a 1ª e empatou a 2ª: quem venceu a 1ª leva — %j', (rodadas, vencedor) => {
    expect(vencedorMao(rodadas)).toEqual({ finalizada: true, vencedor });
  });

  test.each([
    [[0, 1, null], 0],
    [[1, 0, null], 1],
  ])('1 a 1 e empatou a 3ª: quem venceu a 1ª leva — %j', (rodadas, vencedor) => {
    expect(vencedorMao(rodadas)).toEqual({ finalizada: true, vencedor });
  });

  test.each([
    [[null, null, 0], 0],
    [[null, null, 1], 1],
  ])('empatou 1ª e 2ª: quem vence a 3ª leva — %j', (rodadas, vencedor) => {
    expect(vencedorMao(rodadas)).toEqual({ finalizada: true, vencedor });
  });

  test('três empates => mão finalizada sem vencedor (ninguém pontua)', () => {
    expect(vencedorMao([null, null, null])).toEqual({ finalizada: true, vencedor: null });
  });
});
