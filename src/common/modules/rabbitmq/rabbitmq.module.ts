import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { RABBITMQ_SERVICE, CREATE_PRODUCTS_QUEUE } from './constants';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: RABBITMQ_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL as string],
          queue: CREATE_PRODUCTS_QUEUE,
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class RabbitmqModule {}
