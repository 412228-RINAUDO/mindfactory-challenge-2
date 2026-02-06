import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sujeto } from '../../modules/sujetos/entities/sujeto.entity';
import { ObjetoDeValor } from '../../modules/objetos-valor/entities/objeto-valor.entity';
import { Automotor } from '../../modules/automotores/entities/automotor.entity';
import { VinculoSujetoObjeto } from '../../modules/vinculos/entities/vinculo-sujeto-objeto.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Sujeto)
    private readonly sujetoRepository: Repository<Sujeto>,
    @InjectRepository(ObjetoDeValor)
    private readonly objetoDeValorRepository: Repository<ObjetoDeValor>,
    @InjectRepository(Automotor)
    private readonly automotorRepository: Repository<Automotor>,
    @InjectRepository(VinculoSujetoObjeto)
    private readonly vinculoRepository: Repository<VinculoSujetoObjeto>,
  ) {}

  async run(): Promise<void> {
    const existingCount = await this.sujetoRepository.count();
    if (existingCount > 0) {
      this.logger.log('Database already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding database...');

    // Create sujetos (subjects/owners)
    const sujetos = await this.sujetoRepository.save([
      { cuit: '20304050607', denominacion: 'Juan Carlos Pérez' },
      { cuit: '27234567890', denominacion: 'María Elena González' },
      { cuit: '30712345678', denominacion: 'Transportes del Sur S.A.' },
      { cuit: '20123456786', denominacion: 'Roberto Martínez' },
      { cuit: '27345678901', denominacion: 'Ana Laura Fernández' },
    ]);

    // Create objetos de valor (value objects) and automotores (vehicles)
    const vehicleData = [
      {
        codigo: 'AUTO-001',
        descripcion: 'Toyota Corolla 2020',
        dominio: 'AB123CD',
        numeroChasis: '9BRBL3HE3L0123456',
        numeroMotor: '1NZ1234567',
        color: 'Blanco',
        fechaFabricacion: 202003,
      },
      {
        codigo: 'AUTO-002',
        descripcion: 'Ford Ranger 2021',
        dominio: 'AC456EF',
        numeroChasis: '8AFDT5CG5M0234567',
        numeroMotor: '2L2345678',
        color: 'Negro',
        fechaFabricacion: 202106,
      },
      {
        codigo: 'AUTO-003',
        descripcion: 'Volkswagen Gol 2019',
        dominio: 'AD789GH',
        numeroChasis: '9BWAB45U5L0345678',
        numeroMotor: '3C3456789',
        color: 'Rojo',
        fechaFabricacion: 201911,
      },
      {
        codigo: 'AUTO-004',
        descripcion: 'Chevrolet Cruze 2022',
        dominio: 'AE012IJ',
        numeroChasis: '9BGKS48B4M0456789',
        numeroMotor: '4E4567890',
        color: 'Gris Plata',
        fechaFabricacion: 202201,
      },
      {
        codigo: 'AUTO-005',
        descripcion: 'Fiat Cronos 2023',
        dominio: 'AF345KL',
        numeroChasis: '9BD195129P0567890',
        numeroMotor: '5F5678901',
        color: 'Azul',
        fechaFabricacion: 202308,
      },
      {
        codigo: 'AUTO-006',
        descripcion: 'Renault Sandero 2020',
        dominio: 'AG678MN',
        numeroChasis: '8A1HSDM0CL0678901',
        numeroMotor: '6G6789012',
        color: 'Blanco',
        fechaFabricacion: 202004,
      },
      {
        codigo: 'AUTO-007',
        descripcion: 'Peugeot 208 2021',
        dominio: 'AH901OP',
        numeroChasis: '8AD0C5PY6M0789012',
        numeroMotor: '7H7890123',
        color: 'Negro',
        fechaFabricacion: 202109,
      },
    ];

    for (const data of vehicleData) {
      const objetoDeValor = await this.objetoDeValorRepository.save({
        tipo: 'AUTOMOTOR',
        codigo: data.codigo,
        descripcion: data.descripcion,
      });

      await this.automotorRepository.save({
        ovpId: objetoDeValor.id,
        dominio: data.dominio,
        numeroChasis: data.numeroChasis,
        numeroMotor: data.numeroMotor,
        color: data.color,
        fechaFabricacion: data.fechaFabricacion,
      });
    }

    // Fetch all objetos to create vinculos (ordered by id to match creation order)
    const objetos = await this.objetoDeValorRepository.find({
      order: { id: 'ASC' },
    });

    // Create vinculos (ownership relationships)
    // Each vehicle has ONE owner with 100% and responsable='S' (per business rules)
    // sujetos[0] (Juan Carlos Pérez) owns vehicles 0, 1
    // sujetos[1] (María Elena González) owns vehicle 2
    // sujetos[2] (Transportes del Sur S.A.) owns vehicles 3, 4, 5
    // sujetos[3] (Roberto Martínez) owns vehicle 6

    await this.vinculoRepository.save([
      // Juan Carlos Pérez owns Toyota Corolla
      {
        ovpId: objetos[0]?.id,
        spoId: sujetos[0]?.id,
        tipoVinculo: 'DUENO',
        porcentaje: 100,
        responsable: 'S',
        fechaInicio: new Date('2020-05-15'),
        fechaFin: null,
      },
      // Juan Carlos Pérez owns Ford Ranger
      {
        ovpId: objetos[1]?.id,
        spoId: sujetos[0]?.id,
        tipoVinculo: 'DUENO',
        porcentaje: 100,
        responsable: 'S',
        fechaInicio: new Date('2021-08-20'),
        fechaFin: null,
      },
      // María Elena González owns Volkswagen Gol
      {
        ovpId: objetos[2]?.id,
        spoId: sujetos[1]?.id,
        tipoVinculo: 'DUENO',
        porcentaje: 100,
        responsable: 'S',
        fechaInicio: new Date('2019-12-10'),
        fechaFin: null,
      },
      // Transportes del Sur S.A. owns Chevrolet Cruze
      {
        ovpId: objetos[3]?.id,
        spoId: sujetos[2]?.id,
        tipoVinculo: 'DUENO',
        porcentaje: 100,
        responsable: 'S',
        fechaInicio: new Date('2022-03-01'),
        fechaFin: null,
      },
      // Transportes del Sur S.A. owns Fiat Cronos
      {
        ovpId: objetos[4]?.id,
        spoId: sujetos[2]?.id,
        tipoVinculo: 'DUENO',
        porcentaje: 100,
        responsable: 'S',
        fechaInicio: new Date('2023-09-15'),
        fechaFin: null,
      },
      // Transportes del Sur S.A. owns Renault Sandero
      {
        ovpId: objetos[5]?.id,
        spoId: sujetos[2]?.id,
        tipoVinculo: 'DUENO',
        porcentaje: 100,
        responsable: 'S',
        fechaInicio: new Date('2020-06-01'),
        fechaFin: null,
      },
      // Roberto Martínez owns Peugeot 208
      {
        ovpId: objetos[6]?.id,
        spoId: sujetos[3]?.id,
        tipoVinculo: 'DUENO',
        porcentaje: 100,
        responsable: 'S',
        fechaInicio: new Date('2021-11-25'),
        fechaFin: null,
      },
    ]);

    this.logger.log('Database seeded successfully!');
    this.logger.log(`Created ${sujetos.length} sujetos`);
    this.logger.log(`Created ${vehicleData.length} automotores`);
    this.logger.log(`Created ${vehicleData.length} vinculos`);
  }
}
