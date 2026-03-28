import { DomainException } from './domain.exception';

export class CategoryCircularReferenceException extends DomainException {
  constructor(message: string = 'Circular reference detected in category hierarchy') {
    super(message);
  }
}
