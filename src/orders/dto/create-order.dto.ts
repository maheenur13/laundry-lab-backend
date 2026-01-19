import {
  IsString,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  ValidateNested,
  Min,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '../../catalog/enums/service-type.enum';
import { ClothingCategory } from '../../catalog/enums/clothing-category.enum';

class OrderItemDto {
  @ApiProperty({
    description: 'Clothing item ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  clothingItemId: string;

  @ApiProperty({
    enum: ClothingCategory,
    example: ClothingCategory.MEN,
  })
  @IsEnum(ClothingCategory)
  category: ClothingCategory;

  @ApiProperty({
    enum: ServiceType,
    isArray: true,
    example: [ServiceType.WASHING, ServiceType.IRONING],
  })
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  services: ServiceType[];

  @ApiProperty({
    description: 'Quantity',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

class AddressDto {
  @ApiProperty({
    description: 'Full address',
    example: 'House 10, Road 5, Dhanmondi, Dhaka 1205',
  })
  @IsString()
  @MaxLength(500)
  fullAddress: string;

  @ApiPropertyOptional({
    description: 'Landmark for easier location',
    example: 'Near Star Kabab',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @ApiPropertyOptional({
    description: 'Contact phone for this address',
    example: '01712345678',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Order items',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Pickup address',
    type: AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  pickupAddress: AddressDto;

  @ApiPropertyOptional({
    description: 'Delivery address (if different from pickup)',
    type: AddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  deliveryAddress?: AddressDto;

  @ApiPropertyOptional({
    description: 'Additional notes for the order',
    example: 'Please handle with care',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Scheduled pickup time',
    example: '2024-01-15T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledPickupTime?: string;
}
