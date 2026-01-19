import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDeliveryDto {
  @ApiProperty({
    description: 'Delivery person user ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  deliveryPersonId: string;
}
