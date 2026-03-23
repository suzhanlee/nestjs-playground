import { DomainEventBase } from './domain-event.base';

/**
 * Event emitted when a new Product is created
 */
export class ProductCreatedEvent extends DomainEventBase {
  constructor(
    aggregateId: number,
    public readonly name: string,
    public readonly price: number, // stored in cents
    public readonly stock: number,
    public readonly description?: string,
  ) {
    super(aggregateId);
  }

  protected getEventPayload(): Record<string, unknown> {
    return {
      name: this.name,
      price: this.price,
      stock: this.stock,
      description: this.description,
    };
  }
}

/**
 * Event emitted when a Product's price is changed
 */
export class ProductPriceChangedEvent extends DomainEventBase {
  constructor(
    aggregateId: number,
    public readonly oldPrice: number, // stored in cents
    public readonly newPrice: number, // stored in cents
    public readonly productName: string,
  ) {
    super(aggregateId);
  }

  protected getEventPayload(): Record<string, unknown> {
    return {
      productName: this.productName,
      oldPrice: this.oldPrice,
      newPrice: this.newPrice,
      priceDifference: this.newPrice - this.oldPrice,
    };
  }
}

/**
 * Event emitted when Product stock is decreased
 */
export class StockDecreasedEvent extends DomainEventBase {
  constructor(
    aggregateId: number,
    public readonly productName: string,
    public readonly quantityDecreased: number,
    public readonly remainingStock: number,
  ) {
    super(aggregateId);
  }

  protected getEventPayload(): Record<string, unknown> {
    return {
      productName: this.productName,
      quantityDecreased: this.quantityDecreased,
      remainingStock: this.remainingStock,
    };
  }
}

/**
 * Event emitted when Product stock is increased
 */
export class StockIncreasedEvent extends DomainEventBase {
  constructor(
    aggregateId: number,
    public readonly productName: string,
    public readonly quantityAdded: number,
    public readonly newStock: number,
  ) {
    super(aggregateId);
  }

  protected getEventPayload(): Record<string, unknown> {
    return {
      productName: this.productName,
      quantityAdded: this.quantityAdded,
      newStock: this.newStock,
    };
  }
}

/**
 * Event emitted when Product stock is low (alert level)
 */
export class StockLowEvent extends DomainEventBase {
  constructor(
    aggregateId: number,
    public readonly productName: string,
    public readonly currentStock: number,
    public readonly threshold: number = 10,
  ) {
    super(aggregateId);
  }

  protected getEventPayload(): Record<string, unknown> {
    return {
      productName: this.productName,
      currentStock: this.currentStock,
      threshold: this.threshold,
    };
  }
}

/**
 * Event emitted when Product name is changed
 */
export class ProductNameChangedEvent extends DomainEventBase {
  constructor(
    aggregateId: number,
    public readonly oldName: string,
    public readonly newName: string,
  ) {
    super(aggregateId);
  }

  protected getEventPayload(): Record<string, unknown> {
    return {
      oldName: this.oldName,
      newName: this.newName,
    };
  }
}

/**
 * Event emitted when Product description is changed
 */
export class ProductDescriptionChangedEvent extends DomainEventBase {
  constructor(
    aggregateId: number,
    public readonly productName: string,
    public readonly oldDescription: string | null,
    public readonly newDescription: string | null,
  ) {
    super(aggregateId);
  }

  protected getEventPayload(): Record<string, unknown> {
    return {
      productName: this.productName,
      oldDescription: this.oldDescription,
      newDescription: this.newDescription,
    };
  }
}

/**
 * Event emitted when a Product is deleted
 */
export class ProductDeletedEvent extends DomainEventBase {
  constructor(
    aggregateId: number,
    public readonly productName: string,
  ) {
    super(aggregateId);
  }

  protected getEventPayload(): Record<string, unknown> {
    return {
      productName: this.productName,
    };
  }
}
