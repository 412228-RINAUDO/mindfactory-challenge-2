import { validate } from 'class-validator';
import { IsCuit } from './is-cuit.validator';

class TestDto {
  @IsCuit()
  cuit: string;
}

describe('IsCuit', () => {
  // Valid CUITs (calculated with module 11 algorithm)
  it('should accept valid CUIT 20123456786', async () => {
    const dto = new TestDto();
    dto.cuit = '20123456786';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept valid CUIT 27123456780', async () => {
    const dto = new TestDto();
    dto.cuit = '27123456780';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept valid CUIT 30715116886', async () => {
    const dto = new TestDto();
    dto.cuit = '30715116886';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  // Invalid CUITs
  it('should reject CUIT with wrong check digit', async () => {
    const dto = new TestDto();
    dto.cuit = '20123456780'; // Wrong check digit (should be 6)
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject CUIT with less than 11 digits', async () => {
    const dto = new TestDto();
    dto.cuit = '2030495852';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject CUIT with more than 11 digits', async () => {
    const dto = new TestDto();
    dto.cuit = '203049585251';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject CUIT with non-numeric characters', async () => {
    const dto = new TestDto();
    dto.cuit = '20-30495852-5';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });

  it('should reject empty string', async () => {
    const dto = new TestDto();
    dto.cuit = '';
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
  });
});
