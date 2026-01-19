import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClothingItem, ClothingItemDocument } from './schemas/clothing-item.schema';
import { Service, ServiceDocument } from './schemas/service.schema';
import { Pricing, PricingDocument } from './schemas/pricing.schema';
import { CreateClothingItemDto } from './dto/create-clothing-item.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { ClothingCategory } from './enums/clothing-category.enum';
import { ServiceType } from './enums/service-type.enum';

/**
 * Catalog service - manages clothing items, services, and pricing.
 */
@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(ClothingItem.name) private clothingItemModel: Model<ClothingItemDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Pricing.name) private pricingModel: Model<PricingDocument>,
  ) {}

  // ========== Clothing Items ==========

  /**
   * Get all active clothing items, optionally filtered by category.
   */
  async getClothingItems(category?: ClothingCategory): Promise<ClothingItemDocument[]> {
    const query: Record<string, unknown> = { isActive: true };
    if (category) {
      query.category = category;
    }
    return this.clothingItemModel.find(query).sort({ category: 1, 'name.en': 1 }).exec();
  }

  /**
   * Get a single clothing item by ID.
   */
  async getClothingItemById(id: string): Promise<ClothingItemDocument> {
    const item = await this.clothingItemModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException('Clothing item not found');
    }
    return item;
  }

  /**
   * Create a new clothing item (admin only).
   */
  async createClothingItem(dto: CreateClothingItemDto): Promise<ClothingItemDocument> {
    const item = new this.clothingItemModel(dto);
    return item.save();
  }

  /**
   * Update a clothing item (admin only).
   */
  async updateClothingItem(
    id: string,
    dto: Partial<CreateClothingItemDto>,
  ): Promise<ClothingItemDocument> {
    const item = await this.clothingItemModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!item) {
      throw new NotFoundException('Clothing item not found');
    }
    return item;
  }

  // ========== Services ==========

  /**
   * Get all active services.
   */
  async getServices(): Promise<ServiceDocument[]> {
    return this.serviceModel.find({ isActive: true }).exec();
  }

  /**
   * Get a single service by type.
   */
  async getServiceByType(type: ServiceType): Promise<ServiceDocument> {
    const service = await this.serviceModel.findOne({ type }).exec();
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  /**
   * Create a new service (admin only).
   */
  async createService(dto: CreateServiceDto): Promise<ServiceDocument> {
    const existing = await this.serviceModel.findOne({ type: dto.type }).exec();
    if (existing) {
      throw new ConflictException('Service type already exists');
    }
    const service = new this.serviceModel(dto);
    return service.save();
  }

  // ========== Pricing ==========

  /**
   * Get pricing for all items, optionally filtered.
   */
  async getPricing(
    category?: ClothingCategory,
    serviceType?: ServiceType,
  ): Promise<PricingDocument[]> {
    const query: Record<string, unknown> = { isActive: true };
    if (category) query.category = category;
    if (serviceType) query.serviceType = serviceType;

    return this.pricingModel
      .find(query)
      .populate('clothingItem')
      .exec();
  }

  /**
   * Get price for a specific item + service combination.
   */
  async getItemPrice(
    clothingItemId: string,
    serviceType: ServiceType,
    category: ClothingCategory,
  ): Promise<number> {
    const pricing = await this.pricingModel
      .findOne({
        clothingItem: new Types.ObjectId(clothingItemId),
        serviceType,
        category,
        isActive: true,
      })
      .exec();

    if (!pricing) {
      throw new NotFoundException('Pricing not found for this item and service');
    }

    return pricing.price;
  }

  /**
   * Create or update pricing (admin only).
   */
  async upsertPricing(dto: CreatePricingDto): Promise<PricingDocument> {
    const pricing = await this.pricingModel
      .findOneAndUpdate(
        {
          clothingItem: new Types.ObjectId(dto.clothingItemId),
          serviceType: dto.serviceType,
          category: dto.category,
        },
        {
          price: dto.price,
          isActive: dto.isActive ?? true,
        },
        { upsert: true, new: true },
      )
      .exec();

    return pricing;
  }

  /**
   * Calculate total price for order items.
   */
  async calculateOrderTotal(
    items: Array<{
      clothingItemId: string;
      category: ClothingCategory;
      services: ServiceType[];
      quantity: number;
    }>,
  ): Promise<{
    itemsTotal: number;
    breakdown: Array<{
      clothingItemId: string;
      services: Array<{ type: ServiceType; price: number }>;
      quantity: number;
      subtotal: number;
    }>;
  }> {
    let itemsTotal = 0;
    const breakdown = [];

    for (const item of items) {
      const servicesPricing = [];
      let itemSubtotal = 0;

      for (const serviceType of item.services) {
        try {
          const price = await this.getItemPrice(
            item.clothingItemId,
            serviceType,
            item.category,
          );
          servicesPricing.push({ type: serviceType, price });
          itemSubtotal += price * item.quantity;
        } catch {
          // If pricing not found, skip this service
          continue;
        }
      }

      itemsTotal += itemSubtotal;
      breakdown.push({
        clothingItemId: item.clothingItemId,
        services: servicesPricing,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    return { itemsTotal, breakdown };
  }

  /**
   * Seed initial catalog data (for development).
   */
  async seedCatalogData(): Promise<void> {
    // Check if already seeded
    const existingItems = await this.clothingItemModel.countDocuments();
    if (existingItems > 0) {
      return;
    }

    // Seed services
    const services = [
      {
        name: { en: 'Washing', bn: 'ধোয়া' },
        type: ServiceType.WASHING,
        description: 'Professional machine washing',
        icon: 'washing-machine',
      },
      {
        name: { en: 'Ironing', bn: 'ইস্ত্রি' },
        type: ServiceType.IRONING,
        description: 'Steam ironing service',
        icon: 'iron',
      },
    ];

    for (const service of services) {
      await this.serviceModel.create(service);
    }

    // Seed clothing items
    const clothingItems = [
      // Men
      { name: { en: 'Shirt', bn: 'শার্ট' }, category: ClothingCategory.MEN, icon: 'shirt' },
      { name: { en: 'Pant', bn: 'প্যান্ট' }, category: ClothingCategory.MEN, icon: 'pants' },
      { name: { en: 'T-Shirt', bn: 'টি-শার্ট' }, category: ClothingCategory.MEN, icon: 'tshirt' },
      { name: { en: 'Suit', bn: 'স্যুট' }, category: ClothingCategory.MEN, icon: 'suit' },
      { name: { en: 'Panjabi', bn: 'পাঞ্জাবি' }, category: ClothingCategory.MEN, icon: 'panjabi' },
      { name: { en: 'Jacket', bn: 'জ্যাকেট' }, category: ClothingCategory.MEN, icon: 'jacket' },
      // Women
      { name: { en: 'Shirt', bn: 'শার্ট' }, category: ClothingCategory.WOMEN, icon: 'shirt' },
      { name: { en: 'Pant', bn: 'প্যান্ট' }, category: ClothingCategory.WOMEN, icon: 'pants' },
      { name: { en: 'Kameez', bn: 'কামিজ' }, category: ClothingCategory.WOMEN, icon: 'kameez' },
      { name: { en: 'Saree', bn: 'শাড়ি' }, category: ClothingCategory.WOMEN, icon: 'saree' },
      { name: { en: 'Salwar', bn: 'সালোয়ার' }, category: ClothingCategory.WOMEN, icon: 'salwar' },
      { name: { en: 'Orna', bn: 'ওড়না' }, category: ClothingCategory.WOMEN, icon: 'orna' },
      // Children
      { name: { en: 'Shirt', bn: 'শার্ট' }, category: ClothingCategory.CHILDREN, icon: 'shirt' },
      { name: { en: 'Pant', bn: 'প্যান্ট' }, category: ClothingCategory.CHILDREN, icon: 'pants' },
      { name: { en: 'Dress', bn: 'ড্রেস' }, category: ClothingCategory.CHILDREN, icon: 'dress' },
      { name: { en: 'T-Shirt', bn: 'টি-শার্ট' }, category: ClothingCategory.CHILDREN, icon: 'tshirt' },
    ];

    const createdItems = await this.clothingItemModel.insertMany(clothingItems);

    // Seed pricing (example prices in BDT)
    const basePrices: Record<string, Record<ClothingCategory, { wash: number; iron: number }>> = {
      Shirt: {
        [ClothingCategory.MEN]: { wash: 40, iron: 25 },
        [ClothingCategory.WOMEN]: { wash: 40, iron: 25 },
        [ClothingCategory.CHILDREN]: { wash: 30, iron: 20 },
      },
      Pant: {
        [ClothingCategory.MEN]: { wash: 50, iron: 30 },
        [ClothingCategory.WOMEN]: { wash: 50, iron: 30 },
        [ClothingCategory.CHILDREN]: { wash: 35, iron: 25 },
      },
      'T-Shirt': {
        [ClothingCategory.MEN]: { wash: 35, iron: 20 },
        [ClothingCategory.WOMEN]: { wash: 35, iron: 20 },
        [ClothingCategory.CHILDREN]: { wash: 25, iron: 15 },
      },
      Suit: {
        [ClothingCategory.MEN]: { wash: 150, iron: 80 },
        [ClothingCategory.WOMEN]: { wash: 150, iron: 80 },
        [ClothingCategory.CHILDREN]: { wash: 100, iron: 60 },
      },
      Panjabi: {
        [ClothingCategory.MEN]: { wash: 60, iron: 40 },
        [ClothingCategory.WOMEN]: { wash: 60, iron: 40 },
        [ClothingCategory.CHILDREN]: { wash: 45, iron: 30 },
      },
      Jacket: {
        [ClothingCategory.MEN]: { wash: 100, iron: 50 },
        [ClothingCategory.WOMEN]: { wash: 100, iron: 50 },
        [ClothingCategory.CHILDREN]: { wash: 70, iron: 40 },
      },
      Kameez: {
        [ClothingCategory.MEN]: { wash: 50, iron: 30 },
        [ClothingCategory.WOMEN]: { wash: 50, iron: 30 },
        [ClothingCategory.CHILDREN]: { wash: 35, iron: 25 },
      },
      Saree: {
        [ClothingCategory.MEN]: { wash: 80, iron: 50 },
        [ClothingCategory.WOMEN]: { wash: 80, iron: 50 },
        [ClothingCategory.CHILDREN]: { wash: 60, iron: 40 },
      },
      Salwar: {
        [ClothingCategory.MEN]: { wash: 45, iron: 30 },
        [ClothingCategory.WOMEN]: { wash: 45, iron: 30 },
        [ClothingCategory.CHILDREN]: { wash: 35, iron: 25 },
      },
      Orna: {
        [ClothingCategory.MEN]: { wash: 30, iron: 20 },
        [ClothingCategory.WOMEN]: { wash: 30, iron: 20 },
        [ClothingCategory.CHILDREN]: { wash: 25, iron: 15 },
      },
      Dress: {
        [ClothingCategory.MEN]: { wash: 60, iron: 35 },
        [ClothingCategory.WOMEN]: { wash: 60, iron: 35 },
        [ClothingCategory.CHILDREN]: { wash: 45, iron: 25 },
      },
    };

    for (const item of createdItems) {
      const itemName = item.name.en;
      const prices = basePrices[itemName];

      if (prices && prices[item.category]) {
        // Create washing pricing
        await this.pricingModel.create({
          clothingItem: item._id,
          serviceType: ServiceType.WASHING,
          category: item.category,
          price: prices[item.category].wash,
        });

        // Create ironing pricing
        await this.pricingModel.create({
          clothingItem: item._id,
          serviceType: ServiceType.IRONING,
          category: item.category,
          price: prices[item.category].iron,
        });
      }
    }
  }
}
