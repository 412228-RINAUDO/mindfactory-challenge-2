import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import type { Server } from 'http';
import { DataSource } from 'typeorm';
import { AutomotoresModule } from '../src/entities/automotores/automotores.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { getTestDbConfig } from './setup-e2e';
import { AutomotorDetailResponseDto } from '../src/entities/automotores/dto/automotor-detail-response.dto';
import { AutomotorListResponseDto } from '../src/entities/automotores/dto/automotor-list-response.dto';
import { Automotor } from '../src/entities/automotores/entities/automotor.entity';
import { ObjetoDeValor } from '../src/entities/objetos-valor/entities/objeto-valor.entity';
import { Sujeto } from '../src/entities/sujetos/entities/sujeto.entity';
import { VinculoSujetoObjeto } from '../src/entities/vinculos/entities/vinculo-sujeto-objeto.entity';
import { createAutomotor, createSujeto, createVinculo, clearAllTables } from './helpers/factories';

describe('AutomotorController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let dataSource: DataSource;

  beforeAll(async () => {
    const dbConfig = getTestDbConfig();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
          password: dbConfig.password,
          entities: [Automotor, ObjetoDeValor, Sujeto, VinculoSujetoObjeto],
          synchronize: true,
        }),
        AutomotoresModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /automotores', () => {
    beforeEach(async () => {
      await clearAllTables(dataSource);
    });

    it('should return a list of vehicles ordered by dominio', async () => {
      await createAutomotor(dataSource, { dominio: 'ZZ001AA' });
      await createAutomotor(dataSource, { dominio: 'AA001ZZ' });

      const response = await request(server).get('/automotores').expect(200);
      const body = response.body as AutomotorListResponseDto[];

      expect(body).toHaveLength(2);
      expect(body[0].dominio).toBe('AA001ZZ');
      expect(body[1].dominio).toBe('ZZ001AA');
    });

    it('should return vehicle with current responsible owner', async () => {
      const sujeto = await createSujeto(dataSource, {
        cuit: '20999999901',
        denominacion: 'Owner Test 1',
      });
      const auto = await createAutomotor(dataSource, { dominio: 'OW001AA' });
      await createVinculo(dataSource, {
        ovpId: auto.ovpId,
        spoId: sujeto.id,
      });

      const response = await request(server).get('/automotores').expect(200);
      const body = response.body as AutomotorListResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({
        dominio: 'OW001AA',
        fechaFabricacion: 202401,
        cuit: '20999999901',
        dueno: 'Owner Test 1',
      });
    });

    it('should return only responsible owner (responsable = S) for vehicles with multiple owners', async () => {
      const responsible = await createSujeto(dataSource, {
        cuit: '20888888801',
        denominacion: 'Responsible Owner',
      });
      const notResponsible = await createSujeto(dataSource, {
        cuit: '20888888802',
        denominacion: 'Not Responsible',
      });
      const auto = await createAutomotor(dataSource, { dominio: 'MU001AA' });

      await createVinculo(dataSource, {
        ovpId: auto.ovpId,
        spoId: responsible.id,
        responsable: 'S',
        porcentaje: 75,
      });
      await createVinculo(dataSource, {
        ovpId: auto.ovpId,
        spoId: notResponsible.id,
        responsable: 'N',
        porcentaje: 25,
      });

      const response = await request(server).get('/automotores').expect(200);
      const body = response.body as AutomotorListResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({
        dominio: 'MU001AA',
        cuit: '20888888801',
        dueno: 'Responsible Owner',
      });
    });

    it('should return null cuit/dueno for vehicles without owner', async () => {
      await createAutomotor(dataSource, { dominio: 'NO001OW' });

      const response = await request(server).get('/automotores').expect(200);
      const body = response.body as AutomotorListResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({
        dominio: 'NO001OW',
        cuit: null,
        dueno: null,
      });
    });

    it('should return null cuit/dueno for vehicles with inactive owner (fechaFin set)', async () => {
      const sujeto = await createSujeto(dataSource, { cuit: '20777777701' });
      const auto = await createAutomotor(dataSource, { dominio: 'IN001AC' });
      await createVinculo(dataSource, {
        ovpId: auto.ovpId,
        spoId: sujeto.id,
        fechaFin: new Date('2024-01-01'),
      });

      const response = await request(server).get('/automotores').expect(200);
      const body = response.body as AutomotorListResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({
        dominio: 'IN001AC',
        cuit: null,
        dueno: null,
      });
    });
  });

  describe('GET /automotores/:dominio', () => {
    beforeEach(async () => {
      await clearAllTables(dataSource);
    });

    it('should return vehicle details with current owner', async () => {
      const sujeto = await createSujeto(dataSource, {
        cuit: '20666666601',
        denominacion: 'Detail Owner',
      });
      const auto = await createAutomotor(dataSource, {
        dominio: 'DT001AA',
        numeroChasis: 'CHASIS123',
        numeroMotor: 'MOTOR456',
        color: 'Rojo',
        fechaFabricacion: 202401,
      });
      await createVinculo(dataSource, {
        ovpId: auto.ovpId,
        spoId: sujeto.id,
        porcentaje: 100,
      });

      const response = await request(server).get('/automotores/DT001AA').expect(200);

      expect(response.body).toMatchObject({
        dominio: 'DT001AA',
        numeroChasis: 'CHASIS123',
        numeroMotor: 'MOTOR456',
        color: 'Rojo',
        fechaFabricacion: 202401,
        duenoActual: {
          cuit: '20666666601',
          denominacion: 'Detail Owner',
          porcentaje: '100.00',
        },
      });
    });

    it('should return vehicle with responsible owner only', async () => {
      const responsible = await createSujeto(dataSource, {
        cuit: '20555555501',
        denominacion: 'Resp Detail',
      });
      const notResponsible = await createSujeto(dataSource, { cuit: '20555555502' });
      const auto = await createAutomotor(dataSource, { dominio: 'RS001AA' });

      await createVinculo(dataSource, {
        ovpId: auto.ovpId,
        spoId: responsible.id,
        responsable: 'S',
        porcentaje: 75,
      });
      await createVinculo(dataSource, {
        ovpId: auto.ovpId,
        spoId: notResponsible.id,
        responsable: 'N',
        porcentaje: 25,
      });

      const response = await request(server).get('/automotores/RS001AA').expect(200);
      const body = response.body as AutomotorDetailResponseDto;

      expect(body.duenoActual).toMatchObject({
        cuit: '20555555501',
        denominacion: 'Resp Detail',
        porcentaje: '75.00',
      });
    });

    it('should return null duenoActual for vehicle without owner', async () => {
      await createAutomotor(dataSource, { dominio: 'NV001OW' });

      const response = await request(server).get('/automotores/NV001OW').expect(200);
      const body = response.body as AutomotorDetailResponseDto;

      expect(body.dominio).toBe('NV001OW');
      expect(body.duenoActual).toBeNull();
    });

    it('should return null duenoActual for vehicle with inactive owner', async () => {
      const sujeto = await createSujeto(dataSource, { cuit: '20444444401' });
      const auto = await createAutomotor(dataSource, { dominio: 'IV001AC' });
      await createVinculo(dataSource, {
        ovpId: auto.ovpId,
        spoId: sujeto.id,
        fechaFin: new Date('2024-01-01'),
      });

      const response = await request(server).get('/automotores/IV001AC').expect(200);
      const body = response.body as AutomotorDetailResponseDto;

      expect(body.dominio).toBe('IV001AC');
      expect(body.duenoActual).toBeNull();
    });

    it('should return 404 when vehicle does not exist', async () => {
      const response = await request(server).get('/automotores/NOTEXIST').expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        errorCode: 'AUTOMOTOR_NOT_FOUND',
      });
    });

    it('should return vehicle with null optional fields', async () => {
      await createAutomotor(dataSource, {
        dominio: 'NL001AA',
        numeroChasis: null,
        numeroMotor: null,
        color: null,
      });

      const response = await request(server).get('/automotores/NL001AA').expect(200);
      const body = response.body as AutomotorDetailResponseDto;

      expect(body.numeroChasis).toBeNull();
      expect(body.numeroMotor).toBeNull();
      expect(body.color).toBeNull();
    });
  });
});
