import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SujetoService } from '../services/sujeto.service';
import { SujetoResponseDto } from '../dto/sujeto-response.dto';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';
import { EntityNotFoundException } from '../../../common/exceptions/entity-not-found.exception';
import { ErrorCodes } from '../../../common/constants/error-codes';

@ApiTags('sujetos')
@Controller('sujetos')
export class SujetoController {
  constructor(private readonly sujetoService: SujetoService) {}

  @Get('by-cuit')
  @ApiOperation({ summary: 'Get sujeto by CUIT' })
  @ApiQuery({
    name: 'cuit',
    description: 'CUIT to search for',
    example: '20123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Sujeto found',
    type: SujetoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sujeto not found',
    type: ErrorResponseDto,
  })
  async findByCuit(@Query('cuit') cuit: string): Promise<SujetoResponseDto> {
    const sujeto = await this.sujetoService.findByCuit(cuit);
    if (!sujeto) {
      throw new EntityNotFoundException(
        ErrorCodes.SUJETO_NOT_FOUND,
        `Sujeto with CUIT ${cuit} not found`,
      );
    }
    return new SujetoResponseDto(sujeto);
  }
}
