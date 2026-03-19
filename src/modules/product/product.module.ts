import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './presentation/product.controller';
import { ProductService } from './application/services/product.service';
import { Product } from './domain/entities/product.entity';
import { ProductRepositoryImpl } from './infrastructure/repositories/product.repository.impl';
import { IProductRepository } from './domain/repositories/product.repository.interface';

/**
 * Product Module
 * (similar to @Configuration class in Spring that does @ComponentScan)
 *
 * Spring Equivalent:
 * @Configuration
 * @ComponentScan(basePackages = "com.example.product")
 * @EnableJpaRepositories(basePackages = "com.example.product.repository")
 * public class ProductConfig {
 *     @Bean
 *     public ProductService productService(ProductRepository productRepository) {
 *         return new ProductService(productRepository);
 *     }
 *
 *     @Bean
 *     public ProductController productController(ProductService productService) {
 *         return new ProductController(productService);
 *     }
 * }
 */
@Module({
  imports: [
    // Register the entity for TypeORM (similar to @Entity scan in Spring)
    TypeOrmModule.forFeature([Product]),
  ],
  controllers: [
    // Controllers (similar to @RestController in Spring)
    ProductController,
  ],
  providers: [
    // Services (similar to @Service in Spring)
    {
      provide: 'IProductRepository',
      useClass: ProductRepositoryImpl,
    },
    {
      provide: 'ProductService',
      useFactory: (repository: IProductRepository) => new ProductService(repository),
      inject: ['IProductRepository'],
    },
    ProductService,
    // Repository implementation (similar to @Repository in Spring)
    ProductRepositoryImpl,
  ],
  exports: [
    // Export for other modules to use
    ProductService,
    IProductRepository,
  ],
})
export class ProductModule {}
