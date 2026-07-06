import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

import config from '../../config';

type OwnerProjectStatus = 'Online' | 'Maintenance' | 'Offline' | string;
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
type TicketState = 'wait' | 'onprocess' | 'deny' | 'complete' | string;
type InchargeSubmitStatus = 'onprocess' | 'deny' | 'complete';

type OwnerProject = {
  id: number;
  name: string;
  module: string;
  status: OwnerProjectStatus;
  open: number;
  inProgress: number;
  resolved: number;
  deny: number;
  color: 'blue' | 'purple' | 'orange' | 'green';
};

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

type OwnerTicket = {
  id: number;
  ticketNo: string;

  projectId: number;
  projectName: string;
  area: string;

  problemTitle: string;
  problemDetail: string;

  requestById: number;
  requestByName: string;
  requestByEmpNo: string;
  requestByDisplay: string;
  requestAt: string;

  priority: TicketPriority;
  state: TicketState;

  contact: string;
  reply: string;

  inchargeById?: number | null;
  inchargeByName?: string;
  inchargeByEmpNo?: string;
  inchargeByDisplay?: string;

  attachments: TicketAttachment[];
  histories: TicketHistory[];
};

type InchargeForm = {
  ticketStatus: InchargeSubmitStatus | '';
  remarkToRequester: string;
};

@Component({
  selector: 'app-owner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner.component.html',
  styleUrl: './owner.component.css'
})
export class OwnerComponent implements OnInit {
  constructor(private http: HttpClient) {}

  config = config;

  token: string | undefined = '';
  name: string | undefined = '';
  empNo: string | undefined = '';
  userId: number | null = null;

  ownerName = '-';
  ownerRole = 'Project Owner / Incharge';
  ownerEmail = '-';

  selectedProjectId: number | 'all' = 'all';
  selectedTicket: OwnerTicket | null = null;
  expandedTicketId: number | null = null;

  isLoadingOwnerTickets = false;

  inchargeForm: InchargeForm = this.getDefaultInchargeForm();

  projects: OwnerProject[] = [];
  tickets: OwnerTicket[] = [];

  ngOnInit() {
    this.token = localStorage.getItem('ticketPress_token') || '';
    this.name = localStorage.getItem('ticketPress_name') || '';
    this.empNo = localStorage.getItem('ticketPress_empNo') || '';
    this.userId = Number(localStorage.getItem('ticketPress_userId')) || null;

    this.ownerName =
      this.name && this.empNo
        ? `${this.name} [${this.empNo}]`
        : this.name || '-';

    this.fetchOwnerTickets();
  }

  get totalOpen() {
    return this.projects.reduce((sum, p) => sum + p.open, 0);
  }

  get totalInProgress() {
    return this.projects.reduce((sum, p) => sum + p.inProgress, 0);
  }

  get totalResolved() {
    return this.projects.reduce((sum, p) => sum + p.resolved, 0);
  }


  get totalDeny() {
    return this.projects.reduce((sum, p) => sum + p.deny, 0);
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

  get isWaitSelected() {
    return this.normalizeState(this.selectedTicket?.state) === 'wait';
  }

  get isOnProcessSelected() {
    return this.normalizeState(this.selectedTicket?.state) === 'onprocess';
  }

  get shouldShowRemark() {
    const selectedState = this.normalizeState(this.selectedTicket?.state);
  
    return selectedState === 'wait' || selectedState === 'onprocess';
  }

  private getDefaultInchargeForm(): InchargeForm {
    return {
      ticketStatus: '',
      remarkToRequester: ''
    };
  }

  fetchOwnerTickets() {
    if (!this.userId) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing User',
        text: 'ไม่พบ userId ของ Owner กรุณา login ใหม่'
      });
      return;
    }

    this.isLoadingOwnerTickets = true;

    const body = {
      userId: this.userId
    };
    
    this.http.post<any>(`${config.apiServer}/api/ticket/owner/list`, body).subscribe({
      next: (res) => {
        const owner = res.owner;

        if (owner?.display) {
          this.ownerName = owner.display;
        }

        const projectRows = res.projects || [];
        const ticketRows = res.results || [];

        this.projects = projectRows.map((item: any) => ({
          id: Number(item.id),
          name: item.name || '-',
          module: item.module || 'No description',
          status: item.status || 'Offline',
          open: Number(item.open || 0),
          inProgress: Number(item.inProgress || 0),
          resolved: Number(item.resolved || 0),
          deny: Number(item.deny || 0),
          color: item.color || 'blue'
        }));

        this.tickets = ticketRows.map((item: any) => ({
          id: Number(item.id),
          ticketNo: item.ticketNo || '-',

          projectId: Number(item.projectId || 0),
          projectName: item.projectName || '-',
          area: item.area || '-',

          problemTitle: item.problemTitle || '-',
          problemDetail: item.problemDetail || '-',

          requestById: Number(item.requestById || 0),
          requestByName: item.requestByName || '-',
          requestByEmpNo: item.requestByEmpNo || '-',
          requestByDisplay: item.requestByDisplay || '-',
          requestAt: item.requestAt
            ? this.formatRequestDate(new Date(item.requestAt))
            : '-',

          priority: (item.priority || 'Medium') as TicketPriority,
          state: item.state || 'wait',

          contact: item.contact || '',
          reply: item.reply || '',

          inchargeById: item.inchargeById || null,
          inchargeByName: item.inchargeByName || '',
          inchargeByEmpNo: item.inchargeByEmpNo || '',
          inchargeByDisplay: item.inchargeByDisplay || '-',

          attachments: item.attachments || [],

          histories: (item.histories || []).map((h: any) => ({
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
        }));

        if (
          this.selectedTicket &&
          !this.tickets.some(t => t.id === this.selectedTicket?.id)
        ) {
          this.clearInchargeForm();
        }
      },
      error: (err) => {
        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Load Owner Tickets Failed',
          text:
            err.error?.message ||
            err.error?.error ||
            'ไม่สามารถโหลด Ticket ของ Owner ได้'
        });
      },
      complete: () => {
        this.isLoadingOwnerTickets = false;
      }
    });
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

  canShowAction(ticket: OwnerTicket) {
    const state = this.normalizeState(ticket.state);
    return state === 'wait' || state === 'onprocess';
  }

  getActionLabel(ticket: OwnerTicket) {
    const state = this.normalizeState(ticket.state);

    if (state === 'wait') return 'Incharge';
    if (state === 'onprocess') return 'Update';

    return '';
  }

  openInchargeForm(ticket: OwnerTicket) {
    this.selectedTicket = ticket;
  
    const state = this.normalizeState(ticket.state);
  
    this.inchargeForm = {
      ticketStatus: state === 'wait' ? 'onprocess' : 'onprocess',
      remarkToRequester: ''
    };
  }

  clearInchargeForm() {
    this.selectedTicket = null;
    this.inchargeForm = this.getDefaultInchargeForm();
  }

  setInchargeStatus(status: InchargeSubmitStatus) {
    this.inchargeForm.ticketStatus = status;
  }

  async submitIncharge() {
    if (!this.selectedTicket) return;

    if (!this.userId) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing User',
        text: 'ไม่พบ userId ของ Owner กรุณา login ใหม่'
      });
      return;
    }

    if (!this.inchargeForm.ticketStatus) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Status',
        text: 'กรุณาเลือก Status'
      });
      return;
    }

    if (this.shouldShowRemark && !this.inchargeForm.remarkToRequester.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Remark',
        text: 'กรุณากรอก Remark to Requester'
      });
      return;
    }

    const body = {
      userId: this.userId,
      ticketId: this.selectedTicket.id,
      ticketStatus: this.inchargeForm.ticketStatus,
      reply: this.shouldShowRemark ? this.inchargeForm.remarkToRequester.trim() : ''
    };

    try {
      const confirm = await Swal.fire({
        icon: 'question',
        title: 'Confirm Update Ticket',
        html: `
          <div style="text-align:left; line-height:1.8;">
            <div><b>Ticket No:</b> ${this.escapeHtml(this.selectedTicket.ticketNo)}</div>
            <div><b>Status:</b> ${this.escapeHtml(this.inchargeForm.ticketStatus)}</div>
            ${
              this.shouldShowRemark
                ? `<div><b>Remark:</b> ${this.escapeHtml(this.inchargeForm.remarkToRequester)}</div>`
                : ''
            }
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      });

      if (!confirm.isConfirmed) return;

      Swal.fire({
        title: 'Saving...',
        text: 'กำลังบันทึกสถานะ Ticket',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await firstValueFrom(
        this.http.post(`${config.apiServer}/api/ticket/ownerIncharge`, body)
      );

      Swal.close();

      await Swal.fire({
        icon: 'success',
        title: 'Update Success',
        text: 'บันทึกสถานะ Ticket สำเร็จ'
      });

      this.clearInchargeForm();
      this.fetchOwnerTickets();
    } catch (err: any) {
      Swal.close();

      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text:
          err.error?.message ||
          err.error?.error ||
          'ไม่สามารถบันทึกสถานะ Ticket ได้'
      });

      console.error(err);
    }
  }

  toggleTicketFiles(ticket: OwnerTicket) {
    this.expandedTicketId =
      this.expandedTicketId === ticket.id ? null : ticket.id;
  }

  openTicketDetail(ticket: OwnerTicket) {
    const attachmentHtml = ticket.attachments.length
      ? `
        <div class="owner-detail-images">
          ${ticket.attachments.map(file => `
            <a href="${this.config.apiServer + file.fileUrl}" target="_blank" class="owner-detail-image-card">
              <img src="${this.config.apiServer + file.fileUrl}" />
              <div>${this.escapeHtml(file.fileName)}</div>
            </a>
          `).join('')}
        </div>
      `
      : `<div class="owner-detail-empty">No attachment files</div>`;

      const historyHtml = ticket.histories.length
  ? ticket.histories.map(h => {
      const stateClass = this.getStatusClass(h.state);
      const stateLabel = this.getStateDisplayName(h.state);

      return `
        <div class="owner-history-item owner-history-${stateClass}">
          <div class="owner-history-dot ${stateClass}"></div>

          <div class="owner-history-content">
            <div>
              <span class="owner-history-state ${stateClass}">
                ${this.escapeHtml(stateLabel)}
              </span>
            </div>

            <div class="owner-history-by">
              By:
              ${this.escapeHtml(h.inchargeByDisplay || '-')}
            </div>

            ${
              h.remark
                ? `
                  <div class="owner-history-remark ${stateClass}">
                    ${this.escapeHtml(h.remark)}
                  </div>
                `
                : ''
            }

            <div class="owner-history-time">
              ${this.escapeHtml(h.timeStmp)}
            </div>
          </div>
        </div>
      `;
    }).join('')
  : `<div class="owner-detail-empty">No status history</div>`;

    Swal.fire({
      title: 'Ticket Detail',
      width: 820,
      confirmButtonText: 'Close',
      html: `
        <style>
          .owner-detail-wrap {
            text-align: left;
            line-height: 1.75;
          }


          .owner-detail-card {
            padding: 14px;
            border-radius: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            margin-bottom: 14px;
          }

          .owner-detail-title {
            font-weight: 950;
            color: #1d4ed8;
            margin-bottom: 8px;
          }

          .owner-detail-images {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 12px;
          }

          .owner-detail-image-card {
            display: block;
            text-decoration: none;
            color: #334155;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            overflow: hidden;
            background: #ffffff;
          }

          .owner-detail-image-card img {
            width: 100%;
            height: 110px;
            object-fit: cover;
            display: block;
          }

          .owner-detail-image-card div {
            padding: 8px;
            font-size: 12px;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

         .owner-history-item {
          display: grid;
          grid-template-columns: 18px 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }

        .owner-history-dot {
          width: 12px;
          height: 12px;
          margin-top: 10px;
          border-radius: 999px;
          background: #2563eb;
          box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.12);
        }

        .owner-history-dot.wait {
          background: #f59e0b;
          box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.14);
        }

        .owner-history-dot.onprocess {
          background: #2563eb;
          box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.14);
        }

        .owner-history-dot.complete {
          background: #10b981;
          box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.14);
        }

        .owner-history-dot.deny {
          background: #ef4444;
          box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.14);
        }

        .owner-history-content {
          min-width: 0;
        }

        .owner-history-state {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 0 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.5px;
        }

        .owner-history-state.wait {
          color: #92400e;
          background: #fef3c7;
          border: 1px solid #fcd34d;
        }

        .owner-history-state.onprocess {
          color: #1d4ed8;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }

        .owner-history-state.complete {
          color: #047857;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
        }

        .owner-history-state.deny {
          color: #b91c1c;
          background: #fee2e2;
          border: 1px solid #fecaca;
        }

        .owner-history-by {
          margin-top: 7px;
          color: #475569;
          font-size: 13px;
          font-weight: 850;
        }

        .owner-history-time,
        .owner-detail-empty {
          margin-top: 7px;
          color: #64748b;
          font-size: 12px;
          font-weight: 850;
        }

        .owner-history-remark {
          margin-top: 10px;
          padding: 12px 14px;
          border-radius: 13px;
          color: #0f172a;
          font-size: 13px;
          font-weight: 800;
          white-space: pre-wrap;
        }

        .owner-history-remark.wait {
          background: #fffbeb;
          border-left: 5px solid #f59e0b;
        }

        .owner-history-remark.onprocess {
          background: #eff6ff;
          border-left: 5px solid #2563eb;
        }

        .owner-history-remark.complete {
          background: #ecfdf5;
          border-left: 5px solid #10b981;
        }

        .owner-history-remark.deny {
          background: #fef2f2;
          border-left: 5px solid #ef4444;
        }
          }
        </style>

        <div class="owner-detail-wrap">
          <div class="owner-detail-card">
            <div><b>Ticket No:</b> ${this.escapeHtml(ticket.ticketNo)}</div>
            <div><b>Project:</b> ${this.escapeHtml(ticket.projectName)}</div>
            <div><b>Area:</b> ${this.escapeHtml(ticket.area)}</div>
            <div><b>Request By:</b> ${this.escapeHtml(ticket.requestByDisplay)}</div>
            <div><b>Request At:</b> ${this.escapeHtml(ticket.requestAt)}</div>
            <div><b>Contact Request:</b> ${this.escapeHtml(ticket.contact || '-')}</div>
            <div><b>Current State:</b> ${this.escapeHtml(ticket.state)}</div>
          </div>

          <div class="owner-detail-card">
            <div class="owner-detail-title">Problem</div>
            <div><b>Title:</b> ${this.escapeHtml(ticket.problemTitle)}</div>
            <div><b>Detail:</b><br>${this.escapeHtml(ticket.problemDetail || '-')}</div>
          </div>

          <div class="owner-detail-card">
            <div class="owner-detail-title">Reply</div>
            <div>${this.escapeHtml(ticket.reply || '-')}</div>
          </div>

          <div class="owner-detail-card">
            <div class="owner-detail-title">Attachments</div>
            ${attachmentHtml}
          </div>

          <div class="owner-detail-card">
            <div class="owner-detail-title">Ticket Status Timeline</div>
            ${historyHtml}
          </div>
        </div>
      `
    });
  }

  getStateDisplayName(state: string) {
    const value = this.normalizeState(state);
  
    if (value === 'wait') return 'WAIT';
    if (value === 'onprocess') return 'ON PROCESS';
    if (value === 'complete') return 'COMPLETE';
    if (value === 'deny') return 'DENY';
  
    return String(state || '-').toUpperCase();
  }

  getPriorityClass(priority: TicketPriority) {
    return String(priority || '').toLowerCase();
  }

  getStatusClass(status: string) {
    return this.normalizeState(status).replaceAll(' ', '-');
  }

  getProjectStatusClass(status: OwnerProjectStatus) {
    return String(status || '').toLowerCase();
  }

  private normalizeState(state: string | undefined | null) {
    return String(state || '').toLowerCase().replaceAll(' ', '');
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

  private escapeHtml(value: string) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}