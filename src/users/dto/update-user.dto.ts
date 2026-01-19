import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating user profile.
 * Only name and address can be updated by the user.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'রহিম উদ্দিন',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'User address',
    example: 'House 10, Road 5, Dhanmondi, Dhaka',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}
