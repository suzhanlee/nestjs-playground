---
name: implement
description: test-case.md를 읽어서 TDD로 DDD 아키텍처를 준수하며 구현합니다. "구현", "implement"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - AskUserQuestion
  - Glob
  - Grep
validate_prompt: |
  dod:
    - id: "1"
      description: "test-case.md에 있는 모든 테스트 케이스가 구현되었는가"
    - id: "2"
      description: "모든 테스트가 통과하는가 (npm test, npm run test:e2e)"
    - id: "3"
      description: "DDD 패턴을 준수하는가 (VO, Aggregate, ID 참조)"
    - id: "4"
      description: "도메인 로직이 엔티티/VO에 포함되었는가"
---

# TDD 구현 스킬

## 개요

test-case.md를 분석하여 TDD 방식으로 DDD 아키텍처를 준수하며 구현합니다.

## 사용법

```
/implement
```

## DDD 규칙

### Value Object (값 객체)

**특징**:
- 불변(immutable): 한 번 생성되면 변경 불가
- 값으로 동등성 비교: 모든 속성이 같으면 동일
- ID 없음: 식별자가 없음

**구현 패턴**:
```typescript
export class Money {
  private readonly amountInCents: number;

  private constructor(amountInCents: number) {
    if (amountInCents < 0) {
      throw new InvalidMoneyException();
    }
    this.amountInCents = amountInCents;
  }

  // 팩토리 메서드
  static create(cents: number): Money {
    return new Money(cents);
  }

  static fromWon(won: number): Money {
    return new Money(Math.round(won * 100));
  }

  // 비즈니스 메서드
  add(other: Money): Money {
    return new Money(this.amountInCents + other.amountInCents);
  }

  equals(other: Money): boolean {
    return this.amountInCents === other.amountInCents;
  }
}
```

**위치**: `src/common/domain/value-objects/{name}.value-object.ts`

### Aggregate (애그리거트)

**특징**:
- 프라이벗 프로퍼티: `_id`, `_name` 등
- 팩토리 메서드: `static create()`
- 비즈니스 메서드로 상태 변경
- 상태 변경 시 도메인 이벤트 발행

**구현 패턴**:
```typescript
@Entity('products')
export class Product {
  // 프라이빗 프로퍼티
  @PrimaryGeneratedColumn()
  private _id: number;

  private _name: string;
  private _priceInCents: number;
  private _stock: number;
  private _domainEvents: IDomainEvent[] = [];

  // TypeORM 접근자
  @Column()
  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  @Column()
  get name(): string { return this._name; }

  // 팩토리 메서드
  static create(data: {
    name: string;
    price: Money;
    stock: Quantity;
  }): Product {
    const product = new Product();
    product._name = data.name.trim();
    product._priceInCents = data.price.toCents();
    product._stock = data.stock.toNumber();
    product.addEvent(new ProductCreatedEvent(...));
    return product;
  }

  // 비즈니스 메서드
  changePrice(newPrice: Money): void {
    // 비즈니스 규칙 검증
    if (newPrice.isGreaterThan(this.getPrice().multiply(1.5))) {
      throw new InvalidPriceChangeException();
    }
    this._priceInCents = newPrice.toCents();
    this.addEvent(new ProductPriceChangedEvent(...));
  }

  // 도메인 이벤트 관리
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

**위치**: `src/modules/{module}/domain/entities/{aggregate}.entity.ts`

### 애그리거트 간 참조

**규칙**: ID로만 참조 (객체 참조 금지)

```typescript
// ✅ 올바른 참조 방식
private _categoryId: number;

// ❌ 잘못된 참조 방식
private _category: Category;
```

### Repository Pattern

**인터페이스**:
```typescript
// src/modules/{module}/domain/repositories/{name}.repository.interface.ts
export interface IProductRepository {
  findById(id: number): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  save(entity: Product): Promise<Product>;
  delete(id: number): Promise<void>;
}
```

**구현**:
```typescript
// src/modules/{module}/infrastructure/repositories/{name}.repository.impl.ts
@EntityRepository(Product)
export class ProductRepositoryImpl implements IProductRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findById(id: number): Promise<Product | null> {
    return this.dataSource.getRepository(Product).findOne({ where: { id } });
  }

  async save(entity: Product): Promise<Product> {
    return this.dataSource.getRepository(Product).save(entity);
  }
}
```

## 구현 가이드

### Phase 1: test-case.md 분석

1. **test-case.md 확인**
   ```bash
   ls -la state/
   ```

2. **test-case.md 읽기**
   - E2E 테스트 케이스 추출 (TC-E2E-XXX)
   - 단위 테스트 케이스 추출 (TC-UNIT-XXX)
   - 우선순위별 정렬 (P0 → P1 → P2 → P3)

3. **테스트 케이스 파싱**
   - API 엔드포인트별 분류
   - 엔티티/서비스별 분류
   - 비즈니스 규칙 추출

### Phase 2: 도메인 모델 설계

1. **Value Objects 식별**
   - 금액 → Money
   - 수량 → Quantity
   - 주소 → Address
   - 이메일 → Email

2. **Aggregates 식별**
   - Aggregate Root 경계 확인
   - 일관성 경계 확인
   - 트랜잭션 경계 확인

3. **애그리거트 간 경계 정의**
   - ID 참조 규칙 적용
   - 타 애그리거트 상태 변경 금지

### Phase 3: TDD 구현 사이클

각 테스트 케이스별로 Red-Green-Refactor 사이클 실행:

#### 1. RED: 실패하는 테스트 작성

**E2E 테스트**:
```typescript
// test/{resource}.e2e-spec.ts
describe('POST /api/products', () => {
  it('should create a new product', () => {
    return request(app.getHttpServer())
      .post('/api/products')
      .send({
        name: 'Test Product',
        price: 10000,
        stock: 10
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('Test Product');
      });
  });
});
```

**단위 테스트**:
```typescript
// src/modules/product/domain/product.entity.spec.ts
describe('Product Entity', () => {
  describe('create', () => {
    it('should create a product with valid data', () => {
      const product = Product.create({
        name: 'Test Product',
        price: Money.fromWon(10000),
        stock: Quantity.of(10)
      });

      expect(product.name).toBe('Test Product');
      expect(product.getPrice()).toEqual(Money.fromWon(10000));
    });
  });
});
```

#### 2. VERIFY: 테스트 실패 확인

```bash
# E2E 테스트
npm run test:e2e test/product.e2e-spec.ts

# 단위 테스트
npm test product.entity.spec.ts
```

#### 3. GREEN: 최소한의 구현

**순서**: 하위 레이어부터 상위 레이어로

1. **Value Objects** (필요시)
   - `src/common/domain/value-objects/{vo}.value-object.ts`

2. **Entity**
   - `src/modules/{module}/domain/entities/{entity}.entity.ts`

3. **Repository Interface**
   - `src/modules/{module}/domain/repositories/{name}.repository.interface.ts`

4. **Repository Implementation**
   - `src/modules/{module}/infrastructure/repositories/{name}.repository.impl.ts`

5. **Application Service**
   - `src/modules/{module}/application/services/{name}.application.service.ts`

6. **DTO**
   - `src/modules/{module}/application/dto/create-{resource}.dto.ts`
   - `src/modules/{module}/application/dto/update-{resource}.dto.ts`

7. **Controller**
   - `src/modules/{module}/presentation/{resource}.controller.ts`

8. **Module**
   - `src/modules/{module}/{module}.module.ts`

9. **App Module Import**
   - `src/app.module.ts`

#### 4. VERIFY: 테스트 통과 확인

```bash
npm test
npm run test:e2e
```

#### 5. REFACTOR: 코드 정리 (필요시)

- 중복 제거
- 네이밍 개선
- 구조 개선
- 테스트 통과 확인

### Phase 4: 우선순위별 구현

```
P0 (필수) → P1 (높음) → P2 (중간) → P3 (낮음)
```

같은 우선순위 내에서는 다음 순서로:
1. Entity Factory Method 테스트
2. Entity Business Methods 테스트
3. Repository 테스트
4. Service 테스트
5. E2E 테스트

## 템플릿 파일

### DTO 템플릿

**Create DTO**:
```typescript
// src/modules/{module}/application/dto/create-{resource}.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsInt()
  @Min(0)
  stock: number;
}
```

**Response DTO**:
```typescript
// src/modules/{module}/application/dto/{resource}-response.dto.ts
export class ProductResponseDto {
  id: number;
  name: string;
  description: string | null;
  price: number;
  priceFormatted: string;
  stock: number;
  isInStock: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.price = entity.getPrice().toWon();
    dto.priceFormatted = entity.getPrice().toFormat();
    dto.stock = entity.getStock().toNumber();
    dto.isInStock = entity.isInStock();
    dto.isLowStock = entity.isLowStock();
    dto.isOutOfStock = entity.isOutOfStock();
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
```

### Application Service 템플릿

```typescript
// src/modules/{module}/application/services/{resource}.application.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Money, Quantity } from '../../../../common/domain';
import { Product, InvalidProductNameException, InvalidMoneyException, InvalidQuantityException } from '../../domain';
import { IProductRepository } from '../../domain/repositories';
import { CreateProductDto } from '../dto';

@Injectable()
export class ProductApplicationService {
  constructor(
    private readonly repository: IProductRepository,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const product = Product.create({
      name: dto.name,
      description: dto.description,
      price: Money.fromWon(dto.price),
      stock: Quantity.of(dto.stock),
    });

    const saved = await this.repository.save(product);
    return ProductResponseDto.fromEntity(saved);
  }

  async findById(id: number): Promise<ProductResponseDto> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return ProductResponseDto.fromEntity(product);
  }

  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.repository.findAll();
    return products.map(p => ProductResponseDto.fromEntity(p));
  }
}
```

### Controller 템플릿

```typescript
// src/modules/{module}/presentation/{resource}.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductApplicationService } from '../application/services';
import { CreateProductDto, ProductResponseDto } from '../application/dto';

@Controller('products')
export class ProductController {
  constructor(
    private readonly service: ProductApplicationService,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return await this.service.create(dto);
  }

  @Get()
  async findAll(): Promise<ProductResponseDto[]> {
    return await this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductResponseDto> {
    return await this.service.findById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.service.update(+id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.delete(+id);
  }
}
```

### Module 템플릿

```typescript
// src/modules/{module}/{module}.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductApplicationService } from './application/services';
import { ProductController } from './presentation';
import { ProductRepositoryImpl } from './infrastructure/repositories';
import { Product } from './domain';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductController],
  providers: [
    ProductApplicationService,
    {
      provide: 'IProductRepository',
      useClass: ProductRepositoryImpl,
    },
  ],
  exports: ['IProductRepository'],
})
export class ProductModule {}
```

## Verification (DoD 확인 방법)

### DoD #1: 모든 테스트 케이스 구현 확인

```bash
# test-case.md의 테스트 케이스 목록 추출
grep -E "TC-E2E-|TC-UNIT-" state/test-case.md

# 구현된 테스트 파일 확인
find test/ -name "*.e2e-spec.ts"
find src/ -name "*.spec.ts"
```

### DoD #2: 모든 테스트 통과 확인

```bash
npm test                    # 단위 테스트
npm run test:e2e           # E2E 테스트
npm run test:cov           # 커버리지
```

### DoD #3: DDD 패턴 준수 확인

**Value Objects**:
- 불변: `private readonly` 프로퍼티
- 팩토리 메서드: `static create()` 또는 `static of()`
- 생성자 검증: 유효성 검사 후 예외 발생

**Aggregates**:
- 프라이빗 프로퍼티: `_id`, `_name`
- 팩토리 메서드: `static create()`
- 비즈니스 메서드: 상태 변경 메서드
- 도메인 이벤트: `addEvent()`, `domainEvents`, `clearDomainEvents()`

**참조**:
- ID로만 참조: `private _categoryId: number`
- 객체 참조 없음: `private _category: Category` (X)

### DoD #4: 도메인 로직 위치 확인

- 엔티티/VO 내부에 비즈니스 로직 존재
- 서비스는 orchestration만 담당 (저장소 호출, DTO 변환 등)

## Implementation Steps (스킬 로직)

### Step 1: 세션 및 테스트 케이스 찾기

```bash
# test-case.md 확인
cat state/test-case.md
```

### Step 2: 테스트 케이스 파싱

- E2E 테스트 케이스 추출 (TC-E2E-XXX)
- 단위 테스트 케이스 추출 (TC-UNIT-XXX)
- 우선순위별 정렬 (P0 → P1 → P2 → P3)

### Step 3: 도메인 모델 설계

- requirements.md의 비즈니스 요구사항 참조
- Value Objects 식별 (금액, 수량, 주소 등)
- Aggregates 식별 (주문, 상품, 회원 등)
- 애그리거트 간 관계 정의 (ID 참조)

### Step 4: TDD로 구현

우선순위별로 테스트를 하나씩 구현:

```
for each test_case in sorted_test_cases:
    # RED: 테스트 작성
    write_test(test_case)

    # VERIFY: 실패 확인
    run_test()
    assert test_fails()

    # GREEN: 구현
    write_minimal_implementation(test_case)

    # VERIFY: 통과 확인
    run_test()
    assert test_passes()

    # REFACTOR (필요시)
    refactor_code()
    run_test()
    assert all_tests_pass()
```

### Step 5: 검증 및 완료

```bash
# 모든 단위 테스트 실행
npm test

# 모든 E2E 테스트 실행
npm run test:e2e

# 커버리지 확인
npm run test:cov
```

## Critical Files (참조)

### DDD 패턴 예시 파일
- `src/common/domain/value-objects/money.value-object.ts` - Money VO
- `src/common/domain/value-objects/quantity.value-object.ts` - Quantity VO
- `src/modules/product/domain/entities/product.entity.ts` - Product Aggregate
- `src/modules/product/domain/repositories/product.repository.interface.ts`
- `src/modules/product/infrastructure/repositories/product.repository.impl.ts`

### 테스트 예시 파일
- `test/product.e2e-spec.ts` - E2E 테스트 패턴
- `src/common/domain/value-objects/money.value-object.spec.ts` - 단위 테스트 패턴

### 스킬 예시 파일
- `.claude/skills/test-case/SKILL.md` - 테스트 케이스 스킬

## 참고 자료

- `.claude/skills/implement/references/ddd-patterns.md` - DDD 패턴 상세
- `.claude/skills/implement/references/tdd-workflow.md` - TDD 워크플로우
- `.claude/skills/implement/references/module-structure.md` - 모듈 구조

## 완료 안내

```
✅ TDD 구현 완료

📊 구현 결과:
   - E2E 테스트: N개 통과
   - 단위 테스트: N개 통과
   - 코드 커버리지: N%

🎯 DDD 준수 사항:
   - Value Objects: Money, Quantity 등
   - Aggregates: Product, Order 등
   - ID 참조: 애그리거트 간 ID로만 참조
   - 도메인 로직: 엔티티/VO 내부 구현
```
