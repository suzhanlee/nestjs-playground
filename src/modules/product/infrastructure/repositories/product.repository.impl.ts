import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Like, Repository } from 'typeorm';
import { Product } from '../../domain';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { IEventDispatcher } from '../../../../common';

/**
 * Product Repository Implementation using TypeORM
 *
 * This repository:
 * - Persists aggregates to the database
 * - Dispatches domain events after successful save
 * - Reconstructs aggregates from the database
 *
 * Spring Equivalent:
 * @Repository
 * public class ProductRepositoryImpl implements ProductRepository {
 *     @PersistenceContext
 *     private EntityManager em;
 *
 *     @Transactional
 *     public Product save(Product product) {
 *         em.persist(product);
 *         eventPublisher.publishEvents(product);
 *         return product;
 *     }
 * }
 */
@Injectable()
export class ProductRepositoryImpl implements IProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly typeOrmRepository: Repository<Product>,
    @Inject('IEventDispatcher')
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  async findById(id: number): Promise<Product | null> {
    return await this.typeOrmRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Product[]> {
    return await this.typeOrmRepository.find();
  }

  async findByName(name: string): Promise<Product[]> {
    return await this.typeOrmRepository.find({
      where: { name: Like(`%${name}%`) },
    });
  }

  async findLowStock(threshold: number): Promise<Product[]> {
    return await this.typeOrmRepository.find({
      where: { stock: LessThan(threshold) },
    });
  }

  async save(product: Product): Promise<Product> {
    // Save to database
    const saved = await this.typeOrmRepository.save(product);

    // Dispatch domain events after successful save
    // This ensures events are only sent if persistence succeeds
    await this.eventDispatcher.dispatchEvents(saved);

    return saved;
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.typeOrmRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async existsById(id: number): Promise<boolean> {
    return await this.typeOrmRepository.exists({ where: { id } });
  }

  async count(): Promise<number> {
    return await this.typeOrmRepository.count();
  }
}
