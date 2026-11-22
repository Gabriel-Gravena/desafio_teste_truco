/**
 * Truco Paulista — baralho, manilhas e força das cartas.
 *
 * Baralho "sujo" de 40 cartas (sem 8, 9, 10 e coringas).
 * Ordem crescente das cartas comuns: 4 5 6 7 Q J K A 2 3
 * Ordem crescente dos naipes (só importa para manilhas): ouros < espadas < copas < paus
 * Manilha = valor imediatamente acima da "vira" (cíclico: vira 3 => manilha 4).
 */
const {
  VALORES,
  NAIPES,
  criarBaralho,
  embaralhar,
  calcularManilha,
  ehManilha,
  forcaCarta,
  compararCartas,
} = require('../src/truco');

const c = (valor, naipe) => ({ valor, naipe });

describe('constantes', () => {
  test('VALORES está na ordem crescente de força do truco paulista', () => {
    expect(VALORES).toEqual(['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3']);
  });

  test('NAIPES está na ordem crescente de força das manilhas', () => {
    expect(NAIPES).toEqual(['ouros', 'espadas', 'copas', 'paus']);
  });
});

describe('criarBaralho', () => {
  const baralho = criarBaralho();

  test('tem 40 cartas', () => {
    expect(baralho).toHaveLength(40);
  });

  test('não tem cartas repetidas', () => {
    const chaves = new Set(baralho.map((x) => `${x.valor}-${x.naipe}`));
    expect(chaves.size).toBe(40);
  });

  test('cada carta é um objeto { valor, naipe }', () => {
    baralho.forEach((carta) => {
      expect(VALORES).toContain(carta.valor);
      expect(NAIPES).toContain(carta.naipe);
    });
  });

  test('não contém 8, 9, 10 nem coringa', () => {
    ['8', '9', '10', 'coringa', 'JOKER'].forEach((v) => {
      expect(baralho.some((x) => x.valor === v)).toBe(false);
    });
  });

  test('tem 10 cartas de cada naipe e 4 de cada valor', () => {
    NAIPES.forEach((n) => expect(baralho.filter((x) => x.naipe === n)).toHaveLength(10));
    VALORES.forEach((v) => expect(baralho.filter((x) => x.valor === v)).toHaveLength(4));
  });

  test('retorna um baralho novo a cada chamada', () => {
    const a = criarBaralho();
    const b = criarBaralho();
    expect(a).not.toBe(b);
    a.pop();
    expect(b).toHaveLength(40);
  });
});

describe('embaralhar', () => {
  test('mantém as mesmas 40 cartas', () => {
    const original = criarBaralho();
    const embaralhado = embaralhar(original);
    const ordenar = (arr) => arr.map((x) => `${x.valor}-${x.naipe}`).sort();
    expect(ordenar(embaralhado)).toEqual(ordenar(original));
  });

  test('não altera o array recebido', () => {
    const original = criarBaralho();
    const copia = JSON.parse(JSON.stringify(original));
    embaralhar(original);
    expect(original).toEqual(copia);
  });

  test('é determinístico quando recebe a mesma função rng', () => {
    const rngFixo = () => {
      let s = 42;
      return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    };
    expect(embaralhar(criarBaralho(), rngFixo())).toEqual(embaralhar(criarBaralho(), rngFixo()));
  });

  test('muda a ordem das cartas', () => {
    expect(embaralhar(criarBaralho())).not.toEqual(criarBaralho());
  });
});

describe('calcularManilha', () => {
  test.each([
    ['4', '5'],
    ['5', '6'],
    ['6', '7'],
    ['7', 'Q'],
    ['Q', 'J'],
    ['J', 'K'],
    ['K', 'A'],
    ['A', '2'],
    ['2', '3'],
    ['3', '4'],
  ])('vira %s => manilha %s', (vira, manilha) => {
    expect(calcularManilha(c(vira, 'copas'))).toBe(manilha);
  });

  test('o naipe da vira não influencia a manilha', () => {
    NAIPES.forEach((n) => expect(calcularManilha(c('7', n))).toBe('Q'));
  });

  test('lança erro para vira inválida', () => {
    expect(() => calcularManilha(c('8', 'copas'))).toThrow();
    expect(() => calcularManilha(c('4', 'estrelas'))).toThrow();
    expect(() => calcularManilha(null)).toThrow();
  });
});

describe('ehManilha', () => {
  const vira = c('K', 'ouros'); // manilha = A

  test('identifica as 4 manilhas', () => {
    NAIPES.forEach((n) => expect(ehManilha(c('A', n), vira)).toBe(true));
  });

  test('a própria vira e outras cartas não são manilha', () => {
    expect(ehManilha(c('K', 'paus'), vira)).toBe(false);
    expect(ehManilha(c('3', 'paus'), vira)).toBe(false);
  });
});

describe('forcaCarta / compararCartas', () => {
  const vira = c('4', 'ouros'); // manilha = 5

  test('forcaCarta retorna um número', () => {
    expect(typeof forcaCarta(c('3', 'paus'), vira)).toBe('number');
  });

  test('cartas comuns seguem a ordem 4 < 6 < 7 < Q < J < K < A < 2 < 3 (sem a manilha 5)', () => {
    const ordem = ['4', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
    for (let i = 0; i < ordem.length - 1; i++) {
      expect(compararCartas(c(ordem[i + 1], 'ouros'), c(ordem[i], 'ouros'), vira)).toBe(1);
      expect(compararCartas(c(ordem[i], 'ouros'), c(ordem[i + 1], 'ouros'), vira)).toBe(-1);
    }
  });

  test('cartas comuns de mesmo valor e naipes diferentes empatam', () => {
    expect(compararCartas(c('3', 'paus'), c('3', 'ouros'), vira)).toBe(0);
    expect(compararCartas(c('K', 'copas'), c('K', 'espadas'), vira)).toBe(0);
  });

  test('qualquer manilha vence a carta comum mais forte (3)', () => {
    NAIPES.forEach((n) => {
      expect(compararCartas(c('5', n), c('3', 'paus'), vira)).toBe(1);
    });
  });

  test('manilhas: zap (paus) > copas > espadas > ouros (pica-fumo)', () => {
    expect(compararCartas(c('5', 'paus'), c('5', 'copas'), vira)).toBe(1);
    expect(compararCartas(c('5', 'copas'), c('5', 'espadas'), vira)).toBe(1);
    expect(compararCartas(c('5', 'espadas'), c('5', 'ouros'), vira)).toBe(1);
    expect(compararCartas(c('5', 'ouros'), c('5', 'paus'), vira)).toBe(-1);
  });

  test('vira 3 faz do 4 a manilha, e o 4 passa a vencer o 3', () => {
    const vira3 = c('3', 'copas');
    expect(compararCartas(c('4', 'ouros'), c('3', 'paus'), vira3)).toBe(1);
  });

  test('o mesmo valor muda de força conforme a vira', () => {
    const q = c('Q', 'paus');
    const k = c('K', 'paus');
    expect(compararCartas(q, k, c('4', 'ouros'))).toBe(-1); // Q comum < K
    expect(compararCartas(q, k, c('7', 'ouros'))).toBe(1); // Q é manilha
  });

  test('lança erro para carta inválida', () => {
    expect(() => forcaCarta(c('9', 'copas'), vira)).toThrow();
  });
});
