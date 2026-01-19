import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ClothingCategory } from '../enums/clothing-category.enum';
import { ServiceType } from '../enums/service-type.enum';

export type PricingDocument = Pricing & Document;

/**
 * Pricing schema.
 * Defines price for a specific clothing item + service combination.
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
export class Pricing {
  @Prop({ type: Types.ObjectId, ref: 'ClothingItem', required: true })
  clothingItem: Types.ObjectId;

  @Prop({
    type: String,
    enum: ServiceType,
    required: true,
  })
  serviceType: ServiceType;

  @Prop({
    type: String,
    enum: ClothingCategory,
    required: true,
  })
  category: ClothingCategory;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const PricingSchema = SchemaFactory.createForClass(Pricing);

// Compound unique index
PricingSchema.index(
  { clothingItem: 1, serviceType: 1, category: 1 },
  { unique: true },
);
