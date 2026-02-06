import { validate } from 'class-validator';
import { IsDominio } from './is-dominio.validator';

class TestDto {
  @IsDominio()
  dominio: string;
}

describe('IsDominio', () => {
  it('should accept old format AAA999', async () => {
    const dto = new TestDto();
    dto.dominio = 'ABC123';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept new format AA999AA', async () => {
    const dto = new TestDto();
    dto.dominio = 'AB123CD';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid format', async () => {
    const dto = new TestDto();
    dto.dominio = 'INVALID';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.constraints?.['IsDominioConstraint']).toBeDefined();
  });

  it('should reject lowercase letters', async () => {
    const dto = new TestDto();
    dto.dominio = 'abc123';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject empty string', async () => {
    const dto = new TestDto();
    dto.dominio = '';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});
