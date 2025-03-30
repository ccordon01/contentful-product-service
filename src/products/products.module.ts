import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { RabbitmqModule } from 'src/common/modules/rabbitmq/rabbitmq.module';
import { ProductsController } from './products.controller';
import { HttpApiClientModule } from 'src/common/modules/http-api-client/http-api-client.module';

@Module({
  imports: [RabbitmqModule, HttpApiClientModule],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
