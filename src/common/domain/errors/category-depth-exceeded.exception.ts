import { DomainException } from './domain.exception';

export class CategoryDepthExceededException extends DomainException {
  constructor(message: string = 'Maximum category depth exceeded') {
    super(message);
  }
}
