import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjetoDeValor } from './entities/objeto-valor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ObjetoDeValor])],
  exports: [TypeOrmModule],
})
export class ObjetosValorModule {}
