import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function fechaFabricacionValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = String(control.value);

    if (!/^\d{6}$/.test(value)) {
      return {
        fechaFabricacion: {
          message: 'Formato inválido. Use AAAAMM (ej: 202401)',
        },
      };
    }

    const year = parseInt(value.substring(0, 4), 10);
    const month = parseInt(value.substring(4, 6), 10);

    if (year < 1900) {
      return {
        fechaFabricacion: { message: 'El año debe ser mayor o igual a 1900' },
      };
    }

    if (month < 1 || month > 12) {
      return {
        fechaFabricacion: { message: 'El mes debe estar entre 01 y 12' },
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      return { fechaFabricacion: { message: 'La fecha no puede ser futura' } };
    }

    return null;
  };
}
