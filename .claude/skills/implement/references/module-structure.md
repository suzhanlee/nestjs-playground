# NestJS 모듈 구조 템플릿

## DDD 기반 NestJS 모듈 구조

```
src/modules/{module}/
├── domain/                           # 도메인 레이어
│   ├── entities/                     # 엔티티 (Aggregate Root)
│   │   └── {aggregate}.entity.ts
│   ├── value-objects/                # 값 객체 (모듈 특화 VO)
│   │   └── {vo}.value-object.ts
│   ├── repositories/                 # 리포지토리 인터페이스
│   │   └── {name}.repository.interface.ts
│   ├── errors/                       # 도메인 예외
│   │   ├── {exception}.exception.ts
│   │   └── index.ts
│   ├── events/                       # 도메인 이벤트
│   │   ├── {event}.event.ts
│   │   └── index.ts
│   └── index.ts                      # 도메인 export
│
├── application/                      # 애플리케이션 레이어
│   ├── dto/                          # Data Transfer Objects
│   │   ├── create-{resource}.dto.ts
│   │   ├── update-{resource}.dto.ts
│   │   └── {resource}-response.dto.ts
│   ├── services/                     # 애플리케이션 서비스
│   │   └── {resource}.application.service.ts
│   └── index.ts                      # 애플리케이션 export
│
├── infrastructure/                   # 인프라스트럭처 레이어
│   ├── repositories/                 # 리포지토리 구현
│   │   └── {name}.repository.impl.ts
│   ├── persistence/                  # 영속성 관련 (선택)
│   │   └── {entity}.schema.ts
│   └── index.ts                      # 인프라 export
│
├── presentation/                     # 프레젠테이션 레이어
│   ├── controllers/                  # 컨트롤러
│   │   └── {resource}.controller.ts
│   ├── guards/                       # 가드 (선택)
│   │   └── {name}.guard.ts
│   └── index.ts                      # 프레젠테이션 export
│
├── {module}.module.ts                # 모듈 정의
└── index.ts                          # 모듈 export
```

---

## 파일별 템플릿

### 1. Entity (Aggregate Root)

**파일**: `src/modules/{module}/domain/entities/{aggregate}.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IDomainEvent } from '../../../../common/domain';
import { Invalid{Entity}Exception } from '../errors';

@Entity('{table_name}')
export class {Entity} {
  // ========================================
  // Private Properties
  // ========================================

  @PrimaryGeneratedColumn()
  private _id: number;

  @Column({ nullable: false, length: 255 })
  private _name: string;

  private _domainEvents: IDomainEvent[] = [];

  // ========================================
  // TypeORM Accessors
  // ========================================

  @Column()
  get id(): number {
    return this._id;
  }
  set id(value: number) {
    this._id = value;
  }

  get name(): string {
    return this._name;
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ========================================
  // Factory Method
  // ========================================

  static create(data: {
    name: string;
    // ... other fields
  }): {Entity} {
    if (!data.name || data.name.trim().length === 0) {
      throw new Invalid{Entity}Exception('Name is required');
    }

    const entity = new {Entity}();
    entity._name = data.name.trim();
    // ... set other fields

    entity.addEvent(new {Entity}CreatedEvent(/* ... */));

    return entity;
  }

  // ========================================
  // Business Methods
  // ========================================

  changeName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Invalid{Entity}Exception('Name is required');
    }

    const oldName = this._name;
    this._name = newName.trim();

    this.addEvent(new {Entity}NameChangedEvent(this._id, oldName, this._name));
  }

  // ========================================
  // Domain Events
  // ========================================

  get domainEvents(): IDomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  private addEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }
}
```

---

### 2. Repository Interface

**파일**: `src/modules/{module}/domain/repositories/{name}.repository.interface.ts`

```typescript
import { {Entity} } from '../entities';

export interface I{Entity}Repository {
  findById(id: number): Promise<{Entity} | null>;
  findAll(): Promise<{Entity}[]>;
  save(entity: {Entity}): Promise<{Entity}>;
  delete(id: number): Promise<void>;
  // ... custom methods
}
```

---

### 3. Repository Implementation

**파일**: `src/modules/{module}/infrastructure/repositories/{name}.repository.impl.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { {Entity} } from '../../domain/entities/{entity}.entity';
import { I{Entity}Repository } from '../../domain/repositories/{entity}.repository.interface';

@Injectable()
export class {Entity}RepositoryImpl implements I{Entity}Repository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: number): Promise<{Entity} | null> {
    const repo = this.dataSource.getRepository({Entity});
    return await repo.findOne({ where: { id } });
  }

  async findAll(): Promise<{Entity}[]> {
    const repo = this.dataSource.getRepository({Entity});
    return await repo.find();
  }

  async save(entity: {Entity}): Promise<{Entity}> {
    const repo = this.dataSource.getRepository({Entity});
    return await repo.save(entity);
  }

  async delete(id: number): Promise<void> {
    const repo = this.dataSource.getRepository({Entity});
    await repo.delete(id);
  }
}
```

---

### 4. Create DTO

**파일**: `src/modules/{module}/application/dto/create-{resource}.dto.ts`

```typescript
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class Create{Entity}Dto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
  // ... other fields
}
```

---

### 5. Update DTO

**파일**: `src/modules/{module}/application/dto/update-{resource}.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { Create{Entity}Dto } from './create-{entity}.dto';

export class Update{Entity}Dto extends PartialType(Create{Entity}Dto) {
  // All fields are optional
}
```

---

### 6. Response DTO

**파일**: `src/modules/{module}/application/dto/{resource}-response.dto.ts`

```typescript
import { {Entity} } from '../../domain/entities/{entity}.entity';

export class {Entity}ResponseDto {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: {Entity}): {Entity}ResponseDto {
    const dto = new {Entity}ResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
```

---

### 7. Application Service

**파일**: `src/modules/{module}/application/services/{resource}.application.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { {Entity} } from '../../domain/entities/{entity}.entity';
import { I{Entity}Repository } from '../../domain/repositories/{entity}.repository.interface';
import { Create{Entity}Dto, Update{Entity}Dto, {Entity}ResponseDto } from '../dto';

@Injectable()
export class {Entity}ApplicationService {
  constructor(
    private readonly repository: I{Entity}Repository,
  ) {}

  async create(dto: Create{Entity}Dto): Promise<{Entity}ResponseDto> {
    const entity = {Entity}.create({
      name: dto.name,
      description: dto.description,
    });

    const saved = await this.repository.save(entity);
    return {Entity}ResponseDto.fromEntity(saved);
  }

  async findById(id: number): Promise<{Entity}ResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException('{Entity} with id ${id} not found');
    }
    return {Entity}ResponseDto.fromEntity(entity);
  }

  async findAll(): Promise<{Entity}ResponseDto[]> {
    const entities = await this.repository.findAll();
    return entities.map(e => {Entity}ResponseDto.fromEntity(e));
  }

  async update(id: number, dto: Update{Entity}Dto): Promise<{Entity}ResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException('{Entity} with id ${id} not found');
    }

    if (dto.name) {
      entity.changeName(dto.name);
    }
    // ... other updates

    const saved = await this.repository.save(entity);
    return {Entity}ResponseDto.fromEntity(saved);
  }

  async delete(id: number): Promise<void> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException('{Entity} with id ${id} not found');
    }

    await this.repository.delete(id);
  }
}
```

---

### 8. Controller

**파일**: `src/modules/{module}/presentation/controllers/{resource}.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { {Entity}ApplicationService } from '../../application/services/{entity}.application.service';
import { Create{Entity}Dto, Update{Entity}Dto, {Entity}ResponseDto } from '../../application/dto';

@Controller('{entities}')
export class {Entity}Controller {
  constructor(
    private readonly service: {Entity}ApplicationService,
  ) {}

  @Post()
  async create(@Body() dto: Create{Entity}Dto): Promise<{Entity}ResponseDto> {
    return await this.service.create(dto);
  }

  @Get()
  async findAll(): Promise<{Entity}ResponseDto[]> {
    return await this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{Entity}ResponseDto> {
    return await this.service.findById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Update{Entity}Dto,
  ): Promise<{Entity}ResponseDto> {
    return await this.service.update(+id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.delete(+id);
  }
}
```

---

### 9. Module

**파일**: `src/modules/{module}/{module}.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { {Entity}Controller } from './presentation/controllers/{entity}.controller';
import { {Entity}ApplicationService } from './application/services/{entity}.application.service';
import { {Entity}RepositoryImpl } from './infrastructure/repositories/{entity}.repository.impl';
import { {Entity} } from './domain/entities/{entity}.entity';

@Module({
  imports: [TypeOrmModule.forFeature([{Entity}])],
  controllers: [{Entity}Controller],
  providers: [
    {Entity}ApplicationService,
    {
      provide: 'I{Entity}Repository',
      useClass: {Entity}RepositoryImpl,
    },
  ],
  exports: ['I{Entity}Repository'],
})
export class {Module}Module {}
```

---

### 10. Index Files

**Domain Index**: `src/modules/{module}/domain/index.ts`

```typescript
export * from './entities/{entity}.entity';
export * from './repositories/{entity}.repository.interface';
export * from './errors';
export * from './events';
```

**Application Index**: `src/modules/{module}/application/index.ts`

```typescript
export * from './dto';
export * from './services/{entity}.application.service';
```

**Module Index**: `src/modules/{module}/index.ts`

```typescript
export * from './domain';
export * from './application';
export * from './{module}.module';
```

---

## App Module에 모듈 등록

**파일**: `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { {Module}Module } from './modules/{module}/{module}.module';

@Module({
  imports: [
    // ... other modules
    {Module}Module,
  ],
  // ...
})
export class AppModule {}
```

---

## 테스트 파일 구조

### 단위 테스트

**파일**: `src/modules/{module}/domain/entities/{entity}.entity.spec.ts`

```typescript
import { {Entity} } from './{entity}.entity';
import { Invalid{Entity}Exception } from '../errors';

describe('{Entity} Entity', () => {
  describe('create', () => {
    it('should create entity with valid data', () => {
      const entity = {Entity}.create({
        name: 'Test',
      });

      expect(entity.name).toBe('Test');
    });

    it('should throw error for empty name', () => {
      expect(() => {
        {Entity}.create({ name: '' });
      }).toThrow(Invalid{Entity}Exception);
    });
  });
});
```

### E2E 테스트

**파일**: `test/{resource}.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { {Entity} } from '../src/modules/{module}/domain/entities/{entity}.entity';

describe('{Entity}Controller (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.createQueryBuilder().delete().from({Entity}).execute();
    await app.close();
  });

  afterEach(async () => {
    await dataSource.createQueryBuilder().delete().from({Entity}).execute();
  });

  describe('POST /api/{entities}', () => {
    it('should create a new entity', () => {
      return request(app.getHttpServer())
        .post('/api/{entities}')
        .send({ name: 'Test Entity' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Entity');
        });
    });
  });
});
```

---

## 명명 규칙

| 유형 | 규칙 | 예시 |
|------|------|------|
| Entity | PascalCase, 단수형 | Product, Order |
| Table | snake_case, 복수형 | products, orders |
| Controller | PascalCase + "Controller" | ProductController |
| Service | PascalCase + "ApplicationService" | ProductApplicationService |
| Repository (Interface) | "I" + PascalCase + "Repository" | IProductRepository |
| Repository (Impl) | PascalCase + "RepositoryImpl" | ProductRepositoryImpl |
| DTO | PascalCase + "Dto" | CreateProductDto |
| Response DTO | PascalCase + "ResponseDto" | ProductResponseDto |
| Exception | PascalCase + "Exception" | InvalidProductException |
| Event | PascalCase + "Event" | ProductCreatedEvent |
| Route | kebab-case, 복수형 | /api/products |

---

## 의존성 방향

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│                      (Controllers)                           │
│                          │                                   │
│                          ▼                                   │
├─────────────────────────────────────────────────────────────┤
│                   Application Layer                          │
│                 (Application Services)                       │
│                          │                                   │
│                          ▼                                   │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                            │
│            (Entities, VOs, Repository Interfaces)           │
│                          │                                   │
│                          ▼                                   │
├─────────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                        │
│              (Repository Implementations)                    │
└─────────────────────────────────────────────────────────────┘
```

**규칙**:
- 상위 레이어는 하위 레이어만 의존
- 하위 레이어는 상위 레이어를 알지 못함
- 인터페이스는 도메인 레이어에 위치
- 구현체는 인프라스트럭처 레이어에 위치
