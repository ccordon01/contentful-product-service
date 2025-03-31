import { Test, TestingModule } from '@nestjs/testing';
import { HttpApiClientService } from './http-api-client.service';
import { of, throwError } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('HttpApiClientService', () => {
  let service: HttpApiClientService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        CONTENTFUL_URL: 'https://cdn.contentful.com',
        CONTENTFUL_SPACE_ID: 'test-space',
        CONTENTFUL_ENVIRONMENT: 'master',
        CONTENTFUL_ACCESS_TOKEN: 'mockAccessToken',
        CONTENTFUL_CONTENT_TYPE: 'product',
        MONGODB_URI: 'mongodb://localhost:27017/test',
        RABBITMQ_URL: 'amqp://localhost',
        JWT_SECRET: 'secret',
      };
      return config[key] as string;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpApiClientService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HttpApiClientService>(HttpApiClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle network errors gracefully', async () => {
    const mockHttpService = {
      get: jest.fn().mockReturnValue(
        throwError(() => ({
          response: {
            data: 'Network error',
          },
        })),
      ),
    };

    const service = new HttpApiClientService(
      mockHttpService as any,
      mockConfigService as any,
    );

    try {
      await service.fetchProducts();
    } catch (error) {
      expect(error).toEqual('Network error');
    }
  });

  it('should fetch products successfully', async () => {
    const mockHttpService = {
      get: jest.fn().mockReturnValue(
        of({
          data: {
            sys: { type: 'Array' },
            total: 3,
            skip: 0,
            limit: 3,
            items: [
              {
                metadata: { tags: [] },
                sys: {
                  space: {
                    sys: {
                      type: 'Link',
                      linkType: 'Space',
                      id: '9xs1613l9f7v',
                    },
                  },
                  id: '4HZHurmc8Ld78PNnI1ReYh',
                  type: 'Entry',
                  createdAt: '2024-01-23T21:47:08.012Z',
                  updatedAt: '2024-01-23T21:47:08.012Z',
                  environment: {
                    sys: {
                      id: 'master',
                      type: 'Link',
                      linkType: 'Environment',
                    },
                  },
                  revision: 1,
                  contentType: {
                    sys: {
                      type: 'Link',
                      linkType: 'ContentType',
                      id: 'product',
                    },
                  },
                  locale: 'en-US',
                },
                fields: {
                  sku: 'ZIMPDOPD',
                  name: 'Apple Mi Watch',
                  brand: 'Apple',
                  model: 'Mi Watch',
                  category: 'Smartwatch',
                  color: 'Rose Gold',
                  price: 1410.29,
                  currency: 'USD',
                  stock: 7,
                },
              },
              {
                metadata: { tags: [] },
                sys: {
                  space: {
                    sys: {
                      type: 'Link',
                      linkType: 'Space',
                      id: '9xs1613l9f7v',
                    },
                  },
                  id: '3ZxS5MCw4W3R8rcN1SdQB7',
                  type: 'Entry',
                  createdAt: '2024-01-23T21:47:07.975Z',
                  updatedAt: '2024-01-23T21:47:07.975Z',
                  environment: {
                    sys: {
                      id: 'master',
                      type: 'Link',
                      linkType: 'Environment',
                    },
                  },
                  revision: 1,
                  contentType: {
                    sys: {
                      type: 'Link',
                      linkType: 'ContentType',
                      id: 'product',
                    },
                  },
                  locale: 'en-US',
                },
                fields: {
                  sku: 'O53YSHQL',
                  name: 'Dell Moto G7',
                  brand: 'Dell',
                  model: 'Moto G7',
                  category: 'Smartphone',
                  color: 'Blue',
                  price: 1829.92,
                  currency: 'USD',
                  stock: 75,
                },
              },
              {
                metadata: { tags: [] },
                sys: {
                  space: {
                    sys: {
                      type: 'Link',
                      linkType: 'Space',
                      id: '9xs1613l9f7v',
                    },
                  },
                  id: '3LO1GPO3x1hjnVFzAp7V6S',
                  type: 'Entry',
                  createdAt: '2024-01-23T21:47:07.900Z',
                  updatedAt: '2024-01-23T21:47:07.900Z',
                  environment: {
                    sys: {
                      id: 'master',
                      type: 'Link',
                      linkType: 'Environment',
                    },
                  },
                  revision: 1,
                  contentType: {
                    sys: {
                      type: 'Link',
                      linkType: 'ContentType',
                      id: 'product',
                    },
                  },
                  locale: 'en-US',
                },
                fields: {
                  sku: 'UVBY6AR9',
                  name: 'Apple Watch Series 7',
                  brand: 'Apple',
                  model: 'Watch Series 7',
                  category: 'Smartwatch',
                  color: 'Black',
                  price: 133.6,
                  currency: 'USD',
                  stock: 54,
                },
              },
            ],
          },
        }),
      ),
    };

    const service = new HttpApiClientService(
      mockHttpService as any,
      mockConfigService as any,
    );

    const products = await service.fetchProducts();

    expect(products).toEqual({
      sys: { type: 'Array' },
      total: 3,
      skip: 0,
      limit: 3,
      items: [
        {
          metadata: { tags: [] },
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: '9xs1613l9f7v' },
            },
            id: '4HZHurmc8Ld78PNnI1ReYh',
            type: 'Entry',
            createdAt: '2024-01-23T21:47:08.012Z',
            updatedAt: '2024-01-23T21:47:08.012Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'product' },
            },
            locale: 'en-US',
          },
          fields: {
            sku: 'ZIMPDOPD',
            name: 'Apple Mi Watch',
            brand: 'Apple',
            model: 'Mi Watch',
            category: 'Smartwatch',
            color: 'Rose Gold',
            price: 1410.29,
            currency: 'USD',
            stock: 7,
          },
        },
        {
          metadata: { tags: [] },
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: '9xs1613l9f7v' },
            },
            id: '3ZxS5MCw4W3R8rcN1SdQB7',
            type: 'Entry',
            createdAt: '2024-01-23T21:47:07.975Z',
            updatedAt: '2024-01-23T21:47:07.975Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'product' },
            },
            locale: 'en-US',
          },
          fields: {
            sku: 'O53YSHQL',
            name: 'Dell Moto G7',
            brand: 'Dell',
            model: 'Moto G7',
            category: 'Smartphone',
            color: 'Blue',
            price: 1829.92,
            currency: 'USD',
            stock: 75,
          },
        },
        {
          metadata: { tags: [] },
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: '9xs1613l9f7v' },
            },
            id: '3LO1GPO3x1hjnVFzAp7V6S',
            type: 'Entry',
            createdAt: '2024-01-23T21:47:07.900Z',
            updatedAt: '2024-01-23T21:47:07.900Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'product' },
            },
            locale: 'en-US',
          },
          fields: {
            sku: 'UVBY6AR9',
            name: 'Apple Watch Series 7',
            brand: 'Apple',
            model: 'Watch Series 7',
            category: 'Smartwatch',
            color: 'Black',
            price: 133.6,
            currency: 'USD',
            stock: 54,
          },
        },
      ],
    });
  });

  it('should handle server errors (5xx status codes)', async () => {
    const mockHttpService = {
      get: jest.fn().mockReturnValue(
        throwError(() => ({
          response: {
            status: 500,
            data: 'Server error',
          },
        })),
      ),
    };

    const service = new HttpApiClientService(
      mockHttpService as any,
      mockConfigService as any,
    );

    try {
      await service.fetchProducts();
    } catch (error) {
      expect(error).toEqual('Server error');
    }
  });

  it('should handle the request was made but no response was received', async () => {
    const mockHttpService = {
      get: jest.fn().mockReturnValue(
        throwError(() => ({
          request: 'Mock XMLHttpRequest',
        })),
      ),
    };

    const service = new HttpApiClientService(
      mockHttpService as any,
      mockConfigService as any,
    );

    try {
      await service.fetchProducts();
    } catch (error) {
      expect(error).toEqual('Mock XMLHttpRequest');
    }
  });

  it('should handle something happened in setting up the request that triggered an Error', async () => {
    const mockHttpService = {
      get: jest.fn().mockReturnValue(
        throwError(() => ({
          response: undefined,
          request: undefined,
        })),
      ),
    };

    const service = new HttpApiClientService(
      mockHttpService as any,
      mockConfigService as any,
    );

    try {
      await service.fetchProducts();
    } catch (error) {
      expect(error).toEqual({
        status: undefined,
        message: undefined,
      });
    }
  });
});
