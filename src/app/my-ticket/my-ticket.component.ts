import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

import config from '../../config';

type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Deny';

type TicketAttachment = {
  id: number;
  fileName: string;
  fileUrl: string;
  timeStmp?: string;
};

type TicketHistory = {
  id: number;
  ticketId: number;
  state: string;
  inchargeById?: number | null;
  inchargeByName?: string;
  inchargeByEmpNo?: string;
  inchargeByDisplay?: string;
  remark?: string;
  timeStmp: string;
};

type ApiRequestTicketRow = {
  id: number;
  ticketNo: string;

  projectId: number;
  projectName: string;
  projectDescription?: string;

  projectOwnerId?: number | null;
  projectOwnerName?: string;
  projectOwnerEmpNo?: string;
  projectOwnerDisplay?: string;
  projectEmail?: string;
  projectPhone?: string;

  area: string;
  contact: string;
  problemTitle: string;
  problemDetail: string;
  priority: TicketPriority;
  reply?: string;

  state: string;
  ticketStatusId?: number | null;

  requestById: number;
  requestByName: string;
  requestByEmpNo: string;
  requestByDisplay: string;
  requestAt: string;

  inchargeById?: number | null;
  inchargeByName?: string;
  inchargeByEmpNo?: string;
  inchargeByDisplay?: string;

  attachments: TicketAttachment[];
  histories: TicketHistory[];
};

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
  rawState: string;

  owner: string;
  ownerRemark?: string;

  contact?: string;
  updatedAt?: string;

  expectedFinishDate?: string;
  rootCause?: string;
  actionTaken?: string;

  inchargeBy?: string;
  attachments: TicketAttachment[];
  histories: TicketHistory[];
};

@Component({
  selector: 'app-my-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-ticket.component.html',
  styleUrl: './my-ticket.component.css'
})
export class MyTicketComponent implements OnInit {
  constructor(private http: HttpClient) {}

  config = config;

  requesterName = '-';
  requesterGroup = 'Production User';

  token: string | undefined = '';
  name: string | undefined = '';
  empNo: string | undefined = '';
  userId: number | null = null;

  searchText = '';
  statusFilter: TicketStatus | 'All' = 'All';

  selectedTicket: MyTicket | null = null;

  isLoadingTickets = false;

  tickets: MyTicket[] = [];

  ngOnInit() {
    this.token = localStorage.getItem('ticketPress_token') || '';
    this.name = localStorage.getItem('ticketPress_name') || '';
    this.empNo = localStorage.getItem('ticketPress_empNo') || '';

    this.userId =
      Number(localStorage.getItem('ticketPress_id')) ||
      Number(localStorage.getItem('ticketPress_userId')) ||
      null;

    this.requesterName =
      this.name && this.empNo
        ? `${this.name} [${this.empNo}]`
        : this.name || '-';

    this.fetchRequestTickets();
  }

  fetchRequestTickets() {
    if (!this.userId) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing User',
        text: 'ไม่พบ userId กรุณา login ใหม่'
      });
      return;
    }

    this.isLoadingTickets = true;

    const body = {
      userId: this.userId
    };

    this.http.post<any>(`${config.apiServer}/api/ticket/requestTicket`, body).subscribe({
      next: (res) => {
        const requester = res.requester;

        if (requester?.display) {
          this.requesterName = requester.display;
        }

        const rows: ApiRequestTicketRow[] = res.results || [];

        this.tickets = rows.map((item) => this.mapApiTicketToMyTicket(item));

        if (
          this.selectedTicket &&
          !this.tickets.some(t => t.id === this.selectedTicket?.id)
        ) {
          this.selectedTicket = null;
        }

        if (!this.selectedTicket && this.tickets.length > 0) {
          this.selectedTicket = this.tickets[0];
        }
      },
      error: (err) => {
        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Load My Ticket Failed',
          text:
            err.error?.message ||
            err.error?.error ||
            'ไม่สามารถโหลด Ticket ของคุณได้'
        });
      },
      complete: () => {
        this.isLoadingTickets = false;
      }
    });
  }

  private mapApiTicketToMyTicket(item: ApiRequestTicketRow): MyTicket {
    const latestHistory = item.histories?.length
      ? item.histories[item.histories.length - 1]
      : null;

    return {
      id: Number(item.id),
  ticketNo: item.ticketNo || '-',
  projectName: item.projectName || '-',

  problem: item.problemTitle || '-',
  detail: item.problemDetail || '-',

  requester: item.requestByDisplay || '-',
  line: item.area || '-',
  requestAt: item.requestAt
    ? this.formatRequestDate(new Date(item.requestAt))
    : '-',

  priority: (item.priority || 'Medium') as TicketPriority,
  status: this.mapTicketStatus(item.state),
  rawState: item.state || 'wait',

  owner: item.projectOwnerDisplay || item.inchargeByDisplay || '-',
  ownerRemark: item.reply || latestHistory?.remark || '',

  contact: item.contact || '',
  updatedAt: latestHistory?.timeStmp
    ? this.formatRequestDate(new Date(latestHistory.timeStmp))
    : '',

  expectedFinishDate: '',
  rootCause: '',
  actionTaken: '',

  inchargeBy: item.inchargeByDisplay || '-',

  attachments: item.attachments || [],
  histories: (item.histories || []).map(h => ({
    id: Number(h.id),
    ticketId: Number(h.ticketId),
    state: h.state || '-',
    inchargeById: h.inchargeById || null,
    inchargeByName: h.inchargeByName || '',
    inchargeByEmpNo: h.inchargeByEmpNo || '',
    inchargeByDisplay: h.inchargeByDisplay || '-',
    remark: h.remark || '',
    timeStmp: h.timeStmp
      ? this.formatRequestDate(new Date(h.timeStmp))
      : '-'
  }))
    };
  }

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

  get totalDeny() {
    return this.tickets.filter(t => t.status === 'Deny').length;
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
        ticket.detail.toLowerCase().includes(keyword) ||
        ticket.owner.toLowerCase().includes(keyword) ||
        ticket.line.toLowerCase().includes(keyword);

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
    return String(priority || '').toLowerCase();
  }

  getStatusClass(status: TicketStatus | string) {
    const value = String(status || '').toLowerCase();

    if (value === 'open' || value === 'wait') return 'open';
    if (value === 'in progress' || value === 'onprocess') return 'in-progress';
    if (value === 'resolved' || value === 'complete') return 'resolved';
    if (value === 'deny') return 'deny';

    return value.replaceAll(' ', '-');
  }

  getProgressPercent(status: TicketStatus | string) {
    const value = this.normalizeState(status);

    if (value === 'open' || value === 'wait') return 25;
    if (value === 'inprogress' || value === 'onprocess') return 65;
    if (value === 'resolved' || value === 'complete') return 100;
    if (value === 'deny') return 100;

    return 0;
  }


  openAttachment(file: TicketAttachment) {
    const imageUrl = `${this.config.apiServer}${file.fileUrl}`;
  
    Swal.fire({
      width: 900,
      showConfirmButton: true,
      confirmButtonText: 'Close',
      buttonsStyling: false,
      customClass: {
        popup: 'attachment-popup',
        confirmButton: 'attachment-confirm'
      },
      html: `
        <style>
          .attachment-popup {
            border-radius: 24px !important;
            padding: 22px 0 !important;
            overflow: hidden;
          }
  
          .attachment-confirm {
            border-radius: 14px !important;
            background: linear-gradient(135deg, #2563eb, #0891b2) !important;
            color: #ffffff !important;
            font-weight: 950 !important;
            padding: 11px 24px !important;
            border: 0 !important;
          }
  
          .attachment-preview-wrap {
            padding: 8px 28px 4px;
            text-align: center;
          }
  
          .attachment-preview-img {
            width: 100%;
            max-height: 72vh;
            object-fit: contain;
            border-radius: 18px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
          }
  
          .attachment-file-name {
            margin-top: 12px;
            color: #475569;
            font-size: 13px;
            font-weight: 850;
            word-break: break-all;
          }
        </style>
  
        <div class="attachment-preview-wrap">
          <img
            src="${this.escapeHtml(imageUrl)}"
            class="attachment-preview-img"
            alt="${this.escapeHtml(file.fileName || 'Attachment')}"
          />
  
          <div class="attachment-file-name">
            ${this.escapeHtml(file.fileName || '-')}
          </div>
        </div>
      `
    });
  }



  private escapeHtml(value: string) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }



  private mapTicketStatus(state: string): TicketStatus {
    const value = this.normalizeState(state);

    if (value === 'wait') return 'Open';
    if (value === 'onprocess') return 'In Progress';
    if (value === 'complete') return 'Resolved';
    if (value === 'deny') return 'Deny';

    return 'Open';
  }

  private normalizeState(state: string | undefined | null) {
    return String(state || '')
      .toLowerCase()
      .replaceAll(' ', '')
      .replaceAll('-', '');
  }

  private formatRequestDate(date: Date) {
    if (!date || Number.isNaN(date.getTime())) return '-';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hh}:${mm}`;
  }
}