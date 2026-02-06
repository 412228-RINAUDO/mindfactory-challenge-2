import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AutomotorService } from './automotor.service';
import {
  AutomotorListItem,
  AutomotorDetail,
  CreateAutomotorRequest,
  UpdateAutomotorRequest,
} from '../models/automotor.model';
import { NotificationService } from '../../../core/services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AutomotorStateService {
  private readonly automotorService = inject(AutomotorService);
  private readonly notificationService = inject(NotificationService);

  private readonly _automotores = signal<AutomotorListItem[]>([]);
  private readonly _selectedAutomotor = signal<AutomotorDetail | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly automotores = this._automotores.asReadonly();
  readonly selectedAutomotor = this._selectedAutomotor.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly automotorCount = computed(() => this._automotores().length);

  async loadAutomotores(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const automotores = await firstValueFrom(this.automotorService.getAll());
      this._automotores.set(automotores);
    } catch (error) {
      this._error.set(this.getErrorMessage(error));
    } finally {
      this._loading.set(false);
    }
  }

  async loadAutomotorByDominio(
    dominio: string,
  ): Promise<AutomotorDetail | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const automotor = await firstValueFrom(
        this.automotorService.getByDominio(dominio),
      );
      this._selectedAutomotor.set(automotor);
      return automotor;
    } catch (error) {
      this._error.set(this.getErrorMessage(error));
      this._selectedAutomotor.set(null);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async createAutomotor(
    request: CreateAutomotorRequest,
  ): Promise<AutomotorDetail | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const automotor = await firstValueFrom(
        this.automotorService.create(request),
      );
      this.notificationService.success(
        'Automotor creado',
        `El vehículo ${automotor.dominio} fue creado exitosamente`,
      );
      await this.loadAutomotores();
      return automotor;
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async updateAutomotor(
    dominio: string,
    request: UpdateAutomotorRequest,
  ): Promise<AutomotorDetail | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const automotor = await firstValueFrom(
        this.automotorService.update(dominio, request),
      );
      this.notificationService.success(
        'Automotor actualizado',
        `El vehículo ${dominio} fue actualizado exitosamente`,
      );
      await this.loadAutomotores();
      return automotor;
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async deleteAutomotor(dominio: string): Promise<boolean> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.automotorService.delete(dominio));
      this.notificationService.success(
        'Automotor eliminado',
        `El vehículo ${dominio} fue eliminado exitosamente`,
      );
      await this.loadAutomotores();
      return true;
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      this.notificationService.error('Error al eliminar', message);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  clearSelectedAutomotor(): void {
    this._selectedAutomotor.set(null);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.error?.message) {
        return error.error.message;
      }
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Ocurrió un error inesperado';
  }
}
