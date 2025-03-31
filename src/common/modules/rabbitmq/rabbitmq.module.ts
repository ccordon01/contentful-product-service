import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { RABBITMQ_SERVICE, CREATE_PRODUCTS_QUEUE } from './constants';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            queue: CREATE_PRODUCTS_QUEUE,
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class RabbitmqModule {}
