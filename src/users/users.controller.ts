import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard, RolesGuard, CurrentUser, Roles } from '../common';
import { User } from './schemas/user.schema';
import { UserRole } from './enums/user-role.enum';

/**
 * Controller for user profile management.
 */
@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user's profile.
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  /**
   * Update current user's profile.
   */
  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, dto);
  }

  /**
   * Get all users (admin only).
   */
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiResponse({ status: 200, description: 'Users list returned' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getAllUsers(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  /**
   * Get all delivery personnel (admin only).
   */
  @Get('delivery-personnel')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all delivery personnel (Admin only)' })
  @ApiResponse({ status: 200, description: 'Delivery personnel list returned' })
  async getDeliveryPersonnel() {
    return this.usersService.findDeliveryPersonnel();
  }
}
