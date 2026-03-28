import { DomainException } from './domain.exception';

export class InvalidCategoryNameException extends DomainException {
  constructor(message: string = 'Invalid category name') {
    super(message);
  }
}
