import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Standard API response structure for mobile app consumption.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Global response interceptor that wraps all successful responses
 * in a consistent structure for mobile app consumption.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has our response structure, pass through
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Wrap response in standard structure
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
