import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpApiClientModule } from './common/modules/http-api-client/http-api-client.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    ScheduleModule.forRoot(),
    ProductsModule,
    HttpApiClientModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
