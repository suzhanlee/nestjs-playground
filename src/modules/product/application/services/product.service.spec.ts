import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { DecreaseStockDto } from '../dto/decrease-stock.dto';

/**
 * Application Layer Mock Tests for ProductService
 * Spring Equivalent: @ExtendWith(MockitoExtension.class) with @MockBean
 */
describe('ProductService', () => {
  let service: ProductService;
  let mockRepository: jest.Mocked<IProductRepository>;

  // Helper to create a mock product
  const createMockProduct = (id: number, overrides?: Partial<Product>): Product => {
    const product = new Product();
    product.id = id;
    product.name = 'Test Product';
    product.description = 'Test Description';
    product.price = 1000;
    product.stock = 10;
    product.createdAt = new Date();
    product.updatedAt = new Date();
    return { ...product, ...overrides } as Product;
  };

  beforeEach(async () => {
    // Create mock repository
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByName: jest.fn(),
      findLowStock: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
      existsById: jest.fn(),
      count: jest.fn(),
    } as jest.Mocked<IProductRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: 'IProductRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const dto: CreateProductDto = {
        name: 'Laptop',
        description: 'High-performance laptop',
        price: 99999,
        stock: 10,
      };

      const savedProduct = createMockProduct(1, dto);
      mockRepository.save.mockResolvedValue(savedProduct);

      const result = await service.create(dto);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Laptop');
      expect(result.price).toBe(99999);
      expect(result.stock).toBe(10);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.any(Product));
    });

    it('should create product without description', async () => {
      const dto: CreateProductDto = {
        name: 'Mouse',
        price: 5000,
        stock: 50,
      };

      const savedProduct = createMockProduct(2, { ...dto, description: undefined });
      mockRepository.save.mockResolvedValue(savedProduct);

      const result = await service.create(dto);

      expect(result.name).toBe('Mouse');
      expect(result.description).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return array of products', async () => {
      const products = [
        createMockProduct(1, { name: 'Product 1' }),
        createMockProduct(2, { name: 'Product 2' }),
      ];
      mockRepository.findAll.mockResolvedValue(products);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Product 1');
      expect(result[1].name).toBe('Product 2');
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no products exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      const product = createMockProduct(1);
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

  describe('searchByName', () => {
    it('should return products matching name', async () => {
      const products = [
        createMockProduct(1, { name: 'Gaming Laptop' }),
        createMockProduct(2, { name: 'Laptop Pro' }),
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
      const products = [createMockProduct(1, { name: 'Low Stock Item', stock: 5 })];
      mockRepository.findLowStock.mockResolvedValue(products);

      const result = await service.findLowStock(10);

      expect(result).toHaveLength(1);
      expect(result[0].stock).toBe(5);
      expect(mockRepository.findLowStock).toHaveBeenCalledWith(10);
    });

    it('should use default threshold of 10', async () => {
      mockRepository.findLowStock.mockResolvedValue([]);

      await service.findLowStock();

      expect(mockRepository.findLowStock).toHaveBeenCalledWith(10);
    });
  });

  describe('update', () => {
    it('should update product fields', async () => {
      const existingProduct = createMockProduct(1);
      mockRepository.findById.mockResolvedValue(existingProduct);

      const updatedProduct = createMockProduct(1, { name: 'Updated Name', price: 2000 });
      mockRepository.save.mockResolvedValue(updatedProduct);

      const dto: UpdateProductDto = {
        name: 'Updated Name',
        price: 2000,
      };

      const result = await service.update(1, dto);

      expect(result.name).toBe('Updated Name');
      expect(result.price).toBe(2000);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const dto: UpdateProductDto = { name: 'New Name' };

      await expect(service.update(999, dto)).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields', async () => {
      const existingProduct = createMockProduct(1, {
        name: 'Original Name',
        description: 'Original Description',
        price: 1000,
        stock: 10,
      });
      mockRepository.findById.mockResolvedValue(existingProduct);

      const updatedProduct = createMockProduct(1, { name: 'New Name' });
      mockRepository.save.mockResolvedValue(updatedProduct);

      const dto: UpdateProductDto = { name: 'New Name' };

      await service.update(1, dto);

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete product successfully', async () => {
      mockRepository.existsById.mockResolvedValue(true);
      mockRepository.deleteById.mockResolvedValue(true);

      await service.delete(1);

      expect(mockRepository.deleteById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.existsById.mockResolvedValue(false);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('decreaseStock', () => {
    it('should decrease stock successfully', async () => {
      const product = createMockProduct(1, { stock: 10 });
      mockRepository.findById.mockResolvedValue(product);

      const updatedProduct = createMockProduct(1, { stock: 7 });
      mockRepository.save.mockResolvedValue(updatedProduct);

      const dto: DecreaseStockDto = { quantity: 3 };

      const result = await service.decreaseStock(1, dto);

      expect(result.stock).toBe(7);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const dto: DecreaseStockDto = { quantity: 1 };

      await expect(service.decreaseStock(999, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      const product = createMockProduct(1, { stock: 2 });
      mockRepository.findById.mockResolvedValue(product);

      const dto: DecreaseStockDto = { quantity: 5 };

      await expect(service.decreaseStock(1, dto)).rejects.toThrow(BadRequestException);
      await expect(service.decreaseStock(1, dto)).rejects.toThrow('Insufficient stock');
    });
  });

  describe('increaseStock', () => {
    it('should increase stock successfully', async () => {
      const product = createMockProduct(1, { stock: 10 });
      mockRepository.findById.mockResolvedValue(product);

      const updatedProduct = createMockProduct(1, { stock: 15 });
      mockRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.increaseStock(1, 5);

      expect(result.stock).toBe(15);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.increaseStock(999, 5)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when quantity is invalid', async () => {
      const product = createMockProduct(1, { stock: 10 });
      mockRepository.findById.mockResolvedValue(product);

      await expect(service.increaseStock(1, 0)).rejects.toThrow(BadRequestException);
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
