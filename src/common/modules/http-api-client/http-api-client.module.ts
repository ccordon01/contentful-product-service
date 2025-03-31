import { Module } from '@nestjs/common';
import { HttpApiClientService } from './http-api-client.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [HttpApiClientService],
  exports: [HttpApiClientService],
})
export class HttpApiClientModule {}
