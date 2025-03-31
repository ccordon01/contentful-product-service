import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'No products found' })
  message: string;

  @ApiProperty({ example: 'Not Found' })
  error: string;
}
