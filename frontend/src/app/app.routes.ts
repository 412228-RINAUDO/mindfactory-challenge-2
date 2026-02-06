import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'automotores',
    pathMatch: 'full',
  },
  {
    path: 'automotores',
    loadChildren: () =>
      import('./features/automotores/automotores.routes').then(
        (m) => m.AUTOMOTORES_ROUTES,
      ),
  },
];
