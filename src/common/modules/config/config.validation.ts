import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  validateSync,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  @Matches(/^mongodb(\+srv)?:\/\/.*/, {
    message: 'MONGODB_URI must be a valid MongoDB URI.',
  })
  MONGODB_URI: string;

  @IsNumber()
  @IsOptional()
  API_PORT: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^amqp:\/\/.*/, {
    message: 'RABBITMQ_URL must be a valid RabbitMQ URL.',
  })
  RABBITMQ_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  CONTENTFUL_URL: string;

  @IsString()
  @IsNotEmpty()
  CONTENTFUL_SPACE_ID: string;

  @IsString()
  @IsNotEmpty()
  CONTENTFUL_ENVIRONMENT: string;

  @IsString()
  @IsNotEmpty()
  CONTENTFUL_ACCESS_TOKEN: string;

  @IsString()
  @IsNotEmpty()
  CONTENTFUL_CONTENT_TYPE: string;
}

export const ConfigValidation = {
  validate: (config: Record<string, unknown>) => {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
      enableImplicitConversion: true,
    });

    const errors = validateSync(validatedConfig, {
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      throw new Error(
        `Config validation error: ${errors
          .map((err) => Object.values(err.constraints || {}).join(', '))
          .join('; ')}`,
      );
    }

    return validatedConfig;
  },
};
