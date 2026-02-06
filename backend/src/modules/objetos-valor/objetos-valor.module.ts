import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjetoDeValor } from './entities/objeto-valor.entity';
import { ObjetoValorRepository } from './repositories/objeto-valor.repository';
import { OBJETO_VALOR_REPOSITORY } from './interfaces/objeto-valor-repository.interface';
import { ObjetoValorService } from './services/objeto-valor.service';

@Module({
  imports: [TypeOrmModule.forFeature([ObjetoDeValor])],
  providers: [
    ObjetoValorService,
    {
      provide: OBJETO_VALOR_REPOSITORY,
      useClass: ObjetoValorRepository,
    },
  ],
  exports: [ObjetoValorService],
})
export class ObjetosValorModule {}
