import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Category } from '../../domain';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';

/**
 * Category Repository Implementation
 *
 * This implements the Category repository interface using TypeORM.
 * It handles all database operations for categories.
 */
@Injectable()
export class CategoryRepositoryImpl implements ICategoryRepository {
  private readonly repo: Repository<Category>;

  constructor(@Inject('DataSource') private dataSource: DataSource) {
    this.repo = dataSource.getRepository(Category);
  }

  async findById(id: number): Promise<Category | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async findAll(): Promise<Category[]> {
    return await this.repo.find({
      order: { level: 'ASC', name: 'ASC' },
    });
  }

  async findByName(name: string): Promise<Category | null> {
    return await this.repo.findOne({ where: { name } });
  }

  async findByParentId(parentId: number | null): Promise<Category[]> {
    return await this.repo.find({
      where: { parentId },
      order: { name: 'ASC' },
    });
  }

  async findRootCategories(): Promise<Category[]> {
    return await this.repo.find({
      where: { parentId: null },
      order: { name: 'ASC' },
    });
  }

  async findChildren(parentId: number): Promise<Category[]> {
    return await this.repo.find({
      where: { parentId },
      order: { name: 'ASC' },
    });
  }

  async findByIsActive(isActive: boolean): Promise<Category[]> {
    return await this.repo.find({
      where: { isActive },
      order: { level: 'ASC', name: 'ASC' },
    });
  }

  async existsById(id: number): Promise<boolean> {
    const result = await this.repo.count({ where: { id } });
    return result > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    const result = await this.repo.count({ where: { name } });
    return result > 0;
  }

  async count(): Promise<number> {
    return await this.repo.count();
  }

  async save(category: Category): Promise<Category> {
    return await this.repo.save(category);
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected > 0;
  }

  async findByIdWithChildren(id: number): Promise<Category | null> {
    return await this.repo.findOne({
      where: { id },
      relations: ['children'],
    });
  }

  async findByIdWithProducts(id: number): Promise<Category | null> {
    // Products are referenced by categoryId in Product entity
    // This would need to be implemented once Product-Category relationship is established
    const category = await this.repo.findOne({ where: { id } });
    if (category) {
      // TODO: Load products when Product entity has categoryId
      // For now, set empty array
      (category as any)._products = [];
    }
    return category;
  }

  async findTree(): Promise<Category[]> {
    return await this.repo.find({
      relations: ['children'],
      order: { level: 'ASC', name: 'ASC' },
    });
  }

  async getLevel(id: number): Promise<number> {
    const category = await this.repo.findOne({ where: { id }, select: ['level'] });
    return category?.level ?? 0;
  }

  async isDescendant(categoryId: number, ancestorId: number): Promise<boolean> {
    // Start from categoryId and traverse up to check if ancestorId is in the chain
    let currentId = categoryId;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (currentId !== null && iterations < maxIterations) {
      if (currentId === ancestorId) {
        return true;
      }
      const category = await this.repo.findOne({
        where: { id: currentId },
        select: ['parentId'],
      });
      currentId = category?.parentId ?? null;
      iterations++;
    }

    return false;
  }

  async findDescendants(categoryId: number): Promise<Category[]> {
    // Find all categories where parentId is in the subtree
    // This is a recursive operation
    const descendants: Category[] = [];
    const queue = [categoryId];
    const visited = new Set<number>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const children = await this.findChildren(currentId);
      for (const child of children) {
        if (!visited.has(child.id)) {
          descendants.push(child);
          queue.push(child.id);
        }
      }
    }

    return descendants;
  }

  async findProducts(categoryId: number, includeDescendants: boolean = false): Promise<any[]> {
    // TODO: Implement when Product entity has categoryId field
    // For now, return empty array
    return [];
  }
}
