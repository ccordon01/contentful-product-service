import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { Cron } from '@nestjs/schedule';
import { MessagesService } from 'src/common/modules/rabbitmq/messages.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Fetches and saves products from the API every hour using a cron job.
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  fetchAndSaveProductsHourly() {
    this.logger.log('Initiating Product Synchronization.');
    this.messagesService.sendMessage({
      message: 'Hello, world!',
    });
  }
}
