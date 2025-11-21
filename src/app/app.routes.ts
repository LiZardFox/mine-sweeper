import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Mine Sweeper',
    loadComponent: () => import('./mine-sweeper/mine-sweeper'),
  },
];
