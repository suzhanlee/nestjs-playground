// Value Objects
export * from './value-objects/value-object.base';
export * from './value-objects/money.value-object';
export * from './value-objects/quantity.value-object';

// Domain Events
export * from './events/domain-event.interface';
export * from './events/domain-event.base';
export * from './events/product.events';
export * from './events/category.events';

// Domain Exceptions
export * from './errors/domain.exception';
export * from './errors/invalid-money.exception';
export * from './errors/invalid-quantity.exception';
export * from './errors/insufficient-stock.exception';
export * from './errors/invalid-price-change.exception';
export * from './errors/invalid-product-name.exception';
export * from './errors/invalid-category-name.exception';
export * from './errors/category-already-exists.exception';
export * from './errors/category-has-products.exception';
export * from './errors/category-has-children.exception';
export * from './errors/category-depth-exceeded.exception';
export * from './errors/category-circular-reference.exception';
export * from './errors/last-category-exception';

// Ports (Interfaces)
export * from './ports/event-dispatcher.interface';
