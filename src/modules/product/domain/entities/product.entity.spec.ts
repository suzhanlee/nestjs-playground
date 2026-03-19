import { Product } from './product.entity';

/**
 * Domain Unit Tests for Product Entity
 * Spring Equivalent: @ExtendWith(MockitoExtension.class) or pure Java unit tests
 */
describe('Product Entity', () => {
  describe('Constructor', () => {
    it('should create a product with default values', () => {
      const product = new Product();
      expect(product.name).toBeUndefined();
      expect(product.description).toBeUndefined();
      expect(product.price).toBeUndefined();
      expect(product.stock).toBeUndefined();
    });
  });

  describe('decreaseStock', () => {
    it('should decrease stock when sufficient stock exists', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 10;

      product.decreaseStock(3);

      expect(product.stock).toBe(7);
    });

    it('should decrease all stock when quantity equals stock', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 5;

      product.decreaseStock(5);

      expect(product.stock).toBe(0);
    });

    it('should throw error when insufficient stock', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 2;

      expect(() => product.decreaseStock(5)).toThrow('Insufficient stock');
    });

    it('should throw error with correct details when stock is zero', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 0;

      expect(() => product.decreaseStock(1)).toThrow('Insufficient stock. Current: 0, Requested: 1');
    });

    it('should throw error when trying to decrease zero', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 10;

      expect(() => product.decreaseStock(0)).toThrow('Insufficient stock');
    });
  });

  describe('increaseStock', () => {
    it('should increase stock by positive quantity', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 10;

      product.increaseStock(5);

      expect(product.stock).toBe(15);
    });

    it('should throw error when quantity is zero', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 10;

      expect(() => product.increaseStock(0)).toThrow('Quantity must be positive');
    });

    it('should throw error when quantity is negative', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 10;

      expect(() => product.increaseStock(-5)).toThrow('Quantity must be positive');
    });
  });

  describe('updatePrice', () => {
    it('should update price when valid', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 10;

      product.updatePrice(1500);

      expect(product.price).toBe(1500);
    });

    it('should set price to zero', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 10;

      product.updatePrice(0);

      expect(product.price).toBe(0);
    });

    it('should throw error when price is negative', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 10;

      expect(() => product.updatePrice(-100)).toThrow('Price cannot be negative');
    });
  });

  describe('isInStock', () => {
    it('should return true when stock is sufficient for default quantity', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 10;

      expect(product.isInStock()).toBe(true);
    });

    it('should return true when stock is sufficient for specified quantity', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 10;

      expect(product.isInStock(5)).toBe(true);
    });

    it('should return true when stock equals requested quantity', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 5;

      expect(product.isInStock(5)).toBe(true);
    });

    it('should return false when stock is insufficient', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 3;

      expect(product.isInStock(5)).toBe(false);
    });

    it('should return false when stock is zero', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 0;

      expect(product.isInStock()).toBe(false);
    });
  });

  describe('getTotalValue', () => {
    it('should calculate total value correctly', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 5;

      expect(product.getTotalValue()).toBe(5000);
    });

    it('should return zero when price is zero', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 0;
      product.stock = 10;

      expect(product.getTotalValue()).toBe(0);
    });

    it('should return zero when stock is zero', () => {
      const product = new Product();
      product.name = 'Laptop';
      product.price = 1000;
      product.stock = 0;

      expect(product.getTotalValue()).toBe(0);
    });
  });
});
