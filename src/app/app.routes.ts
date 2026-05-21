import { Routes } from '@angular/router';
import { SignInComponent } from './sign-in/sign-in.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { TicketCenterComponent } from './ticket-center/ticket-center.component';
import { OwnerComponent } from './owner/owner.component';
import { MyTicketComponent } from './my-ticket/my-ticket.component';
import { ProjectComponent } from './project/project.component';

export const routes: Routes = [
  {
    path: '',
    component: TicketCenterComponent,
  },
  {
    path: 'signIn',
    component: SignInComponent
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
    path: 'myTicket',
    component: MyTicketComponent,
  },
  {
    path: 'project',
    component: ProjectComponent,
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
