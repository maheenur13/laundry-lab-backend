import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CreateClothingItemDto } from './dto/create-clothing-item.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '../common';
import { UserRole } from '../users/enums/user-role.enum';
import { ClothingCategory } from './enums/clothing-category.enum';
import { ServiceType } from './enums/service-type.enum';

/**
 * Catalog controller - clothing items, services, and pricing.
 */
@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ========== Clothing Items ==========

  /**
   * Get all clothing items (public).
   */
  @Get('clothing-items')
  @Public()
  @ApiOperation({ summary: 'Get all clothing items' })
  @ApiQuery({ name: 'category', required: false, enum: ClothingCategory })
  @ApiResponse({ status: 200, description: 'List of clothing items' })
  async getClothingItems(@Query('category') category?: ClothingCategory) {
    return this.catalogService.getClothingItems(category);
  }

  /**
   * Get a single clothing item by ID.
   */
  @Get('clothing-items/:id')
  @Public()
  @ApiOperation({ summary: 'Get clothing item by ID' })
  @ApiResponse({ status: 200, description: 'Clothing item details' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getClothingItem(@Param('id') id: string) {
    return this.catalogService.getClothingItemById(id);
  }

  /**
   * Create a new clothing item (admin only).
   */
  @Post('clothing-items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create clothing item (Admin only)' })
  @ApiResponse({ status: 201, description: 'Item created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createClothingItem(@Body() dto: CreateClothingItemDto) {
    return this.catalogService.createClothingItem(dto);
  }

  /**
   * Update a clothing item (admin only).
   */
  @Patch('clothing-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update clothing item (Admin only)' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async updateClothingItem(
    @Param('id') id: string,
    @Body() dto: Partial<CreateClothingItemDto>,
  ) {
    return this.catalogService.updateClothingItem(id, dto);
  }

  // ========== Services ==========

  /**
   * Get all services (public).
   */
  @Get('services')
  @Public()
  @ApiOperation({ summary: 'Get all laundry services' })
  @ApiResponse({ status: 200, description: 'List of services' })
  async getServices() {
    return this.catalogService.getServices();
  }

  /**
   * Create a new service (admin only).
   */
  @Post('services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create service (Admin only)' })
  @ApiResponse({ status: 201, description: 'Service created' })
  @ApiResponse({ status: 409, description: 'Service type already exists' })
  async createService(@Body() dto: CreateServiceDto) {
    return this.catalogService.createService(dto);
  }

  // ========== Pricing ==========

  /**
   * Get pricing list (public).
   */
  @Get('pricing')
  @Public()
  @ApiOperation({ summary: 'Get pricing for all items' })
  @ApiQuery({ name: 'category', required: false, enum: ClothingCategory })
  @ApiQuery({ name: 'serviceType', required: false, enum: ServiceType })
  @ApiResponse({ status: 200, description: 'Pricing list' })
  async getPricing(
    @Query('category') category?: ClothingCategory,
    @Query('serviceType') serviceType?: ServiceType,
  ) {
    return this.catalogService.getPricing(category, serviceType);
  }

  /**
   * Create or update pricing (admin only).
   */
  @Post('pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create/update pricing (Admin only)' })
  @ApiResponse({ status: 201, description: 'Pricing saved' })
  async upsertPricing(@Body() dto: CreatePricingDto) {
    return this.catalogService.upsertPricing(dto);
  }

  // ========== Seed Data ==========

  /**
   * Seed catalog data (development only).
   */
  @Post('seed')
  @Public()
  @ApiOperation({ summary: 'Seed catalog data (Development only)' })
  @ApiResponse({ status: 201, description: 'Data seeded' })
  async seedData() {
    await this.catalogService.seedCatalogData();
    return { message: 'Catalog data seeded successfully' };
  }
}
