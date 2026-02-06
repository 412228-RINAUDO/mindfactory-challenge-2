import { validate } from 'class-validator';
import { IsFechaFabricacion } from './is-fecha-fabricacion.validator';

class TestDto {
  @IsFechaFabricacion()
  fechaFabricacion: number;
}

describe('IsFechaFabricacion', () => {
  it('should accept valid YYYYMM format 202401', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 202401;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept valid YYYYMM format 202412', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 202412;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept historic date 199001', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 199001;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject month 00', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 202400;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject month 13', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 202413;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject future date', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 209912; // Far future
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject year before 1900', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 189912;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject invalid length (5 digits)', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 20241;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject invalid length (7 digits)', async () => {
    const dto = new TestDto();
    dto.fechaFabricacion = 2024011;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});
