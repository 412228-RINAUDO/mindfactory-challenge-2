import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sujeto } from './entities/sujeto.entity';
import { SujetoRepository } from './repositories/sujeto.repository';
import { SUJETO_REPOSITORY } from './interfaces/sujeto-repository.interface';
import { SujetoService } from './services/sujeto.service';
import { SujetoController } from './controllers/sujeto.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sujeto])],
  controllers: [SujetoController],
  providers: [
    SujetoService,
    {
      provide: SUJETO_REPOSITORY,
      useClass: SujetoRepository,
    },
  ],
  exports: [SujetoService],
})
export class SujetosModule {}
