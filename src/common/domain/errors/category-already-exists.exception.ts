import { DomainException } from './domain.exception';

export class CategoryAlreadyExistsException extends DomainException {
  constructor(message: string = 'Category already exists') {
    super(message);
  }
}
