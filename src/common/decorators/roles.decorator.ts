import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access a route.
 * Must be used with RolesGuard.
 *
 * @example
 * @Roles(UserRole.ADMIN)
 * @Get('all-orders')
 * async getAllOrders() { ... }
 *
 * @example
 * @Roles(UserRole.ADMIN, UserRole.DELIVERY)
 * @Patch(':id/status')
 * async updateStatus() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
