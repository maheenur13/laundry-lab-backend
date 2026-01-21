import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { AssignDeliveryDto } from "./dto/assign-delivery.dto";
import { JwtAuthGuard, RolesGuard, CurrentUser, Roles } from "../common";
import { UserRole } from "../users/enums/user-role.enum";
import { User, UserDocument } from "../users/schemas/user.schema";
import { OrderStatus } from "./enums/order-status.enum";

/**
 * Orders controller - order management endpoints.
 */
@ApiTags("Orders")
@ApiBearerAuth("JWT-auth")
@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ========== Customer Endpoints ==========

  /**
   * Create a new order (customer).
   */
  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: "Create a new order (Customer only)" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  @ApiResponse({ status: 400, description: "Invalid order data" })
  async createOrder(
    @CurrentUser("_id") userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(userId, dto);
  }

  /**
   * Get customer's own orders.
   */
  @Get("my")
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: "Get my orders (Customer only)" })
  @ApiResponse({ status: 200, description: "List of customer orders" })
  async getMyOrders(@CurrentUser("_id") userId: string) {
    return this.ordersService.getCustomerOrders(userId);
  }

  // ========== Delivery Endpoints ==========

  /**
   * Get orders assigned to delivery person.
   */
  @Get("assigned")
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: "Get assigned orders (Delivery only)" })
  @ApiResponse({ status: 200, description: "List of assigned orders" })
  async getAssignedOrders(@CurrentUser("_id") userId: string) {
    return this.ordersService.getDeliveryOrders(userId);
  }

  /**
   * Get delivery history (completed orders).
   */
  @Get("delivery/history")
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: "Get delivery history (Delivery only)" })
  @ApiResponse({ status: 200, description: "List of completed deliveries" })
  async getDeliveryHistory(@CurrentUser("_id") userId: string) {
    return this.ordersService.getDeliveryHistory(userId);
  }

  /**
   * Get delivery statistics.
   */
  @Get("delivery/stats")
  @Roles(UserRole.DELIVERY)
  @ApiOperation({ summary: "Get delivery statistics (Delivery only)" })
  @ApiResponse({ status: 200, description: "Delivery statistics" })
  async getDeliveryStats(@CurrentUser("_id") userId: string) {
    return this.ordersService.getDeliveryStats(userId);
  }

  /**
   * Update order status (delivery person).
   */
  @Patch(":id/status")
  @Roles(UserRole.DELIVERY, UserRole.ADMIN)
  @ApiOperation({ summary: "Update order status (Delivery/Admin)" })
  @ApiResponse({ status: 200, description: "Status updated successfully" })
  @ApiResponse({ status: 400, description: "Invalid status transition" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async updateOrderStatus(
    @Param("id") orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.updateOrderStatus(orderId, dto, user);
  }

  // ========== Admin Endpoints ==========

  /**
   * Get all orders (admin).
   */
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get all orders (Admin only)" })
  @ApiQuery({ name: "status", required: false, enum: OrderStatus })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Paginated orders list" })
  async getAllOrders(
    @Query("status") status?: OrderStatus,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.ordersService.getAllOrders(status, page, limit);
  }

  /**
   * Get unassigned orders (admin).
   */
  @Get("unassigned")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get unassigned orders (Admin only)" })
  @ApiResponse({ status: 200, description: "List of unassigned orders" })
  async getUnassignedOrders() {
    return this.ordersService.getUnassignedOrders();
  }

  /**
   * Get order statistics (admin dashboard).
   */
  @Get("stats")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get order statistics (Admin only)" })
  @ApiResponse({ status: 200, description: "Order statistics" })
  async getOrderStats() {
    return this.ordersService.getOrderStats();
  }

  /**
   * Get a single order by ID.
   */
  @Get(":id")
  @ApiOperation({ summary: "Get order by ID" })
  @ApiResponse({ status: 200, description: "Order details" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async getOrderById(
    @Param("id") orderId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.getOrderById(orderId, user);
  }

  /**
   * Assign delivery person to order (admin).
   */
  @Patch(":id/assign")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Assign delivery person (Admin only)" })
  @ApiResponse({ status: 200, description: "Delivery person assigned" })
  @ApiResponse({
    status: 404,
    description: "Order or delivery person not found",
  })
  async assignDeliveryPerson(
    @Param("id") orderId: string,
    @Body() dto: AssignDeliveryDto,
  ) {
    return this.ordersService.assignDeliveryPerson(orderId, dto);
  }
}
