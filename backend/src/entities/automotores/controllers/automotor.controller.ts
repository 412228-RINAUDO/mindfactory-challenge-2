import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AutomotorService } from '../services/automotor.service';
import { AutomotorListResponseDto } from '../dto/automotor-list-response.dto';
import { AutomotorDetailResponseDto } from '../dto/automotor-detail-response.dto';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('automotores')
@Controller('automotores')
export class AutomotorController {
  constructor(private readonly automotorService: AutomotorService) {}

  @Get()
  @ApiOperation({ summary: 'List all vehicles with current owner' })
  @ApiResponse({
    status: 200,
    description: 'List of vehicles with owner info',
    type: [AutomotorListResponseDto],
  })
  async findAll(): Promise<AutomotorListResponseDto[]> {
    return this.automotorService.findAll();
  }

  @Get(':dominio')
  @ApiOperation({ summary: 'Get vehicle details by license plate' })
  @ApiParam({
    name: 'dominio',
    description: 'Vehicle license plate (e.g., AA123BB)',
    example: 'AA123BB',
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicle details with current owner',
    type: AutomotorDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found', type: ErrorResponseDto })
  async findByDominio(@Param('dominio') dominio: string): Promise<AutomotorDetailResponseDto> {
    return this.automotorService.findByDominio(dominio);
  }
}
