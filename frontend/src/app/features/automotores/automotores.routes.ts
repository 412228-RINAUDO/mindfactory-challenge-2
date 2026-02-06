import { Routes } from '@angular/router';

export const AUTOMOTORES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/automotor-list/automotor-list-page.component').then(
        (m) => m.AutomotorListPageComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/automotor-form/automotor-form-page.component').then(
        (m) => m.AutomotorFormPageComponent,
      ),
  },
  {
    path: ':dominio/edit',
    loadComponent: () =>
      import('./components/automotor-form/automotor-form-page.component').then(
        (m) => m.AutomotorFormPageComponent,
      ),
  },
];
