import { Money } from './money.value-object';
import { InvalidMoneyException } from '../errors/invalid-money.exception';

describe('Money Value Object', () => {
  describe('Creation', () => {
    it('should create Money from cents', () => {
      const money = Money.create(10000);
      expect(money.toCents()).toBe(10000);
    });

    it('should create Money from Won', () => {
      const money = Money.fromWon(100);
      expect(money.toCents()).toBe(10000);
      expect(money.toWon()).toBe(100);
    });

    it('should create Money from decimal', () => {
      const money = Money.fromDecimal(100.5);
      expect(money.toCents()).toBe(10050);
    });

    it('should create Money of zero', () => {
      const money = Money.zero();
      expect(money.isZero()).toBe(true);
    });

    it('should throw InvalidMoneyException for negative cents', () => {
      expect(() => Money.create(-1)).toThrow(InvalidMoneyException);
    });

    it('should throw InvalidMoneyException for negative Won', () => {
      expect(() => Money.fromWon(-1)).toThrow(InvalidMoneyException);
    });

    it('should throw InvalidMoneyException for negative decimal', () => {
      expect(() => Money.fromDecimal(-1)).toThrow(InvalidMoneyException);
    });
  });

  describe('Arithmetic Operations', () => {
    it('should add two Money values', () => {
      const money1 = Money.fromWon(100);
      const money2 = Money.fromWon(50);
      const result = money1.add(money2);
      expect(result.toWon()).toBe(150);
    });

    it('should subtract Money from Money', () => {
      const money1 = Money.fromWon(100);
      const money2 = Money.fromWon(30);
      const result = money1.subtract(money2);
      expect(result.toWon()).toBe(70);
    });

    it('should throw when subtracting more than available', () => {
      const money1 = Money.fromWon(50);
      const money2 = Money.fromWon(100);
      expect(() => money1.subtract(money2)).toThrow(InvalidMoneyException);
    });

    it('should multiply Money by factor', () => {
      const money = Money.fromWon(100);
      const result = money.multiply(2);
      expect(result.toWon()).toBe(200);
    });

    it('should multiply Money by decimal factor', () => {
      const money = Money.fromWon(100);
      const result = money.multiply(1.5);
      expect(result.toWon()).toBe(150);
    });

    it('should throw when multiplying by negative factor', () => {
      const money = Money.fromWon(100);
      expect(() => money.multiply(-1)).toThrow(InvalidMoneyException);
    });

    it('should divide Money by divisor', () => {
      const money = Money.fromWon(100);
      const result = money.divide(2);
      expect(result.toWon()).toBe(50);
    });

    it('should throw when dividing by zero or negative', () => {
      const money = Money.fromWon(100);
      expect(() => money.divide(0)).toThrow(InvalidMoneyException);
      expect(() => money.divide(-1)).toThrow(InvalidMoneyException);
    });

    it('should calculate percentage', () => {
      const money = Money.fromWon(100);
      const result = money.percentage(10);
      expect(result.toWon()).toBe(10);
    });
  });

  describe('Comparison', () => {
    it('should check if greater than', () => {
      const money1 = Money.fromWon(100);
      const money2 = Money.fromWon(50);
      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money2.isGreaterThan(money1)).toBe(false);
    });

    it('should check if greater than or equal', () => {
      const money1 = Money.fromWon(100);
      const money2 = Money.fromWon(100);
      expect(money1.isGreaterThanOrEqual(money2)).toBe(true);
    });

    it('should check if less than', () => {
      const money1 = Money.fromWon(50);
      const money2 = Money.fromWon(100);
      expect(money1.isLessThan(money2)).toBe(true);
    });

    it('should check if less than or equal', () => {
      const money1 = Money.fromWon(100);
      const money2 = Money.fromWon(100);
      expect(money1.isLessThanOrEqual(money2)).toBe(true);
    });

    it('should check if zero', () => {
      expect(Money.zero().isZero()).toBe(true);
      expect(Money.fromWon(100).isZero()).toBe(false);
    });
  });

  describe('Equality', () => {
    it('should be equal when values are the same', () => {
      const money1 = Money.fromWon(100);
      const money2 = Money.fromWon(100);
      expect(money1.equals(money2)).toBe(true);
    });

    it('should not be equal when values are different', () => {
      const money1 = Money.fromWon(100);
      const money2 = Money.fromWon(50);
      expect(money1.equals(money2)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      const money = Money.fromWon(100);
      expect(money.equals(null as any)).toBe(false);
      expect(money.equals(undefined as any)).toBe(false);
    });
  });

  describe('Formatting', () => {
    it('should format as currency string', () => {
      const money = Money.fromWon(10000);
      expect(money.toFormat()).toBe('₩10,000');
    });

    it('should convert to JSON', () => {
      const money = Money.fromWon(10000);
      const json = money.toJSON();
      expect(json.cents).toBe(1000000);
      expect(json.won).toBe(10000);
      expect(json.formatted).toBe('₩10,000');
    });

    it('should convert to string', () => {
      const money = Money.fromWon(10000);
      expect(money.toString()).toBe('₩10,000');
    });
  });

  describe('Immutability', () => {
    it('should return new instances from arithmetic operations', () => {
      const money1 = Money.fromWon(100);
      const money2 = Money.fromWon(50);
      const result = money1.add(money2);

      // Original should be unchanged
      expect(money1.toWon()).toBe(100);
      expect(money2.toWon()).toBe(50);

      // Result should be new instance
      expect(result.toWon()).toBe(150);
      expect(result).not.toBe(money1);
      expect(result).not.toBe(money2);
    });
  });
});
