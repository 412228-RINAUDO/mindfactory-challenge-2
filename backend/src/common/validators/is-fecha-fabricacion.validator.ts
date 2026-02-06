import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsFechaFabricacionConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'number') return false;

    const strValue = value.toString();
    if (strValue.length !== 6) return false;

    const year = Math.floor(value / 100);
    const month = value % 100;

    // Year must be >= 1900
    if (year < 1900) return false;

    // Month must be 1-12
    if (month < 1 || month > 12) return false;

    // Cannot be in the future
    const now = new Date();
    const currentYYYYMM = now.getFullYear() * 100 + (now.getMonth() + 1);
    if (value > currentYYYYMM) return false;

    return true;
  }

  defaultMessage(): string {
    return 'Fecha fabricacion must be in YYYYMM format, with valid month (1-12), and not in the future';
  }
}

export function IsFechaFabricacion(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [],
      validator: IsFechaFabricacionConstraint,
    });
  };
}
