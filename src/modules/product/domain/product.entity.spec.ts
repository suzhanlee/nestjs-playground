import { Product } from './product.entity';
import {
  InvalidProductNameException,
  InvalidPriceChangeException,
  InsufficientStockException,
  ProductCreatedEvent,
  ProductPriceChangedEvent,
  StockDecreasedEvent,
  StockIncreasedEvent,
  StockLowEvent,
  ProductNameChangedEvent,
  ProductDescriptionChangedEvent,
  ProductDeletedEvent,
  Money,
  Quantity,
} from '../../../common';

describe('Product Entity (Rich Domain Model)', () => {
  describe('Factory Method - create()', () => {
    it('should create a valid product', () => {
      const product = Product.create({
        name: 'Laptop',
        description: 'High-performance laptop',
        price: Money.fromWon(99999),
        stock: Quantity.of(10),
      });

      expect(product.name).toBe('Laptop');
      expect(product.description).toBe('High-performance laptop');
      expect(product.getPrice().toWon()).toBe(99999);
      expect(product.getStock().toNumber()).toBe(10);
    });

    it('should create product without description', () => {
      const product = Product.create({
        name: 'Mouse',
        price: Money.fromWon(5000),
        stock: Quantity.of(50),
      });

      expect(product.name).toBe('Mouse');
      expect(product.description).toBeNull();
    });

    it('should trim name whitespace', () => {
      const product = Product.create({
        name: '  Laptop  ',
        price: Money.fromWon(10000),
        stock: Quantity.of(5),
      });

      expect(product.name).toBe('Laptop');
    });

    it('should emit ProductCreatedEvent', () => {
      const product = Product.create({
        name: 'Laptop',
        price: Money.fromWon(99999),
        stock: Quantity.of(10),
      });

      const events = product.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ProductCreatedEvent);
      expect((events[0] as ProductCreatedEvent).name).toBe('Laptop');
    });

    it('should throw InvalidProductNameException for empty name', () => {
      expect(() => {
        Product.create({
          name: '',
          price: Money.fromWon(10000),
          stock: Quantity.of(5),
        });
      }).toThrow(InvalidProductNameException);
    });

    it('should throw InvalidProductNameException for too long name', () => {
      expect(() => {
        Product.create({
          name: 'a'.repeat(256),
          price: Money.fromWon(10000),
          stock: Quantity.of(5),
        });
      }).toThrow(InvalidProductNameException);
    });
  });

  describe('Business Methods - Price', () => {
    let product: Product;

    beforeEach(() => {
      product = Product.create({
        name: 'Laptop',
        price: Money.fromWon(100000),
        stock: Quantity.of(10),
      });
      product.clearDomainEvents(); // Clear creation event
    });

    it('should change price within 50% limit', () => {
      product.changePrice(Money.fromWon(140000));

      expect(product.getPrice().toWon()).toBe(140000);
      expect(product.domainEvents).toHaveLength(1);
      expect(product.domainEvents[0]).toBeInstanceOf(ProductPriceChangedEvent);
    });

    it('should throw InvalidPriceChangeException for increase > 50%', () => {
      expect(() => {
        product.changePrice(Money.fromWon(160000));
      }).toThrow(InvalidPriceChangeException);
    });

    it('should allow price decrease of any amount', () => {
      product.changePrice(Money.fromWon(10000));
      expect(product.getPrice().toWon()).toBe(10000);
    });

    it('should allow price to be set to zero', () => {
      product.changePrice(Money.zero());
      expect(product.getPrice().isZero()).toBe(true);
    });
  });

  describe('Business Methods - Stock', () => {
    it('should decrease stock when sufficient', () => {
      const product = Product.create({
        name: 'Laptop',
        price: Money.fromWon(100000),
        stock: Quantity.of(20), // Use higher stock to avoid low stock event
      });
      product.clearDomainEvents();

      product.decreaseStock(Quantity.of(3));

      expect(product.getStock().toNumber()).toBe(17);
      expect(product.domainEvents).toHaveLength(1);
      expect(product.domainEvents[0]).toBeInstanceOf(StockDecreasedEvent);
    });

    it('should emit StockLowEvent when stock falls below 10', () => {
      const product = Product.create({
        name: 'Laptop',
        price: Money.fromWon(100000),
        stock: Quantity.of(10),
      });
      product.clearDomainEvents();

      product.decreaseStock(Quantity.of(7));

      expect(product.getStock().toNumber()).toBe(3);
      expect(product.domainEvents).toHaveLength(2);
      expect(product.domainEvents[0]).toBeInstanceOf(StockDecreasedEvent);
      expect(product.domainEvents[1]).toBeInstanceOf(StockLowEvent);
    });

    it('should throw InsufficientStockException when not enough stock', () => {
      const product = Product.create({
        name: 'Laptop',
        price: Money.fromWon(100000),
        stock: Quantity.of(10),
      });
      product.clearDomainEvents();

      expect(() => {
        product.decreaseStock(Quantity.of(15));
      }).toThrow(InsufficientStockException);
    });

    it('should throw InsufficientStockException when stock is zero', () => {
      const product = Product.create({
        name: 'Laptop',
        price: Money.fromWon(100000),
        stock: Quantity.of(10),
      });
      product.clearDomainEvents();

      product.decreaseStock(Quantity.of(10));
      expect(product.getStock().toNumber()).toBe(0);

      expect(() => {
        product.decreaseStock(Quantity.of(1));
      }).toThrow(InsufficientStockException);
    });

    it('should increase stock', () => {
      const product = Product.create({
        name: 'Laptop',
        price: Money.fromWon(100000),
        stock: Quantity.of(10),
      });
      product.clearDomainEvents();

      product.increaseStock(Quantity.of(5));

      expect(product.getStock().toNumber()).toBe(15);
      expect(product.domainEvents).toHaveLength(1);
      expect(product.domainEvents[0]).toBeInstanceOf(StockIncreasedEvent);
    });

    it('should check if has stock for quantity', () => {
      const product = Product.create({
        name: 'Laptop',
        price: Money.fromWon(100000),
        stock: Quantity.of(10),
      });

      expect(product.hasStockFor(Quantity.of(5))).toBe(true);
      expect(product.hasStockFor(Quantity.of(10))).toBe(true);
      expect(product.hasStockFor(Quantity.of(15))).toBe(false);
    });
  });

  describe('Business Methods - Name', () => {
    let product: Product;

    beforeEach(() => {
      product = Product.create({
        name: 'Laptop',
        price: Money.fromWon(100000),
        stock: Quantity.of(10),
      });
      product.clearDomainEvents();
    });

    it('should change name', () => {
      product.changeName('Gaming Laptop');

      expect(product.name).toBe('Gaming Laptop');
      expect(product.domainEvents).toHaveLength(1);
      expect(product.domainEvents[0]).toBeInstanceOf(ProductNameChangedEvent);
    });

    it('should trim name whitespace', () => {
      product.changeName('  New Name  ');
      expect(product.name).toBe('New Name');
    });

    it('should throw InvalidProductNameException for empty name', () => {
      expect(() => {
        product.changeName('');
      }).toThrow(InvalidProductNameException);
    });
  });

  describe('Business Methods - Description', () => {
    let product: Product;

    beforeEach(() => {
      product = Product.create({
        name: 'Laptop',
        description: 'Original description',
        price: Money.fromWon(100000),
        stock: Quantity.of(10),
      });
      product.clearDomainEvents();
    });

    it('should change description', () => {
      product.changeDescription('New description');

      expect(product.description).toBe('New description');
      expect(product.domainEvents).toHaveLength(1);
      expect(product.domainEvents[0]).toBeInstanceOf(ProductDescriptionChangedEvent);
    });

    it('should clear description', () => {
      product.changeDescription(null);
      expect(product.description).toBeNull();
    });

    it('should trim description', () => {
      product.changeDescription('  New description  ');
      expect(product.description).toBe('New description');
    });
  });

  describe('Query Methods', () => {
    let product: Product;

    beforeEach(() => {
      product = Product.create({
        name: 'Laptop',
        price: Money.fromWon(100000),
        stock: Quantity.of(10),
      });
    });

    it('should check if in stock', () => {
      expect(product.isInStock()).toBe(true);
      expect(product.isInStock(10)).toBe(true);
      expect(product.isInStock(15)).toBe(false);
    });

    it('should check if low stock', () => {
      expect(product.isLowStock()).toBe(false);
      expect(product.isLowStock(15)).toBe(true);
    });

    it('should check if out of stock', () => {
      expect(product.isOutOfStock()).toBe(false);
      product.decreaseStock(Quantity.of(10));
      expect(product.isOutOfStock()).toBe(true);
    });

    it('should calculate total value', () => {
      const totalValue = product.getTotalValue();
      expect(totalValue.toWon()).toBe(1000000); // 100000 * 10
    });
  });

  describe('Domain Events Management', () => {
    it('should get domain events copy', () => {
      const product = Product.create({
        name: 'Test',
        price: Money.fromWon(10000),
        stock: Quantity.of(5),
      });

      const events1 = product.domainEvents;
      const events2 = product.domainEvents;

      expect(events1).not.toBe(events2); // Different array instances
      expect(events1).toEqual(events2); // Same contents
    });

    it('should clear domain events', () => {
      const product = Product.create({
        name: 'Test',
        price: Money.fromWon(10000),
        stock: Quantity.of(5),
      });

      expect(product.domainEvents).toHaveLength(1);

      product.clearDomainEvents();
      expect(product.domainEvents).toHaveLength(0);
    });

    it('should emit ProductDeletedEvent when marked as deleted', () => {
      const product = Product.create({
        name: 'Test',
        price: Money.fromWon(10000),
        stock: Quantity.of(5),
      });
      product.clearDomainEvents();

      product.markAsDeleted();

      expect(product.domainEvents).toHaveLength(1);
      expect(product.domainEvents[0]).toBeInstanceOf(ProductDeletedEvent);
    });
  });

  describe('Value Objects Immutability', () => {
    it('should return new Money instances from getPrice()', () => {
      const product = Product.create({
        name: 'Test',
        price: Money.fromWon(10000),
        stock: Quantity.of(5),
      });

      const price1 = product.getPrice();
      const price2 = product.getPrice();

      expect(price1).not.toBe(price2); // Different instances
      expect(price1.equals(price2)).toBe(true); // Same value
    });

    it('should return new Quantity instances from getStock()', () => {
      const product = Product.create({
        name: 'Test',
        price: Money.fromWon(10000),
        stock: Quantity.of(5),
      });

      const stock1 = product.getStock();
      const stock2 = product.getStock();

      expect(stock1).not.toBe(stock2); // Different instances
      expect(stock1.equals(stock2)).toBe(true); // Same value
    });
  });
});
