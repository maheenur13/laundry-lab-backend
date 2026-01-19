import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';

export type UserDocument = User & Document;

/**
 * User schema for MongoDB.
 * Phone number is the primary identifier (no password - OTP-based auth).
 */
@Schema({
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: {
    virtuals: true,
    transform: (_, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.otpCode;
      delete ret.otpExpiry;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    // Bangladesh phone number format: +880XXXXXXXXXX or 01XXXXXXXXX
    match: /^(\+880|0)?1[3-9]\d{8}$/,
  })
  phoneNumber: string;

  @Prop({ trim: true })
  address: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Prop({ default: false })
  isVerified: boolean;

  // OTP fields (not exposed in responses)
  @Prop()
  otpCode: string;

  @Prop()
  otpExpiry: Date;

  // Timestamps added by Mongoose
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index for better query performance (phoneNumber already has unique: true in @Prop)
UserSchema.index({ role: 1 });
