import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const DOMINIO_PATTERN = /^[A-Z]{3}[0-9]{3}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;

export function dominioValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = String(control.value).toUpperCase();
    const isValid = DOMINIO_PATTERN.test(value);

    return isValid
      ? null
      : { dominio: { message: 'Formato inválido. Use AAA999 o AA999AA' } };
  };
}
