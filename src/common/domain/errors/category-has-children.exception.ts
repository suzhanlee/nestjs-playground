import { DomainException } from './domain.exception';

export class CategoryHasChildrenException extends DomainException {
  constructor(message: string = 'Cannot delete category with subcategories') {
    super(message);
  }
}
