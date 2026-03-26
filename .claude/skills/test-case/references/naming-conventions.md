# 테스트 케이스 명명 규칙

## 테스트 케이스 ID 명명 규칙

### 형식

```
TC-{레벨}-{순번}
```

### 레벨 구분

| 접두사 | 의미 | 예시 |
|--------|------|------|
| `TC-E2E` | E2E 테스트 | `TC-E2E-001` |
| `TC-UNIT` | 단위 테스트 | `TC-UNIT-001` |
| `TC-INT` | 통합 테스트 | `TC-INT-001` |

### 순번 규칙

- 001부터 시작
- 같은 레벨 내에서 순차적 부여
- 기능별로 그룹화하여 순번 부여 권장

---

## 테스트 케이스 제목 명명 규칙

### Given-When-Then 패턴

```typescript
it('should [Expected Result] when [Condition] under [Context]', () => {
  // ...
});
```

### 예시

| 잘못된 예 | 올바른 예 |
|-----------|-----------|
| `test('create works')` | `test('should create product with valid data')` |
| `test('validation')` | `test('should reject request with missing required fields')` |
| `test('update')` | `test('should update product price within 50% limit')` |
| `test('error')` | `test('should return 404 for non-existent product')` |

### 명명 패턴 라이브러리

#### 정상 시나리오 (Happy Path)

| 패턴 | 예시 |
|------|------|
| `should create [resource] with valid data` | `should create product with valid data` |
| `should create [resource] without [optional field]` | `should create product without description` |
| `should return all [resources]` | `should return all products` |
| `should return [resource] by id` | `should return product by id` |
| `should update [resource] [field]` | `should update product name` |
| `should delete [resource]` | `should delete product` |

#### 예외 시나리오 (Error Cases)

| 패턴 | 예시 |
|------|------|
| `should reject request with missing [field]` | `should reject request with missing name` |
| `should reject request with invalid [field]` | `should reject request with invalid email` |
| `should reject [field] exceeding [limit]` | `should reject name exceeding max length` |
| `should return 400 for [condition]` | `should return 400 for negative price` |
| `should return 404 for non-existent [resource]` | `should return 404 for non-existent product` |
| `should return 409 for duplicate [field]` | `should return 409 for duplicate email` |

#### 경계값 시나리오

| 패턴 | 예시 |
|------|------|
| `should accept [field] at minimum length` | `should accept name at minimum length` |
| `should accept [field] at maximum length` | `should accept name at maximum length` |
| `should reject empty [field]` | `should reject empty name` |
| `should reject [field] below minimum` | `should reject price below minimum` |
| `should reject [field] above maximum` | `should reject quantity above maximum` |

#### 비즈니스 규칙 검증

| 패턴 | 예시 |
|------|------|
| `should enforce [rule] when [condition]` | `should enforce 50% limit when increasing price` |
| `should prevent [action] when [condition]` | `should prevent purchase when out of stock` |
| `should automatically set [field]` | `should automatically set createdAt timestamp` |
| `should calculate [derived field]` | `should calculate total price including tax` |

---

## 단위 테스트 명명 규칙

### 엔티티 테스트

```typescript
describe('[EntityName]', () => {
  describe('Factory Method - create()', () => {
    it('should create entity with valid parameters', () => {});
    it('should throw error when [field] is empty', () => {});
  });

  describe('Business Method - [methodName]()', () => {
    it('should update [field] successfully', () => {});
    it('should throw error when [condition]', () => {});
  });
});
```

### 서비스 테스트

```typescript
describe('[ServiceName]', () => {
  describe('[methodName]()', () => {
    it('should return [result] when [condition]', () => {});
    it('should throw [Exception] when [condition]', () => {});
  });
});
```

---

## E2E 테스트 명명 규칙

### describe 블록 구조

```typescript
describe('[ResourceName]Controller (E2E)', () => {
  describe('[METHOD] /api/[resources]', () => {
    // 테스트 케이스들
  });

  describe('[METHOD] /api/[resources]/:id', () => {
    // 테스트 케이스들
  });

  describe('[METHOD] /api/[resources]/:id/[action]', () => {
    // 테스트 케이스들
  });
});
```

### 예시

```typescript
describe('ProductController (E2E)', () => {
  describe('POST /api/products', () => {
    it('should create a new product', () => {});
    it('should create a product without description', () => {});
    it('should reject request with missing required fields', () => {});
  });

  describe('GET /api/products', () => {
    it('should return empty array when no products exist', () => {});
    it('should return all products', () => {});
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by id', () => {});
    it('should return 404 for non-existent product', () => {});
  });
});
```

---

## 테스트 케이스 카테고리명

### describe 블록 카테고리

| 카테고리 | 용도 | 예시 |
|----------|------|------|
| `정상 시나리오 (Happy Path)` | 정상적인 흐름 | 유효한 데이터로 생성 |
| `유효성 검증 (Validation)` | 데이터 유효성 검사 | 필수 필드 누락 |
| `경계값 분석 (Boundary Values)` | 경계값 테스트 | 최소/최대길이 |
| `비즈니스 규칙 검증` | 도메인 규칙 검증 | 가격 인상 제한 |

---

## 테스트 데이터 명명 규칙

### 테스트 픽스처

```typescript
// 좋은 예
const validProductData = {
  name: 'Test Product',
  price: 10000,
  stock: 10,
};

const invalidProductData = {
  name: '', // 빈 이름
  price: -100, // 음수 가격
};

// 나쁜 예
const data1 = { ... };
const data2 = { ... };
```

### 테스트 변수명

| 용도 | 명명 규칙 | 예시 |
|------|-----------|------|
| 유효한 데이터 | `valid[Resource]Data` | `validProductData` |
| 무효한 데이터 | `invalid[Resource]Data` | `invalidProductData` |
| 최소값 데이터 | `minimal[Resource]Data` | `minimalProductData` |
| 최대값 데이터 | `maximal[Resource]Data` | `maximalProductData` |
| 경계값 데이터 | `boundary[Resource]Data` | `boundaryProductData` |
| 생성된 리소스 | `created[Resource]` | `createdProduct` |
| 응답 | `response` 또는 `result` | `response` |

---

## 테스트 케이스 문서화

### Markdown 템플릿

```markdown
### 2.1 POST /api/[resources]

#### 정상 시나리오 (Happy Path)
- [ ] **TC-E2E-001**: 모든 필수 필드로 [리소스] 생성
  - Given: 유효한 필수 데이터
  - When: POST /api/[resources]
  - Then: 201 Created, 응답에 생성된 ID 포함

#### 유효성 검증 (Validation)
- [ ] **TC-E2E-002**: 필수 필드 누락 시 400 반환
  - Given: 필수 필드가 누락된 데이터
  - When: POST /api/[resources]
  - Then: 400 Bad Request

#### 경계값 분석 (Boundary Values)
- [ ] **TC-E2E-003**: 빈 문자열 필드 처리
  - Given: 빈 문자열이 포함된 데이터
  - When: POST /api/[resources]
  - Then: 400 Bad Request

#### 비즈니스 규칙 검증
- [ ] **TC-E2E-010**: 중복 [필드]로 생성 시도 시 실패
  - Given: 이미 존재하는 [필드]값
  - When: POST /api/[resources]
  - Then: 409 Conflict
```

---

## 우선순위 명명

### 우선순위 레벨

| 우선순위 | 명칭 | 색상 (표기용) |
|----------|------|---------------|
| P0 | 필수 (Critical) | 🔴 |
| P1 | 높음 (High) | 🟠 |
| P2 | 중간 (Medium) | 🟡 |
| P3 | 낮음 (Low) | 🟢 |

### 문서 표기

```markdown
## 4. 테스트 우선순위

### P0 (필수 - MVP 런칭 필수) 🔴
- TC-E2E-001: 모든 필수 필드로 제품 생성
- TC-E2E-002: 제품 단건 조회
- TC-E2E-003: 제품 목록 조회

### P1 (높음 - 안정성 필수) 🟠
- TC-E2E-006: 필수 필드 누락 시 400 반환
- TC-E2E-007: 음수 가격으로 생성 시도 시 400 반환
```

---

## 주석 규칙

### 테스트 케이스 주석

```typescript
// Given
const productData = {
  name: 'Test Product',
  price: 10000,
  stock: 10,
};

// When
const response = await request(app.getHttpServer())
  .post('/api/products')
  .send(productData);

// Then
expect(response.status).toBe(201);
expect(response.body).toHaveProperty('id');
```

### 복잡한 테스트 로직 주석

```typescript
// Arrange: Create a product with specific price for 50% limit test
const product = await createProduct({ price: 10000 });

// Act: Try to increase price by 60% (exceeds 50% limit)
const response = await request(app.getHttpServer())
  .patch(`/api/products/${product.id}`)
  .send({ price: 16000 });

// Assert: Should reject due to 50% limit
expect(response.status).toBe(400);
expect(response.body.message).toContain('50%');
```
