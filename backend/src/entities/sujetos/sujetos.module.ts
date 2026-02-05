import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sujeto } from './entities/sujeto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sujeto])],
  exports: [TypeOrmModule],
})
export class SujetosModule {}
