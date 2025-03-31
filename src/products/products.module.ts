import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { RabbitmqModule } from 'src/common/modules/rabbitmq/rabbitmq.module';
import { ProductsController } from './controllers/products.controller';
import { HttpApiClientModule } from 'src/common/modules/http-api-client/http-api-client.module';
import { ProductsRepository } from './repository/products.repository';
import { ProductSchema } from './repository/schemas/product.schema';
import { Product } from './repository/schemas/product.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicProductsController } from './controllers/public-products.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    RabbitmqModule,
    HttpApiClientModule,
  ],
  providers: [ProductsService, ProductsRepository],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}

@Module({
  imports: [ProductsModule],
  controllers: [PublicProductsController],
})
export class PublicProductsModule {}
