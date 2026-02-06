import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { AutomotoresModule } from './modules/automotores/automotores.module';
import { ObjetosValorModule } from './modules/objetos-valor/objetos-valor.module';
import { SujetosModule } from './modules/sujetos/sujetos.module';
import { VinculosModule } from './modules/vinculos/vinculos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
        migrationsRun: true,
        migrations: ['dist/database/migrations/*.js'],
      }),
    }),
    HealthModule,
    ObjetosValorModule,
    SujetosModule,
    VinculosModule,
    AutomotoresModule,
  ],
})
export class AppModule {}
