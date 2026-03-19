# NestJS DDD Playground

A Domain-Driven Design (DDD) example project built with NestJS and TypeORM, designed to help Spring + JPA developers transition to NestJS.

## Architecture

This project follows a clean DDD layered architecture:

```
src/
├── main.ts                    # Entry point (like Spring Boot Application.java)
├── app.module.ts              # Root module
├── common/                    # Shared utilities
│   ├── decorators/            # Custom decorators
│   ├── filters/               # Exception filters (@ControllerAdvice)
│   ├── interceptors/          # Interceptors
│   └── dtos/                  # Shared DTOs
├── config/                    # Configuration (application.yml)
│   └── typeorm.config.ts
└── modules/
    └── product/               # Product bounded context
        ├── domain/            # Domain layer (entities, value objects)
        │   ├── entities/
        │   └── repositories/
        ├── application/       # Application layer (services, use cases)
        │   ├── dto/
        │   └── services/
        ├── infrastructure/    # Infrastructure layer (DB implementation)
        │   └── repositories/
        ├── presentation/      # Presentation layer (controllers)
        └── product.module.ts  # Module assembly (@Configuration)
```

## Spring to NestJS Mapping

| Spring | NestJS | Purpose |
|--------|--------|---------|
| `@Entity` | `@Entity()` | JPA/TypeORM entity |
| `@Id @GeneratedValue` | `@PrimaryGeneratedColumn()` | Primary key |
| `@Column` | `@Column()` | Column definition |
| `@Repository` | `@Injectable()` + interface | Repository pattern |
| `@Service` | `@Injectable()` | Service layer |
| `@RestController` | `@Controller()` | REST controller |
| `@RequestMapping` | `@Controller('path')` | Route prefix |
| `@GetMapping` | `@Get()` | GET endpoint |
| `@PostMapping` | `@Post()` | POST endpoint |
| `@RequestBody` | `@Body()` | Request body |
| `@PathVariable` | `@Param()` | Path variable |
| `@RequestParam` | `@Query()` | Query parameter |
| `@Valid` | `ValidationPipe` | Validation |
| `@ControllerAdvice` | `ExceptionFilter` | Global exception handling |
| `@Configuration` | `@Module()` | Module configuration |
| `@ComponentScan` | `imports: []` | Module discovery |
| `@Transactional` | TypeORM transaction | Transactions |
| `@Autowired` | Constructor injection | DI |

## Prerequisites

- Node.js 18+
- MySQL 8.0+ (Docker recommended)

## Quick Start

### 1. Start MySQL with Docker

```bash
docker run -d --name nestjs-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=nestjs_db \
  -p 3306:3306 mysql:8
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

```bash
npm run start:dev
```

API will be available at `http://localhost:3000/api`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products` | Create product |
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| GET | `/api/products/search?name=value` | Search by name |
| GET | `/api/products/low-stock?threshold=10` | Get low stock products |
| PUT | `/api/products/:id` | Update product |
| PATCH | `/api/products/:id` | Partial update |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/products/:id/decrease-stock` | Decrease stock |
| POST | `/api/products/:id/increase-stock` | Increase stock |
| GET | `/api/products/count/total` | Get product count |

## Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Generate coverage
npm run test:cov
```

## Example Requests

### Create Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 99999,
    "stock": 10
  }'
```

### Get All Products

```bash
curl http://localhost:3000/api/products
```

### Update Product

```bash
curl -X PATCH http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 89999
  }'
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
NODE_ENV=development
PORT=3000
GLOBAL_PREFIX=api

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=nestjs_db

TYPEORM_SYNCHRONIZE=true
TYPEORM_LOGGING=true
```

## License

MIT
