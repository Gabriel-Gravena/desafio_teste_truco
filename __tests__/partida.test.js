const { PartidaTruco } = require('../src/truco');

const c = (valor, naipe) => ({ valor, naipe });
const VIRA = c('4', 'ouros');

const DIST_TIME0 = {
  vira: VIRA,
  maos: [
    [c('5', 'paus'), c('5', 'copas'), c('6', 'ouros')],
    [c('4', 'paus'), c('4', 'copas'), c('4', 'espadas')],
    [c('6', 'paus'), c('6', 'copas'), c('6', 'espadas')],
    [c('7', 'paus'), c('7', 'copas'), c('7', 'espadas')],
  ],
};

const DIST_TIME1 = {
  vira: VIRA,
  maos: [
    [c('4', 'paus'), c('4', 'copas'), c('4', 'espadas')],
    [c('5', 'paus'), c('5', 'copas'), c('6', 'ouros')],
    [c('6', 'paus'), c('6', 'copas'), c('6', 'espadas')],
    [c('7', 'paus'), c('7', 'copas'), c('7', 'espadas')],
  ],
};

function jogar(partida, ...cartas) {
  cartas.forEach((carta) => partida.jogarCarta(partida.vez, carta));
}

function time0VenceMao(partida) {
  jogar(partida, c('5', 'paus'), c('4', 'paus'), c('6', 'paus'), c('7', 'paus'));
  jogar(partida, c('5', 'copas'), c('4', 'copas'), c('6', 'copas'), c('7', 'copas'));
}

function time1VenceMao(partida) {
  jogar(partida, c('4', 'paus'), c('5', 'paus'), c('6', 'paus'), c('7', 'paus'));
  jogar(partida, c('5', 'copas'), c('6', 'copas'), c('7', 'copas'), c('4', 'copas'));
}

describe('estado inicial', () => {
  test('placar começa 0 x 0, sem vencedor e sem mão em andamento', () => {
    const p = new PartidaTruco();
    expect(p.placar).toEqual([0, 0]);
    expect(p.vencedor).toBeNull();
    expect(p.maoFinalizada).toBe(true);
  });

  test('aceita placar inicial (útil para testes)', () => {
    expect(new PartidaTruco({ placar: [7, 3] }).placar).toEqual([7, 3]);
  });

  test('placar retornado é uma cópia', () => {
    const p = new PartidaTruco();
    p.placar[0] = 99;
    expect(p.placar).toEqual([0, 0]);
  });

  test('não é possível jogar antes de iniciar uma mão', () => {
    const p = new PartidaTruco();
    expect(() => p.jogarCarta(0, c('4', 'paus'))).toThrow();
    expect(() => p.pedirTruco(0)).toThrow();
  });
});

describe('novaMao (distribuição)', () => {
  test('sem distribuição definida, dá 3 cartas a cada jogador e vira 1 carta, todas diferentes', () => {
    const p = new PartidaTruco();
    p.novaMao();
    const todas = [0, 1, 2, 3].flatMap((j) => p.maoDoJogador(j));
    [0, 1, 2, 3].forEach((j) => expect(p.maoDoJogador(j)).toHaveLength(3));
    todas.push(p.vira);
    expect(new Set(todas.map((x) => `${x.valor}-${x.naipe}`)).size).toBe(13);
  });

  test('com distribuição definida, usa exatamente as cartas informadas', () => {
    const p = new PartidaTruco();
    p.novaMao(DIST_TIME0);
    expect(p.vira).toEqual(VIRA);
    expect(p.manilha).toBe('5');
    [0, 1, 2, 3].forEach((j) => expect(p.maoDoJogador(j)).toEqual(DIST_TIME0.maos[j]));
  });

  test('a mão começa valendo 1 ponto, sem aposta pendente e sem rodadas jogadas', () => {
    const p = new PartidaTruco();
    p.novaMao(DIST_TIME0);
    expect(p.valorMao).toBe(1);
    expect(p.apostaPendente).toBeNull();
    expect(p.resultadosRodadas).toEqual([]);
    expect(p.maoFinalizada).toBe(false);
  });

  test('rejeita distribuição com cartas repetidas', () => {
    const p = new PartidaTruco();
    const dist = { vira: VIRA, maos: DIST_TIME0.maos.map((m) => [...m]) };
    dist.maos[1][0] = c('5', 'paus');
    expect(() => p.novaMao(dist)).toThrow();
  });

  test('rejeita distribuição com vira repetida em alguma mão', () => {
    const p = new PartidaTruco();
    expect(() => p.novaMao({ ...DIST_TIME0, vira: c('6', 'ouros') })).toThrow();
  });

  test('rejeita mãos com quantidade errada de cartas', () => {
    const p = new PartidaTruco();
    const dist = { vira: VIRA, maos: DIST_TIME0.maos.map((m) => [...m]) };
    dist.maos[0].pop();
    expect(() => p.novaMao(dist)).toThrow();
  });

  test('não permite iniciar nova mão com outra em andamento', () => {
    const p = new PartidaTruco();
    p.novaMao(DIST_TIME0);
    expect(() => p.novaMao(DIST_TIME0)).toThrow();
  });

  test('maoDoJogador retorna uma cópia', () => {
    const p = new PartidaTruco();
    p.novaMao(DIST_TIME0);
    p.maoDoJogador(0).pop();
    expect(p.maoDoJogador(0)).toHaveLength(3);
  });
});

describe('ordem de jogada', () => {
  test('começa o jogador à direita do dealer', () => {
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(DIST_TIME0);
    expect(p.vez).toBe(0);

    const q = new PartidaTruco({ dealer: 1 });
    q.novaMao(DIST_TIME0);
    expect(q.vez).toBe(2);
  });

  test('o dealer avança a cada nova mão', () => {
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(DIST_TIME0);
    time0VenceMao(p);
    p.novaMao(DIST_TIME0);
    expect(p.dealer).toBe(0);
    expect(p.vez).toBe(1);
  });

  test('a vez passa para o próximo jogador (0 -> 1 -> 2 -> 3)', () => {
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(DIST_TIME0);
    p.jogarCarta(0, c('6', 'ouros'));
    expect(p.vez).toBe(1);
    p.jogarCarta(1, c('4', 'paus'));
    expect(p.vez).toBe(2);
    p.jogarCarta(2, c('6', 'paus'));
    expect(p.vez).toBe(3);
  });

  test('jogar fora da vez lança erro', () => {
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(DIST_TIME0);
    expect(() => p.jogarCarta(1, c('4', 'paus'))).toThrow();
  });

  test('jogar carta que não está na mão lança erro', () => {
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(DIST_TIME0);
    expect(() => p.jogarCarta(0, c('3', 'paus'))).toThrow();
  });

  test('a carta jogada sai da mão e vai para a mesa', () => {
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(DIST_TIME0);
    p.jogarCarta(0, c('6', 'ouros'));
    expect(p.maoDoJogador(0)).toHaveLength(2);
    expect(p.maoDoJogador(0)).not.toContainEqual(c('6', 'ouros'));
    expect(p.mesa).toEqual([{ jogador: 0, carta: c('6', 'ouros') }]);
  });

  test('a mesa é limpa quando a rodada termina', () => {
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(DIST_TIME0);
    jogar(p, c('5', 'paus'), c('4', 'paus'), c('6', 'paus'), c('7', 'paus'));
    expect(p.mesa).toEqual([]);
    expect(p.resultadosRodadas).toEqual([0]);
  });

  test('quem vence a rodada começa a próxima', () => {
    const dist = {
      vira: VIRA,
      maos: [
        [c('4', 'paus'), c('4', 'copas'), c('4', 'espadas')],
        [c('6', 'paus'), c('6', 'copas'), c('6', 'espadas')],
        [c('5', 'paus'), c('5', 'copas'), c('6', 'ouros')],
        [c('7', 'paus'), c('7', 'copas'), c('7', 'espadas')],
      ],
    };
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(dist);
    jogar(p, c('4', 'paus'), c('6', 'paus'), c('5', 'paus'), c('7', 'paus'));
    expect(p.vez).toBe(2);
  });

  test('em rodada empatada, quem iniciou a rodada começa a próxima', () => {
    const dist = {
      vira: VIRA,
      maos: [
        [c('3', 'paus'), c('A', 'ouros'), c('K', 'paus')],
        [c('3', 'copas'), c('Q', 'ouros'), c('K', 'copas')],
        [c('4', 'paus'), c('4', 'copas'), c('4', 'espadas')],
        [c('6', 'paus'), c('6', 'copas'), c('6', 'espadas')],
      ],
    };
    const p = new PartidaTruco({ dealer: 0 });
    p.novaMao(dist);
    jogar(p, c('3', 'copas'), c('4', 'paus'), c('6', 'paus'), c('3', 'paus'));
    expect(p.resultadosRodadas).toEqual([null]);
    expect(p.vez).toBe(1);
  });
});

describe('resultado da mão', () => {
  test('time que vence 2 rodadas ganha 1 ponto e a mão termina sem jogar a 3ª', () => {
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(DIST_TIME0);
    time0VenceMao(p);
    expect(p.resultadosRodadas).toEqual([0, 0]);
    expect(p.maoFinalizada).toBe(true);
    expect(p.vencedorUltimaMao).toBe(0);
    expect(p.placar).toEqual([1, 0]);
    expect(() => p.jogarCarta(p.vez, c('6', 'ouros'))).toThrow();
  });

  test('time 1 também pontua', () => {
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(DIST_TIME1);
    time1VenceMao(p);
    expect(p.placar).toEqual([0, 1]);
  });

  test('empate na 1ª e vitória na 2ª: vencedor da 2ª leva a mão', () => {
    const dist = {
      vira: VIRA,
      maos: [
        [c('3', 'paus'), c('A', 'ouros'), c('K', 'paus')],
        [c('3', 'copas'), c('Q', 'ouros'), c('K', 'copas')],
        [c('4', 'paus'), c('4', 'copas'), c('4', 'espadas')],
        [c('6', 'paus'), c('6', 'copas'), c('6', 'espadas')],
      ],
    };
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(dist);
    jogar(p, c('3', 'paus'), c('3', 'copas'), c('4', 'paus'), c('6', 'paus'));
    jogar(p, c('A', 'ouros'), c('Q', 'ouros'), c('4', 'copas'), c('6', 'copas'));
    expect(p.resultadosRodadas).toEqual([null, 0]);
    expect(p.placar).toEqual([1, 0]);
    expect(p.maoFinalizada).toBe(true);
  });

  test('três rodadas empatadas: ninguém pontua', () => {
    const dist = {
      vira: VIRA,
      maos: [
        [c('3', 'paus'), c('2', 'paus'), c('A', 'paus')],
        [c('3', 'copas'), c('2', 'copas'), c('A', 'copas')],
        [c('4', 'paus'), c('4', 'copas'), c('4', 'espadas')],
        [c('6', 'paus'), c('6', 'copas'), c('6', 'espadas')],
      ],
    };
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(dist);
    jogar(p, c('3', 'paus'), c('3', 'copas'), c('4', 'paus'), c('6', 'paus'));
    jogar(p, c('2', 'paus'), c('2', 'copas'), c('4', 'copas'), c('6', 'copas'));
    jogar(p, c('A', 'paus'), c('A', 'copas'), c('4', 'espadas'), c('6', 'espadas'));
    expect(p.resultadosRodadas).toEqual([null, null, null]);
    expect(p.maoFinalizada).toBe(true);
    expect(p.vencedorUltimaMao).toBeNull();
    expect(p.placar).toEqual([0, 0]);
  });

  test('1 x 1 nas rodadas: a 3ª decide', () => {
    const dist = {
      vira: VIRA,
      maos: [
        [c('5', 'paus'), c('4', 'paus'), c('5', 'espadas')],
        [c('6', 'paus'), c('5', 'copas'), c('4', 'copas')],
        [c('6', 'copas'), c('7', 'paus'), c('7', 'copas')],
        [c('6', 'espadas'), c('7', 'espadas'), c('Q', 'paus')],
      ],
    };
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(dist);
    jogar(p, c('5', 'paus'), c('6', 'paus'), c('6', 'copas'), c('6', 'espadas'));
    jogar(p, c('4', 'paus'), c('5', 'copas'), c('7', 'paus'), c('7', 'espadas'));
    expect(p.vez).toBe(1);
    jogar(p, c('4', 'copas'), c('7', 'copas'), c('Q', 'paus'), c('5', 'espadas'));
    expect(p.resultadosRodadas).toEqual([0, 1, 0]);
    expect(p.placar).toEqual([1, 0]);
  });
});

describe('truco e aumentos', () => {
  let p;
  beforeEach(() => {
    p = new PartidaTruco({ dealer: 3 });
    p.novaMao(DIST_TIME0);
  });

  test('pedir truco cria aposta pendente de 3 pontos para o time do pedinte', () => {
    p.pedirTruco(0);
    expect(p.apostaPendente).toEqual({ valor: 3, time: 0 });
    expect(p.valorMao).toBe(1);
  });

  test('só o jogador da vez pode pedir truco', () => {
    expect(() => p.pedirTruco(1)).toThrow();
    expect(() => p.pedirTruco(2)).toThrow();
  });

  test('não é possível jogar carta com aposta pendente', () => {
    p.pedirTruco(0);
    expect(() => p.jogarCarta(0, c('5', 'paus'))).toThrow();
  });

  test('não é possível pedir truco com aposta pendente', () => {
    p.pedirTruco(0);
    expect(() => p.pedirTruco(0)).toThrow();
  });

  test('o próprio time não pode responder ao seu pedido', () => {
    p.pedirTruco(0);
    expect(() => p.responderTruco(0, 'aceitar')).toThrow();
    expect(() => p.responderTruco(2, 'aceitar')).toThrow();
  });

  test('qualquer jogador do time adversário pode responder', () => {
    p.pedirTruco(0);
    expect(() => p.responderTruco(3, 'aceitar')).not.toThrow();
  });

  test('responder sem aposta pendente lança erro', () => {
    expect(() => p.responderTruco(1, 'aceitar')).toThrow();
  });

  test('resposta inválida lança erro', () => {
    p.pedirTruco(0);
    expect(() => p.responderTruco(1, 'talvez')).toThrow();
  });

  test('aceitar: mão passa a valer 3 e a vez continua com quem pediu', () => {
    p.pedirTruco(0);
    p.responderTruco(1, 'aceitar');
    expect(p.valorMao).toBe(3);
    expect(p.apostaPendente).toBeNull();
    expect(p.vez).toBe(0);
    time0VenceMao(p);
    expect(p.placar).toEqual([3, 0]);
  });

  test('correr do truco: quem pediu ganha 1 ponto e a mão acaba', () => {
    p.pedirTruco(0);
    p.responderTruco(1, 'correr');
    expect(p.placar).toEqual([1, 0]);
    expect(p.maoFinalizada).toBe(true);
    expect(p.vencedorUltimaMao).toBe(0);
    expect(p.apostaPendente).toBeNull();
  });

  test('aumentar para seis: mão vale 3 e o pedido de 6 fica com o outro time', () => {
    p.pedirTruco(0);
    p.responderTruco(1, 'aumentar');
    expect(p.valorMao).toBe(3);
    expect(p.apostaPendente).toEqual({ valor: 6, time: 1 });
  });

  test('correr do seis: quem pediu seis ganha 3', () => {
    p.pedirTruco(0);
    p.responderTruco(1, 'aumentar');
    p.responderTruco(2, 'correr');
    expect(p.placar).toEqual([0, 3]);
    expect(p.maoFinalizada).toBe(true);
  });

  test('aceitar o seis: mão vale 6', () => {
    p.pedirTruco(0);
    p.responderTruco(1, 'aumentar');
    p.responderTruco(0, 'aceitar');
    expect(p.valorMao).toBe(6);
    time0VenceMao(p);
    expect(p.placar).toEqual([6, 0]);
  });

  test('sequência completa 3 -> 6 -> 9 -> 12', () => {
    p.pedirTruco(0);
    p.responderTruco(1, 'aumentar');
    p.responderTruco(0, 'aumentar');
    expect(p.apostaPendente).toEqual({ valor: 9, time: 0 });
    p.responderTruco(3, 'aumentar');
    expect(p.apostaPendente).toEqual({ valor: 12, time: 1 });
    expect(p.valorMao).toBe(9);
    p.responderTruco(2, 'aceitar');
    expect(p.valorMao).toBe(12);
  });

  test('correr do doze dá 9 pontos a quem pediu', () => {
    p.pedirTruco(0);
    p.responderTruco(1, 'aumentar');
    p.responderTruco(0, 'aumentar');
    p.responderTruco(1, 'aumentar');
    p.responderTruco(0, 'correr');
    expect(p.placar).toEqual([0, 9]);
  });

  test('não é possível aumentar além de 12', () => {
    p.pedirTruco(0);
    p.responderTruco(1, 'aumentar');
    p.responderTruco(0, 'aumentar');
    p.responderTruco(1, 'aumentar');
    expect(() => p.responderTruco(0, 'aumentar')).toThrow();
  });

  test('não é possível pedir aumento com a mão valendo 12', () => {
    p.pedirTruco(0);
    p.responderTruco(1, 'aumentar');
    p.responderTruco(0, 'aumentar');
    p.responderTruco(1, 'aumentar');
    p.responderTruco(0, 'aceitar');
    expect(() => p.pedirTruco(0)).toThrow();
  });

  test('o mesmo time não pode pedir aumento duas vezes seguidas', () => {
    p.pedirTruco(0);
    p.responderTruco(1, 'aceitar');
    expect(() => p.pedirTruco(0)).toThrow();
    p.jogarCarta(0, c('5', 'paus'));
    p.jogarCarta(1, c('4', 'paus'));
    expect(() => p.pedirTruco(2)).toThrow();
  });

  test('depois de aceito, o time adversário pode pedir seis na sua vez', () => {
    p.pedirTruco(0);
    p.responderTruco(1, 'aceitar');
    p.jogarCarta(0, c('5', 'paus'));
    p.pedirTruco(1);
    expect(p.apostaPendente).toEqual({ valor: 6, time: 1 });
  });

  test('depois que o adversário aumentou, o time original pode pedir de novo na sua vez', () => {
    p.pedirTruco(0);
    p.responderTruco(1, 'aumentar');
    p.responderTruco(0, 'aceitar');
    expect(() => p.pedirTruco(0)).not.toThrow();
    expect(p.apostaPendente).toEqual({ valor: 9, time: 0 });
  });
});

describe('fim de partida', () => {
  test('time que chega a 12 pontos vence a partida', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [10, 4] });
    p.novaMao(DIST_TIME0);
    p.pedirTruco(0);
    p.responderTruco(1, 'aceitar');
    time0VenceMao(p);
    expect(p.placar[0]).toBeGreaterThanOrEqual(12);
    expect(p.vencedor).toBe(0);
  });

  test('vencer por correr do adversário também encerra a partida', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [4, 9] });
    p.novaMao(DIST_TIME0);
    p.pedirTruco(0);
    p.responderTruco(1, 'aumentar');
    p.responderTruco(0, 'correr');
    expect(p.vencedor).toBe(1);
  });

  test('após o fim da partida não é possível iniciar nova mão', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [10, 4] });
    p.novaMao(DIST_TIME0);
    p.pedirTruco(0);
    p.responderTruco(1, 'aceitar');
    time0VenceMao(p);
    expect(() => p.novaMao()).toThrow();
  });

  test('menos de 12 pontos não encerra a partida', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [8, 0] });
    p.novaMao(DIST_TIME0);
    p.pedirTruco(0);
    p.responderTruco(1, 'aceitar');
    time0VenceMao(p);
    expect(p.placar).toEqual([11, 0]);
    expect(p.vencedor).toBeNull();
  });
});

describe('mão de onze', () => {
  test('quando um time tem 11 pontos, a mão começa aguardando a decisão desse time', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [11, 5] });
    p.novaMao(DIST_TIME0);
    expect(p.maoDeOnze).toEqual({ time: 0, decidida: false });
    expect(p.maoDeFerro).toBe(false);
  });

  test('não se joga carta antes da decisão', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [11, 5] });
    p.novaMao(DIST_TIME0);
    expect(() => p.jogarCarta(0, c('5', 'paus'))).toThrow();
  });

  test('só o time com 11 pontos decide', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [11, 5] });
    p.novaMao(DIST_TIME0);
    expect(() => p.decidirMaoDeOnze(1, true)).toThrow();
  });

  test('não é possível decidir duas vezes', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [11, 5] });
    p.novaMao(DIST_TIME0);
    p.decidirMaoDeOnze(0, true);
    expect(() => p.decidirMaoDeOnze(0, true)).toThrow();
  });

  test('decidir fora de mão de onze lança erro', () => {
    const p = new PartidaTruco({ dealer: 3 });
    p.novaMao(DIST_TIME0);
    expect(() => p.decidirMaoDeOnze(0, true)).toThrow();
  });

  test('jogar a mão de onze: vale 3 pontos e vencer encerra a partida', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [11, 5] });
    p.novaMao(DIST_TIME0);
    p.decidirMaoDeOnze(0, true);
    expect(p.valorMao).toBe(3);
    time0VenceMao(p);
    expect(p.vencedor).toBe(0);
  });

  test('perder a mão de onze dá 3 pontos ao adversário', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [11, 5] });
    p.novaMao(DIST_TIME1);
    p.decidirMaoDeOnze(0, true);
    time1VenceMao(p);
    expect(p.placar).toEqual([11, 8]);
    expect(p.vencedor).toBeNull();
  });

  test('correr da mão de onze dá 1 ponto ao adversário e encerra a mão', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [11, 5] });
    p.novaMao(DIST_TIME0);
    p.decidirMaoDeOnze(0, false);
    expect(p.placar).toEqual([11, 6]);
    expect(p.maoFinalizada).toBe(true);
  });

  test('o time 1 também pode estar na mão de onze', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [2, 11] });
    p.novaMao(DIST_TIME0);
    expect(p.maoDeOnze).toEqual({ time: 1, decidida: false });
    p.decidirMaoDeOnze(1, false);
    expect(p.placar).toEqual([3, 11]);
  });

  test('não se pode pedir truco na mão de onze', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [5, 11] });
    p.novaMao(DIST_TIME0);
    p.decidirMaoDeOnze(1, true);
    expect(() => p.pedirTruco(0)).toThrow();
  });
});

describe('mão de ferro (11 x 11)', () => {
  test('ambos com 11: mão vale 1, não há decisão nem truco', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [11, 11] });
    p.novaMao(DIST_TIME0);
    expect(p.maoDeFerro).toBe(true);
    expect(p.maoDeOnze).toBeNull();
    expect(p.valorMao).toBe(1);
    expect(() => p.pedirTruco(0)).toThrow();
    expect(() => p.decidirMaoDeOnze(0, true)).toThrow();
  });

  test('quem vence a mão de ferro vence a partida', () => {
    const p = new PartidaTruco({ dealer: 3, placar: [11, 11] });
    p.novaMao(DIST_TIME1);
    time1VenceMao(p);
    expect(p.placar).toEqual([11, 12]);
    expect(p.vencedor).toBe(1);
  });
});

describe('simulação de partida completa', () => {
  test('jogando sempre a primeira carta da mão, a partida termina com um vencedor', () => {
    const p = new PartidaTruco();
    let maos = 0;
    while (p.vencedor === null) {
      p.novaMao();
      if (p.maoDeOnze) p.decidirMaoDeOnze(p.maoDeOnze.time, true);
      while (!p.maoFinalizada) p.jogarCarta(p.vez, p.maoDoJogador(p.vez)[0]);
      maos += 1;
      if (maos > 500) throw new Error('partida não terminou');
    }
    expect([0, 1]).toContain(p.vencedor);
    expect(p.placar[p.vencedor]).toBeGreaterThanOrEqual(12);
    expect(p.placar[1 - p.vencedor]).toBeLessThan(12);
  });
});
