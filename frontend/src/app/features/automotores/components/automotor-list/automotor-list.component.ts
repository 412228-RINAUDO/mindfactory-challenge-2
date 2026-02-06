import { Component, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { AutomotorListItem } from '../../models/automotor.model';

@Component({
  selector: 'app-automotor-list',
  standalone: true,
  imports: [TableModule, ButtonModule, Tooltip],
  templateUrl: './automotor-list.component.html',
})
export class AutomotorListComponent {
  readonly automotores = input.required<AutomotorListItem[]>();
  readonly loading = input(false);

  readonly edit = output<AutomotorListItem>();
  readonly delete = output<AutomotorListItem>();

  formatFechaFabricacion(fecha: number): string {
    const str = String(fecha);
    if (str.length !== 6) return str;
    return `${str.substring(4, 6)}/${str.substring(0, 4)}`;
  }
}
