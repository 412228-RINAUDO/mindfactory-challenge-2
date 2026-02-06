import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({
    name: 'error_code',
    example: 'AUTOMOTOR_NOT_FOUND',
    description: 'Error code for frontend translation',
  })
  errorCode: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/automotores/XX123YY' })
  path: string;
}
