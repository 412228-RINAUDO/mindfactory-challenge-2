import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AutomotorService } from '../services/automotor.service';
import { AutomotorResponseDto } from '../dto/automotor-response.dto';

@ApiTags('automotores')
@Controller('automotores')
export class AutomotorController {
  constructor(private readonly automotorService: AutomotorService) {}

  @Get()
  @ApiOperation({ summary: 'List all vehicles' })
  @ApiResponse({
    status: 200,
    description: 'List of vehicles',
    type: [AutomotorResponseDto],
  })
  async findAll(): Promise<AutomotorResponseDto[]> {
    return this.automotorService.findAll();
  }
}
