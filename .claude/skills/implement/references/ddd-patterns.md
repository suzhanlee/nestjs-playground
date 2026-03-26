# DDD 패턴 참조

## Value Object (값 객체)

### 개념

Value Object는 식별자(ID) 없이 값 자체로 동등성을 판단하는 불변 객체입니다.

### 특징

1. **불변성 (Immutable)**: 한 번 생성되면 내부 상태가 변경되지 않음
2. **값 기반 동등성**: 모든 속성이 같으면 동일한 객체로 간주
3. **식별자 없음**: ID와 같은 식별자를 가지지 않음
4. **자가 유효성 검증**: 생성 시점에 유효성을 검증

### 예시: Money Value Object

```typescript
export class Money {
  private readonly amountInCents: number;

  // private constructor - 외부에서 직접 생성 불가
  private constructor(amountInCents: number) {
    if (amountInCents < 0) {
      throw new InvalidMoneyException();
    }
    this.amountInCents = amountInCents;
  }

  // Factory Method: 원하는 단위로 생성
  static create(cents: number): Money {
    return new Money(cents);
  }

  static fromWon(won: number): Money {
    if (won < 0) {
      throw new InvalidMoneyException();
    }
    return new Money(Math.round(won * 100));
  }

  // 비즈니스 메서드: 항상 새로운 인스턴스 반환
  add(other: Money): Money {
    return new Money(this.amountInCents + other.amountInCents);
  }

  subtract(other: Money): Money {
    const result = this.amountInCents - other.amountInCents;
    if (result < 0) {
      throw new InvalidMoneyException();
    }
    return new Money(result);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.amountInCents * factor));
  }

  // 비교 메서드
  isGreaterThan(other: Money): boolean {
    return this.amountInCents > other.amountInCents;
  }

  equals(other: Money): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.amountInCents === other.amountInCents;
  }

  // 변환 메서드
  toCents(): number {
    return this.amountInCents;
  }

  toWon(): number {
    return this.amountInCents / 100;
  }

  toFormat(): string {
    return `₩${this.toWon().toLocaleString('ko-KR')}`;
  }
}
```

### 예시: Quantity Value Object

```typescript
export class Quantity {
  private readonly value: number;

  private constructor(value: number) {
    if (value < 0 || !Number.isInteger(value)) {
      throw new InvalidQuantityException();
    }
    this.value = value;
  }

  static of(value: number): Quantity {
    return new Quantity(value);
  }

  static zero(): Quantity {
    return new Quantity(0);
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }

  decrease(amount: Quantity): Quantity {
    const result = this.value - amount.value;
    if (result < 0) {
      throw new InvalidQuantityException();
    }
    return new Quantity(result);
  }

  increase(amount: Quantity): Quantity {
    return new Quantity(this.value + amount.value);
  }

  hasEnoughFor(required: Quantity): boolean {
    return this.value >= required.value;
  }

  equals(other: Quantity): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.value === other.value;
  }
}
```

### 일반적인 Value Objects

| 도메인 | Value Object | 속성 |
|--------|--------------|------|
| 금융 | Money | amount, currency |
| 재고 | Quantity | value |
| 주소 | Address | street, city, zipCode, country |
| 연락처 | Email | address |
| 식별 | PhoneNumber | number, countryCode |
| 측정 | Measurement | value, unit |
| 기간 | DateRange | startDate, endDate |
| 비율 | Percentage | value (0-100) |

---

## Aggregate (애그리거트)

### 개념

Aggregate는 관련된 객체들을 하나의 단위로 묶은 것입니다. 일관성 경계를 형성하고, 트랜잭션의 단위가 됩니다.

### 특징

1. **Aggregate Root**: 단일 진입점 (루트 엔티티)
2. **일관성 경계**: 내부 객체의 일관성을 보장
3. **트랜잭션 경계**: 하나의 트랜잭션으로 처리
4. **ID 기반 참조**: 타 애그리거트는 ID로만 참조

### 예시: Product Aggregate

```typescript
@Entity('products')
export class Product {
  // ========================================
  // Private Properties (TypeORM columns)
  // ========================================

  @PrimaryGeneratedColumn()
  private _id: number;

  private _name: string;
  private _description: string | null;
  private _priceInCents: number;
  private _stock: number;

  private _domainEvents: IDomainEvent[] = [];

  // ========================================
  // TypeORM Decorators (on getters)
  // ========================================

  @Column({ nullable: false, length: 255 })
  get name(): string {
    return this._name;
  }

  @Column({ length: 1000, nullable: true })
  get description(): string | null {
    return this._description;
  }

  @Column({ type: 'int', nullable: false, default: 0 })
  get stock(): number {
    return this._stock;
  }
  set stock(value: number) {
    this._stock = value;
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column()
  get id(): number {
    return this._id;
  }
  set id(value: number) {
    this._id = value;
  }

  // ========================================
  // Factory Method
  // ========================================

  static create(data: {
    name: string;
    description?: string;
    price: Money;
    stock: Quantity;
  }): Product {
    // Validate name
    if (!data.name || data.name.trim().length === 0 || data.name.length > 255) {
      throw new InvalidProductNameException();
    }

    const product = new Product();
    product._name = data.name.trim();
    product._description = data.description?.trim() || null;
    product._priceInCents = data.price.toCents();
    product._stock = data.stock.toNumber();

    // Emit domain event
    product.addEvent(new ProductCreatedEvent(
      0, // ID not assigned yet
      product._name,
      product._priceInCents,
      product._stock,
      product._description,
    ));

    return product;
  }

  // ========================================
  // Business Methods - Price
  // ========================================

  changePrice(newPrice: Money): void {
    const currentPrice = Money.create(this._priceInCents);

    // Business rule: cannot increase by more than 50%
    if (newPrice.isGreaterThan(currentPrice.multiply(1.5))) {
      throw new InvalidPriceChangeException();
    }

    const oldPrice = this._priceInCents;
    this._priceInCents = newPrice.toCents();

    this.addEvent(new ProductPriceChangedEvent(this._id, oldPrice, this._priceInCents, this._name));
  }

  getPrice(): Money {
    return Money.create(this._priceInCents);
  }

  // ========================================
  // Business Methods - Stock
  // ========================================

  decreaseStock(quantity: Quantity): void {
    const currentStock = Quantity.of(this._stock);

    if (currentStock.isLessThan(quantity)) {
      throw new InsufficientStockException(this._stock, quantity.toNumber());
    }

    const newStock = currentStock.decrease(quantity);
    this._stock = newStock.toNumber();

    this.addEvent(new StockDecreasedEvent(this._id, this._name, quantity.toNumber(), this._stock));

    const LOW_STOCK_THRESHOLD = 10;
    if (newStock.toNumber() > 0 && newStock.isLessThan(Quantity.of(LOW_STOCK_THRESHOLD))) {
      this.addEvent(new StockLowEvent(this._id, this._name, this._stock, LOW_STOCK_THRESHOLD));
    }
  }

  increaseStock(quantity: Quantity): void {
    const currentStock = Quantity.of(this._stock);
    const newStock = currentStock.increase(quantity);
    this._stock = newStock.toNumber();

    this.addEvent(new StockIncreasedEvent(this._id, this._name, quantity.toNumber(), this._stock));
  }

  getStock(): Quantity {
    return Quantity.of(this._stock);
  }

  // ========================================
  // Business Methods - Queries
  // ========================================

  isInStock(quantity: number = 1): boolean {
    return this._stock >= quantity;
  }

  isLowStock(threshold: number = 10): boolean {
    return this._stock > 0 && this._stock < threshold;
  }

  isOutOfStock(): boolean {
    return this._stock === 0;
  }

  getTotalValue(): Money {
    return Money.create(this._priceInCents).multiply(this._stock);
  }

  // ========================================
  // Domain Events Management
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

  // ========================================
  // Lifecycle Methods
  // ========================================

  markAsDeleted(): void {
    this.addEvent(new ProductDeletedEvent(this._id, this._name));
  }
}
```

---

## 애그리거트 간 참조 규칙

### 규칙: ID로만 참조

타 애그리거트를 참조할 때는 객체 참조가 아닌 ID만 저장합니다.

```typescript
// ✅ 올바른 참조 방식
@Entity('orders')
export class Order {
  private _productId: number;  // ID로만 참조
  private _quantity: number;
}

// ❌ 잘못된 참조 방식
@Entity('orders')
export class Order {
  private _product: Product;  // 객체 참조 (X)
  private _quantity: number;
}
```

### 이유

1. **일관성 경계**: 각 애그리거트는 자신의 일관성만 책임
2. **성능**: 로딩 범위를 명확히 제어
3. **복잡성 감소**: 순환 참조 방지

### 해결 방법

필요한 경우 Application Service에서 두 애그리거트를 조합:

```typescript
@Injectable()
export class OrderApplicationService {
  async createOrder(dto: CreateOrderDto): Promise<OrderResponseDto> {
    // 1. Product 조회 (ID로)
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      throw new NotFoundException();
    }

    // 2. 재고 확인 및 감소 (Product의 비즈니스 로직)
    product.decreaseStock(Quantity.of(dto.quantity));

    // 3. Order 생성 (Product ID만 참조)
    const order = Order.create({
      productId: dto.productId,  // ID만 저장
      quantity: dto.quantity,
      price: product.getPrice(), // 필요한 데이터는 복사
    });

    // 4. 각각 저장
    await this.productRepository.save(product);
    await this.orderRepository.save(order);

    return OrderResponseDto.fromEntity(order);
  }
}
```

---

## Repository Pattern

### 인터페이스 (Domain Layer)

```typescript
// src/modules/product/domain/repositories/product.repository.interface.ts
export interface IProductRepository {
  findById(id: number): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  save(entity: Product): Promise<Product>;
  delete(id: number): Promise<void>;
  findByName(name: string): Promise<Product[]>;
  count(): Promise<number>;
}
```

### 구현 (Infrastructure Layer)

```typescript
// src/modules/product/infrastructure/repositories/product.repository.impl.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Product } from '../../domain/entities/product.entity';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';

@Injectable()
export class ProductRepositoryImpl implements IProductRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: number): Promise<Product | null> {
    const repo = this.dataSource.getRepository(Product);
    return await repo.findOne({ where: { id } });
  }

  async findAll(): Promise<Product[]> {
    const repo = this.dataSource.getRepository(Product);
    return await repo.find();
  }

  async save(entity: Product): Promise<Product> {
    const repo = this.dataSource.getRepository(Product);
    return await repo.save(entity);
  }

  async delete(id: number): Promise<void> {
    const repo = this.dataSource.getRepository(Product);
    await repo.delete(id);
  }

  async findByName(name: string): Promise<Product[]> {
    const repo = this.dataSource.getRepository(Product);
    return await repo.find({ where: { name } });
  }

  async count(): Promise<number> {
    const repo = this.dataSource.getRepository(Product);
    return await repo.count();
  }
}
```

### DI 설정 (Module)

```typescript
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

---

## 도메인 이벤트

### 이벤트 인터페이스

```typescript
export interface IDomainEvent {
  occurredAt: Date;
}
```

### 이벤트 예시

```typescript
export class ProductCreatedEvent implements IDomainEvent {
  occurredAt: Date;
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly priceInCents: number,
    public readonly stock: number,
    public readonly description: string | null,
  ) {
    this.occurredAt = new Date();
  }
}
```

### 이벤트 발행 및 처리

```typescript
// Entity에서 이벤트 추가
product.addEvent(new ProductCreatedEvent(...));

// Repository에서 이벤트 저장 후 처리
await repository.save(product);
const events = product.domainEvents;
product.clearDomainEvents();
await eventBus.publish(events);
```

---

## 요약: DDD 패턴 체크리스트

### Value Object
- [ ] private constructor
- [ ] static factory method (create, of, from*)
- [ ] private readonly 프로퍼티
- [ ] 생성자에서 유효성 검증
- [ ] equals() 메서드
- [ ] 비즈니스 메서드는 새 인스턴스 반환

### Aggregate Root
- [ ] private 프로퍼티 (_id, _name 등)
- [ ] static create() 팩토리 메서드
- [ ] 비즈니스 메서드로 상태 변경
- [ ] 상태 변경 시 도메인 이벤트 발행
- [ ] domainEvents getter
- [ ] clearDomainEvents() 메서드

### 애그리거트 간 참조
- [ ] ID로만 참조
- [ ] 객체 참조 없음

### Repository
- [ ] 인터페이스는 domain 레이어
- [ ] 구현체는 infrastructure 레이어
- [ ] DI로 인터페이스 주입
