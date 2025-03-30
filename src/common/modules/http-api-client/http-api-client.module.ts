import { Module } from '@nestjs/common';
import { HttpApiClientService } from './http-api-client.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [HttpApiClientService],
  exports: [HttpApiClientService],
})
export class HttpApiClientModule {}
