import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1706900000000 implements MigrationInterface {
  name = 'InitialSchema1706900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sujeto table
    await queryRunner.query(`
      CREATE TABLE "sujeto" (
        "spo_id" BIGSERIAL PRIMARY KEY,
        "spo_cuit" VARCHAR(11) NOT NULL UNIQUE,
        "spo_denominacion" VARCHAR(160) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Create objeto_de_valor table
    await queryRunner.query(`
      CREATE TABLE "objeto_de_valor" (
        "ovp_id" BIGSERIAL PRIMARY KEY,
        "ovp_tipo" VARCHAR(30) NOT NULL DEFAULT 'AUTOMOTOR',
        "ovp_codigo" VARCHAR(64) NOT NULL UNIQUE,
        "ovp_descripcion" VARCHAR(240),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Create automotores table
    await queryRunner.query(`
      CREATE TABLE "automotores" (
        "atr_id" BIGSERIAL PRIMARY KEY,
        "atr_ovp_id" BIGINT NOT NULL UNIQUE,
        "atr_dominio" VARCHAR(8) NOT NULL UNIQUE,
        "atr_numero_chasis" VARCHAR(25),
        "atr_numero_motor" VARCHAR(25),
        "atr_color" VARCHAR(40),
        "atr_fecha_fabricacion" INT NOT NULL,
        "atr_fecha_alta_registro" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_automotores_ovp" FOREIGN KEY ("atr_ovp_id")
          REFERENCES "objeto_de_valor"("ovp_id") ON DELETE CASCADE,
        CONSTRAINT "chk_atr_fecha_fabricacion"
          CHECK ("atr_fecha_fabricacion" BETWEEN 190001 AND 299912)
      )
    `);

    // Create vinculo_sujeto_objeto table
    await queryRunner.query(`
      CREATE TABLE "vinculo_sujeto_objeto" (
        "vso_id" BIGSERIAL PRIMARY KEY,
        "vso_ovp_id" BIGINT NOT NULL,
        "vso_spo_id" BIGINT NOT NULL,
        "vso_tipo_vinculo" VARCHAR(30) NOT NULL DEFAULT 'DUENO',
        "vso_porcentaje" NUMERIC(5,2) NOT NULL DEFAULT 100,
        "vso_responsable" CHAR(1) NOT NULL DEFAULT 'S',
        "vso_fecha_inicio" DATE NOT NULL DEFAULT CURRENT_DATE,
        "vso_fecha_fin" DATE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_vso_ovp" FOREIGN KEY ("vso_ovp_id")
          REFERENCES "objeto_de_valor"("ovp_id") ON DELETE CASCADE,
        CONSTRAINT "fk_vso_spo" FOREIGN KEY ("vso_spo_id")
          REFERENCES "sujeto"("spo_id") ON DELETE RESTRICT
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_automotores_ovp" ON "automotores"("atr_ovp_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_vso_ovp" ON "vinculo_sujeto_objeto"("vso_ovp_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_vso_spo" ON "vinculo_sujeto_objeto"("vso_spo_id")
    `);

    // Create unique partial index for active owner
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_vso_owner_actual"
        ON "vinculo_sujeto_objeto"("vso_ovp_id")
        WHERE "vso_tipo_vinculo" = 'DUENO' AND "vso_fecha_fin" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "vinculo_sujeto_objeto"`);
    await queryRunner.query(`DROP TABLE "automotores"`);
    await queryRunner.query(`DROP TABLE "objeto_de_valor"`);
    await queryRunner.query(`DROP TABLE "sujeto"`);
  }
}
