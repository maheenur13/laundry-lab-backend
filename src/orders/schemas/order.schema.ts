import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../enums/order-status.enum';
import { ServiceType } from '../../catalog/enums/service-type.enum';
import { ClothingCategory } from '../../catalog/enums/clothing-category.enum';

export type OrderDocument = Order & Document;

/**
 * Order item sub-document schema.
 */
@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'ClothingItem', required: true })
  clothingItem: Types.ObjectId;

  @Prop({ type: String, required: true })
  clothingItemName: string;

  @Prop({
    type: String,
    enum: ClothingCategory,
    required: true,
  })
  category: ClothingCategory;

  @Prop({
    type: [String],
    enum: ServiceType,
    required: true,
  })
  services: ServiceType[];

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice: number;

  @Prop({ type: Number, required: true, min: 0 })
  subtotal: number;
}

/**
 * Pricing details sub-document schema.
 */
@Schema({ _id: false })
export class OrderPricing {
  @Prop({ type: Number, required: true, min: 0 })
  itemsTotal: number;

  @Prop({ type: Number, required: true, min: 0 })
  deliveryCharge: number;

  @Prop({ type: Number, required: true, min: 0 })
  grandTotal: number;
}

/**
 * Address sub-document schema.
 */
@Schema({ _id: false })
export class OrderAddress {
  @Prop({ type: String, required: true })
  fullAddress: string;

  @Prop({ type: String })
  landmark: string;

  @Prop({ type: String })
  contactPhone: string;
}

/**
 * Status history entry sub-document.
 */
@Schema({ _id: false })
export class StatusHistoryEntry {
  @Prop({
    type: String,
    enum: OrderStatus,
    required: true,
  })
  status: OrderStatus;

  @Prop({ type: Date, required: true, default: Date.now })
  timestamp: Date;

  @Prop({ type: String })
  note: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

/**
 * Main Order schema.
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
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deliveryPerson: Types.ObjectId;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ type: OrderPricing, required: true })
  pricing: OrderPricing;

  @Prop({ type: OrderAddress, required: true })
  pickupAddress: OrderAddress;

  @Prop({ type: OrderAddress })
  deliveryAddress: OrderAddress;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.REQUESTED,
  })
  status: OrderStatus;

  @Prop({ type: [StatusHistoryEntry], default: [] })
  statusHistory: StatusHistoryEntry[];

  @Prop({ type: String })
  notes: string;

  @Prop({ type: Date })
  scheduledPickupTime: Date;

  @Prop({ type: Date })
  estimatedDeliveryTime: Date;

  // Timestamps added by Mongoose
  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes for better query performance
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ deliveryPerson: 1, status: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
