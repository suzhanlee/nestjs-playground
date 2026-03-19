# From Spring/JPA Expert to NestJS Expert: A Progressive Learning Path

Welcome to your NestJS journey! This guide leverages your existing Spring and JPA expertise to accelerate your mastery of NestJS. Each level builds upon the previous one, with hands-on exercises using the existing Product module at `src/modules/product/` as your foundation.

## Prerequisites

- Strong understanding of Spring Framework and Spring Boot
- Experience with JPA/Hibernate
- Basic knowledge of JavaScript/TypeScript (Level 1 will cover essentials)
- Node.js 18+ and MySQL 8.0+ installed

## Learning Philosophy

This curriculum uses **knowledge transfer** - mapping Spring concepts to NestJS equivalents at each step. You'll:
- See side-by-side comparisons of Spring vs NestJS code
- Work with the existing Product module as a template
- Build new features incrementally
- Test your understanding with practical exercises

---

# LEVEL 1: Foundations - TypeScript & Node.js for Java Developers

## Learning Objectives

By the end of this level, you will:
- Understand TypeScript's type system vs Java's
- Know Node.js runtime differences from JVM
- Set up and debug a NestJS project
- Grasp NestJS's architecture philosophy

## Spring/JPA Mapping

| Java Concept | TypeScript Equivalent | Key Differences |
|--------------|----------------------|-----------------|
| `Class` | `class` | Same syntax, TypeScript has structural typing |
| `Interface` | `interface` | TypeScript interfaces are purely compile-time |
| `List<String>` | `string[]` | Array syntax, generics are type parameters |
| `Optional<T>` | `T \| null` | Union types instead of wrapper class |
| `final` | `readonly` | Immutable properties |
| `@Autowired` | Constructor parameters | Dependency injection is implicit |

## Hands-On Tasks

### Task 1.1: TypeScript Syntax Exploration

**File to Study:** `src/modules/product/domain/entities/product.entity.ts`

**Exercise:**
1. Read the Product entity and identify all TypeScript-specific features
2. Compare with JPA entity patterns you know
3. Identify: What's missing in TypeScript that Java has?

**Expected Outcomes:**
- Understanding that TypeScript uses properties instead of getter/setter
- Recognition of decorator syntax similarity to annotations
- Awareness that TypeScript types are erased at compile-time

**Verification:**
- [ ] Can explain difference between `interface` and `class` in TypeScript
- [ ] Can identify 5 TypeScript types in Product entity
- [ ] Can run `npm run build` without errors

### Task 1.2: Project Structure & Runtime

**Files to Study:** `package.json`, `tsconfig.json`, `main.ts`

**Exercise:**
1. Compare `package.json` with `pom.xml`
2. Run: `npm install && npm run start:dev`
3. Observe hot-reload vs Spring DevTools

**Verification:**
- [ ] Application starts on http://localhost:3000/api
- [ ] Can make code change and see hot-reload
- [ ] Can explain difference between `npm start` and `npm run start:dev`

### Task 1.3: Debugging Setup

**Exercise:** Set breakpoints in `ProductService.create()`, start debugger with `npm run start:debug`, step through code.

**Verification:**
- [ ] Can hit breakpoint in service method
- [ ] Can inspect variables in debug panel

---

# LEVEL 2: Core NestJS - Modules, Controllers, Services

## Spring/JPA Mapping

| Spring Concept | NestJS Equivalent |
|----------------|-------------------|
| `@SpringBootApplication` | `@Module()` in `app.module.ts` |
| `@RestController` | `@Controller()` |
| `@GetMapping` | `@Get()` |
| `@PostMapping` | `@Post()` |
| `@RequestBody` | `@Body()` |
| `@PathVariable` | `@Param()` |
| `@RequestParam` | `@Query()` |
| `@Service` | `@Injectable()` |
| `@Configuration` | `@Module()` |

## Hands-On Tasks

### Task 2.1: Analyze Existing Product Module

**Files to Study:**
- `src/modules/product/product.module.ts`
- `src/modules/product/presentation/product.controller.ts`
- `src/modules/product/application/services/product.service.ts`

**Exercise:** Draw the dependency graph, identify Spring equivalents.

**Verification:**
- [ ] Can draw module dependency diagram
- [ ] Can explain `TypeOrmModule.forFeature([Product])` purpose

### Task 2.2: Create Category Module

**Requirement:** Create new Category feature following Product module structure.

**Files to Create:**
```
src/modules/category/
├── domain/entities/category.entity.ts
├── domain/repositories/category.repository.interface.ts
├── application/dto/create-category.dto.ts
├── application/services/category.service.ts
├── infrastructure/repositories/category.repository.impl.ts
├── presentation/category.controller.ts
└── category.module.ts
```

**API Endpoints:**
- POST /api/categories
- GET /api/categories
- GET /api/categories/:id
- PATCH /api/categories/:id
- DELETE /api/categories/:id

**Verification:**
- [ ] All CRUD endpoints work
- [ ] Validation rejects invalid requests
- [ ] Category module imported in app.module.ts

### Task 2.3: Link Products to Categories

**Requirement:** Add many-to-one relationship from Product to Category.

**NestJS:**
```typescript
@ManyToOne(() => Category, category => category.products)
@JoinColumn({ name: 'category_id' })
category: Category;
```

**Verification:**
- [ ] Products can be created with categoryId
- [ ] GET /api/categories/:id/products works

---

# LEVEL 3: Data Layer - TypeORM vs JPA

## Spring/JPA Mapping

| JPA Concept | TypeORM Equivalent |
|-------------|-------------------|
| `@Entity` | `@Entity('table_name')` |
| `@Id @GeneratedValue` | `@PrimaryGeneratedColumn()` |
| `@Column` | `@Column()` |
| `@ManyToOne` | `@ManyToOne()` |
| `@OneToMany` | `@OneToMany()` |
| `@ManyToMany` | `@ManyToMany()` |
| `@JoinColumn` | `@JoinColumn()` |
| `@CreatedDate` | `@CreateDateColumn()` |
| `@LastModifiedDate` | `@UpdateDateColumn()` |
| `@Version` | `@VersionColumn()` |

## Hands-On Tasks

### Task 3.1: Repository Patterns

**Files to Study:**
- `src/modules/product/domain/repositories/product.repository.interface.ts`
- `src/modules/product/infrastructure/repositories/product.repository.impl.ts`

**Exercise:** Implement custom query methods in Category repository.

**Verification:**
- [ ] Custom queries work (findByName, findEmpty, countProducts)

### Task 3.2: QueryBuilder & Complex Queries

**File to Create:** `src/modules/product/application/dto/search-products.dto.ts`

**Requirement:** Implement advanced product search with pagination.

**Verification:**
- [ ] GET /api/products/search with filters works
- [ ] Pagination works correctly

### Task 3.3: Transactions

**File to Create:** `src/modules/product/application/dto/bulk-update-price.dto.ts`

**Requirement:** Bulk update with rollback on failure.

**Verification:**
- [ ] All updates succeed when valid
- [ ] Rollback occurs when one update fails

### Task 3.4: Migrations

**Exercise:** Create migration to add `slug` field to products.

```bash
npm run typeorm migration:generate -- src/migrations/AddSlugToProduct
npm run typeorm migration:run
```

**Verification:**
- [ ] Migration runs successfully
- [ ] Can rollback migration

---

# LEVEL 4: Advanced Patterns - Guards, Interceptors, Pipes, Events

## Spring/JPA Mapping

| Spring Concept | NestJS Equivalent |
|----------------|-------------------|
| `@PreAuthorize` | `Guards` |
| `@AuthenticationPrincipal` | Custom decorators |
| `@ControllerAdvice` | `ExceptionFilter` |
| `@Aspect` | `Interceptor` |
| `@InitBinder` | `Pipe` |
| `ApplicationEventPublisher` | `EventEmitter2` |

## Hands-On Tasks

### Task 4.1: Implement Authentication

**Files to Create:**
- `src/modules/auth/auth.module.ts`
- `src/modules/auth/guards/jwt-auth.guard.ts`
- `src/modules/auth/strategies/jwt.strategy.ts`
- `src/common/guards/roles.guard.ts`
- `src/common/decorators/roles.decorator.ts`
- `src/common/decorators/current-user.decorator.ts`

**Dependencies:**
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
```

**Verification:**
- [ ] Can create user and get JWT token
- [ ] Protected endpoints return 401 without token
- [ ] Admin endpoints work for admin users only

### Task 4.2: Logging Interceptor

**File to Create:** `src/common/interceptors/logging.interceptor.ts`

**Verification:**
- [ ] All requests logged with duration

### Task 4.3: Event-Driven Architecture

**Dependencies:**
```bash
npm install @nestjs/event-emitter
```

**Files to Create:**
- `src/modules/product/events/product-created.event.ts`
- `src/modules/product/events/listeners/*.listener.ts`

**Verification:**
- [ ] Event emitted when product created
- [ ] Multiple listeners receive event
- [ ] Async execution works

---

# LEVEL 5: Testing - Unit, Integration, and E2E

## Spring/JPA Mapping

| Spring Concept | NestJS Equivalent |
|----------------|-------------------|
| `@SpringBootTest` | `Test.createTestingModule()` |
| `@WebMvcTest` | Controller testing |
| `@DataJpaTest` | Repository testing |
| `@MockBean` | `jest.Mock<T>` |
| `RestAssured` | Supertest |
| `@BeforeEach` | `beforeEach()` |

## Hands-On Tasks

### Task 5.1: Unit Testing Services

**File to Study:** `src/modules/product/application/services/product.service.spec.ts`

**Exercise:** Add comprehensive unit tests for Category service.

**Verification:**
- [ ] All CRUD methods have tests
- [ ] Edge cases covered
- [ ] Tests run under 100ms each

### Task 5.2: Integration Testing

**Dependencies:**
```bash
npm install sqlite3
```

**File to Create:** `src/modules/product/infrastructure/repositories/product.repository.integration.spec.ts`

**Verification:**
- [ ] Tests use in-memory SQLite
- [ ] Database cleaned between tests

### Task 5.3: E2E Testing

**File to Study:** `test/product.e2e-spec.ts`

**Exercise:** Create E2E tests for Category module.

**Verification:**
- [ ] All endpoints covered
- [ ] Authentication tests included

### Task 5.4: Test Coverage

**Run:** `npm run test:cov`

**Targets:**
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

---

# LEVEL 6: Production Readiness

## Spring/JPA Mapping

| Spring Concept | NestJS Equivalent |
|----------------|-------------------|
| `application.yml` | `.env` + ConfigModule |
| `@ConfigurationProperties` | `ConfigService` |
| SLF4J + Logback | Winston |
| Spring Actuator | Terminus |
| Micrometer | prom-client |

## Hands-On Tasks

### Task 6.1: Environment Configuration

**File to Create:** `src/config/configuration.ts`

**Dependencies:**
```bash
npm install Joi
```

**Verification:**
- [ ] Configuration loads correctly
- [ ] Validation catches missing env vars

### Task 6.2: Structured Logging

**Dependencies:**
```bash
npm install nest-winston winston winston-daily-rotate-file
```

**File to Create:** `src/common/logging/winston.config.ts`

**Verification:**
- [ ] Logs written to files with rotation
- [ ] Error logs separated

### Task 6.3: Health Checks & Metrics

**Dependencies:**
```bash
npm install @nestjs/terminus prom-client
```

**File to Create:** `src/common/health/health.controller.ts`

**Verification:**
- [ ] GET /health returns health status
- [ ] GET /metrics returns Prometheus metrics

### Task 6.4: Production Deployment

**Create:** `Dockerfile` and `docker-compose.yml`

**Verification:**
- [ ] Docker image builds
- [ ] Docker compose starts all services

---

# LEVEL 7: Advanced Topics

## Spring/JPA Mapping

| Spring Concept | NestJS Equivalent |
|----------------|-------------------|
| Spring Cloud | NestJS Microservices |
| Spring GraphQL | GraphQL (Apollo) |
| WebSocket | WebSocket Gateway |
| RabbitMQ/Kafka | Transport strategy |
| Axon Framework | CQRS implementation |

## Hands-On Tasks

### Task 7.1: GraphQL API

**Dependencies:**
```bash
npm install @nestjs/graphql graphql@16 apollo-server-express
```

**File to Create:** `src/modules/product/presentation/product.resolver.ts`

**Verification:**
- [ ] GraphQL playground accessible at /graphql
- [ ] Can query and create products

### Task 7.2: WebSocket Gateway

**Dependencies:**
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

**File to Create:** `src/modules/product/gateways/product.gateway.ts`

**Verification:**
- [ ] Real-time stock updates work
- [ ] Subscribe/unsubscribe works

### Task 7.3: CQRS Pattern

**Dependencies:**
```bash
npm install @nestjs/cqrs
```

**Architecture:**
- Commands (CreateProductCommand, UpdateProductCommand)
- Queries (GetProductQuery, ListProductsQuery)
- Events (ProductCreatedEvent)

**Verification:**
- [ ] Commands and queries separated
- [ ] Events published on commands

### Task 7.4: Message Queue Integration

**Dependencies:**
```bash
npm install @nestjs/microservices amqplib amqp-connection-manager
```

**Verification:**
- [ ] Products can check stock via message
- [ ] Stock updated asynchronously

---

# GRADUATION PROJECT: E-Commerce Backend

Build a complete e-commerce backend with:
- Product catalog (existing)
- Order management
- Payment processing
- User authentication
- Real-time inventory
- GraphQL API
- Event-driven architecture

---

# APPENDIX A: Quick Reference

## Essential Commands

```bash
npm run start:dev    # Hot-reload development
npm run build        # Production build
npm test             # Unit tests
npm run test:e2e     # E2E tests
npm run test:cov     # Coverage report
```

## Common Patterns

**Repository Interface:**
```typescript
export interface IProductRepository {
  findById(id: number): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  save(entity: Product): Promise<Product>;
}
```

**Service:**
```typescript
@Injectable()
export class ProductService {
  constructor(private readonly repository: IProductRepository) {}
  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const entity = new Product();
    const saved = await this.repository.save(entity);
    return ProductResponseDto.fromEntity(saved);
  }
}
```

**Controller:**
```typescript
@Controller('products')
export class ProductController {
  constructor(private readonly service: ProductService) {}
  @Post()
  async create(@Body() dto: CreateProductDto) {
    return await this.service.create(dto);
  }
}
```

---

# Critical Files Reference

- `src/modules/product/domain/entities/product.entity.ts` - Entity template
- `src/modules/product/product.module.ts` - Module configuration
- `src/modules/product/application/services/product.service.ts` - Service template
- `src/modules/product/presentation/product.controller.ts` - Controller template
- `test/product.e2e-spec.ts` - E2E testing template
