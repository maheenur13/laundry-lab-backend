import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for requesting OTP.
 */
export class RequestOtpDto {
  @ApiProperty({
    description: 'Bangladesh phone number',
    example: '01712345678',
    pattern: '^(\\+880|0)?1[3-9]\\d{8}$',
  })
  @IsString()
  @Matches(/^(\+880|0)?1[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladesh phone number',
  })
  phoneNumber: string;
}
