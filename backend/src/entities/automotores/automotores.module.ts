import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Automotor } from './entities/automotor.entity';
import { AutomotorController } from './controllers/automotor.controller';
import { AutomotorService } from './services/automotor.service';
import { AutomotorRepository } from './repositories/automotor.repository';
import { AUTOMOTOR_REPOSITORY } from './interfaces/automotor-repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Automotor])],
  controllers: [AutomotorController],
  providers: [
    AutomotorService,
    {
      provide: AUTOMOTOR_REPOSITORY,
      useClass: AutomotorRepository,
    },
  ],
  exports: [AutomotorService],
})
export class AutomotoresModule {}
