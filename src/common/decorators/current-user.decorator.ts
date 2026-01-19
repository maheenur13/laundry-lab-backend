import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator to extract the current authenticated user from request.
 * Use this to access the user object in route handlers.
 *
 * @example
 * @Get('me')
 * async getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 *
 * @example
 * @Get('my-id')
 * async getMyId(@CurrentUser('_id') userId: string) {
 *   return userId;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a specific property is requested, return that property
    if (data) {
      return user?.[data];
    }

    return user;
  },
);
