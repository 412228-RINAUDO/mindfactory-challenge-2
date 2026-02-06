# 🚀 Challenge Técnico — Migración Oracle Forms

**⏰ Plazo:** 3 días (72 h) desde que recibís este enunciado.

**📤 Entrega:** enviá un mail a **challenge@mindfactory.ar** con el **link al repo público**.

**🆘 Dudas:** podés escribirnos a lucas.kail**@mindfactory.ar**

**🧰 Stack objetivo:** NestJS + Oracle DB (con TypeORM) + Angular

**📥 Input:** XML de Oracle Forms (alta/CRUD Automotor)

**📦 Output:** Backend y Front funcionales + Docker

---

## 🎯 Objetivo (qué buscamos)

Migrar el formulario Oracle Forms provisto (XML) a una API **NestJS + TypeORM** con **Postgres**, preservando validaciones y reglas de negocio. Armar un **Front Angular** simple para alta, listado, edición y baja del automotor con su **dueño por CUIT**.

> Bonus de actitud: contanos tus decisiones, trade-offs y cómo validarías.

---

## 📦 Alcance obligatorio

### 🔧 Backend (NestJS)

- **Modelo** según SQL (ver “Archivos”):
  `Automotores → Objeto_De_Valor → Vinculo_Sujeto_Objeto → Sujeto`.
- **Validaciones (server):**
  - **Dominio**: `AAA999` o `AA999AA`.
  - **CUIT**: dígito verificador (módulo 11).
  - **Fecha fabricación (YYYYMM)**: 6 dígitos, mes 1..12, no futuro.
  - **Owner único** activo por automotor (cerrar anterior al reasignar).
- **Endpoints (`/api`)**:
  - `GET /automotores` → lista + dueño actual.
  - `GET /automotores/:dominio` → detalle + dueño actual.
  - `POST /automotores` → alta + asignación de dueño por CUIT (valida todo).
  - `PUT /automotores/:dominio` → actualizar datos y/o cambiar dueño.
  - `DELETE /automotores/:dominio` → elimina automotor y su objeto (cascade).
  - `GET /sujetos/by-cuit?cuit=` → obtener sujeto por CUIT.
  - `POST /sujetos` → crear sujeto (CUIT válido + denominación).
- **Errores**: usar `422 Unprocessable Entity` para reglas de negocio.
- **Tests**:
  - Unit: validadores de CUIT, dominio, YYYYMM.

### 🖥️ Frontend (Angular)

- **Páginas**:
  - **Listado** (dominio, dueño, CUIT, fabricación, link “Editar”).
  - **Formulario** crear/editar:
    - Campos: dominio, chasis, motor, color, fecha fabricación (YYYYMM), **CUIT dueño**.
    - Validaciones client-side equivalentes.
    - Si el CUIT no existe, permitir **crearlo** (prompt/diálogo) y reintentar.
- **Flujo**:
  - Crear/actualizar debe **reasignar** dueño responsable (100%) cuando cambie el CUIT.

### 🐳 Docker

- `docker-compose.yml` con servicios:
  - **db**: Postgres 16 (volumen de datos).
  - **api**: NestJS (build multi-stage, `depends_on` db).
  - **web**: Angular servido (node).
- `Dockerfile` para **api** (y opcionalmente **web**).
- `.env.example` (puertos, credenciales DB).
- **README** con one-liner: `docker compose up -d --build` (+ migraciones/seed si aplica).
- ✅ Debe levantar con un comando y quedar accesible.

---

## 🔀 Flujo de trabajo con Git

- **Trabajar en distintas ramas**
- **Commits (Conventional Commits):** `feat(api): validar dominio ...`, `fix(e2e): ...`
- **Pull Requests:** mínimo **2 PRs** (p. ej. backend/frontend o docker/backend):
  - Descripción con **qué / por qué / cómo**, pruebas manuales y **trade-offs**.

---

## 🧠 Mini-desafío de pensamiento: **“¿Y si fueran 500 formularios?”**

> No hace falta implementarlo. Queremos entender como piensas.

Creá `docs/ESCALABILIDAD.md` con:

- **Arquitectura**: pipeline **parsing → modelo intermedio → codegen → validación**.
- **Parsing** del XML a un **modelo intermedio** (Blocks/Items/Triggers/PU).
- **Codegen** con **templates** (entidades/DTOs/controllers/services) y convenciones.
- **CLI/Workflow** reproducible.
- **Observabilidad**: métricas de conversión, reporte HTML.
- Incluí **1–2 ejemplos** (pseudo-JSON + mini-template).

---

## 🤖 Podés usar IA/aceleradores (con criterio)

Permitido usar **ChatGPT** u otros, siempre que documentes en `docs/IA_ACELERADORES.md`:

- Qué pediste y **por qué**.
- Cómo **validaste** lo generado (tests, revisión).
- Riesgos y mitigaciones.
- **Justificá** tu enfoque frente a alternativas.

---

## 🧾 Lo que te damos

- **XML** del formulario (alta/CRUD + triggers y program unit).
- **SQL** del esquema base (tablas, índices, vista de apoyo).
  _(ver al final “Archivos fuente” para copiar/pegar)_

---

## 🧭 Reglas & límites

- Usar **TypeORM**.
- No cambiar **reglas de negocio** del XML; hay que replicarlas.
- Front **minimalista** (prima lo funcional).

---

## 🧪 Criterios de evaluación (100 pts)

- **Fidelidad reglas XML ↔ Backend** — 28 pts
- **Calidad de diseño** (DDD light, módulos/servicios/DTOs, errores) — 12 pts
- **Modelo & SQL** (constraints, relaciones, índices, owner único) — 10 pts
- **Tests** (unit) — 10 pts
- **Frontend funcional** (validaciones y flujo) — 12 pts
- **Docker** (1 comando + README claro) — 8 pts
- **Git Workflow** (ramas, PRs, commits, ADR) — 10 pts
- **Razonamiento/escala (500 formularios)** — 10 pts

**Bonuses (hasta +5):** Seeds mínimas, Swagger/OpenAPI.

---

## 📬 Entrega (recordatorio)

- Enviá un mail a **challenge@mindfactory.ar** con el **link al repo público**.
- Incluí en el README:
  - Cómo levantar con Docker (api/web/db).
  - Cómo correr tests.
  - Endpoints principales y credenciales fake.
- **Tiempo máximo:** **3 días (72 h)**.

---

## ✅ Checklist de aceptación rápida

- [x] `docker compose up -d --build` levanta **db**, **api** y **web** con healthchecks.
- [x] `GET /api/automotores` lista con dueño actual.
- [x] `POST /api/automotores` crea/actualiza automotor y asigna dueño (CUIT válido + existente).
- [x] `PUT /api/automotores/:dominio` actualiza y puede reasignar dueño.
- [x] `DELETE /api/automotores/:dominio` elimina en cascada.
- [ ] Angular funciona: listar, crear, editar, eliminar; validaciones client-side.
- [x] Tests: validadores.
- [x] Git: **≥2 PRs** con descripción y decisiones; commits claros.
- [ ] Docs: `docs/DECISION_LOG.md`, `docs/ESCALABILIDAD.md`, `docs/IA_ACELERADORES.md`.

---

## 📎 Archivos fuente (copiar/pegar)

### A) `alta_automotor.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Form Name="ALTA_AUTOMOTOR" Version="10g">
  <Blocks>
    <Block Name="AUTOMOTOR" DataSourceName="Automotores">
      <Items>
        <Item Name="DOMINIO" Datatype="CHAR" Length="8" Required="true" Prompt="Dominio"/>
        <Item Name="NUMERO_CHASIS" Datatype="CHAR" Length="25" Required="false" Prompt="N° Chasis"/>
        <Item Name="NUMERO_MOTOR" Datatype="CHAR" Length="25" Required="false" Prompt="N° Motor"/>
        <Item Name="COLOR" Datatype="CHAR" Length="40" Required="false" Prompt="Color"/>
        <Item Name="FECHA_FABRICACION" Datatype="NUMBER" Length="6" Required="true" Prompt="YYYYMM Fabricación"/>
        <Item Name="CUIT_DUENIO" Datatype="CHAR" Length="11" Required="true" Prompt="CUIT Dueño"/>
        <Item Name="DENOM_DUENIO" Datatype="CHAR" Length="160" Required="false" Prompt="Nombre Dueño" Enabled="false"/>
        <Item Name="BTN_SAVE" ItemType="BUTTON" Label="Guardar/Alta"/>
        <Item Name="BTN_UPDATE" ItemType="BUTTON" Label="Actualizar"/>
        <Item Name="BTN_DELETE" ItemType="BUTTON" Label="Eliminar"/>
        <Item Name="BTN_LIST" ItemType="BUTTON" Label="Listar"/>
      </Items>

      <Triggers>
        <Trigger Name="WHEN-VALIDATE-ITEM" Item="DOMINIO" FireInQuery="false" DisplayInKeyboardHelp="true"
          TriggerText="BEGIN&#10;  PCK_AUTOMOTOR.validar_dominio(:AUTOMOTOR.DOMINIO);&#10;END;"/>
        <Trigger Name="WHEN-VALIDATE-ITEM" Item="CUIT_DUENIO" FireInQuery="false" DisplayInKeyboardHelp="true"
          TriggerText="BEGIN&#10;  IF NOT PCK_AUTOMOTOR.es_cuit_valido(:AUTOMOTOR.CUIT_DUENIO) THEN&#10;    message('CUIT inv&#225;lido');&#10;    RAISE FORM_TRIGGER_FAILURE;&#10;  END IF;&#10;  :AUTOMOTOR.DENOM_DUENIO := PCK_AUTOMOTOR.obtener_denominacion(:AUTOMOTOR.CUIT_DUENIO);&#10;  IF :AUTOMOTOR.DENOM_DUENIO IS NULL THEN&#10;    message('No existe Sujeto con ese CUIT');&#10;    RAISE FORM_TRIGGER_FAILURE;&#10;  END IF;&#10;END;"/>
        <Trigger Name="WHEN-VALIDATE-ITEM" Item="FECHA_FABRICACION" FireInQuery="false" DisplayInKeyboardHelp="true"
          TriggerText="BEGIN&#10;  PCK_AUTOMOTOR.validar_fabricacion(:AUTOMOTOR.FECHA_FABRICACION);&#10;END;"/>
        <Trigger Name="WHEN-BUTTON-PRESSED" Item="BTN_SAVE"
          TriggerText="BEGIN&#10;  PCK_AUTOMOTOR.registrar_alta(&#10;    :AUTOMOTOR.DOMINIO,&#10;    :AUTOMOTOR.NUMERO_CHASIS,&#10;    :AUTOMOTOR.NUMERO_MOTOR,&#10;    :AUTOMOTOR.COLOR,&#10;    :AUTOMOTOR.FECHA_FABRICACION,&#10;    :AUTOMOTOR.CUIT_DUENIO&#10;  );&#10;  message('Automotor guardado con due&#241;o asignado');&#10;END;"/>
        <Trigger Name="WHEN-BUTTON-PRESSED" Item="BTN_UPDATE"
          TriggerText="BEGIN&#10;  PCK_AUTOMOTOR.actualizar(&#10;    :AUTOMOTOR.DOMINIO,&#10;    :AUTOMOTOR.NUMERO_CHASIS,&#10;    :AUTOMOTOR.NUMERO_MOTOR,&#10;    :AUTOMOTOR.COLOR,&#10;    :AUTOMOTOR.FECHA_FABRICACION,&#10;    :AUTOMOTOR.CUIT_DUENIO&#10;  );&#10;  message('Automotor actualizado');&#10;END;"/>
        <Trigger Name="WHEN-BUTTON-PRESSED" Item="BTN_DELETE"
          TriggerText="BEGIN&#10;  PCK_AUTOMOTOR.eliminar(:AUTOMOTOR.DOMINIO);&#10;  message('Automotor eliminado');&#10;END;"/>
        <Trigger Name="WHEN-BUTTON-PRESSED" Item="BTN_LIST"
          TriggerText="BEGIN&#10;  PCK_AUTOMOTOR.refrescar_listado;&#10;  message('Listado cargado (ver RG_AUTOS_DUENIO)');&#10;END;"/>
      </Triggers>
    </Block>
  </Blocks>

  <RecordGroups>
    <RecordGroup Name="RG_AUTOS_DUENIO" QueryText="SELECT a.atr_dominio AS dominio, s.spo_cuit AS cuit, s.spo_denominacion AS duenio&#10;FROM &quot;Automotores&quot; a&#10;JOIN &quot;Objeto_De_Valor&quot; o ON o.ovp_id = a.atr_ovp_id&#10;LEFT JOIN &quot;Vinculo_Sujeto_Objeto&quot; v ON v.vso_ovp_id = o.ovp_id AND v.vso_responsable = 'S' AND v.vso_fecha_fin IS NULL&#10;LEFT JOIN &quot;Sujeto&quot; s ON s.spo_id = v.vso_spo_id&#10;ORDER BY a.atr_dominio"/>
  </RecordGroups>

  <ProgramUnits>
    <ProgramUnit Name="PCK_AUTOMOTOR" UnitType="PLSQL"
      ProgramText="PACKAGE BODY PCK_AUTOMOTOR IS&#10;&#10;  FUNCTION es_cuit_valido(p_cuit IN VARCHAR2) RETURN BOOLEAN IS&#10;    v_sum NUMBER := 0; v_coef SYS.OdciNumberList := SYS.OdciNumberList(5,4,3,2,7,6,5,4,3,2); v_dig NUMBER;&#10;  BEGIN&#10;    IF LENGTH(p_cuit) &lt;&gt; 11 OR REGEXP_INSTR(p_cuit, '^[0-9]{11}$') = 0 THEN RETURN FALSE; END IF;&#10;    FOR i IN 1..10 LOOP v_sum := v_sum + TO_NUMBER(SUBSTR(p_cuit,i,1))*v_coef(i); END LOOP;&#10;    v_dig := MOD(11 - MOD(v_sum,11),11); IF v_dig = 11 THEN v_dig := 0; END IF;&#10;    RETURN v_dig = TO_NUMBER(SUBSTR(p_cuit,11,1));&#10;  END;&#10;&#10;  PROCEDURE validar_dominio(p_dom IN VARCHAR2) IS&#10;  BEGIN&#10;    IF REGEXP_INSTR(p_dom, '^[A-Z]{3}[0-9]{3}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$') = 0 THEN&#10;      message('Dominio inv&#225;lido'); RAISE FORM_TRIGGER_FAILURE;&#10;    END IF;&#10;  END;&#10;&#10;  PROCEDURE validar_fabricacion(p_fab IN NUMBER) IS&#10;    v_y NUMBER; v_m NUMBER; v_now VARCHAR2(6) := TO_CHAR(SYSDATE,'YYYYMM');&#10;  BEGIN&#10;    IF p_fab IS NULL OR LENGTH(TO_CHAR(p_fab)) &lt;&gt; 6 THEN message('Fecha fabricaci&#243;n YYYYMM'); RAISE FORM_TRIGGER_FAILURE; END IF;&#10;    v_y := TO_NUMBER(SUBSTR(TO_CHAR(p_fab),1,4)); v_m := TO_NUMBER(SUBSTR(TO_CHAR(p_fab),5,2));&#10;    IF v_y &lt; 1900 OR v_m NOT BETWEEN 1 AND 12 OR TO_CHAR(p_fab) &gt; v_now THEN&#10;      message('Fecha fabricaci&#243;n inv&#225;lida'); RAISE FORM_TRIGGER_FAILURE;&#10;    END IF;&#10;  END;&#10;&#10;  FUNCTION obtener_denominacion(p_cuit IN VARCHAR2) RETURN VARCHAR2 IS&#10;    v_den VARCHAR2(160);&#10;  BEGIN&#10;    SELECT spo_denominacion INTO v_den FROM &quot;Sujeto&quot; WHERE spo_cuit = p_cuit;&#10;    RETURN v_den;&#10;  EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL; END;&#10;&#10;  FUNCTION obtener_spo_id(p_cuit IN VARCHAR2) RETURN NUMBER IS&#10;    v_id NUMBER;&#10;  BEGIN&#10;    SELECT spo_id INTO v_id FROM &quot;Sujeto&quot; WHERE spo_cuit = p_cuit; RETURN v_id;&#10;  EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL; END;&#10;&#10;  PROCEDURE registrar_alta(p_dom IN VARCHAR2, p_chasis IN VARCHAR2, p_motor IN VARCHAR2, p_color IN VARCHAR2, p_fab IN NUMBER, p_cuit IN VARCHAR2) IS&#10;    v_spo NUMBER; v_ovp NUMBER; v_atr NUMBER;&#10;  BEGIN&#10;    validar_dominio(p_dom);&#10;    validar_fabricacion(p_fab);&#10;    IF NOT es_cuit_valido(p_cuit) THEN message('CUIT inv&#225;lido'); RAISE FORM_TRIGGER_FAILURE; END IF;&#10;    v_spo := obtener_spo_id(p_cuit); IF v_spo IS NULL THEN message('No existe Sujeto con ese CUIT'); RAISE FORM_TRIGGER_FAILURE; END IF;&#10;&#10;    BEGIN&#10;      SELECT ovp_id INTO v_ovp FROM &quot;Objeto_De_Valor&quot; WHERE ovp_tipo='AUTOMOTOR' AND ovp_codigo = p_dom;&#10;    EXCEPTION WHEN NO_DATA_FOUND THEN&#10;      INSERT INTO &quot;Objeto_De_Valor&quot;(ovp_tipo, ovp_codigo, ovp_descripcion) VALUES('AUTOMOTOR', p_dom, 'Automotor '||p_dom) RETURNING ovp_id INTO v_ovp;&#10;    END;&#10;&#10;    BEGIN&#10;      SELECT atr_id INTO v_atr FROM &quot;Automotores&quot; WHERE atr_dominio = p_dom;&#10;      UPDATE &quot;Automotores&quot; SET atr_numero_chasis = p_chasis, atr_numero_motor = p_motor, atr_color = p_color, atr_fecha_fabricacion = p_fab WHERE atr_id = v_atr;&#10;    EXCEPTION WHEN NO_DATA_FOUND THEN&#10;      INSERT INTO &quot;Automotores&quot;(atr_ovp_id, atr_dominio, atr_numero_chasis, atr_numero_motor, atr_color, atr_fecha_fabricacion)&#10;      VALUES(v_ovp, p_dom, p_chasis, p_motor, p_color, p_fab) RETURNING atr_id INTO v_atr;&#10;    END;&#10;&#10;    UPDATE &quot;Vinculo_Sujeto_Objeto&quot; SET vso_fecha_fin = SYSDATE WHERE vso_ovp_id = v_ovp AND vso_responsable='S' AND vso_fecha_fin IS NULL;&#10;    INSERT INTO &quot;Vinculo_Sujeto_Objeto&quot;(vso_ovp_id, vso_spo_id, vso_tipo_vinculo, vso_porcentaje, vso_responsable, vso_fecha_inicio)&#10;    VALUES(v_ovp, v_spo, 'DUENO', 100, 'S', TRUNC(SYSDATE));&#10;  END;&#10;&#10;  PROCEDURE actualizar(p_dom IN VARCHAR2, p_chasis IN VARCHAR2, p_motor IN VARCHAR2, p_color IN VARCHAR2, p_fab IN NUMBER, p_cuit IN VARCHAR2) IS&#10;  BEGIN&#10;    registrar_alta(p_dom, p_chasis, p_motor, p_color, p_fab, p_cuit);&#10;  END;&#10;&#10;  PROCEDURE eliminar(p_dom IN VARCHAR2) IS&#10;    v_ovp NUMBER; v_atr NUMBER;&#10;  BEGIN&#10;    SELECT o.ovp_id, a.atr_id INTO v_ovp, v_atr&#10;    FROM &quot;Automotores&quot; a JOIN &quot;Objeto_De_Valor&quot; o ON o.ovp_id = a.atr_ovp_id&#10;    WHERE a.atr_dominio = p_dom;&#10;    DELETE FROM &quot;Vinculo_Sujeto_Objeto&quot; WHERE vso_ovp_id = v_ovp;&#10;    DELETE FROM &quot;Automotores&quot; WHERE atr_id = v_atr;&#10;    DELETE FROM &quot;Objeto_De_Valor&quot; WHERE ovp_id = v_ovp;&#10;  EXCEPTION WHEN NO_DATA_FOUND THEN&#10;    message('Dominio no encontrado'); RAISE FORM_TRIGGER_FAILURE;&#10;  END;&#10;&#10;  PROCEDURE refrescar_listado IS&#10;  BEGIN&#10;    NULL;&#10;  END;&#10;&#10;END;"/>
  </ProgramUnits>
</Form>

```

### B) `schema_automotor.sql` (PostgreSQL)

```sql
CREATE TABLE IF NOT EXISTS "Sujeto" (
  spo_id           BIGSERIAL PRIMARY KEY,
  spo_cuit         VARCHAR(11)  NOT NULL UNIQUE,
  spo_denominacion VARCHAR(160) NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Objeto_De_Valor" (
  ovp_id          BIGSERIAL PRIMARY KEY,
  ovp_tipo        VARCHAR(30)   NOT NULL DEFAULT 'AUTOMOTOR',
  ovp_codigo      VARCHAR(64)   NOT NULL UNIQUE,
  ovp_descripcion VARCHAR(240),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Automotores" (
  atr_id                  BIGSERIAL PRIMARY KEY,
  atr_ovp_id              BIGINT      NOT NULL REFERENCES "Objeto_De_Valor"(ovp_id) ON DELETE CASCADE,
  atr_dominio             VARCHAR(8)  NOT NULL UNIQUE,
  atr_numero_chasis       VARCHAR(25),
  atr_numero_motor        VARCHAR(25),
  atr_color               VARCHAR(40),
  atr_fecha_fabricacion   INTEGER     NOT NULL,  -- YYYYMM
  atr_fecha_alta_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_atr_fecha_fabricacion CHECK (atr_fecha_fabricacion BETWEEN 190001 AND 299912)
);
CREATE INDEX IF NOT EXISTS idx_automotores_ovp ON "Automotores"(atr_ovp_id);

CREATE TABLE IF NOT EXISTS "Vinculo_Sujeto_Objeto" (
  vso_id           BIGSERIAL PRIMARY KEY,
  vso_ovp_id       BIGINT      NOT NULL REFERENCES "Objeto_De_Valor"(ovp_id) ON DELETE CASCADE,
  vso_spo_id       BIGINT      NOT NULL REFERENCES "Sujeto"(spo_id) ON DELETE RESTRICT,
  vso_tipo_vinculo VARCHAR(30) NOT NULL DEFAULT 'DUENO',
  vso_porcentaje   NUMERIC(5,2) NOT NULL DEFAULT 100,
  vso_responsable  CHAR(1)     NOT NULL DEFAULT 'S',
  vso_fecha_inicio DATE        NOT NULL DEFAULT CURRENT_DATE,
  vso_fecha_fin    DATE        NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vso_ovp ON "Vinculo_Sujeto_Objeto"(vso_ovp_id);
CREATE INDEX IF NOT EXISTS idx_vso_spo ON "Vinculo_Sujeto_Objeto"(vso_spo_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uq_vso_owner_actual'
  ) THEN
    CREATE UNIQUE INDEX uq_vso_owner_actual
      ON "Vinculo_Sujeto_Objeto"(vso_ovp_id)
      WHERE vso_responsable = 'S' AND vso_fecha_fin IS NULL AND vso_tipo_vinculo = 'DUENO';
  END IF;
END$$;

CREATE OR REPLACE VIEW vw_automotores_con_dueno AS
SELECT
  a.atr_dominio         AS dominio,
  a.atr_numero_chasis   AS numero_chasis,
  a.atr_numero_motor    AS numero_motor,
  a.atr_color           AS color,
  a.atr_fecha_fabricacion AS fecha_fabricacion,
  s.spo_cuit            AS cuit_dueno,
  s.spo_denominacion    AS denominacion_dueno
FROM "Automotores" a
JOIN "Objeto_De_Valor" o ON o.ovp_id = a.atr_ovp_id
LEFT JOIN "Vinculo_Sujeto_Objeto" v
  ON v.vso_ovp_id = o.ovp_id AND v.vso_responsable = 'S' AND v.vso_fecha_fin IS NULL
LEFT JOIN "Sujeto" s ON s.spo_id = v.vso_spo_id
ORDER BY a.atr_dominio;
```
