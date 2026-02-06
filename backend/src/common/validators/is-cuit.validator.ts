import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsCuitConstraint implements ValidatorConstraintInterface {
  private readonly COEFFICIENTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    if (value.length !== 11) return false;
    if (!/^[0-9]{11}$/.test(value)) return false;

    // Module 11 algorithm from XML
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      const digit = parseInt(value[i]!, 10);
      sum += digit * this.COEFFICIENTS[i]!;
    }

    let checkDigit = 11 - (sum % 11);
    if (checkDigit === 11) checkDigit = 0;
    if (checkDigit === 10) checkDigit = 9;

    return checkDigit === parseInt(value[10]!, 10);
  }

  defaultMessage(): string {
    return 'CUIT is invalid';
  }
}

export function IsCuit(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCuitConstraint,
    });
  };
}
