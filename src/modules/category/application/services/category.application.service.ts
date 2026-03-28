import { Injectable, NotFoundException, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { Category } from '../../domain';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { IEventDispatcher } from '../../../../common';
import {
  CreateCategoryRequestDto,
  UpdateCategoryRequestDto,
  CategoryResponseDto,
} from '../dto';
import {
  CategoryAlreadyExistsException,
  CategoryHasProductsException,
  CategoryHasChildrenException,
  CategoryDepthExceededException,
  CategoryCircularReferenceException,
  LastCategoryException,
} from '../../../../common';

/**
 * Category Application Service
 *
 * This is a THIN service layer that:
 * - Orchestrates domain operations
 * - Handles transaction boundaries
 * - Dispatches domain events
 * - Maps DTOs to/from domain models
 *
 * NO business logic here - all business rules are in the domain entity.
 */
@Injectable()
export class CategoryApplicationService {
  constructor(
    @Inject('ICategoryRepository') private readonly repository: ICategoryRepository,
    @Inject('IEventDispatcher') private readonly eventDispatcher: IEventDispatcher,
  ) {}

  /**
   * Create a new category
   */
  async create(request: CreateCategoryRequestDto): Promise<CategoryResponseDto> {
    // Check for duplicate name
    if (await this.repository.existsByName(request.name)) {
      throw new ConflictException('Category with this name already exists');
    }

    // Validate parent if provided
    let parentLevel = 0;
    if (request.parentId) {
      const parent = await this.requireCategory(request.parentId);
      parentLevel = parent.level;
    }

    // Use domain factory method
    const category = Category.create({
      name: request.name,
      parentId: request.parentId ?? null,
      parentLevel,
      isActive: request.isActive ?? true,
    });

    // Persist and dispatch events
    await this.saveAndDispatch(category);

    const totalCategories = await this.repository.count();
    return CategoryResponseDto.fromDomain(category, totalCategories);
  }

  /**
   * Find category by ID
   */
  async findById(id: number): Promise<CategoryResponseDto> {
    const category = await this.requireCategoryWithDetails(id);
    const totalCategories = await this.repository.count();
    return CategoryResponseDto.fromDomain(category, totalCategories);
  }

  /**
   * Find all categories
   */
  async findAll(options?: { isActive?: boolean }): Promise<CategoryResponseDto[]> {
    let categories: Category[];
    if (options?.isActive !== undefined) {
      categories = await this.repository.findByIsActive(options.isActive);
    } else {
      categories = await this.repository.findAll();
    }
    const totalCategories = await this.repository.count();
    return CategoryResponseDto.fromDomains(categories, totalCategories);
  }

  /**
   * Find root categories
   */
  async findRootCategories(): Promise<CategoryResponseDto[]> {
    const categories = await this.repository.findRootCategories();
    const totalCategories = await this.repository.count();
    return CategoryResponseDto.fromDomains(categories, totalCategories);
  }

  /**
   * Find children of a category
   */
  async findChildren(id: number): Promise<CategoryResponseDto[]> {
    await this.requireCategory(id);
    const categories = await this.repository.findChildren(id);
    const totalCategories = await this.repository.count();
    return CategoryResponseDto.fromDomains(categories, totalCategories);
  }

  /**
   * Find category tree (all categories with hierarchy)
   */
  async findTree(): Promise<CategoryResponseDto[]> {
    const categories = await this.repository.findTree();
    const totalCategories = await this.repository.count();
    return CategoryResponseDto.fromDomains(categories, totalCategories);
  }

  /**
   * Find products in a category
   */
  async findProducts(id: number, includeDescendants: boolean = false): Promise<any[]> {
    await this.requireCategory(id);
    return await this.repository.findProducts(id, includeDescendants);
  }

  /**
   * Update category
   */
  async update(id: number, request: UpdateCategoryRequestDto): Promise<CategoryResponseDto> {
    const category = await this.requireCategoryWithDetails(id);

    // Update name
    if (request.name !== undefined) {
      // Check for duplicate name (excluding current category)
      const existing = await this.repository.findByName(request.name);
      if (existing && existing.id !== id) {
        throw new ConflictException('Category with this name already exists');
      }
      category.changeName(request.name);
    }

    // Update parent
    if (request.parentId !== undefined) {
      // Validate parent exists
      if (request.parentId !== null) {
        await this.requireCategory(request.parentId);
        const parentLevel = await this.repository.getLevel(request.parentId);

        // Check for circular reference
        const isDescendant = await this.repository.isDescendant(request.parentId, id);
        if (isDescendant) {
          throw new BadRequestException('Cannot set a descendant category as parent');
        }

        category.changeParent(request.parentId, parentLevel);
      } else {
        category.changeParent(null, 0);
      }
    }

    // Update active status
    if (request.isActive !== undefined) {
      if (request.isActive) {
        category.activate();
      } else {
        category.deactivate();
      }
    }

    // Persist and dispatch events
    await this.saveAndDispatch(category);

    const totalCategories = await this.repository.count();
    return CategoryResponseDto.fromDomain(category, totalCategories);
  }

  /**
   * Delete category
   */
  async delete(id: number): Promise<void> {
    const category = await this.requireCategoryWithDetails(id);

    // Check business rules
    const totalCategories = await this.repository.count();
    if (!category.canDelete(totalCategories)) {
      if (category.hasProducts()) {
        throw new BadRequestException('Cannot delete category with products');
      }
      if (category.hasChildren()) {
        throw new BadRequestException('Cannot delete category with subcategories');
      }
      if (totalCategories <= 1) {
        throw new BadRequestException('Cannot delete the last category');
      }
    }

    // Mark as deleted (emits event)
    category.markAsDeleted();

    // Dispatch events before deletion
    await this.eventDispatcher.dispatchEvents(category);

    // Delete from repository
    await this.repository.deleteById(id);
  }

  /**
   * Create a child category
   */
  async createChild(parentId: number, name: string, isActive?: boolean): Promise<CategoryResponseDto> {
    const parent = await this.requireCategory(parentId);

    // Check parent level (max 2 for parent to allow level 2 child)
    if (parent.level >= 2) {
      throw new BadRequestException('Maximum category depth exceeded');
    }

    // Check for duplicate name
    if (await this.repository.existsByName(name)) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = Category.create({
      name,
      parentId,
      parentLevel: parent.level,
      isActive: isActive ?? true,
    });

    await this.saveAndDispatch(category);

    const totalCategories = await this.repository.count();
    return CategoryResponseDto.fromDomain(category, totalCategories);
  }

  /**
   * Move category to different parent
   */
  async moveCategory(id: number, newParentId: number | null): Promise<CategoryResponseDto> {
    const category = await this.requireCategory(id);

    let newParentLevel = 0;
    if (newParentId !== null) {
      const newParent = await this.requireCategory(newParentId);
      newParentLevel = newParent.level;

      // Check for circular reference
      const isDescendant = await this.repository.isDescendant(newParentId, id);
      if (isDescendant) {
        throw new BadRequestException('Cannot move to a descendant category');
      }
    }

    category.changeParent(newParentId, newParentLevel);

    await this.saveAndDispatch(category);

    const totalCategories = await this.repository.count();
    return CategoryResponseDto.fromDomain(category, totalCategories);
  }

  /**
   * Activate category
   */
  async activate(id: number): Promise<CategoryResponseDto> {
    const category = await this.requireCategory(id);
    category.activate();
    await this.saveAndDispatch(category);

    const totalCategories = await this.repository.count();
    return CategoryResponseDto.fromDomain(category, totalCategories);
  }

  /**
   * Deactivate category
   */
  async deactivate(id: number): Promise<CategoryResponseDto> {
    const category = await this.requireCategory(id);
    category.deactivate();
    await this.saveAndDispatch(category);

    const totalCategories = await this.repository.count();
    return CategoryResponseDto.fromDomain(category, totalCategories);
  }

  /**
   * Get total category count
   */
  async count(): Promise<number> {
    return await this.repository.count();
  }

  /**
   * Helper: Require category to exist or throw NotFoundException
   */
  private async requireCategory(id: number): Promise<Category> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  /**
   * Helper: Require category with details (children, products) to exist or throw NotFoundException
   */
  private async requireCategoryWithDetails(id: number): Promise<Category> {
    const category = await this.repository.findByIdWithChildren(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    // Also load products
    const withProducts = await this.repository.findByIdWithProducts(id);
    if (withProducts) {
      category.setProducts((withProducts as any)._products ?? []);
    }
    return category;
  }

  /**
   * Helper: Save category and dispatch domain events
   * This is a transaction boundary - both save and dispatch should succeed or fail together
   */
  private async saveAndDispatch(category: Category): Promise<void> {
    await this.repository.save(category);
    await this.eventDispatcher.dispatchEvents(category);
  }
}
