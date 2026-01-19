import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enums/user-role.enum';

/**
 * Service for user-related business logic.
 * Handles CRUD operations and user lookups.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Find user by phone number.
   */
  async findByPhone(phoneNumber: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phoneNumber }).exec();
  }

  /**
   * Find user by ID.
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Create a new user (called during signup).
   */
  async create(data: {
    fullName: string;
    phoneNumber: string;
    address: string;
    role?: UserRole;
  }): Promise<UserDocument> {
    const existingUser = await this.findByPhone(data.phoneNumber);
    if (existingUser) {
      throw new ConflictException('Phone number already registered');
    }

    const user = new this.userModel({
      ...data,
      role: data.role || UserRole.CUSTOMER,
      isVerified: true, // Set to true after OTP verification
    });

    return user.save();
  }

  /**
   * Update user profile.
   */
  async update(userId: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, dto, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Save OTP for a phone number (creates temp user if not exists).
   */
  async saveOtp(phoneNumber: string, otpCode: string, otpExpiry: Date): Promise<void> {
    await this.userModel.updateOne(
      { phoneNumber },
      {
        $set: { otpCode, otpExpiry },
        $setOnInsert: {
          fullName: 'New User',
          address: '',
          role: UserRole.CUSTOMER,
          isVerified: false,
        },
      },
      { upsert: true },
    );
  }

  /**
   * Verify OTP and mark user as verified.
   */
  async verifyOtp(phoneNumber: string, otpCode: string): Promise<UserDocument | null> {
    const user = await this.findByPhone(phoneNumber);

    if (!user) {
      return null;
    }

    if (user.otpCode !== otpCode) {
      return null;
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return null;
    }

    // Clear OTP and mark as verified
    user.otpCode = '';
    user.otpExpiry = undefined as unknown as Date;
    user.isVerified = true;
    await user.save();

    return user;
  }

  /**
   * Get all users (admin only).
   */
  async findAll(role?: UserRole): Promise<UserDocument[]> {
    const query = role ? { role } : {};
    return this.userModel.find(query).exec();
  }

  /**
   * Get all delivery personnel.
   */
  async findDeliveryPersonnel(): Promise<UserDocument[]> {
    return this.userModel.find({ role: UserRole.DELIVERY }).exec();
  }
}
