import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClothingCategory } from '../enums/clothing-category.enum';
import { ServiceType } from '../enums/service-type.enum';

class LocalizedNameDto {
  @ApiProperty({ example: 'Shirt' })
  @IsString()
  en: string;

  @ApiProperty({ example: 'শার্ট' })
  @IsString()
  bn: string;
}

export class CreateClothingItemDto {
  @ApiProperty({
    type: LocalizedNameDto,
    description: 'Localized name (English and Bangla)',
  })
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  name: LocalizedNameDto;

  @ApiProperty({
    enum: ClothingCategory,
    example: ClothingCategory.MEN,
  })
  @IsEnum(ClothingCategory)
  category: ClothingCategory;

  @ApiPropertyOptional({
    example: 'shirt',
    description: 'Icon identifier',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    enum: ServiceType,
    isArray: true,
    example: [ServiceType.WASHING, ServiceType.IRONING],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  availableServices?: ServiceType[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
