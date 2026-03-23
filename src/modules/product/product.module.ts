import { Module, Inject } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './presentation/product.controller';
import { ProductApplicationService } from './application/services/product.application.service';
import { Product } from './domain';
import { ProductRepositoryImpl } from './infrastructure/repositories/product.repository.impl';
import { IProductRepository } from './domain/repositories/product.repository.interface';
import { IEventDispatcher, InMemoryEventDispatcher } from '../../common';
import {
  ProductCreatedHandler,
  PriceChangedHandler,
  StockDecreasedHandler,
  StockLowHandler,
} from './infrastructure';
import {
  ProductCreatedEvent,
  ProductPriceChangedEvent,
  StockDecreasedEvent,
  StockLowEvent,
} from '../../common';

/**
 * Product Module
 *
 * This module wires together all components of the Product bounded context:
 * - Domain: Product entity, repository interfaces
 * - Application: Application services, DTOs
 * - Infrastructure: Repository implementations, event handlers
 * - Presentation: Controllers
 *
 * Spring Equivalent:
 * @Configuration
 * @ComponentScan(basePackages = "com.example.product")
 * @EnableJpaRepositories(basePackages = "com.example.product.repository")
 * public class ProductConfig {
 *     @Bean
 *     public ProductService productService(ProductRepository repository) {
 *         return new ProductService(repository);
 *     }
 *
 *     @Bean
 *     public ProductController productController(ProductService service) {
 *         return new ProductController(service);
 *     }
 * }
 */
@Module({
  imports: [
    // Register the entity for TypeORM
    TypeOrmModule.forFeature([Product]),
  ],
  controllers: [ProductController],
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
    ProductRepositoryImpl,
    {
      provide: 'IProductRepository',
      useExisting: ProductRepositoryImpl,
    },

    // ========================================
    // Application Service (Application)
    // ========================================
    ProductApplicationService,

    // ========================================
    // Event Handlers (Infrastructure)
    // ========================================
    ProductCreatedHandler,
    PriceChangedHandler,
    StockDecreasedHandler,
    StockLowHandler,
  ],
  exports: [
    // Export for other modules to use
    ProductApplicationService,
    'IProductRepository',
    'IEventDispatcher',
  ],
})
export class ProductModule {
  constructor(
    @Inject('IEventDispatcher') private readonly eventDispatcher: IEventDispatcher,
    private readonly productCreatedHandler: ProductCreatedHandler,
    private readonly priceChangedHandler: PriceChangedHandler,
    private readonly stockDecreasedHandler: StockDecreasedHandler,
    private readonly stockLowHandler: StockLowHandler,
  ) {}

  onModuleInit() {
    // Register event handlers on module initialization
    this.eventDispatcher.register(ProductCreatedEvent, this.productCreatedHandler);
    this.eventDispatcher.register(ProductPriceChangedEvent, this.priceChangedHandler);
    this.eventDispatcher.register(StockDecreasedEvent, this.stockDecreasedHandler);
    this.eventDispatcher.register(StockLowEvent, this.stockLowHandler);
  }

  onModuleDestroy() {
    // Optional: Clean up event handlers on module destruction
    // this.eventDispatcher.clearHandlers();
  }
}
