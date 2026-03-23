import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductApplicationService } from './product.application.service';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain';
import { IEventDispatcher, InMemoryEventDispatcher, Money, Quantity } from '../../../../common';
import {
  CreateProductRequest,
  UpdateProductRequest,
  DecreaseStockRequest,
  IncreaseStockRequest,
  ChangePriceRequest,
} from '../../application';

describe('ProductApplicationService', () => {
  let service: ProductApplicationService;
  let mockRepository: jest.Mocked<IProductRepository>;
  let eventDispatcher: IEventDispatcher;

  const createMockProduct = (overrides?: {
    id?: number;
    name?: string;
    description?: string | null;
    price?: number;
    stock?: number;
  }): Product => {
    const product = Product.create({
      name: overrides?.name || 'Test Product',
      price: Money.fromWon(overrides?.price ?? 1000),
      stock: Quantity.of(overrides?.stock ?? 10),
      description: overrides?.description,
    });

    if (overrides?.id) {
      // Use Object.assign to set private property
      Object.assign(product, { _id: overrides.id });
    }

    return product;
  };

  beforeEach(async () => {
    eventDispatcher = new InMemoryEventDispatcher();

    const idCounter = 1;
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByName: jest.fn(),
      findLowStock: jest.fn(),
      save: jest.fn((product: Product) => {
        // For tests, just return the product as-is
        // In real scenario, the ID would be assigned by the database
        return Promise.resolve(product);
      }),
      deleteById: jest.fn(),
      existsById: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<IProductRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductApplicationService,
        {
          provide: 'IProductRepository',
          useValue: mockRepository,
        },
        {
          provide: 'IEventDispatcher',
          useValue: eventDispatcher,
        },
      ],
    }).compile();

    service = module.get<ProductApplicationService>(ProductApplicationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const dto: CreateProductRequest = {
        name: 'Laptop',
        description: 'High-performance laptop',
        price: 99999,
        stock: 10,
      };

      // Mock save to return a product with ID set
      mockRepository.save.mockImplementation((product: Product) => {
        const saved = createMockProduct({
          id: 1,
          name: 'Laptop',
          price: 99999,
          stock: 10,
          description: dto.description,
        });
        return Promise.resolve(saved);
      });

      const result = await service.create(dto);

      expect(result.name).toBe('Laptop');
      expect(result.price).toBe(99999);
      expect(result.description).toBe('High-performance laptop');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create product without description', async () => {
      const dto: CreateProductRequest = {
        name: 'Mouse',
        price: 5000,
        stock: 50,
      };

      mockRepository.save.mockImplementation((product: Product) => {
        const saved = createMockProduct({
          id: 2,
          name: 'Mouse',
          price: 5000,
          stock: 50,
          description: null,
        });
        return Promise.resolve(saved);
      });

      const result = await service.create(dto);

      expect(result.name).toBe('Mouse');
      expect(result.description).toBeNull();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      const product = createMockProduct({ id: 1 });
      mockRepository.findById.mockResolvedValue(product);

      const result = await service.findById(1);

      expect(result.id).toBe(1);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      await expect(service.findById(999)).rejects.toThrow('Product with ID 999 not found');
    });
  });

  describe('findAll', () => {
    it('should return array of products', async () => {
      const products = [
        createMockProduct({ id: 1, name: 'Product 1' }),
        createMockProduct({ id: 2, name: 'Product 2' }),
      ];
      mockRepository.findAll.mockResolvedValue(products);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no products exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('searchByName', () => {
    it('should return products matching name', async () => {
      const products = [
        createMockProduct({ id: 1, name: 'Gaming Laptop' }),
        createMockProduct({ id: 2, name: 'Laptop Pro' }),
      ];
      mockRepository.findByName.mockResolvedValue(products);

      const result = await service.searchByName('Laptop');

      expect(result).toHaveLength(2);
      expect(mockRepository.findByName).toHaveBeenCalledWith('Laptop');
    });

    it('should return empty array when no matches', async () => {
      mockRepository.findByName.mockResolvedValue([]);

      const result = await service.searchByName('NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('findLowStock', () => {
    it('should return products below threshold', async () => {
      const products = [createMockProduct({ id: 1, name: 'Low Stock Item' })];
      mockRepository.findLowStock.mockResolvedValue(products);

      const result = await service.findLowStock(10);

      expect(result).toHaveLength(1);
      expect(mockRepository.findLowStock).toHaveBeenCalledWith(10);
    });

    it('should use default threshold of 10', async () => {
      mockRepository.findLowStock.mockResolvedValue([]);

      await service.findLowStock();

      expect(mockRepository.findLowStock).toHaveBeenCalledWith(10);
    });
  });

  describe('update', () => {
    it('should update product name', async () => {
      const existingProduct = createMockProduct({ id: 1 });
      mockRepository.findById.mockResolvedValue(existingProduct);

      const updatedProduct = createMockProduct({ id: 1, name: 'Updated Name' });
      mockRepository.save.mockResolvedValue(updatedProduct);

      const dto: UpdateProductRequest = { name: 'Updated Name' };

      const result = await service.update(1, dto);

      expect(result.name).toBe('Updated Name');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update product price', async () => {
      const existingProduct = createMockProduct({ id: 1, price: 10000 });
      mockRepository.findById.mockResolvedValue(existingProduct);

      const updatedProduct = createMockProduct({ id: 1 });
      mockRepository.save.mockResolvedValue(updatedProduct);

      const dto: UpdateProductRequest = { price: 14000 }; // Within 50% limit

      const result = await service.update(1, dto);

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const dto: UpdateProductRequest = { name: 'New Name' };

      await expect(service.update(999, dto)).rejects.toThrow(NotFoundException);
    });

    it('should update stock when new stock is higher', async () => {
      const existingProduct = createMockProduct({ id: 1 });
      mockRepository.findById.mockResolvedValue(existingProduct);

      const updatedProduct = createMockProduct({ id: 1 });
      mockRepository.save.mockResolvedValue(updatedProduct);

      const dto: UpdateProductRequest = { stock: 20 };

      await service.update(1, dto);

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should decrease stock when new stock is lower', async () => {
      const existingProduct = createMockProduct({ id: 1 });
      mockRepository.findById.mockResolvedValue(existingProduct);

      const updatedProduct = createMockProduct({ id: 1 });
      mockRepository.save.mockResolvedValue(updatedProduct);

      const dto: UpdateProductRequest = { stock: 5 };

      await service.update(1, dto);

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete product successfully', async () => {
      const product = createMockProduct({ id: 1 });
      mockRepository.findById.mockResolvedValue(product);
      mockRepository.deleteById.mockResolvedValue(true);

      await service.delete(1);

      expect(mockRepository.deleteById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('decreaseStock', () => {
    it('should decrease stock successfully', async () => {
      const product = createMockProduct({ id: 1 });
      mockRepository.findById.mockResolvedValue(product);

      const updatedProduct = createMockProduct({ id: 1 });
      mockRepository.save.mockResolvedValue(updatedProduct);

      const dto: DecreaseStockRequest = { quantity: 3 };

      const result = await service.decreaseStock(1, dto);

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const dto: DecreaseStockRequest = { quantity: 1 };

      await expect(service.decreaseStock(999, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('increaseStock', () => {
    it('should increase stock successfully', async () => {
      const product = createMockProduct({ id: 1 });
      mockRepository.findById.mockResolvedValue(product);

      const updatedProduct = createMockProduct({ id: 1 });
      mockRepository.save.mockResolvedValue(updatedProduct);

      const dto: IncreaseStockRequest = { quantity: 5 };

      const result = await service.increaseStock(1, dto);

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const dto: IncreaseStockRequest = { quantity: 5 };

      await expect(service.increaseStock(999, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePrice', () => {
    it('should change price successfully', async () => {
      const product = createMockProduct({ id: 1 });
      mockRepository.findById.mockResolvedValue(product);

      const updatedProduct = createMockProduct({ id: 1 });
      mockRepository.save.mockResolvedValue(updatedProduct);

      const dto: ChangePriceRequest = { price: 1500 };

      const result = await service.changePrice(1, dto);

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const dto: ChangePriceRequest = { price: 2000 };

      await expect(service.changePrice(999, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('count', () => {
    it('should return product count', async () => {
      mockRepository.count.mockResolvedValue(42);

      const result = await service.count();

      expect(result).toBe(42);
      expect(mockRepository.count).toHaveBeenCalledTimes(1);
    });

    it('should return zero when no products', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.count();

      expect(result).toBe(0);
    });
  });
});
