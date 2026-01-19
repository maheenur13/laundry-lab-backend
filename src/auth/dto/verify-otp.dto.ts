import { IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for verifying OTP.
 */
export class VerifyOtpDto {
  @ApiProperty({
    description: 'Bangladesh phone number',
    example: '01712345678',
  })
  @IsString()
  @Matches(/^(\+880|0)?1[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladesh phone number',
  })
  phoneNumber: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otpCode: string;
}
