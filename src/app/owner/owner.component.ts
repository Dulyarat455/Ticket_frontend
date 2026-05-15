import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type OwnerProjectStatus = 'Online' | 'Maintenance' | 'Offline';
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
type TicketStatus = 'Open' | 'In Progress' | 'Resolved';
type InchargeActionStatus = 'On Process' | 'Complete';

type OwnerProject = {
  id: number;
  name: string;
  module: string;
  status: OwnerProjectStatus;
  open: number;
  inProgress: number;
  resolved: number;
  color: 'blue' | 'purple' | 'orange' | 'green';
};

type OwnerTicket = {
  id: number;
  ticketNo: string;
  projectId: number;
  projectName: string;
  problem: string;
  requester: string;
  line: string;
  requestAt: string;
  priority: TicketPriority;
  status: TicketStatus;
};

type InchargeForm = {
  status: InchargeActionStatus;
  remarkToRequester: string;
  rootCause: string;
  actionTaken: string;
  expectedFinishDate: string;
  evidenceFileName: string;
};

@Component({
  selector: 'app-owner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner.component.html',
  styleUrl: './owner.component.css'
})
export class OwnerComponent {
  ownerName = 'MC Admin Team';
  ownerRole = 'Project Owner / Incharge';
  ownerEmail = 'mc-admin@company.local';

  selectedProjectId: number | 'all' = 'all';
  selectedTicket: OwnerTicket | null = null;

  inchargeForm: InchargeForm = this.getDefaultInchargeForm();

  projects: OwnerProject[] = [
    {
      id: 1,
      name: 'Material Control System',
      module: 'Material Store / Production Line',
      status: 'Online',
      open: 8,
      inProgress: 4,
      resolved: 82,
      color: 'blue'
    },
    {
      id: 2,
      name: 'PBASS Sync Monitor',
      module: 'PBASS / Stock In',
      status: 'Maintenance',
      open: 5,
      inProgress: 2,
      resolved: 24,
      color: 'orange'
    },
    {
      id: 3,
      name: 'Production Issue Request',
      module: 'Issue / Return / Stock Out',
      status: 'Online',
      open: 3,
      inProgress: 1,
      resolved: 18,
      color: 'green'
    }
  ];

  tickets: OwnerTicket[] = [
    {
      id: 1,
      ticketNo: 'TK-260513-001',
      projectId: 1,
      projectName: 'Material Control System',
      problem: 'Scan Job No แล้วข้อมูลไม่ขึ้นใน Return Stock In',
      requester: 'PD Line A',
      line: 'Line A-03',
      requestAt: '13 May 2026 08:42',
      priority: 'High',
      status: 'In Progress'
    },
    {
      id: 2,
      ticketNo: 'TK-260513-004',
      projectId: 1,
      projectName: 'Material Control System',
      problem: 'Stock Out กด Confirm แล้วไม่ update storage map',
      requester: 'MC Store',
      line: 'MC Store',
      requestAt: '13 May 2026 09:25',
      priority: 'Critical',
      status: 'Open'
    },
    {
      id: 3,
      ticketNo: 'TK-260513-002',
      projectId: 2,
      projectName: 'PBASS Sync Monitor',
      problem: 'Preview Data ใช้เวลานานผิดปกติ',
      requester: 'MC Store',
      line: 'Stock In',
      requestAt: '13 May 2026 09:18',
      priority: 'Medium',
      status: 'Open'
    },
    {
      id: 4,
      ticketNo: 'TK-260512-011',
      projectId: 3,
      projectName: 'Production Issue Request',
      problem: 'รายการ Request Queue ไม่ refresh หลัง MC confirm',
      requester: 'PD Group B',
      line: 'Production',
      requestAt: '12 May 2026 16:20',
      priority: 'Low',
      status: 'Resolved'
    }
  ];

  get totalOpen() {
    return this.projects.reduce((sum, p) => sum + p.open, 0);
  }

  get totalInProgress() {
    return this.projects.reduce((sum, p) => sum + p.inProgress, 0);
  }

  get totalResolved() {
    return this.projects.reduce((sum, p) => sum + p.resolved, 0);
  }

  get totalActiveTickets() {
    return this.totalOpen + this.totalInProgress;
  }

  get filteredTickets() {
    if (this.selectedProjectId === 'all') {
      return this.tickets;
    }

    return this.tickets.filter(t => t.projectId === this.selectedProjectId);
  }

  get currentViewName() {
    if (this.selectedProjectId === 'all') {
      return 'All Projects';
    }

    const project = this.projects.find(p => p.id === this.selectedProjectId);
    return project?.name || '-';
  }

  private getDefaultInchargeForm(): InchargeForm {
    return {
      status: 'On Process',
      remarkToRequester: '',
      rootCause: '',
      actionTaken: '',
      expectedFinishDate: '',
      evidenceFileName: ''
    };
  }

  selectProject(projectId: number | 'all') {
    this.selectedProjectId = projectId;

    if (
      this.selectedTicket &&
      projectId !== 'all' &&
      this.selectedTicket.projectId !== projectId
    ) {
      this.clearInchargeForm();
    }
  }

  getProjectActive(projectId: number | 'all') {
    return this.selectedProjectId === projectId;
  }

  openInchargeForm(ticket: OwnerTicket) {
    this.selectedTicket = ticket;

    this.inchargeForm = {
      status: ticket.status === 'Resolved' ? 'Complete' : 'On Process',
      remarkToRequester: '',
      rootCause: '',
      actionTaken: '',
      expectedFinishDate: '',
      evidenceFileName: ''
    };
  }

  clearInchargeForm() {
    this.selectedTicket = null;
    this.inchargeForm = this.getDefaultInchargeForm();
  }

  submitIncharge() {
    if (!this.selectedTicket) return;

    if (!this.inchargeForm.remarkToRequester.trim()) {
      alert('กรุณากรอก Remark to Requester');
      return;
    }

    if (this.inchargeForm.status === 'Complete' && !this.inchargeForm.actionTaken.trim()) {
      alert('กรุณากรอก Action Taken เมื่อเลือก Complete');
      return;
    }

    const body = {
      ticketId: this.selectedTicket.id,
      ticketNo: this.selectedTicket.ticketNo,
      status: this.inchargeForm.status,
      remarkToRequester: this.inchargeForm.remarkToRequester,
      rootCause: this.inchargeForm.rootCause,
      actionTaken: this.inchargeForm.actionTaken,
      expectedFinishDate: this.inchargeForm.expectedFinishDate,
      evidenceFileName: this.inchargeForm.evidenceFileName
    };

    console.log('Submit Incharge:', body);

    const foundTicket = this.tickets.find(t => t.id === this.selectedTicket?.id);

    if (foundTicket) {
      foundTicket.status = this.inchargeForm.status === 'Complete'
        ? 'Resolved'
        : 'In Progress';
    }

    this.clearInchargeForm();
  }

  getPriorityClass(priority: TicketPriority) {
    return priority.toLowerCase();
  }

  getStatusClass(status: TicketStatus) {
    return status.toLowerCase().replace(' ', '-');
  }

  getProjectStatusClass(status: OwnerProjectStatus) {
    return status.toLowerCase();
  }
}