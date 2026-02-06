import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { AutomotorFormComponent } from './automotor-form.component';
import { SujetoDialogComponent } from '../sujeto-dialog/sujeto-dialog.component';
import { AutomotorStateService } from '../../services/automotor-state.service';
import { SujetoService } from '../../services/sujeto.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getErrorMessageByCode } from '../../../../core/constants/error-messages';
import {
  CreateAutomotorRequest,
  UpdateAutomotorRequest,
} from '../../models/automotor.model';
import { CreateSujetoRequest } from '../../models/sujeto.model';

@Component({
  selector: 'app-automotor-form-page',
  standalone: true,
  imports: [ButtonModule, AutomotorFormComponent, SujetoDialogComponent],
  templateUrl: './automotor-form-page.component.html',
})
export class AutomotorFormPageComponent implements OnInit {
  protected readonly automotorState = inject(AutomotorStateService);
  private readonly sujetoService = inject(SujetoService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly _dominio = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _pendingCuit = signal('');
  private readonly _pendingRequest = signal<
    CreateAutomotorRequest | UpdateAutomotorRequest | null
  >(null);
  private readonly _creatingCuit = signal(false);
  private readonly _denominacionDueno = signal<string | null>(null);
  private readonly _loadingDueno = signal(false);

  readonly isEditMode = computed(() => this._dominio() !== null);
  readonly loading = computed(
    () => this._loading() || this.automotorState.loading(),
  );
  readonly pendingCuit = this._pendingCuit.asReadonly();
  readonly creatingCuit = this._creatingCuit.asReadonly();
  readonly denominacionDueno = this._denominacionDueno.asReadonly();
  readonly loadingDueno = this._loadingDueno.asReadonly();

  showSujetoDialog = false;

  ngOnInit(): void {
    const dominio = this.route.snapshot.paramMap.get('dominio');
    if (dominio) {
      this._dominio.set(dominio);
      this.automotorState.loadAutomotorByDominio(dominio).then(() => {
        const automotor = this.automotorState.selectedAutomotor();
        if (automotor?.duenoActual) {
          this._denominacionDueno.set(automotor.duenoActual.denominacion);
        }
      });
    } else {
      this.automotorState.clearSelectedAutomotor();
    }
  }

  async onCuitValidated(cuit: string): Promise<void> {
    this._loadingDueno.set(true);
    this._denominacionDueno.set(null);

    try {
      const sujeto = await firstValueFrom(this.sujetoService.getByCuit(cuit));
      this._denominacionDueno.set(sujeto.denominacion);
    } catch (error) {
      if (this.isSujetoNotFoundError(error)) {
        this._pendingCuit.set(cuit);
        this.showSujetoDialog = true;
      } else {
        this.notificationService.error('Error', this.getErrorMessage(error));
      }
    } finally {
      this._loadingDueno.set(false);
    }
  }

  async onSubmit(
    request: CreateAutomotorRequest | UpdateAutomotorRequest,
  ): Promise<void> {
    this._loading.set(true);

    try {
      if (this.isEditMode()) {
        await this.automotorState.updateAutomotor(
          this._dominio()!,
          request as UpdateAutomotorRequest,
        );
        this.router.navigate(['/automotores']);
      } else {
        await this.automotorState.createAutomotor(
          request as CreateAutomotorRequest,
        );
        this.router.navigate(['/automotores']);
      }
    } catch (error) {
      if (this.isSujetoNotFoundError(error)) {
        const cuit = 'cuitDueno' in request ? request.cuitDueno : undefined;
        if (cuit) {
          this._pendingCuit.set(cuit);
          this._pendingRequest.set(request);
          this.showSujetoDialog = true;
        }
      } else {
        this.notificationService.error('Error', this.getErrorMessage(error));
      }
    } finally {
      this._loading.set(false);
    }
  }

  async onSujetoCreated(request: CreateSujetoRequest): Promise<void> {
    this._creatingCuit.set(true);

    try {
      const sujeto = await firstValueFrom(this.sujetoService.create(request));
      this._denominacionDueno.set(sujeto.denominacion);
      this.notificationService.success(
        'Sujeto creado',
        'El sujeto fue creado exitosamente',
      );
      this.showSujetoDialog = false;

      const pendingRequest = this._pendingRequest();
      if (pendingRequest) {
        await this.onSubmit(pendingRequest);
      }
    } catch (error) {
      this.notificationService.error(
        'Error al crear sujeto',
        this.getErrorMessage(error),
      );
    } finally {
      this._creatingCuit.set(false);
      this._pendingRequest.set(null);
    }
  }

  onSujetoDialogCancelled(): void {
    this._pendingCuit.set('');
    this._pendingRequest.set(null);
  }

  goBack(): void {
    this.router.navigate(['/automotores']);
  }

  private isSujetoNotFoundError(error: unknown): boolean {
    if (error instanceof HttpErrorResponse) {
      return (
        error.status === 404 && error.error?.errorCode === 'SUJETO_NOT_FOUND'
      );
    }
    return false;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const errorCode = error.error?.errorCode ?? error.error?.error_code;
      return getErrorMessageByCode(errorCode);
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Ocurrió un error inesperado';
  }
}
