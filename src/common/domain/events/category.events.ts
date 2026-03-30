import { IDomainEvent } from './domain-event.interface';

export class CategoryCreatedEvent implements IDomainEvent {
  readonly aggregateId: number;
  readonly occurredAt: Date = new Date();
  readonly name: string;
  readonly parentId: number | null;
  readonly level: number;

  constructor(id: number, name: string, parentId: number | null, level: number) {
    this.aggregateId = id;
    this.name = name;
    this.parentId = parentId;
    this.level = level;
  }
}

export class CategoryNameChangedEvent implements IDomainEvent {
  readonly aggregateId: number;
  readonly occurredAt: Date = new Date();
  readonly oldName: string;
  readonly newName: string;

  constructor(id: number, oldName: string, newName: string) {
    this.aggregateId = id;
    this.oldName = oldName;
    this.newName = newName;
  }
}

export class CategoryParentChangedEvent implements IDomainEvent {
  readonly aggregateId: number;
  readonly occurredAt: Date = new Date();
  readonly oldParentId: number | null;
  readonly newParentId: number | null;
  readonly oldLevel: number;
  readonly newLevel: number;

  constructor(
    id: number,
    oldParentId: number | null,
    newParentId: number | null,
    oldLevel: number,
    newLevel: number,
  ) {
    this.aggregateId = id;
    this.oldParentId = oldParentId;
    this.newParentId = newParentId;
    this.oldLevel = oldLevel;
    this.newLevel = newLevel;
  }
}

export class CategoryActivatedEvent implements IDomainEvent {
  readonly aggregateId: number;
  readonly occurredAt: Date = new Date();
  readonly name: string;

  constructor(id: number, name: string) {
    this.aggregateId = id;
    this.name = name;
  }
}

export class CategoryDeactivatedEvent implements IDomainEvent {
  readonly aggregateId: number;
  readonly occurredAt: Date = new Date();
  readonly name: string;

  constructor(id: number, name: string) {
    this.aggregateId = id;
    this.name = name;
  }
}

export class CategoryDeletedEvent implements IDomainEvent {
  readonly aggregateId: number;
  readonly occurredAt: Date = new Date();
  readonly name: string;
  readonly parentId: number | null;

  constructor(id: number, name: string, parentId: number | null) {
    this.aggregateId = id;
    this.name = name;
    this.parentId = parentId;
  }
}
