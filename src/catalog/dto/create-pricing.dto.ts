import { IsString, IsEnum, IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClothingCategory } from '../enums/clothing-category.enum';
import { ServiceType } from '../enums/service-type.enum';

export class CreatePricingDto {
  @ApiProperty({
    description: 'Clothing item ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  clothingItemId: string;

  @ApiProperty({
    enum: ServiceType,
    example: ServiceType.WASHING,
  })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({
    enum: ClothingCategory,
    example: ClothingCategory.MEN,
  })
  @IsEnum(ClothingCategory)
  category: ClothingCategory;

  @ApiProperty({
    description: 'Price in BDT',
    example: 50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
