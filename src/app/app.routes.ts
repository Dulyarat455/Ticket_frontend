import { Routes } from '@angular/router';
import { SignInComponent } from './sign-in/sign-in.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { TicketCenterComponent } from './ticket-center/ticket-center.component';
import { OwnerComponent } from './owner/owner.component';

export const routes: Routes = [
  {
    path: '',
    component: SignInComponent,
  },

  {
    path: 'ticketCenter',
    component: TicketCenterComponent,
  },

  {
    path: 'owner',
    component: OwnerComponent,
  },

  {
    path: '404',
    component: NotFoundComponent,
  },
  {
    path: '**',
    redirectTo: '404',
  },

  // {
  //   path: '**',
  //   redirectTo: '',
  // },
];
