/**
 * Standard API response wrapper (similar to ResponseEntity in Spring)
 */
export class ApiResponseDto<T> {
  /** Success status */
  success: boolean;

  /** Response message */
  message: string;

  /** Optional response data */
  data?: T;

  /** ISO timestamp of response */
  timestamp: string;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static ok<T>(message: string, data?: T): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data);
  }

  static error(message: string): ApiResponseDto<null> {
    return new ApiResponseDto(false, message, null);
  }
}
