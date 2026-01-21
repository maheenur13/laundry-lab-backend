import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { Order, OrderDocument } from "./schemas/order.schema";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { AssignDeliveryDto } from "./dto/assign-delivery.dto";
import {
  OrderStatus,
  isValidStatusTransition,
} from "./enums/order-status.enum";
import { CatalogService } from "../catalog/catalog.service";
import { UsersService } from "../users/users.service";
import { UserRole } from "../users/enums/user-role.enum";
import { UserDocument } from "../users/schemas/user.schema";

/**
 * Orders service - handles order creation, status updates, and queries.
 */
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private catalogService: CatalogService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  /**
   * Create a new order.
   */
  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderDocument> {
    // Calculate pricing for all items
    const itemsWithPricing = [];
    let itemsTotal = 0;

    for (const item of dto.items) {
      const clothingItem = await this.catalogService.getClothingItemById(
        item.clothingItemId,
      );

      // Calculate price for each service
      let unitPrice = 0;
      for (const serviceType of item.services) {
        try {
          const price = await this.catalogService.getItemPrice(
            item.clothingItemId,
            serviceType,
            item.category,
          );
          unitPrice += price;
        } catch {
          throw new BadRequestException(
            `Pricing not found for ${clothingItem.name.en} - ${serviceType}`,
          );
        }
      }

      const subtotal = unitPrice * item.quantity;
      itemsTotal += subtotal;

      itemsWithPricing.push({
        clothingItem: new Types.ObjectId(item.clothingItemId),
        clothingItemName: clothingItem.name.en,
        category: item.category,
        services: item.services,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      });
    }

    // Get delivery charge from config
    const deliveryCharge = Number(
      this.configService.get("DEFAULT_DELIVERY_CHARGE", 60),
    );
    const grandTotal = itemsTotal + deliveryCharge;

    // Create order
    const order = new this.orderModel({
      customer: new Types.ObjectId(userId),
      items: itemsWithPricing,
      pricing: {
        itemsTotal,
        deliveryCharge,
        grandTotal,
      },
      pickupAddress: dto.pickupAddress,
      deliveryAddress: dto.deliveryAddress || dto.pickupAddress,
      notes: dto.notes,
      scheduledPickupTime: dto.scheduledPickupTime
        ? new Date(dto.scheduledPickupTime)
        : undefined,
      status: OrderStatus.REQUESTED,
      statusHistory: [
        {
          status: OrderStatus.REQUESTED,
          timestamp: new Date(),
          note: "Order placed",
          updatedBy: new Types.ObjectId(userId),
        },
      ],
    });

    return order.save();
  }

  /**
   * Get orders for a customer.
   */
  async getCustomerOrders(userId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ customer: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate("deliveryPerson", "fullName phoneNumber")
      .exec();
  }

  /**
   * Get orders assigned to a delivery person.
   */
  async getDeliveryOrders(userId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({
        deliveryPerson: new Types.ObjectId(userId),
        status: { $nin: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] },
      })
      .sort({ createdAt: -1 })
      .populate("customer", "fullName phoneNumber")
      .exec();
  }

  /**
   * Get delivery history for a delivery person (completed orders).
   */
  async getDeliveryHistory(userId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({
        deliveryPerson: new Types.ObjectId(userId),
        status: { $in: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] },
      })
      .sort({ createdAt: -1 })
      .populate("customer", "fullName phoneNumber")
      .exec();
  }

  /**
   * Get delivery statistics for a delivery person.
   */
  async getDeliveryStats(userId: string): Promise<{
    totalDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
    todayDeliveries: number;
    thisWeekDeliveries: number;
    thisMonthDeliveries: number;
    totalRevenue: number;
    averageDeliveryTime: number; // in hours
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const deliveryPersonId = new Types.ObjectId(userId);

    const [
      allStats,
      todayStats,
      weekStats,
      monthStats,
      revenueStats,
      avgTimeStats,
    ] = await Promise.all([
      // All time stats
      this.orderModel.aggregate([
        { $match: { deliveryPerson: deliveryPersonId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      // Today stats
      this.orderModel.countDocuments({
        deliveryPerson: deliveryPersonId,
        status: OrderStatus.DELIVERED,
        updatedAt: { $gte: today },
      }),
      // This week stats
      this.orderModel.countDocuments({
        deliveryPerson: deliveryPersonId,
        status: OrderStatus.DELIVERED,
        updatedAt: { $gte: thisWeek },
      }),
      // This month stats
      this.orderModel.countDocuments({
        deliveryPerson: deliveryPersonId,
        status: OrderStatus.DELIVERED,
        updatedAt: { $gte: thisMonth },
      }),
      // Revenue stats
      this.orderModel.aggregate([
        {
          $match: {
            deliveryPerson: deliveryPersonId,
            status: OrderStatus.DELIVERED,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$pricing.grandTotal" },
          },
        },
      ]),
      // Average delivery time
      this.orderModel.aggregate([
        {
          $match: {
            deliveryPerson: deliveryPersonId,
            status: OrderStatus.DELIVERED,
          },
        },
        {
          $addFields: {
            deliveryTime: {
              $divide: [
                { $subtract: ["$updatedAt", "$createdAt"] },
                1000 * 60 * 60, // Convert to hours
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: "$deliveryTime" },
          },
        },
      ]),
    ]);

    const statusCounts = allStats.reduce(
      (acc, item) => {
        acc[item._id as string] = item.count as number;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalDeliveries = (Object.values(statusCounts) as number[]).reduce(
      (a, b) => a + b,
      0,
    );

    return {
      totalDeliveries,
      completedDeliveries: statusCounts[OrderStatus.DELIVERED] || 0,
      cancelledDeliveries: statusCounts[OrderStatus.CANCELLED] || 0,
      todayDeliveries: todayStats || 0,
      thisWeekDeliveries: weekStats || 0,
      thisMonthDeliveries: monthStats || 0,
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
      averageDeliveryTime:
        Math.round((avgTimeStats[0]?.avgTime || 0) * 100) / 100,
    };
  }

  /**
   * Get all orders (admin only).
   */
  async getAllOrders(
    status?: OrderStatus,
    page = 1,
    limit = 20,
  ): Promise<{
    orders: OrderDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const total = await this.orderModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const orders = await this.orderModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("customer", "fullName phoneNumber")
      .populate("deliveryPerson", "fullName phoneNumber")
      .exec();

    return { orders, total, page, totalPages };
  }

  /**
   * Get a single order by ID.
   */
  async getOrderById(
    orderId: string,
    user: UserDocument,
  ): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(orderId)
      .populate("customer", "fullName phoneNumber address")
      .populate("deliveryPerson", "fullName phoneNumber")
      .exec();

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Check access permissions
    const userId = user._id.toString();
    const isCustomer = order.customer._id.toString() === userId;
    const isDelivery = order.deliveryPerson?._id.toString() === userId;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isCustomer && !isDelivery && !isAdmin) {
      throw new ForbiddenException("Access denied to this order");
    }

    return order;
  }

  /**
   * Update order status.
   */
  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    user: UserDocument,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId).exec();

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Validate status transition
    if (!isValidStatusTransition(order.status, dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${dto.status}`,
      );
    }

    // Check permissions for status updates
    const userId = user._id.toString();
    const isDelivery = order.deliveryPerson?.toString() === userId;
    const isAdmin = user.role === UserRole.ADMIN;

    // Only delivery person or admin can update status
    if (!isDelivery && !isAdmin) {
      throw new ForbiddenException(
        "Only delivery person or admin can update order status",
      );
    }

    // Update status
    order.status = dto.status;
    order.statusHistory.push({
      status: dto.status,
      timestamp: new Date(),
      note: dto.note || "",
      updatedBy: new Types.ObjectId(userId),
    });

    return order.save();
  }

  /**
   * Assign delivery person to an order (admin only).
   */
  async assignDeliveryPerson(
    orderId: string,
    dto: AssignDeliveryDto,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId).exec();

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Verify delivery person exists and has delivery role
    const deliveryPerson = await this.usersService.findById(
      dto.deliveryPersonId,
    );
    if (!deliveryPerson) {
      throw new NotFoundException("Delivery person not found");
    }

    if (deliveryPerson.role !== UserRole.DELIVERY) {
      throw new BadRequestException("User is not a delivery person");
    }

    order.deliveryPerson = new Types.ObjectId(dto.deliveryPersonId);
    return order.save();
  }

  /**
   * Get unassigned orders (for admin to assign delivery).
   */
  async getUnassignedOrders(): Promise<OrderDocument[]> {
    return this.orderModel
      .find({
        deliveryPerson: { $exists: false },
        status: OrderStatus.REQUESTED,
      })
      .sort({ createdAt: 1 }) // Oldest first
      .populate("customer", "fullName phoneNumber")
      .exec();
  }

  /**
   * Get order statistics (admin dashboard).
   */
  async getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    todayOrders: number;
    todayRevenue: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [stats, todayStats] = await Promise.all([
      this.orderModel.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      this.orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: "$pricing.grandTotal" },
          },
        },
      ]),
    ]);

    const statusCounts = stats.reduce(
      (acc, item) => {
        acc[item._id as string] = item.count as number;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalOrders: number = (
      Object.values(statusCounts) as number[]
    ).reduce((a, b) => a + b, 0);

    return {
      totalOrders,
      pendingOrders: statusCounts[OrderStatus.REQUESTED] || 0,
      inProgressOrders:
        (statusCounts[OrderStatus.PICKED_UP] || 0) +
        (statusCounts[OrderStatus.IN_LAUNDRY] || 0) +
        (statusCounts[OrderStatus.OUT_FOR_DELIVERY] || 0),
      completedOrders: statusCounts[OrderStatus.DELIVERED] || 0,
      cancelledOrders: statusCounts[OrderStatus.CANCELLED] || 0,
      todayOrders: todayStats[0]?.count || 0,
      todayRevenue: todayStats[0]?.revenue || 0,
    };
  }
}
