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


  getStatusDisplay(status: TicketStatus | string) {
    const value = this.normalizeState(status);
  
    if (value === 'open' || value === 'wait') return 'Wait';
    if (value === 'inprogress' || value === 'onprocess') return 'On Process';
    if (value === 'resolved' || value === 'complete') return 'Complete';
    if (value === 'deny') return 'Deny';
  
    return String(status || '-');
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






  openTicketTimeline(ticket: MyTicket) {
    const historyHtml = ticket.histories.length
      ? ticket.histories.map(h => {
          const stateClass = this.getHistoryStateClass(h.state);
          const stateLabel = this.getHistoryStateLabel(h.state);
  
          return `
            <div class="my-history-item">
              <div class="my-history-dot ${stateClass}"></div>
  
              <div class="my-history-content">
                <div>
                  <span class="my-history-state ${stateClass}">
                    ${this.escapeHtml(stateLabel)}
                  </span>
                </div>
  
                <div class="my-history-by">
                  By: ${this.escapeHtml(h.inchargeByDisplay || '-')}
                </div>
  
                ${
                  h.remark
                    ? `
                      <div class="my-history-remark ${stateClass}">
                        ${this.escapeHtml(h.remark)}
                      </div>
                    `
                    : ''
                }
  
                <div class="my-history-time">
                  ${this.escapeHtml(h.timeStmp || '-')}
                </div>
              </div>
            </div>
          `;
        }).join('')
      : `<div class="my-history-empty">No status history</div>`;
  
    Swal.fire({
      title: 'Ticket Timeline',
      width: 760,
      confirmButtonText: 'Close',
      buttonsStyling: false,
      customClass: {
        popup: 'my-timeline-popup',
        confirmButton: 'my-timeline-confirm'
      },
      html: `
        <style>
          .my-timeline-popup {
            border-radius: 24px !important;
            padding: 0 0 22px 0 !important;
            overflow: hidden;
          }
  
          .my-timeline-confirm {
            border-radius: 14px !important;
            background: linear-gradient(135deg, #2563eb, #0891b2) !important;
            color: #ffffff !important;
            font-weight: 950 !important;
            padding: 11px 24px !important;
            border: 0 !important;
          }
  
          .my-timeline-wrap {
            text-align: left;
            padding: 4px 8px 10px;
          }
  
          .my-timeline-ticket-card {
            padding: 14px;
            border-radius: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            margin-bottom: 16px;
            line-height: 1.75;
          }
  
          .my-timeline-ticket-card b {
            color: #334155;
          }
  
          .my-history-list {
            padding: 4px 0;
          }
  
          .my-history-item {
            display: grid;
            grid-template-columns: 18px 1fr;
            gap: 10px;
            margin-bottom: 16px;
          }
  
          .my-history-dot {
            width: 12px;
            height: 12px;
            margin-top: 10px;
            border-radius: 999px;
            background: #2563eb;
            box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.12);
          }
  
          .my-history-dot.wait,
          .my-history-dot.open {
            background: #f59e0b;
            box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.14);
          }
  
          .my-history-dot.onprocess,
          .my-history-dot.in-progress {
            background: #2563eb;
            box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.14);
          }
  
          .my-history-dot.complete,
          .my-history-dot.resolved {
            background: #10b981;
            box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.14);
          }
  
          .my-history-dot.deny {
            background: #ef4444;
            box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.14);
          }
  
          .my-history-content {
            min-width: 0;
          }
  
          .my-history-state {
            display: inline-flex;
            align-items: center;
            min-height: 30px;
            padding: 0 13px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 950;
            letter-spacing: 0.5px;
          }
  
          .my-history-state.wait,
          .my-history-state.open {
            color: #92400e;
            background: #fef3c7;
            border: 1px solid #fcd34d;
          }
  
          .my-history-state.onprocess,
          .my-history-state.in-progress {
            color: #1d4ed8;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
          }
  
          .my-history-state.complete,
          .my-history-state.resolved {
            color: #047857;
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
          }
  
          .my-history-state.deny {
            color: #b91c1c;
            background: #fee2e2;
            border: 1px solid #fecaca;
          }
  
          .my-history-by {
            margin-top: 7px;
            color: #475569;
            font-size: 13px;
            font-weight: 850;
          }
  
          .my-history-time,
          .my-history-empty {
            margin-top: 7px;
            color: #64748b;
            font-size: 12px;
            font-weight: 850;
          }
  
          .my-history-remark {
            margin-top: 10px;
            padding: 12px 14px;
            border-radius: 13px;
            color: #0f172a;
            font-size: 13px;
            font-weight: 800;
            white-space: pre-wrap;
          }
  
          .my-history-remark.wait,
          .my-history-remark.open {
            background: #fffbeb;
            border-left: 5px solid #f59e0b;
          }
  
          .my-history-remark.onprocess,
          .my-history-remark.in-progress {
            background: #eff6ff;
            border-left: 5px solid #2563eb;
          }
  
          .my-history-remark.complete,
          .my-history-remark.resolved {
            background: #ecfdf5;
            border-left: 5px solid #10b981;
          }
  
          .my-history-remark.deny {
            background: #fef2f2;
            border-left: 5px solid #ef4444;
          }
        </style>
  
        <div class="my-timeline-wrap">
          <div class="my-timeline-ticket-card">
            <div><b>Ticket No:</b> ${this.escapeHtml(ticket.ticketNo)}</div>
            <div><b>Project:</b> ${this.escapeHtml(ticket.projectName)}</div>
            <div><b>Problem:</b> ${this.escapeHtml(ticket.problem)}</div>
            <div><b>Current Status:</b> ${this.escapeHtml(ticket.status)}</div>
          </div>
  
          <div class="my-history-list">
            ${historyHtml}
          </div>
        </div>
      `
    });
  }
  
  private getHistoryStateClass(state: string) {
    const value = this.normalizeState(state);
  
    if (value === 'wait') return 'wait';
    if (value === 'open') return 'open';
    if (value === 'onprocess') return 'onprocess';
    if (value === 'inprogress') return 'in-progress';
    if (value === 'complete') return 'complete';
    if (value === 'resolved') return 'resolved';
    if (value === 'deny') return 'deny';
  
    return value || 'wait';
  }
  
  private getHistoryStateLabel(state: string) {
    const value = this.normalizeState(state);
  
    if (value === 'wait') return 'WAIT';
    if (value === 'open') return 'WAIT';
    if (value === 'onprocess') return 'ON PROCESS';
    if (value === 'inprogress') return 'ON PROCESS';
    if (value === 'complete') return 'COMPLETE';
    if (value === 'resolved') return 'COMPLETE';
    if (value === 'deny') return 'DENY';
  
    return String(state || '-').toUpperCase();
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