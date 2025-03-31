import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpApiClientModule } from './common/modules/http-api-client/http-api-client.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    ScheduleModule.forRoot(),
    ProductsModule,
    HttpApiClientModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
