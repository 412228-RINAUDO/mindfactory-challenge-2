import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import type { Server } from 'http';
import { DataSource } from 'typeorm';
import { AutomotoresModule } from '../src/modules/automotores/automotores.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { getTestDbConfig } from './setup-e2e';
import { AutomotorListResponseDto } from '../src/modules/automotores/dto/automotor-list-response.dto';
import { Automotor } from '../src/modules/automotores/entities/automotor.entity';
import { ObjetoDeValor } from '../src/modules/objetos-valor/entities/objeto-valor.entity';
import { Sujeto } from '../src/modules/sujetos/entities/sujeto.entity';
import { VinculoSujetoObjeto } from '../src/modules/vinculos/entities/vinculo-sujeto-objeto.entity';
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
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
      await createAutomotor(dataSource, { dominio: 'ZZ001AA', fechaFabricacion: 202301 });
      await createAutomotor(dataSource, { dominio: 'AA001ZZ', fechaFabricacion: 202402 });

      const response = await request(server).get('/automotores').expect(200);
      const body = response.body as AutomotorListResponseDto[];

      expect(body).toHaveLength(2);
      expect(body[0]).toEqual({
        dominio: 'AA001ZZ',
        fechaFabricacion: 202402,
        cuit: null,
        dueno: null,
      });
      expect(body[1]).toEqual({
        dominio: 'ZZ001AA',
        fechaFabricacion: 202301,
        cuit: null,
        dueno: null,
      });
    });

    it('should return vehicle with current responsible owner', async () => {
      const sujeto = await createSujeto(dataSource, {
        cuit: '20999999901',
        denominacion: 'Owner Test 1',
      });
      const auto = await createAutomotor(dataSource, {
        dominio: 'OW001AA',
        fechaFabricacion: 202401,
      });
      await createVinculo(dataSource, {
        ovpId: auto.ovpId,
        spoId: sujeto.id,
      });

      const response = await request(server).get('/automotores').expect(200);
      const body = response.body as AutomotorListResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
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
      const auto = await createAutomotor(dataSource, {
        dominio: 'MU001AA',
        fechaFabricacion: 202401,
      });

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
      expect(body[0]).toEqual({
        dominio: 'MU001AA',
        fechaFabricacion: 202401,
        cuit: '20888888801',
        dueno: 'Responsible Owner',
      });
    });

    it('should return null cuit/dueno for vehicles without owner', async () => {
      await createAutomotor(dataSource, { dominio: 'NO001OW', fechaFabricacion: 202401 });

      const response = await request(server).get('/automotores').expect(200);
      const body = response.body as AutomotorListResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
        dominio: 'NO001OW',
        fechaFabricacion: 202401,
        cuit: null,
        dueno: null,
      });
    });

    it('should return null cuit/dueno for vehicles with inactive owner (fechaFin set)', async () => {
      const sujeto = await createSujeto(dataSource, { cuit: '20777777701' });
      const auto = await createAutomotor(dataSource, {
        dominio: 'IN001AC',
        fechaFabricacion: 202401,
      });
      await createVinculo(dataSource, {
        ovpId: auto.ovpId,
        spoId: sujeto.id,
        fechaFin: new Date('2024-01-01'),
      });

      const response = await request(server).get('/automotores').expect(200);
      const body = response.body as AutomotorListResponseDto[];

      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
        dominio: 'IN001AC',
        fechaFabricacion: 202401,
        cuit: null,
        dueno: null,
      });
    });
  });

  describe('POST /automotores', () => {
    beforeEach(async () => {
      await clearAllTables(dataSource);
    });

    it('should create a new vehicle with owner', async () => {
      const sujeto = await createSujeto(dataSource, {
        cuit: '20123456786',
        denominacion: 'New Owner',
      });

      const response = await request(server)
        .post('/automotores')
        .send({
          dominio: 'AA123BB',
          numeroChasis: 'CHASIS999',
          numeroMotor: 'MOTOR999',
          color: 'Azul',
          fechaFabricacion: 202401,
          cuitDueno: '20123456786',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        dominio: 'AA123BB',
        numeroChasis: 'CHASIS999',
        numeroMotor: 'MOTOR999',
        color: 'Azul',
        fechaFabricacion: 202401,
        duenoActual: {
          cuit: '20123456786',
          denominacion: 'New Owner',
          porcentaje: '100.00',
        },
      });
    });

    it('should return 404 when sujeto does not exist', async () => {
      const response = await request(server)
        .post('/automotores')
        .send({
          dominio: 'AA123BB',
          fechaFabricacion: 202401,
          cuitDueno: '20123456786',
        })
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        errorCode: 'SUJETO_NOT_FOUND',
      });
    });

    it('should return 400 for invalid dominio format', async () => {
      await createSujeto(dataSource, { cuit: '20123456786' });

      const response = await request(server)
        .post('/automotores')
        .send({
          dominio: 'INVALID',
          fechaFabricacion: 202401,
          cuitDueno: '20123456786',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 for invalid CUIT', async () => {
      const response = await request(server)
        .post('/automotores')
        .send({
          dominio: 'AA123BB',
          fechaFabricacion: 202401,
          cuitDueno: '12345678901',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('PUT /automotores/:dominio', () => {
    beforeEach(async () => {
      await clearAllTables(dataSource);
    });

    it('should update vehicle fields', async () => {
      const sujeto = await createSujeto(dataSource, { cuit: '20123456786' });
      const auto = await createAutomotor(dataSource, { dominio: 'UP001AA' });
      await createVinculo(dataSource, { ovpId: auto.ovpId, spoId: sujeto.id });

      const response = await request(server)
        .put('/automotores/UP001AA')
        .send({
          color: 'Verde',
          numeroChasis: 'NEWCHASIS',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        dominio: 'UP001AA',
        color: 'Verde',
        numeroChasis: 'NEWCHASIS',
      });
    });

    it('should reassign owner when cuitDueno changes', async () => {
      const oldOwner = await createSujeto(dataSource, {
        cuit: '20123456786',
        denominacion: 'Old Owner',
      });
      const newOwner = await createSujeto(dataSource, {
        cuit: '27123456780',
        denominacion: 'New Owner',
      });
      const auto = await createAutomotor(dataSource, { dominio: 'RO001AA' });
      await createVinculo(dataSource, { ovpId: auto.ovpId, spoId: oldOwner.id });

      const response = await request(server)
        .put('/automotores/RO001AA')
        .send({
          cuitDueno: '27123456780',
        })
        .expect(200);

      expect(response.body.duenoActual).toMatchObject({
        cuit: '27123456780',
        denominacion: 'New Owner',
      });
    });

    it('should return 404 when vehicle does not exist', async () => {
      const response = await request(server)
        .put('/automotores/NOTEXIST')
        .send({ color: 'Rojo' })
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        errorCode: 'AUTOMOTOR_NOT_FOUND',
      });
    });

    it('should return 404 when new owner does not exist', async () => {
      const sujeto = await createSujeto(dataSource, { cuit: '20123456786' });
      const auto = await createAutomotor(dataSource, { dominio: 'NO001OW' });
      await createVinculo(dataSource, { ovpId: auto.ovpId, spoId: sujeto.id });

      const response = await request(server)
        .put('/automotores/NO001OW')
        .send({ cuitDueno: '27123456780' })
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        errorCode: 'SUJETO_NOT_FOUND',
      });
    });
  });

  describe('DELETE /automotores/:dominio', () => {
    beforeEach(async () => {
      await clearAllTables(dataSource);
    });

    it('should delete vehicle and return 204', async () => {
      await createAutomotor(dataSource, { dominio: 'DL001AA' });

      await request(server).delete('/automotores/DL001AA').expect(204);

      // Verify it's deleted via list endpoint
      const response = await request(server).get('/automotores').expect(200);
      expect(response.body).toHaveLength(0);
    });

    it('should delete vehicle with owner (cascade)', async () => {
      const sujeto = await createSujeto(dataSource, { cuit: '20123456786' });
      const auto = await createAutomotor(dataSource, { dominio: 'DC001AA' });
      await createVinculo(dataSource, { ovpId: auto.ovpId, spoId: sujeto.id });

      await request(server).delete('/automotores/DC001AA').expect(204);

      // Verify vehicle is deleted via list endpoint
      const response = await request(server).get('/automotores').expect(200);
      expect(response.body).toHaveLength(0);

      // Verify sujeto still exists
      const sujetos = await dataSource.getRepository(Sujeto).find();
      expect(sujetos).toHaveLength(1);
    });

    it('should return 404 when vehicle does not exist', async () => {
      const response = await request(server).delete('/automotores/NOTEXIST').expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        errorCode: 'AUTOMOTOR_NOT_FOUND',
      });
    });
  });

  describe('GET /automotores/:dominio', () => {
    beforeEach(async () => {
      await clearAllTables(dataSource);
    });

    it('should return vehicle detail with owner', async () => {
      const sujeto = await createSujeto(dataSource, {
        cuit: '20123456786',
        denominacion: 'Test Owner',
      });
      const auto = await createAutomotor(dataSource, {
        dominio: 'DE001AA',
        fechaFabricacion: 202401,
        numeroChasis: 'CHASIS123',
        numeroMotor: 'MOTOR123',
        color: 'Rojo',
      });
      await createVinculo(dataSource, { ovpId: auto.ovpId, spoId: sujeto.id });

      const response = await request(server).get('/automotores/DE001AA').expect(200);

      expect(response.body).toMatchObject({
        dominio: 'DE001AA',
        numeroChasis: 'CHASIS123',
        numeroMotor: 'MOTOR123',
        color: 'Rojo',
        fechaFabricacion: 202401,
        duenoActual: {
          cuit: '20123456786',
          denominacion: 'Test Owner',
          porcentaje: '100.00',
        },
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.fechaAltaRegistro).toBeDefined();
    });

    it('should return vehicle without owner when no active vinculo exists', async () => {
      await createAutomotor(dataSource, {
        dominio: 'NO001OW',
        fechaFabricacion: 202401,
      });

      const response = await request(server).get('/automotores/NO001OW').expect(200);

      expect(response.body).toMatchObject({
        dominio: 'NO001OW',
        fechaFabricacion: 202401,
        duenoActual: null,
      });
    });

    it('should return 404 when vehicle does not exist', async () => {
      const response = await request(server).get('/automotores/NOTEXIST').expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        errorCode: 'AUTOMOTOR_NOT_FOUND',
      });
    });
  });
});
