import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type ProjectStatus = 'Online' | 'Maintenance' | 'Offline';

type TicketProject = {
  id: number;
  name: string;
  subtitle: string;
  owner: string;
  ownerEmail: string;
  status: ProjectStatus;
  icon: string;
  color: 'blue' | 'purple' | 'orange' | 'green';
};


type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
type TicketStatus = 'Open' | 'In Progress' | 'Resolved';

type TicketRow = {
  ticketNo: string;
  project: string;
  line: string;
  problem: string;
  requester: string;
  requestAt: string;
  priority: TicketPriority;
  status: TicketStatus;
  owner: string;
};

@Component({
  selector: 'app-ticket-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-center.component.html',
  styleUrl: './ticket-center.component.css'
})
export class TicketCenterComponent {
  projects: TicketProject[] = [
    {
      id: 1,
      name: 'Material Control System',
      subtitle: 'Material Store / Production Line',
      owner: 'MC Admin Team',
      ownerEmail: 'mc-admin@company.local',
      status: 'Online',
      icon: '🛡️',
      color: 'blue'
    },
    {
      id: 2,
      name: 'Plating Report System',
      subtitle: 'Plating Line',
      owner: 'Plating IT Support',
      ownerEmail: 'plating-support@company.local',
      status: 'Online',
      icon: '🛡️',
      color: 'purple'
    },
    {
      id: 3,
      name: 'PBASS Sync Monitor',
      subtitle: 'PBASS / Stock In',
      owner: 'PBASS Support Team',
      ownerEmail: 'pbass-support@company.local',
      status: 'Maintenance',
      icon: '🛡️',
      color: 'orange'
    },
    {
      id: 4,
      name: 'Production Issue Request',
      subtitle: 'Line Request / Stock Out',
      owner: 'Production System Owner',
      ownerEmail: 'production-owner@company.local',
      status: 'Online',
      icon: '🛡️',
      color: 'green'
    }
  ];


  tickets: TicketRow[] = [
    {
      ticketNo: 'TK-260513-001',
      project: 'Material Control System',
      line: 'Line A-03',
      problem: 'Scan Job No แล้วข้อมูลไม่ขึ้นใน Return Stock In',
      requester: 'PD Line A',
      requestAt: '13 May 2026 08:42',
      priority: 'High',
      status: 'In Progress',
      owner: 'MC Admin Team'
    },
    {
      ticketNo: 'TK-260513-002',
      project: 'PBASS Sync Monitor',
      line: 'Stock In',
      problem: 'Preview Data ใช้เวลานานผิดปกติ',
      requester: 'MC Store',
      requestAt: '13 May 2026 09:18',
      priority: 'Medium',
      status: 'Open',
      owner: 'ERP Interface Team'
    },
    {
      ticketNo: 'TK-260512-009',
      project: 'Plating Report System',
      line: 'Plating B',
      problem: 'Export Excel แล้ว column controlLotR ไม่แสดง',
      requester: 'QA Plating',
      requestAt: '12 May 2026 15:11',
      priority: 'Low',
      status: 'Resolved',
      owner: 'Plating IT Support'
    },
    {
      ticketNo: 'TK-260513-004',
      project: 'Material Control System',
      line: 'MC Store',
      problem: 'Stock Out กด Confirm แล้วไม่ update storage map',
      requester: 'MC Store',
      requestAt: '13 May 2026 09:25',
      priority: 'Critical',
      status: 'Open',
      owner: 'MC Admin Team'
    }
  ];
  
  getPriorityClass(priority: TicketPriority) {
    return priority.toLowerCase();
  }
  
  getTicketStatusClass(status: TicketStatus) {
    return status.toLowerCase().replace(' ', '-');
  }

  selectedProject: TicketProject = this.projects[0];

  stats = {
    open: 18,
    inProgress: 7,
    resolved: 124
  };

  selectProject(project: TicketProject) {
    this.selectedProject = project;
  }

  getStatusClass(status: ProjectStatus) {
    return status.toLowerCase();
  }

  createTicket() {
    console.log('Create ticket for:', this.selectedProject);
    // ต่อไปค่อย route ไปหน้า create ticket ได้ เช่น
    // this.router.navigate(['/ticket-create', this.selectedProject.id]);
  }
}