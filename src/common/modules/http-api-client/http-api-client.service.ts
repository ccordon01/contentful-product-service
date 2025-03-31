import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { ProductsResponseDto } from 'src/common/dto/products-response.dto';

@Injectable()
export class HttpApiClientService {
  private readonly logger = new Logger(HttpApiClientService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.initializeBaseUrl();
  }

  private initializeBaseUrl(): string {
    const contentfulUrl = this.configService.get<string>('CONTENTFUL_URL');
    const spaceId = this.configService.get<string>('CONTENTFUL_SPACE_ID');
    const environment = this.configService.get<string>(
      'CONTENTFUL_ENVIRONMENT',
    );

    if (!contentfulUrl || !spaceId || !environment) {
      throw new Error('Contentful configuration is missing');
    }

    const url = `${contentfulUrl}/spaces/${spaceId}/environments/${environment}/entries`;

    try {
      new URL(url);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error(`Invalid Contentful URL: ${url}`);
    }

    return url;
  }

  async fetchProducts(
    skip: number = 0,
    limit: number = 10,
  ): Promise<ProductsResponseDto> {
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get<ProductsResponseDto>(this.baseUrl, {
            params: {
              access_token: this.configService.get('CONTENTFUL_ACCESS_TOKEN'),
              content_type: this.configService.get('CONTENTFUL_CONTENT_TYPE'),
              skip: skip,
              limit: limit,
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(error?.response?.data);
              if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                return Promise.reject(error.response?.data);
              } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                return Promise.reject(error.request);
              } else {
                // Something happened in setting up the request that triggered an Error
                return Promise.reject({
                  status: error.status,
                  message: error.message,
                });
              }
            }),
          ),
      );
      return data;
    } catch (error) {
      // Handle the error here
      this.logger.error('Error in fetchProducts:', error);
      throw error;
    }
  }
}
