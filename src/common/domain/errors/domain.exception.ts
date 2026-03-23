/**
 * Base class for all domain exceptions
 *
 * Domain exceptions represent business rule violations or invalid state
 * in the domain model. They are different from infrastructure exceptions
 * (like database errors) or application exceptions (like not found errors).
 *
 * Reference: Martin Fowler - Domain Exception
 * https://martinfowler.com/eaaDev/DomainModel.html
 */
export abstract class DomainException extends Error {
  /**
   * Error code for programmatic handling
   */
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}
