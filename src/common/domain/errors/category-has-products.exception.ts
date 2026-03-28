import { DomainException } from './domain.exception';

export class CategoryHasProductsException extends DomainException {
  constructor(message: string = 'Cannot delete category with products') {
    super(message);
  }
}
