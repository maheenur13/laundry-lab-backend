import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteSignupDto } from './dto/complete-signup.dto';
import { Public } from '../common';

/**
 * Authentication controller for OTP-based login.
 * All routes are public (no JWT required).
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Request OTP for phone number.
   * Rate-limited to prevent abuse.
   */
  @Post('request-otp')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Request OTP for phone number' })
  @ApiResponse({
    status: 201,
    description: 'OTP sent successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'OTP sent successfully' },
            otp: { type: 'string', example: '123456', description: 'Only in development' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  /**
   * Verify OTP and get access token.
   */
  @Post('verify-otp')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({ summary: 'Verify OTP and get access token' })
  @ApiResponse({
    status: 201,
    description: 'OTP verified, token returned',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            user: { type: 'object' },
            isNewUser: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /**
   * Complete signup with profile information.
   */
  @Post('complete-signup')
  @Public()
  @ApiOperation({ summary: 'Complete signup with profile details' })
  @ApiResponse({
    status: 201,
    description: 'Signup completed, new token returned',
  })
  @ApiResponse({ status: 400, description: 'Phone not verified' })
  async completeSignup(@Body() dto: CompleteSignupDto) {
    return this.authService.completeSignup(dto);
  }

  /**
   * Refresh access token (placeholder).
   */
  @Post('refresh-token')
  @Public()
  @ApiOperation({ summary: 'Refresh access token (not implemented)' })
  @ApiResponse({ status: 400, description: 'Not implemented yet' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
