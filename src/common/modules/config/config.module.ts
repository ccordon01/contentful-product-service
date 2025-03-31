import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigValidation } from './config.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      validate: ConfigValidation.validate,
      validationOptions: {
        abortEarly: true,
      },
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
