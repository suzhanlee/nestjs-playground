import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CategoryApplicationService } from './category.application.service';
import { Category } from '../../domain';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { IEventDispatcher } from '../../../../common';
import { CreateCategoryRequestDto, UpdateCategoryRequestDto } from '../dto';
import { CategoryCreatedEvent } from '../../../../common';

describe('CategoryApplicationService', () => {
  let service: CategoryApplicationService;
  let repository: jest.Mocked<ICategoryRepository>;
  let eventDispatcher: jest.Mocked<IEventDispatcher>;

  const mockCategory = {
    id: 1,
    name: '전자기기',
    parentId: null,
    level: 0,
    isActive: true,
    hasProducts: jest.fn().mockReturnValue(false),
    hasChildren: jest.fn().mockReturnValue(false),
    canDelete: jest.fn().mockReturnValue(true),
    setProducts: jest.fn(),
    setChildren: jest.fn(),
    changeName: jest.fn(),
    changeParent: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    markAsDeleted: jest.fn(),
    domainEvents: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Category;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ICategoryRepository>> = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByName: jest.fn(),
      findByParentId: jest.fn(),
      findRootCategories: jest.fn(),
      findChildren: jest.fn(),
      findByIsActive: jest.fn(),
      existsById: jest.fn(),
      existsByName: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
      save: jest.fn(),
      deleteById: jest.fn(),
      findByIdWithChildren: jest.fn(),
      findByIdWithProducts: jest.fn(),
      findTree: jest.fn(),
      getLevel: jest.fn(),
      isDescendant: jest.fn(),
      findDescendants: jest.fn(),
      findProducts: jest.fn(),
    };

    const mockEventDispatcher: Partial<jest.Mocked<IEventDispatcher>> = {
      dispatchEvents: jest.fn(),
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryApplicationService,
        {
          provide: 'ICategoryRepository',
          useValue: mockRepository,
        },
        {
          provide: 'IEventDispatcher',
          useValue: mockEventDispatcher,
        },
      ],
    }).compile();

    service = module.get<CategoryApplicationService>(CategoryApplicationService);
    repository = module.get('ICategoryRepository');
    eventDispatcher = module.get('IEventDispatcher');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('TC-UNIT-013: [P0] should create category with valid data', async () => {
      // Given
      const dto: CreateCategoryRequestDto = {
        name: '전자기기',
        parentId: null,
        isActive: true,
      };
      repository.existsByName.mockResolvedValue(false);
      repository.save.mockResolvedValue(mockCategory as Category);
      repository.count.mockResolvedValue(1);

      // When
      const result = await service.create(dto);

      // Then
      expect(repository.existsByName).toHaveBeenCalledWith(dto.name);
      expect(repository.save).toHaveBeenCalled();
      expect(eventDispatcher.dispatchEvents).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('TC-UNIT-014: [P0] should throw ConflictException when name already exists', async () => {
      // Given
      const dto: CreateCategoryRequestDto = {
        name: '전자기기',
        parentId: null,
      };
      repository.existsByName.mockResolvedValue(true);

      // When & Then
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should create child category when parentId is provided', async () => {
      // Given
      const parentCategory = { ...mockCategory, id: 1, level: 0 };
      const dto: CreateCategoryRequestDto = {
        name: '노트북',
        parentId: 1,
        isActive: true,
      };
      repository.existsByName.mockResolvedValue(false);
      repository.findById.mockResolvedValue(parentCategory as Category);
      repository.save.mockResolvedValue(mockCategory as Category);
      repository.count.mockResolvedValue(2);

      // When
      await service.create(dto);

      // Then
      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when parent does not exist', async () => {
      // Given
      const dto: CreateCategoryRequestDto = {
        name: '노트북',
        parentId: 999,
      };
      repository.existsByName.mockResolvedValue(false);
      repository.findById.mockResolvedValue(null);

      // When & Then
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('TC-UNIT-015: [P0] should return all categories', async () => {
      // Given
      const categories = [mockCategory, { ...mockCategory, id: 2 }] as Category[];
      repository.findAll.mockResolvedValue(categories);
      repository.count.mockResolvedValue(2);

      // When
      const result = await service.findAll();

      // Then
      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should filter by isActive when provided', async () => {
      // Given
      const categories = [mockCategory] as Category[];
      repository.findByIsActive.mockResolvedValue(categories);
      repository.count.mockResolvedValue(1);

      // When
      await service.findAll({ isActive: true });

      // Then
      expect(repository.findByIsActive).toHaveBeenCalledWith(true);
    });
  });

  describe('findById', () => {
    it('TC-UNIT-016: [P0] should return category when it exists', async () => {
      // Given
      const categoryWithDetails = { ...mockCategory, _children: [], _products: [] } as Category;
      repository.findByIdWithChildren.mockResolvedValue(categoryWithDetails);
      repository.findByIdWithProducts.mockResolvedValue(categoryWithDetails);
      repository.count.mockResolvedValue(1);

      // When
      const result = await service.findById(1);

      // Then
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('TC-UNIT-017: [P0] should throw NotFoundException when category does not exist', async () => {
      // Given
      repository.findByIdWithChildren.mockResolvedValue(null);

      // When & Then
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('TC-UNIT-018: [P0] should update category with valid data', async () => {
      // Given
      const dto: UpdateCategoryRequestDto = {
        name: '가전제품',
      };
      const categoryWithDetails = { ...mockCategory, _children: [], _products: [] } as Category;
      repository.findByIdWithChildren.mockResolvedValue(categoryWithDetails);
      repository.findByIdWithProducts.mockResolvedValue(categoryWithDetails);
      repository.findByName.mockResolvedValue(null);
      repository.save.mockResolvedValue(categoryWithDetails);
      repository.count.mockResolvedValue(1);

      // When
      const result = await service.update(1, dto);

      // Then
      expect(categoryWithDetails.changeName).toHaveBeenCalledWith('가전제품');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when new name already exists', async () => {
      // Given
      const dto: UpdateCategoryRequestDto = {
        name: '중복이름',
      };
      const existingCategory = { ...mockCategory, id: 2 };
      const categoryWithDetails = { ...mockCategory, _children: [], _products: [] } as Category;
      repository.findByIdWithChildren.mockResolvedValue(categoryWithDetails);
      repository.findByIdWithProducts.mockResolvedValue(categoryWithDetails);
      repository.findByName.mockResolvedValue(existingCategory as Category);

      // When & Then
      await expect(service.update(1, dto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      // Given
      const dto: UpdateCategoryRequestDto = { name: '새이름' };
      repository.findByIdWithChildren.mockResolvedValue(null);

      // When & Then
      await expect(service.update(999, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('TC-UNIT-019: [P0] should delete category when it can be deleted', async () => {
      // Given
      const categoryWithDetails = { ...mockCategory, _children: [], _products: [] } as Category;
      categoryWithDetails.canDelete = jest.fn().mockReturnValue(true);
      repository.findByIdWithChildren.mockResolvedValue(categoryWithDetails);
      repository.findByIdWithProducts.mockResolvedValue(categoryWithDetails);
      repository.count.mockResolvedValue(2);
      repository.deleteById.mockResolvedValue(true);

      // When
      await service.delete(1);

      // Then
      expect(categoryWithDetails.markAsDeleted).toHaveBeenCalled();
      expect(repository.deleteById).toHaveBeenCalledWith(1);
    });

    it('TC-UNIT-020: [P0] should throw BadRequestException when category has products', async () => {
      // Given
      const categoryWithDetails = { ...mockCategory, _children: [], _products: [] } as Category;
      categoryWithDetails.hasProducts = jest.fn().mockReturnValue(true);
      categoryWithDetails.canDelete = jest.fn().mockReturnValue(false);
      repository.findByIdWithChildren.mockResolvedValue(categoryWithDetails);
      repository.findByIdWithProducts.mockResolvedValue(categoryWithDetails);
      repository.count.mockResolvedValue(2);

      // When & Then
      await expect(service.delete(1)).rejects.toThrow(BadRequestException);
    });

    it('TC-UNIT-021: [P1] should throw BadRequestException when it is the last category', async () => {
      // Given
      const categoryWithDetails = { ...mockCategory, _children: [], _products: [] } as Category;
      categoryWithDetails.hasProducts = jest.fn().mockReturnValue(false);
      categoryWithDetails.hasChildren = jest.fn().mockReturnValue(false);
      categoryWithDetails.canDelete = jest.fn().mockReturnValue(false);
      repository.findByIdWithChildren.mockResolvedValue(categoryWithDetails);
      repository.findByIdWithProducts.mockResolvedValue(categoryWithDetails);
      repository.count.mockResolvedValue(1);

      // When & Then
      await expect(service.delete(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when category has children', async () => {
      // Given
      const categoryWithDetails = { ...mockCategory, _children: [], _products: [] } as Category;
      categoryWithDetails.hasChildren = jest.fn().mockReturnValue(true);
      categoryWithDetails.canDelete = jest.fn().mockReturnValue(false);
      repository.findByIdWithChildren.mockResolvedValue(categoryWithDetails);
      repository.findByIdWithProducts.mockResolvedValue(categoryWithDetails);
      repository.count.mockResolvedValue(2);

      // When & Then
      await expect(service.delete(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createChild', () => {
    it('TC-UNIT-022: [P1] should create child category with valid parent', async () => {
      // Given
      const parentCategory = { ...mockCategory, id: 1, level: 0 };
      const childCategory = { ...mockCategory, id: 2, name: '노트북', parentId: 1, level: 1 };
      repository.findById.mockResolvedValue(parentCategory as Category);
      repository.existsByName.mockResolvedValue(false);
      repository.save.mockResolvedValue(childCategory as Category);
      repository.count.mockResolvedValue(2);

      // When
      const result = await service.createChild(1, '노트북');

      // Then
      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.save).toHaveBeenCalled();
    });

    it('TC-UNIT-023: [P1] should throw BadRequestException when depth would exceed 3 levels', async () => {
      // Given
      const parentCategory = { ...mockCategory, id: 1, level: 2 }; // Level 2 parent
      repository.findById.mockResolvedValue(parentCategory as Category);

      // When & Then
      await expect(service.createChild(1, '하위카테고리')).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when name already exists', async () => {
      // Given
      const parentCategory = { ...mockCategory, id: 1, level: 0 };
      repository.findById.mockResolvedValue(parentCategory as Category);
      repository.existsByName.mockResolvedValue(true);

      // When & Then
      await expect(service.createChild(1, '중복이름')).rejects.toThrow(ConflictException);
    });
  });

  describe('moveCategory', () => {
    it('TC-UNIT-024: [P2] should move category to different parent', async () => {
      // Given
      const newParent = { ...mockCategory, id: 5, level: 0 };
      const category = { ...mockCategory, id: 2, level: 1 };
      repository.findById.mockResolvedValue(category as Category);
      repository.findById.mockResolvedValueOnce(category as Category).mockResolvedValueOnce(newParent as Category);
      repository.isDescendant.mockResolvedValue(false);
      repository.save.mockResolvedValue(category as Category);
      repository.count.mockResolvedValue(2);

      // When
      await service.moveCategory(2, 5);

      // Then
      expect(category.changeParent).toHaveBeenCalledWith(5, 0);
      expect(repository.save).toHaveBeenCalled();
    });

    it('TC-UNIT-025: [P2] should throw BadRequestException when circular reference detected', async () => {
      // Given
      const childCategory = { ...mockCategory, id: 2, parentId: 1, level: 1 };
      const parentCategory = { ...mockCategory, id: 1, level: 0 };
      repository.findById.mockResolvedValue(parentCategory as Category);
      repository.isDescendant.mockResolvedValue(true); // child is descendant of parent

      // When & Then
      await expect(service.moveCategory(1, 2)).rejects.toThrow(BadRequestException);
    });
  });

  describe('activate', () => {
    it('should activate inactive category', async () => {
      // Given
      const inactiveCategory = { ...mockCategory, isActive: false };
      repository.findById.mockResolvedValue(inactiveCategory as Category);
      repository.save.mockResolvedValue(inactiveCategory as Category);
      repository.count.mockResolvedValue(1);

      // When
      await service.activate(1);

      // Then
      expect(inactiveCategory.activate).toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should deactivate active category', async () => {
      // Given
      const activeCategory = { ...mockCategory, isActive: true };
      repository.findById.mockResolvedValue(activeCategory as Category);
      repository.save.mockResolvedValue(activeCategory as Category);
      repository.count.mockResolvedValue(1);

      // When
      await service.deactivate(1);

      // Then
      expect(activeCategory.deactivate).toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should return total category count', async () => {
      // Given
      repository.count.mockResolvedValue(5);

      // When
      const result = await service.count();

      // Then
      expect(result).toBe(5);
    });
  });
});
