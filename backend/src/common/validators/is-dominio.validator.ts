import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsDominioConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    // Old format: AAA999 | New format: AA999AA
    const regex = /^[A-Z]{3}[0-9]{3}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
    return regex.test(value);
  }

  defaultMessage(): string {
    return 'Dominio must be in format AAA999 or AA999AA';
  }
}

export function IsDominio(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [],
      validator: IsDominioConstraint,
    });
  };
}
