import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AutomotorService } from '../services/automotor.service';
import { AutomotorListResponseDto } from '../dto/automotor-list-response.dto';
import { AutomotorDetailResponseDto } from '../dto/automotor-detail-response.dto';
import { CreateAutomotorDto } from '../dto/create-automotor.dto';
import { UpdateAutomotorDto } from '../dto/update-automotor.dto';
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

  @Post()
  @ApiOperation({ summary: 'Create a vehicle and assign owner' })
  @ApiResponse({
    status: 201,
    description: 'Vehicle created with owner assigned',
    type: AutomotorDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (invalid dominio, CUIT, or fecha)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sujeto not found by CUIT',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateAutomotorDto): Promise<AutomotorDetailResponseDto> {
    return this.automotorService.create(dto);
  }

  @Put(':dominio')
  @ApiOperation({ summary: 'Update vehicle and optionally reassign owner' })
  @ApiParam({
    name: 'dominio',
    description: 'Vehicle license plate (e.g., AA123BB)',
    example: 'AA123BB',
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicle updated',
    type: AutomotorDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (invalid CUIT or fecha)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Automotor or Sujeto not found',
    type: ErrorResponseDto,
  })
  async update(
    @Param('dominio') dominio: string,
    @Body() dto: UpdateAutomotorDto,
  ): Promise<AutomotorDetailResponseDto> {
    return this.automotorService.update(dominio, dto);
  }

  @Delete(':dominio')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete vehicle and related entities' })
  @ApiParam({
    name: 'dominio',
    description: 'Vehicle license plate (e.g., AA123BB)',
    example: 'AA123BB',
  })
  @ApiResponse({
    status: 204,
    description: 'Vehicle deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Automotor not found',
    type: ErrorResponseDto,
  })
  async delete(@Param('dominio') dominio: string): Promise<void> {
    return this.automotorService.delete(dominio);
  }

}
