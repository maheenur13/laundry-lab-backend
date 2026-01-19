import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ClothingCategory } from '../enums/clothing-category.enum';
import { ServiceType } from '../enums/service-type.enum';

export type ClothingItemDocument = ClothingItem & Document;

/**
 * Clothing item schema.
 * Represents a type of clothing that can be selected for laundry.
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
export class ClothingItem {
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
    enum: ClothingCategory,
    required: true,
  })
  category: ClothingCategory;

  @Prop({ type: String })
  icon: string;

  @Prop({
    type: [String],
    enum: ServiceType,
    default: [ServiceType.WASHING, ServiceType.IRONING],
  })
  availableServices: ServiceType[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ClothingItemSchema = SchemaFactory.createForClass(ClothingItem);

// Indexes
ClothingItemSchema.index({ category: 1 });
ClothingItemSchema.index({ isActive: 1 });
