import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AutomotorListComponent } from './automotor-list.component';
import { AutomotorStateService } from '../../services/automotor-state.service';
import { AutomotorListItem } from '../../models/automotor.model';

@Component({
  selector: 'app-automotor-list-page',
  standalone: true,
  imports: [ButtonModule, ConfirmDialogModule, AutomotorListComponent],
  providers: [ConfirmationService],
  templateUrl: './automotor-list-page.component.html',
})
export class AutomotorListPageComponent implements OnInit {
  protected readonly automotorState = inject(AutomotorStateService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  ngOnInit(): void {
    this.automotorState.loadAutomotores();
  }

  onCreate(): void {
    this.router.navigate(['/automotores', 'new']);
  }

  onEdit(automotor: AutomotorListItem): void {
    this.router.navigate(['/automotores', automotor.dominio, 'edit']);
  }

  onDelete(automotor: AutomotorListItem): void {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el automotor ${automotor.dominio}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Eliminar',
        severity: 'danger',
      },
      accept: () => {
        this.automotorState.deleteAutomotor(automotor.dominio);
      },
    });
  }
}
