import {
  Component,
  inject,
  model,
  input,
  output,
  OnChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { Message } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { CreateSujetoRequest } from '../../models/sujeto.model';

@Component({
  selector: 'app-sujeto-dialog',
  standalone: true,
  imports: [
    DialogModule,
    ReactiveFormsModule,
    InputTextModule,
    FloatLabel,
    Message,
    ButtonModule,
  ],
  templateUrl: './sujeto-dialog.component.html',
})
export class SujetoDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly visible = model(false);
  readonly cuit = input('');
  readonly loading = input(false);

  readonly created = output<CreateSujetoRequest>();
  readonly cancelled = output<void>();

  form: FormGroup = this.fb.group({
    cuit: [{ value: '', disabled: true }],
    denominacion: ['', [Validators.required, Validators.maxLength(160)]],
  });

  ngOnChanges(): void {
    this.form.patchValue({ cuit: this.cuit() });
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

    return 'Campo inválido';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request: CreateSujetoRequest = {
      cuit: this.cuit(),
      denominacion: this.form.get('denominacion')?.value,
    };
    this.created.emit(request);
  }

  onCancel(): void {
    this.visible.set(false);
    this.form.reset();
    this.cancelled.emit();
  }
}
