import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
type TicketStatus = 'Open' | 'In Progress' | 'Resolved';

type MyTicket = {
  id: number;
  ticketNo: string;
  projectName: string;
  problem: string;
  detail: string;
  requester: string;
  line: string;
  requestAt: string;
  priority: TicketPriority;
  status: TicketStatus;
  owner: string;
  ownerRemark?: string;
  rootCause?: string;
  actionTaken?: string;
  expectedFinishDate?: string;
  updatedAt?: string;
};

@Component({
  selector: 'app-my-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-ticket.component.html',
  styleUrl: './my-ticket.component.css'
})
export class MyTicketComponent {
  requesterName = 'PD Line A';
  requesterGroup = 'Production User';

  searchText = '';
  statusFilter: TicketStatus | 'All' = 'All';

  selectedTicket: MyTicket | null = null;

  tickets: MyTicket[] = [
    {
      id: 1,
      ticketNo: 'TK-260513-001',
      projectName: 'Material Control System',
      problem: 'Scan Job No แล้วข้อมูลไม่ขึ้นใน Return Stock In',
      detail: 'หลังจาก scan Job No Incoming แล้วระบบไม่ดึงข้อมูล Material มาแสดง ต้องการให้ MC ตรวจสอบ',
      requester: 'PD Line A',
      line: 'Line A-03',
      requestAt: '13 May 2026 08:42',
      priority: 'High',
      status: 'In Progress',
      owner: 'MC Admin Team',
      ownerRemark: 'รับเรื่องแล้ว กำลังตรวจสอบ flow การ fetch incoming จาก TransactionStoreHistory',
      rootCause: 'อยู่ระหว่างตรวจสอบ',
      actionTaken: 'ตรวจสอบ API และข้อมูล Job No ที่ production scan เข้ามา',
      expectedFinishDate: '2026-05-14',
      updatedAt: '13 May 2026 10:20'
    },
    {
      id: 2,
      ticketNo: 'TK-260513-005',
      projectName: 'PBASS Sync Monitor',
      problem: 'Preview Data ใช้เวลานานผิดปกติ',
      detail: 'กด Preview Data แล้วใช้เวลานานมาก บางครั้ง timeout',
      requester: 'PD Line A',
      line: 'Stock In',
      requestAt: '13 May 2026 09:18',
      priority: 'Medium',
      status: 'Open',
      owner: 'ERP Interface Team',
      ownerRemark: '',
      updatedAt: ''
    },
    {
      id: 3,
      ticketNo: 'TK-260512-009',
      projectName: 'Plating Report System',
      problem: 'Export Excel แล้ว column controlLotR ไม่แสดง',
      detail: 'ต้องการ export excel แล้วมี controlLotR แสดงในรายงาน',
      requester: 'PD Line A',
      line: 'Plating B',
      requestAt: '12 May 2026 15:11',
      priority: 'Low',
      status: 'Resolved',
      owner: 'Plating IT Support',
      ownerRemark: 'แก้ไขเรียบร้อยแล้ว เพิ่ม field controlLotR ใน backend และ frontend export',
      rootCause: 'ไม่ได้ map field controlLotR ใน response export',
      actionTaken: 'เพิ่ม select field และเพิ่ม column ใน Excel export',
      updatedAt: '12 May 2026 17:02'
    },
    {
      id: 4,
      ticketNo: 'TK-260513-007',
      projectName: 'Material Control System',
      problem: 'Stock Out กด Confirm แล้วไม่ update storage map',
      detail: 'หลัง confirm stock out แล้วข้อมูลใน storage map ยังไม่ refresh ต้องกด reload หน้าเอง',
      requester: 'PD Line A',
      line: 'MC Store',
      requestAt: '13 May 2026 09:25',
      priority: 'Critical',
      status: 'In Progress',
      owner: 'MC Admin Team',
      ownerRemark: 'กำลังตรวจสอบ socket event materialStore:changed',
      rootCause: 'คาดว่า socket ไม่ trigger หลัง stock out สำเร็จ',
      actionTaken: 'ตรวจสอบ backend emit และ frontend listener',
      expectedFinishDate: '2026-05-13',
      updatedAt: '13 May 2026 11:05'
    }
  ];

  get totalTickets() {
    return this.tickets.length;
  }

  get totalOpen() {
    return this.tickets.filter(t => t.status === 'Open').length;
  }

  get totalInProgress() {
    return this.tickets.filter(t => t.status === 'In Progress').length;
  }

  get totalResolved() {
    return this.tickets.filter(t => t.status === 'Resolved').length;
  }

  get filteredTickets() {
    const keyword = this.searchText.trim().toLowerCase();

    return this.tickets.filter(ticket => {
      const matchStatus =
        this.statusFilter === 'All' || ticket.status === this.statusFilter;

      const matchKeyword =
        !keyword ||
        ticket.ticketNo.toLowerCase().includes(keyword) ||
        ticket.projectName.toLowerCase().includes(keyword) ||
        ticket.problem.toLowerCase().includes(keyword) ||
        ticket.owner.toLowerCase().includes(keyword);

      return matchStatus && matchKeyword;
    });
  }

  selectTicket(ticket: MyTicket) {
    this.selectedTicket = ticket;
  }

  clearSelectedTicket() {
    this.selectedTicket = null;
  }

  setStatusFilter(status: TicketStatus | 'All') {
    this.statusFilter = status;
  }

  clearFilter() {
    this.searchText = '';
    this.statusFilter = 'All';
  }

  getPriorityClass(priority: TicketPriority) {
    return priority.toLowerCase();
  }

  getStatusClass(status: TicketStatus) {
    return status.toLowerCase().replace(' ', '-');
  }

  getProgressPercent(status: TicketStatus) {
    if (status === 'Open') return 25;
    if (status === 'In Progress') return 65;
    return 100;
  }
}