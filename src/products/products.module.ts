import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { RabbitmqModule } from 'src/common/modules/rabbitmq/rabbitmq.module';
import { ProductsController } from './products.controller';

@Module({
  imports: [RabbitmqModule],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
