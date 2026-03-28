import { DomainException } from './domain.exception';

export class LastCategoryException extends DomainException {
  constructor(message: string = 'Cannot delete the last category') {
    super(message);
  }
}
