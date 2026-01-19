import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ServiceType } from '../enums/service-type.enum';

export type ServiceDocument = Service & Document;

/**
 * Laundry service schema.
 * Represents a service (washing, ironing) with pricing info.
 */
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Service {
  @Prop({
    type: {
      en: { type: String, required: true },
      bn: { type: String, required: true },
    },
    required: true,
  })
  name: {
    en: string;
    bn: string;
  };

  @Prop({
    type: String,
    enum: ServiceType,
    required: true,
    unique: true,
  })
  type: ServiceType;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  icon: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

// Note: type field already has unique: true in @Prop, no need for explicit index
