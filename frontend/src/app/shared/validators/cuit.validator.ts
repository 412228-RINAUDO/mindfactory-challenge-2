import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

function isValidCuitCheckDigit(cuit: string): boolean {
  const coefficients = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cuit[i], 10) * coefficients[i];
  }

  let checkDigit = 11 - (sum % 11);
  if (checkDigit === 11) checkDigit = 0;
  if (checkDigit === 10) checkDigit = 9;

  return checkDigit === parseInt(cuit[10], 10);
}

export function cuitValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = String(control.value).replace(/\D/g, '');

    if (value.length !== 11) {
      return { cuit: { message: 'El CUIT debe tener 11 dígitos' } };
    }

    if (!isValidCuitCheckDigit(value)) {
      return {
        cuit: {
          message: 'El CUIT no es válido (dígito verificador incorrecto)',
        },
      };
    }

    return null;
  };
}
