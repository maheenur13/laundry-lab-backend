import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { ClothingItem, ClothingItemSchema } from './schemas/clothing-item.schema';
import { Service, ServiceSchema } from './schemas/service.schema';
import { Pricing, PricingSchema } from './schemas/pricing.schema';

/**
 * Catalog module - clothing items, services, and pricing.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClothingItem.name, schema: ClothingItemSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Pricing.name, schema: PricingSchema },
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService], // Export for use in Orders module
})
export class CatalogModule {}
