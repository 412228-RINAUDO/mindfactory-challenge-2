import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Sujeto } from '../../modules/sujetos/entities/sujeto.entity';
import { ObjetoDeValor } from '../../modules/objetos-valor/entities/objeto-valor.entity';
import { Automotor } from '../../modules/automotores/entities/automotor.entity';
import { VinculoSujetoObjeto } from '../../modules/vinculos/entities/vinculo-sujeto-objeto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sujeto,
      ObjetoDeValor,
      Automotor,
      VinculoSujetoObjeto,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
