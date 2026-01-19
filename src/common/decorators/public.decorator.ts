import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route as public (no authentication required).
 * Use this on routes that should be accessible without a JWT token.
 *
 * @example
 * @Public()
 * @Post('request-otp')
 * async requestOtp(@Body() dto: RequestOtpDto) { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
