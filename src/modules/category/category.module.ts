import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './presentation/category.controller';
import { CategoryApplicationService } from './application/services/category.application.service';
import { Category } from './domain';
import { CategoryRepositoryImpl } from './infrastructure/repositories/category.repository.impl';
import { ICategoryRepository } from './domain/repositories/category.repository.interface';
import { IEventDispatcher, InMemoryEventDispatcher } from '../../common';

/**
 * Category Module
 *
 * This module wires together all components of the Category bounded context:
 * - Domain: Category entity, repository interfaces
 * - Application: Application services, DTOs
 * - Infrastructure: Repository implementations
 * - Presentation: Controllers
 *
 * Spring Equivalent:
 * @Configuration
 * @ComponentScan(basePackages = "com.example.category")
 * @EnableJpaRepositories(basePackages = "com.example.category.repository")
 * public class CategoryConfig {
 *     @Bean
 *     public CategoryService categoryService(CategoryRepository repository) {
 *         return new CategoryService(repository);
 *     }
 *
 *     @Bean
 *     public CategoryController categoryController(CategoryService service) {
 *         return new CategoryController(service);
 *     }
 * }
 */
@Module({
  imports: [
    // Register the entity for TypeORM
    TypeOrmModule.forFeature([Category]),
  ],
  controllers: [CategoryController],
  providers: [
    // ========================================
    // Event Dispatcher (Infrastructure)
    // ========================================
    {
      provide: 'IEventDispatcher',
      useClass: InMemoryEventDispatcher,
    },

    // ========================================
    // Repository (Infrastructure)
    // ========================================
    CategoryRepositoryImpl,
    {
      provide: 'ICategoryRepository',
      useExisting: CategoryRepositoryImpl,
    },

    // ========================================
    // Application Service (Application)
    // ========================================
    CategoryApplicationService,
  ],
  exports: [
    // Export for other modules to use
    CategoryApplicationService,
    'ICategoryRepository',
    'IEventDispatcher',
  ],
})
export class CategoryModule {}
