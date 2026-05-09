import { describe, it, expect } from "vitest";

// ─── Funções de pontuação (copiadas da lógica do db.ts) ───────────────────────

function calculatePoints(betHome: number, betAway: number, realHome: number, realAway: number): number {
  if (betHome === realHome && betAway === realAway) return 3;
  const betResult = Math.sign(betHome - betAway);
  const realResult = Math.sign(realHome - realAway);
  if (betResult === realResult) return 1;
  return 0;
}

// ─── Função de geração de código de liga ──────────────────────────────────────

function generateLeagueCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("Sistema de Pontuação do Bolão", () => {
  describe("Placar exato → 3 pontos", () => {
    it("deve retornar 3 pontos quando o placar é exato (vitória)", () => {
      expect(calculatePoints(2, 1, 2, 1)).toBe(3);
    });

    it("deve retornar 3 pontos quando o placar é exato (empate)", () => {
      expect(calculatePoints(1, 1, 1, 1)).toBe(3);
    });

    it("deve retornar 3 pontos quando o placar é exato (derrota)", () => {
      expect(calculatePoints(0, 2, 0, 2)).toBe(3);
    });

    it("deve retornar 3 pontos para placar 0x0", () => {
      expect(calculatePoints(0, 0, 0, 0)).toBe(3);
    });
  });

  describe("Resultado correto → 1 ponto", () => {
    it("deve retornar 1 ponto quando acertou vitória mas não o placar", () => {
      expect(calculatePoints(2, 0, 3, 1)).toBe(1);
    });

    it("deve retornar 1 ponto quando acertou empate mas não o placar", () => {
      expect(calculatePoints(0, 0, 2, 2)).toBe(1);
    });

    it("deve retornar 1 ponto quando acertou derrota mas não o placar", () => {
      expect(calculatePoints(0, 2, 1, 3)).toBe(1);
    });

    it("deve retornar 1 ponto para vitória por margem diferente", () => {
      expect(calculatePoints(1, 0, 4, 0)).toBe(1);
    });
  });

  describe("Errou → 0 pontos", () => {
    it("deve retornar 0 pontos quando apostou em vitória mas foi derrota", () => {
      expect(calculatePoints(2, 0, 0, 1)).toBe(0);
    });

    it("deve retornar 0 pontos quando apostou em empate mas foi vitória", () => {
      expect(calculatePoints(1, 1, 2, 0)).toBe(0);
    });

    it("deve retornar 0 pontos quando apostou em derrota mas foi vitória", () => {
      expect(calculatePoints(0, 2, 2, 1)).toBe(0);
    });

    it("deve retornar 0 pontos quando apostou em vitória mas foi empate", () => {
      expect(calculatePoints(3, 1, 1, 1)).toBe(0);
    });
  });

  describe("Casos extremos", () => {
    it("deve lidar com placares altos corretamente", () => {
      expect(calculatePoints(5, 3, 5, 3)).toBe(3);
      expect(calculatePoints(5, 3, 4, 2)).toBe(1);
      expect(calculatePoints(5, 3, 1, 2)).toBe(0);
    });
  });
});

describe("Código de Liga", () => {
  it("deve gerar um código com 6 caracteres", () => {
    const code = generateLeagueCode();
    expect(code.length).toBe(6);
  });

  it("deve gerar um código em maiúsculas", () => {
    const code = generateLeagueCode();
    expect(code).toBe(code.toUpperCase());
  });

  it("deve gerar códigos diferentes a cada chamada", () => {
    const codes = new Set(Array.from({ length: 10 }, generateLeagueCode));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("Validação de Apostas", () => {
  it("deve aceitar placar 0x0", () => {
    const h = parseInt("0", 10);
    const a = parseInt("0", 10);
    expect(isNaN(h) || isNaN(a) || h < 0 || a < 0).toBe(false);
  });

  it("deve rejeitar placar negativo", () => {
    const h = -1;
    const a = 0;
    expect(h < 0 || a < 0).toBe(true);
  });

  it("deve rejeitar texto como placar", () => {
    const h = parseInt("abc", 10);
    expect(isNaN(h)).toBe(true);
  });

  it("deve aceitar placar válido", () => {
    const h = parseInt("2", 10);
    const a = parseInt("1", 10);
    expect(isNaN(h) || isNaN(a) || h < 0 || a < 0).toBe(false);
  });
});
