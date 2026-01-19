import { IsString, IsEnum, IsOptional, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '../enums/service-type.enum';

class LocalizedNameDto {
  @ApiProperty({ example: 'Washing' })
  @IsString()
  en: string;

  @ApiProperty({ example: 'ধোয়া' })
  @IsString()
  bn: string;
}

export class CreateServiceDto {
  @ApiProperty({
    type: LocalizedNameDto,
    description: 'Localized service name',
  })
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  name: LocalizedNameDto;

  @ApiProperty({
    enum: ServiceType,
    example: ServiceType.WASHING,
  })
  @IsEnum(ServiceType)
  type: ServiceType;

  @ApiPropertyOptional({ example: 'Professional washing service' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'washing-machine' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
