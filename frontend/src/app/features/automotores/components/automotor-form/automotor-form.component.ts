import {
  Component,
  input,
  output,
  OnInit,
  inject,
  effect,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputMask } from 'primeng/inputmask';
import { FloatLabel } from 'primeng/floatlabel';
import { Message } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';
import {
  AutomotorDetail,
  CreateAutomotorRequest,
  UpdateAutomotorRequest,
} from '../../models/automotor.model';
import { dominioValidator } from '../../../../shared/validators/dominio.validator';
import { cuitValidator } from '../../../../shared/validators/cuit.validator';
import { fechaFabricacionValidator } from '../../../../shared/validators/fecha-fabricacion.validator';

export interface AutomotorFormData {
  dominio: string;
  numeroChasis: string;
  numeroMotor: string;
  color: string;
  fechaFabricacion: string;
  cuitDueno: string;
}

@Component({
  selector: 'app-automotor-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    InputMask,
    FloatLabel,
    Message,
    ButtonModule,
    ProgressSpinner,
  ],
  templateUrl: './automotor-form.component.html',
})
export class AutomotorFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly automotor = input<AutomotorDetail | null>(null);
  readonly isEditMode = input(false);
  readonly loading = input(false);
  readonly denominacionDueno = input<string | null>(null);
  readonly loadingDueno = input(false);

  readonly submitted = output<
    CreateAutomotorRequest | UpdateAutomotorRequest
  >();
  readonly cancelled = output<void>();
  readonly cuitValidated = output<string>();

  form!: FormGroup;

  constructor() {
    effect(() => {
      const automotor = this.automotor();
      if (automotor && this.form) {
        this.patchForm(automotor);
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      dominio: ['', [Validators.required, dominioValidator()]],
      numeroChasis: ['', [Validators.maxLength(25)]],
      numeroMotor: ['', [Validators.maxLength(25)]],
      color: ['', [Validators.maxLength(40)]],
      fechaFabricacion: [
        '',
        [Validators.required, fechaFabricacionValidator()],
      ],
      cuitDueno: ['', [Validators.required, cuitValidator()]],
    });
  }

  private patchForm(automotor: AutomotorDetail): void {
    this.form.patchValue({
      dominio: automotor.dominio,
      numeroChasis: automotor.numeroChasis ?? '',
      numeroMotor: automotor.numeroMotor ?? '',
      color: automotor.color ?? '',
      fechaFabricacion: String(automotor.fechaFabricacion),
      cuitDueno: automotor.duenoActual?.cuit ?? '',
    });
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['maxlength'])
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['dominio']) return control.errors['dominio'].message;
    if (control.errors['cuit']) return control.errors['cuit'].message;
    if (control.errors['fechaFabricacion'])
      return control.errors['fechaFabricacion'].message;

    return 'Campo inválido';
  }

  onCuitBlur(): void {
    const cuitControl = this.form.get('cuitDueno');
    if (cuitControl?.valid && cuitControl.value) {
      // Remove dashes from masked input (99-99999999-9 -> 99999999999)
      const rawCuit = cuitControl.value.replace(/-/g, '');
      this.cuitValidated.emit(rawCuit);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value as AutomotorFormData;
    // Remove dashes from masked CUIT input (99-99999999-9 -> 99999999999)
    const rawCuit = formValue.cuitDueno.replace(/-/g, '');

    if (this.isEditMode()) {
      const request: UpdateAutomotorRequest = {
        numeroChasis: formValue.numeroChasis || undefined,
        numeroMotor: formValue.numeroMotor || undefined,
        color: formValue.color || undefined,
        fechaFabricacion: parseInt(formValue.fechaFabricacion, 10),
        cuitDueno: rawCuit,
      };
      this.submitted.emit(request);
    } else {
      const request: CreateAutomotorRequest = {
        dominio: formValue.dominio.toUpperCase(),
        numeroChasis: formValue.numeroChasis || undefined,
        numeroMotor: formValue.numeroMotor || undefined,
        color: formValue.color || undefined,
        fechaFabricacion: parseInt(formValue.fechaFabricacion, 10),
        cuitDueno: rawCuit,
      };
      this.submitted.emit(request);
    }
  }
}
