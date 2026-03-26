# TDD 워크플로우 참조

## Red-Green-Refactor 사이클

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD CYCLE                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐      ┌─────────┐      ┌─────────────┐       │
│   │   RED   │ ───▶ │  GREEN  │ ───▶ │  REFACTOR   │       │
│   └─────────┘      └─────────┘      └─────────────┘       │
│       │                                    │               │
│       │                                    ▼               │
│       │                            ┌─────────────┐        │
│       │                            │   통과 확인  │        │
│       │                            └─────────────┘        │
│       ▼                                    │               │
│   ┌─────────────────────────────────────────┐             │
│   │         실패하는 테스트 작성             │             │
│   └─────────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1. RED: 실패하는 테스트 작성

아직 구현되지 않은 기능에 대한 테스트를 작성합니다.

**목표**: 테스트가 실패하는 것을 확인

**주의사항**:
- 컴파일 에러가 아니라 테스트 실패여야 함
- 테스트가 실패하는 이유를 명확히 이해해야 함

### 2. GREEN: 최소한의 구현

테스트를 통과하기 위한 최소한의 코드를 작성합니다.

**목표**: 테스트 통과

**원칙**:
- 가장 간단한 방법으로 통과
- 하드코딩도 허용 (다음 테스트가 걸러냄)
- 완벽한 코드가 아니어도 됨

### 3. REFACTOR: 코드 정리

테스트를 통과한 상태에서 코드를 개선합니다.

**목표**: 코드 품질 향상 (테스트는 계속 통과해야 함)

**활동**:
- 중복 제거
- 네이밍 개선
- 구조 개선
- 성능 최적화

---

## 테스트 작성 패턴

### Given-When-Then 패턴

```typescript
describe('Product.create', () => {
  it('should create a product with valid data', () => {
    // Given: 준비
    const name = 'Test Product';
    const price = Money.fromWon(10000);
    const stock = Quantity.of(10);

    // When: 실행
    const product = Product.create({
      name,
      price,
      stock,
    });

    // Then: 검증
    expect(product.name).toBe(name);
    expect(product.getPrice()).toEqual(price);
    expect(product.getStock()).toEqual(stock);
    expect(product.domainEvents).toHaveLength(1);
  });
});
```

### AAA 패턴 (Arrange-Act-Assert)

```typescript
it('should decrease stock when sufficient stock exists', () => {
  // Arrange: 설정
  const product = Product.create({
    name: 'Test',
    price: Money.fromWon(10000),
    stock: Quantity.of(10),
  });

  // Act: 동작
  product.decreaseStock(Quantity.of(3));

  // Assert: 단언
  expect(product.getStock().toNumber()).toBe(7);
});
```

---

## 단위 테스트 vs E2E 테스트

### 단위 테스트 (Unit Tests)

**대상**: 도메인 로직 (Entity, VO, Service)

**목적**: 비즈니스 규칙 검증

**특징**:
- 빠름
- 독립적
- DB 외부 의존성 없음

**예시**:

```typescript
// src/modules/product/domain/entities/product.entity.spec.ts
describe('Product Entity', () => {
  describe('create', () => {
    it('should create product with valid data', () => {
      const product = Product.create({
        name: 'Test',
        price: Money.fromWon(10000),
        stock: Quantity.of(10),
      });

      expect(product.name).toBe('Test');
      expect(product.getPrice().toWon()).toBe(10000);
    });

    it('should throw error for empty name', () => {
      expect(() => {
        Product.create({
          name: '',
          price: Money.fromWon(10000),
          stock: Quantity.of(10),
        });
      }).toThrow(InvalidProductNameException);
    });
  });

  describe('changePrice', () => {
    it('should change price within 50% limit', () => {
      const product = Product.create({
        name: 'Test',
        price: Money.fromWon(10000),
        stock: Quantity.of(10),
      });

      product.changePrice(Money.fromWon(14000));

      expect(product.getPrice().toWon()).toBe(14000);
    });

    it('should reject price increase over 50%', () => {
      const product = Product.create({
        name: 'Test',
        price: Money.fromWon(10000),
        stock: Quantity.of(10),
      });

      expect(() => {
        product.changePrice(Money.fromWon(16000));
      }).toThrow(InvalidPriceChangeException);
    });
  });
});
```

### E2E 테스트 (End-to-End Tests)

**대상**: API 엔드포인트

**목적**: 전체 시스템 통합 검증

**특징**:
- 느림
- DB 포함
- 실제 HTTP 요청

**예시**:

```typescript
// test/product.e2e-spec.ts
describe('ProductController (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('POST /api/products', () => {
    it('should create a new product', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Test Laptop',
          price: 99999,
          stock: 10,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Laptop');
          expect(res.body).toHaveProperty('createdAt');
        });
    });

    it('should reject negative price', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .send({
          name: 'Invalid',
          price: -100,
          stock: 10,
        })
        .expect(400);
    });
  });
});
```

---

## TDD 구현 순서

### 1. 도메인 레이어 테스트부터 시작

```
1. Entity/VO 테스트 작성 (단위 테스트)
2. Entity/VO 구현
3. Repository 인터페이스 정의
4. Repository 구현체 작성
5. Application Service 테스트 작성
6. Application Service 구현
7. Controller 테스트 작성 (E2E)
8. Controller 구현
```

### 2. 각 레이어별 테스트 작성

```
Domain Layer:
├── Entity 테스트 (Factory, Business Methods)
└── VO 테스트 (Factory, Operations)

Application Layer:
└── Service 테스트 (Use Cases)

Presentation Layer:
└── E2E 테스트 (API Endpoints)
```

---

## 테스트 데이터 준비

### Test Builder Pattern

```typescript
class ProductTestBuilder {
  private name: string = 'Test Product';
  private price: Money = Money.fromWon(10000);
  private stock: Quantity = Quantity.of(10);

  withName(name: string): ProductTestBuilder {
    this.name = name;
    return this;
  }

  withPrice(price: number): ProductTestBuilder {
    this.price = Money.fromWon(price);
    return this;
  }

  withStock(stock: number): ProductTestBuilder {
    this.stock = Quantity.of(stock);
    return this;
  }

  build(): Product {
    return Product.create({
      name: this.name,
      price: this.price,
      stock: this.stock,
    });
  }
}

// 사용
const product = new ProductTestBuilder()
  .withName('Custom Name')
  .withPrice(50000)
  .build();
```

### Test Fixtures

```typescript
// test/fixtures/product.fixtures.ts
export const validProductData = {
  name: 'Valid Product',
  description: 'A valid product description',
  price: 10000,
  stock: 10,
};

export const invalidProductData = {
  name: '', // Invalid
  price: -100, // Invalid
  stock: -5, // Invalid
};

export const boundaryProductData = {
  name: 'A', // Minimum length
  price: 1, // Minimum value
  stock: 0, // Minimum value
};
```

---

## Mock 사용법

### Repository Mock

```typescript
describe('ProductApplicationService', () => {
  let service: ProductApplicationService;
  let repository: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IProductRepository>;

    service = new ProductApplicationService(repository);
  });

  it('should return product by id', async () => {
    const product = Product.create({
      name: 'Test',
      price: Money.fromWon(10000),
      stock: Quantity.of(10),
    });

    repository.findById.mockResolvedValue(product);

    const result = await service.findById(1);

    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(result.name).toBe('Test');
  });

  it('should throw NotFoundException when product not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findById(999)).rejects.toThrow(NotFoundException);
  });
});
```

---

## 경계값 테스트

### 문자열 경계값

```typescript
describe('Product Name Validation', () => {
  it('should reject empty string', () => {
    expect(() => createProductWithName('')).toThrow();
  });

  it('should reject whitespace only', () => {
    expect(() => createProductWithName('   ')).toThrow();
  });

  it('should accept single character', () => {
    const product = createProductWithName('A');
    expect(product.name).toBe('A');
  });

  it('should accept maximum length (255)', () => {
    const name = 'A'.repeat(255);
    const product = createProductWithName(name);
    expect(product.name).toBe(name);
  });

  it('should reject over maximum length (256)', () => {
    const name = 'A'.repeat(256);
    expect(() => createProductWithName(name)).toThrow();
  });
});
```

### 숫자 경계값

```typescript
describe('Price Validation', () => {
  it('should reject negative price', () => {
    expect(() => Money.fromWon(-1)).toThrow();
  });

  it('should accept zero', () => {
    const money = Money.fromWon(0);
    expect(money.toWon()).toBe(0);
  });

  it('should accept minimum positive value', () => {
    const money = Money.fromWon(1);
    expect(money.toWon()).toBe(1);
  });

  it('should accept large value', () => {
    const money = Money.fromWon(999999999);
    expect(money.toWon()).toBe(999999999);
  });
});
```

---

## 테스트 실행 및 검증

### 단위 테스트 실행

```bash
# 전체 단위 테스트
npm test

# 특정 파일만
npm test product.entity.spec.ts

# 파일 감시 모드
npm test -- --watch

# 커버리지
npm run test:cov
```

### E2E 테스트 실행

```bash
# 전체 E2E 테스트
npm run test:e2e

# 특정 파일만
npm run test:e2e test/product.e2e-spec.ts

# 파일 감시 모드
npm run test:e2e -- --watch
```

### 테스트 커버리지 목표

| 메트릭 | 목표 | 최소 |
|--------|------|------|
| Statements | 80%+ | 70% |
| Branches | 75%+ | 65% |
| Functions | 80%+ | 70% |
| Lines | 80%+ | 70% |

---

## 흔한 실수 및 해결 방법

### 1. 테스트가 실패하지 않는 상태에서 구현 시작

**문제**: RED 단계를 건너뛰고 GREEN으로 바로 가려 함

**해결**: 항상 실패하는 테스트 먼저 작성

### 2. 너무 많은 기능을 한 번에 구현

**문제**: 한 테스트에 여러 기능을 테스트하려 함

**해결**: 한 테스트는 하나의 행위만 테스트

### 3. 테스트 구현에 의존

**문제**: 테스트가 내부 구현을 테스트함

**해결**: 공개 API (Behavior)만 테스트

### 4. Mock 과용

**문제**: 실제 코드와 동기화되지 않은 Mock 사용

**해결**: 최소한의 Mock만 사용, 통합 테스트로 검증

---

## TDD 체크리스트

### 테스트 작성 전
- [ ] 구현해야 할 기능을 명확히 이해
- [ ] 테스트할 시나리오 결정 (Happy Path, Edge Cases)

### RED 단계
- [ ] 실패하는 테스트 작성
- [ ] 테스트가 실패하는 이유 확인
- [ ] 테스트 실패가 예상된 실패인지 확인

### GREEN 단계
- [ ] 최소한의 코드로 테스트 통과
- [ ] 불필요한 코드 없이 최소한만 구현
- [ ] 테스트가 통과하는지 확인

### REFACTOR 단계
- [ ] 코드 중복 제거
- [ ] 네이밍 개선
- [ ] 구조 개선
- [ ] 여전히 테스트 통과하는지 확인

### 반복 후
- [ ] 모든 테스트 통과
- [ ] 코드 커버리지 목표 달성
- [ ] 코드 리뷰 및 피드백
