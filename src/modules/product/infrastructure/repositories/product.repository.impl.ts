import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan } from 'typeorm';
import { Product } from '../../domain/entities/product.entity';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';

/**
 * Product Repository Implementation using TypeORM
 * (similar to JpaRepository implementation in Spring)
 *
 * Spring Equivalent:
 * @Repository
 * public class ProductRepositoryImpl implements ProductRepository {
 *     @PersistenceContext
 *     private EntityManager em;
 * }
 */
@Injectable()
export class ProductRepositoryImpl implements IProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly typeOrmRepository: Repository<Product>,
  ) {}

  async findById(id: number): Promise<Product | null> {
    // Spring: repository.findById(id).orElse(null)
    return await this.typeOrmRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Product[]> {
    // Spring: repository.findAll()
    return await this.typeOrmRepository.find();
  }

  async findByName(name: string): Promise<Product[]> {
    // Spring: repository.findByNameContaining(name)
    return await this.typeOrmRepository.find({
      where: { name: Like(`%${name}%`) },
    });
  }

  async findLowStock(threshold: number): Promise<Product[]> {
    // Spring: repository.findByStockLessThan(threshold)
    return await this.typeOrmRepository.find({
      where: { stock: LessThan(threshold) },
    });
  }

  async save(product: Product): Promise<Product> {
    // Spring: repository.save(product)
    return await this.typeOrmRepository.save(product);
  }

  async deleteById(id: number): Promise<boolean> {
    // Spring: repository.deleteById(id)
    const result = await this.typeOrmRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async existsById(id: number): Promise<boolean> {
    // Spring: repository.existsById(id)
    return await this.typeOrmRepository.exists({ where: { id } });
  }

  async count(): Promise<number> {
    // Spring: repository.count()
    return await this.typeOrmRepository.count();
  }
}
