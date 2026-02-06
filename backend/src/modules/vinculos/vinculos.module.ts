import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VinculoSujetoObjeto } from './entities/vinculo-sujeto-objeto.entity';
import { VinculoRepository } from './repositories/vinculo.repository';
import { VINCULO_REPOSITORY } from './interfaces/vinculo-repository.interface';
import { VinculoService } from './services/vinculo.service';

@Module({
  imports: [TypeOrmModule.forFeature([VinculoSujetoObjeto])],
  providers: [
    VinculoService,
    {
      provide: VINCULO_REPOSITORY,
      useClass: VinculoRepository,
    },
  ],
  exports: [VinculoService],
})
export class VinculosModule {}
