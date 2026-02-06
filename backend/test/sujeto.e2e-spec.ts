import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import type { Server } from 'http';
import { DataSource } from 'typeorm';
import { SujetosModule } from '../src/modules/sujetos/sujetos.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { getTestDbConfig } from './setup-e2e';
import { Automotor } from '../src/modules/automotores/entities/automotor.entity';
import { ObjetoDeValor } from '../src/modules/objetos-valor/entities/objeto-valor.entity';
import { Sujeto } from '../src/modules/sujetos/entities/sujeto.entity';
import { VinculoSujetoObjeto } from '../src/modules/vinculos/entities/vinculo-sujeto-objeto.entity';
import { createSujeto, clearAllTables } from './helpers/factories';

describe('SujetoController (e2e)', () => {
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
        SujetosModule,
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

  describe('GET /sujetos/by-cuit', () => {
    beforeEach(async () => {
      await clearAllTables(dataSource);
    });

    it('should return sujeto when found', async () => {
      const sujeto = await createSujeto(dataSource, {
        cuit: '20123456786',
        denominacion: 'Test Sujeto',
      });

      const response = await request(server)
        .get('/sujetos/by-cuit')
        .query({ cuit: '20123456786' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: sujeto.id,
        cuit: '20123456786',
        denominacion: 'Test Sujeto',
      });
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return 404 when sujeto not found', async () => {
      const response = await request(server)
        .get('/sujetos/by-cuit')
        .query({ cuit: '20999999999' })
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        errorCode: 'SUJETO_NOT_FOUND',
      });
    });
  });

  describe('POST /sujetos', () => {
    beforeEach(async () => {
      await clearAllTables(dataSource);
    });

    it('should create a new sujeto', async () => {
      const response = await request(server)
        .post('/sujetos')
        .send({
          cuit: '20123456786',
          denominacion: 'New Sujeto',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        cuit: '20123456786',
        denominacion: 'New Sujeto',
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return 422 when CUIT already exists', async () => {
      await createSujeto(dataSource, {
        cuit: '20123456786',
        denominacion: 'Existing Sujeto',
      });

      const response = await request(server)
        .post('/sujetos')
        .send({
          cuit: '20123456786',
          denominacion: 'Another Sujeto',
        })
        .expect(422);

      expect(response.body).toMatchObject({
        statusCode: 422,
        errorCode: 'CUIT_ALREADY_EXISTS',
      });
    });

    it('should return 400 for invalid CUIT format', async () => {
      const response = await request(server)
        .post('/sujetos')
        .send({
          cuit: '12345678901',
          denominacion: 'Invalid CUIT Sujeto',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 when denominacion is empty', async () => {
      const response = await request(server)
        .post('/sujetos')
        .send({
          cuit: '20123456786',
          denominacion: '',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 when denominacion exceeds max length', async () => {
      const response = await request(server)
        .post('/sujetos')
        .send({
          cuit: '20123456786',
          denominacion: 'A'.repeat(161),
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });
  });
});
