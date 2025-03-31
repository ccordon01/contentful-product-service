import { Module } from '@nestjs/common';
import {
  ProductsModule,
  PublicProductsModule,
} from './products/products.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpApiClientModule } from './common/modules/http-api-client/http-api-client.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    ScheduleModule.forRoot(),
    HttpApiClientModule,
    AuthModule,
    ProductsModule,
    PublicProductsModule,
    RouterModule.register([
      {
        path: 'public',
        module: PublicProductsModule,
      },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
