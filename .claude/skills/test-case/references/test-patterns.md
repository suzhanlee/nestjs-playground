# NestJS 테스트 패턴

## E2E 테스트 패턴

### Supertest 기반 E2E 테스트

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { Entity } from '../src/modules/...';

describe('ResourceController (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Set up the same configuration as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();

    // Get DataSource for cleanup
    dataSource = app.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clean up database
    if (dataSource) {
      await dataSource.createQueryBuilder().delete().from(Entity).execute();
    }
    await app.close();
  });

  afterEach(async () => {
    // Clean up after each test
    if (dataSource) {
      await dataSource.createQueryBuilder().delete().from(Entity).execute();
    }
  });

  describe('POST /api/resources', () => {
    it('should create a new resource', () => {
      const resourceData = {
        // 필수 필드
      };

      return request(app.getHttpServer())
        .post('/api/resources')
        .send(resourceData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(resourceData.name);
          // 추가 검증
        });
    });

    it('should reject request with missing required fields', () => {
      const resourceData = {
        // 불완전한 데이터
      };

      return request(app.getHttpServer())
        .post('/api/resources')
        .send(resourceData)
        .expect(400);
    });
  });
});
```

### E2E 테스트 시나리오 분류

| 시나리오 유형 | HTTP Status | 검증 포인트 |
|---------------|-------------|-------------|
| 정상 생성 | 201 Created | 리소스 ID 포함, 모든 필드 반영 |
| 필수 필드 누락 | 400 Bad Request | 에러 메시지 포함 |
| 중복 데이터 | 409 Conflict | 중복 필드 명시 |
| 존재하지 않는 리소스 | 404 Not Found | 에러 메시지 포함 |
| 권한 없음 | 401/403 | 인증/인가 실패 |

### E2E 테스트 Given-When-Then 패턴

```typescript
it('should return 404 for non-existent resource', async () => {
  // Given
  const nonExistentId = 999999;

  // When
  const response = await request(app.getHttpServer())
    .get(`/api/resources/${nonExistentId}`);

  // Then
  expect(response.status).toBe(404);
});
```

---

## 단위 테스트 패턴

### 엔티티 테스트

```typescript
import { Entity } from './entity';

describe('Entity', () => {
  describe('Factory Method - create()', () => {
    it('should create entity with valid parameters', () => {
      // Given
      const params = {
        name: 'Test Name',
        value: 100,
      };

      // When
      const entity = Entity.create(params);

      // Then
      expect(entity.name).toBe(params.name);
      expect(entity.value).toBe(params.value);
    });

    it('should throw error when name is empty', () => {
      // Given
      const params = {
        name: '',
        value: 100,
      };

      // When & Then
      expect(() => Entity.create(params)).toThrow();
    });
  });

  describe('Business Method - updateValue()', () => {
    it('should update value within allowed range', () => {
      // Given
      const entity = Entity.create({ name: 'Test', value: 100 });
      const newValue = 150;

      // When
      entity.updateValue(newValue);

      // Then
      expect(entity.value).toBe(newValue);
    });

    it('should reject value exceeding 50% increase', () => {
      // Given
      const entity = Entity.create({ name: 'Test', value: 100 });

      // When & Then
      expect(() => entity.updateValue(160)).toThrow();
    });
  });
});
```

### 서비스 테스트

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { Service } from './service';
import { Repository } from './repository.interface';

describe('Service', () => {
  let service: Service;
  let repository: jest.Mocked<Repository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Service,
        {
          provide: 'Repository',
          useFactory: () => ({
            findById: jest.fn(),
            save: jest.fn(),
            findAll: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<Service>(Service);
    repository = module.get('Repository');
  });

  it('should return entity when found', async () => {
    // Given
    const entity = { id: 1, name: 'Test' };
    repository.findById.mockResolvedValue(entity);

    // When
    const result = await service.findById(1);

    // Then
    expect(result).toEqual(entity);
    expect(repository.findById).toHaveBeenCalledWith(1);
  });

  it('should throw NotFoundException when not found', async () => {
    // Given
    repository.findById.mockResolvedValue(null);

    // When & Then
    await expect(service.findById(999)).rejects.toThrow();
  });
});
```

---

## 통합 테스트 패턴

### Repository 통합 테스트 (SQLite)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, DataSource } from '@nestjs/typeorm';
import { Entity } from './entity';
import { RepositoryImpl } from './repository.impl';

describe('Repository Integration', () => {
  let dataSource: DataSource;
  let repository: RepositoryImpl;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Entity],
          synchronize: true,
        }),
      ],
      providers: [RepositoryImpl],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    repository = module.get<RepositoryImpl>(RepositoryImpl);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.createQueryBuilder().delete().from(Entity).execute();
  });

  it('should save and retrieve entity', async () => {
    // Given
    const entity = Entity.create({ name: 'Test', value: 100 });

    // When
    const saved = await repository.save(entity);
    const found = await repository.findById(saved.id);

    // Then
    expect(found.name).toBe(entity.name);
    expect(found.value).toBe(entity.value);
  });
});
```

---

## 테스트 데이터 빌더 패턴

```typescript
class EntityBuilder {
  private name: string = 'Default Name';
  private value: number = 100;
  private description?: string;

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withValue(value: number): this {
    this.value = value;
    return this;
  }

  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  build(): Entity {
    return Entity.create({
      name: this.name,
      value: this.value,
      description: this.description,
    });
  }
}

// 사용 예
const entity = new EntityBuilder()
  .withName('Custom Name')
  .withValue(200)
  .withDescription('Test Description')
  .build();
```

---

## Mock 데이터 패턴

### Repository Mock

```typescript
const mockRepository = {
  findById: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
};

// 테스트에서 모의 설정
mockRepository.findById.mockResolvedValue({
  id: 1,
  name: 'Test',
});
```

### DataSource Mock

```typescript
const mockDataSource = {
  createQueryBuilder: jest.fn(() => ({
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  })),
};
```

---

## 테스트 실행 패턴

### 특정 테스트만 실행

```bash
# 특 파일 실행
npm test path/to/test.spec.ts

# 특정 테스트 스위트 실행
npm test -- --testNamePattern="POST /api/resources"

# watch 모드에서 특정 패턴만 실행
npm test -- --watch --testNamePattern="should create"
```

### 커버리지 확인

```bash
# 전체 커버리지
npm run test:cov

# 특정 모듈만 커버리지
npm test -- --coverage --collectCoverageFrom="src/modules/**/*.{ts,js}"
```
