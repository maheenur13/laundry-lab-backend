import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CompleteSignupDto } from './dto/complete-signup.dto';
import { JwtPayload } from './strategies/jwt.strategy';

/**
 * Authentication service handling OTP-based login flow.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Normalize phone number to consistent format.
   */
  private normalizePhone(phone: string): string {
    // Remove +880 prefix and ensure 01X format
    let normalized = phone.replace(/^\+880/, '0');
    if (!normalized.startsWith('0')) {
      normalized = '0' + normalized;
    }
    return normalized;
  }

  /**
   * Generate a random 6-digit OTP.
   * In development, uses a fixed OTP for easier testing.
   */
  private generateOtp(): string {
    const isDev = this.configService.get('NODE_ENV') !== 'production';
    if (isDev) {
      return '787800'; // Fixed OTP for development testing
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Request OTP for phone number.
   * In production, this would send SMS via provider.
   */
  async requestOtp(dto: RequestOtpDto): Promise<{ message: string; otp?: string }> {
    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    const otpCode = this.generateOtp();
    const otpExpiry = new Date(
      Date.now() + this.configService.get<number>('OTP_EXPIRY_MINUTES', 5) * 60 * 1000,
    );

    // Save OTP to user (creates temp user if not exists)
    await this.usersService.saveOtp(phoneNumber, otpCode, otpExpiry);

    this.logger.log(`OTP generated for ${phoneNumber}: ${otpCode}`);

    // In development, return OTP for testing
    // In production, integrate with SMS provider (e.g., Twilio, SSL Wireless)
    const isDev = this.configService.get('NODE_ENV') !== 'production';

    return {
      message: 'OTP sent successfully',
      ...(isDev && { otp: otpCode }), // Only return OTP in development
    };
  }

  /**
   * Verify OTP and return auth tokens.
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<{
    accessToken: string;
    user: object;
    isNewUser: boolean;
  }> {
    const phoneNumber = this.normalizePhone(dto.phoneNumber);

    const user = await this.usersService.verifyOtp(phoneNumber, dto.otpCode);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Check if user has completed profile
    const isNewUser = user.fullName === 'New User' || !user.address;

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user._id.toString(),
      phone: user.phoneNumber,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: user.toJSON(),
      isNewUser,
    };
  }

  /**
   * Complete signup with profile information.
   */
  async completeSignup(dto: CompleteSignupDto): Promise<{
    accessToken: string;
    user: object;
  }> {
    const phoneNumber = this.normalizePhone(dto.phoneNumber);

    // Find existing user (should exist after OTP verification)
    const existingUser = await this.usersService.findByPhone(phoneNumber);

    if (!existingUser) {
      throw new BadRequestException('Please verify OTP first');
    }

    if (!existingUser.isVerified) {
      throw new BadRequestException('Phone number not verified');
    }

    // Update user profile
    existingUser.fullName = dto.fullName;
    existingUser.address = dto.address;
    if (dto.role) {
      existingUser.role = dto.role;
    }
    await existingUser.save();

    // Generate new token with updated role
    const payload: JwtPayload = {
      sub: existingUser._id.toString(),
      phone: existingUser.phoneNumber,
      role: existingUser.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: existingUser.toJSON(),
    };
  }

  /**
   * Refresh access token (placeholder for future implementation).
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    // TODO: Implement refresh token logic
    // For now, this is a placeholder for the API structure
    throw new BadRequestException('Refresh token not implemented yet');
  }
}
