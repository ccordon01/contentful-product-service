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
import { ConfigModule } from './common/modules/config/config.module';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 15000,
          limit: 10,
        },
      ],
    }),
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
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
