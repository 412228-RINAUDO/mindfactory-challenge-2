import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VinculoSujetoObjeto } from './entities/vinculo-sujeto-objeto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VinculoSujetoObjeto])],
  exports: [TypeOrmModule],
})
export class VinculosModule {}
