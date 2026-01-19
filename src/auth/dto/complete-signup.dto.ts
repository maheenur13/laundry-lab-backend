import { IsString, MinLength, MaxLength, IsOptional, IsEnum, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/enums/user-role.enum';

/**
 * DTO for completing signup after OTP verification.
 */
export class CompleteSignupDto {
  @ApiProperty({
    description: 'Bangladesh phone number (verified)',
    example: '01712345678',
  })
  @IsString()
  @Matches(/^(\+880|0)?1[3-9]\d{8}$/, {
    message: 'Please provide a valid Bangladesh phone number',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'User full name',
    example: 'রহিম উদ্দিন',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: 'User address',
    example: 'House 10, Road 5, Dhanmondi, Dhaka',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  address: string;

  @ApiPropertyOptional({
    description: 'User role (default: customer)',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
