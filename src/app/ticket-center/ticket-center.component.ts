import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

import config from '../../config';

type ProjectStatus = 'Online' | 'Maintenance' | 'Offline';

type TicketProject = {
  id: number;
  name: string;
  subtitle: string;
  owner: string;
  ownerEmpNo: string;
  ownerEmail: string;
  status: ProjectStatus;
  icon: string;
  color: 'blue' | 'purple' | 'orange' | 'green';
};

type ApiProjectRow = {
  id: number;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  userId: number;
  ownerName?: string;
  ownerEmpNo?: string;
  timeStmp?: string;
  status: string;
  projectState?: string;
  projectStateTime?: string | null;
};

type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

type TicketAttachment = {
  id: number;
  fileName: string;
  fileUrl: string;
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



type TicketRow = {
  id: number;
  ticketNo: string;

  projectId: number;
  projectName: string;
  area: string;

  problemTitle: string;
  problemDetail: string;

  priority: TicketPriority;
  state: string;

  requestById: number;
  requestByName: string;
  requestByEmpNo: string;
  requestByDisplay: string;
  requestAt: string;

  contact: string;

  inchargeById?: number | null;
  inchargeByName?: string;
  inchargeByEmpNo?: string;
  inchargeByDisplay?: string;

  attachments: TicketAttachment[];

  reply: string;
  histories: TicketHistory[];
};

type CreateTicketForm = {
  projectId: number;
  projectName: string;
  owner: string;
  ownerEmail: string;
  userId: number;
  line: string;
  priority: TicketPriority;
  problemTitle: string;
  problemDetail: string;
  contact: string;
  attachments?: File[];
};

@Component({
  selector: 'app-ticket-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-center.component.html',
  styleUrl: './ticket-center.component.css'
})
export class TicketCenterComponent implements OnInit {
  constructor(private http: HttpClient) {}

  config = config;

  token: string | undefined = '';
  name: string | undefined = '';
  empNo: string | undefined = '';
  userId: number | null = null;

  projects: TicketProject[] = [];
  selectedProject: TicketProject | null = null;
  isLoadingProjects = false;
  isLoadingTickets = false;

  expandedTicketId: number | null = null;

  tickets: TicketRow[] = [];

  stats = {
    open: 0,
    inProgress: 0,
    resolved: 0
  };

  ngOnInit() {
    this.token = localStorage.getItem('ticketPress_token') || '';
    this.name = localStorage.getItem('ticketPress_name') || '';
    this.empNo = localStorage.getItem('ticketPress_empNo') || '';
    this.userId = Number(localStorage.getItem('ticketPress_userId')) || null;

    this.fetchProjects();
    this.fetchTickets();
  }

  fetchProjects() {
    this.isLoadingProjects = true;

    this.http.get<any>(`${config.apiServer}/api/project/list`).subscribe({
      next: (res) => {
        const rows: ApiProjectRow[] = res.results || [];

        this.projects = rows.map((item, index) =>
          this.mapProjectToCard(item, index)
        );

        this.selectedProject = this.projects.length > 0
          ? this.projects[0]
          : null;
      },
      error: (err) => {
        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Load Project Failed',
          text:
            err.error?.message ||
            err.error?.error ||
            'ไม่สามารถโหลดข้อมูล Project ได้'
        });
      },
      complete: () => {
        this.isLoadingProjects = false;
      }
    });
  }

  fetchTickets() {
    this.isLoadingTickets = true;

    this.http.get<any>(`${config.apiServer}/api/ticket/list`).subscribe({
      next: (res) => {
        const rows = res.results || [];

        this.tickets = rows.map((item: any) => ({
          id: Number(item.id),
          ticketNo: item.ticketNo || '-',

          projectId: Number(item.projectId),
          projectName: item.projectName || '-',
          area: item.area || '-',

          problemTitle: item.problemTitle || '-',
          problemDetail: item.problemDetail || '-',

          priority: (item.priority || 'Medium') as TicketPriority,
          state: item.state || '-',

          requestById: Number(item.requestById || 0),
          requestByName: item.requestByName || '-',
          requestByEmpNo: item.requestByEmpNo || '-',
          requestByDisplay: item.requestByDisplay || '-',
          requestAt: item.requestAt
            ? this.formatRequestDate(new Date(item.requestAt))
            : '-',

          contact: item.contact || '',

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

        this.updateStatsFromTickets();
      },
      error: (err) => {
        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Load Ticket Failed',
          text:
            err.error?.message ||
            err.error?.error ||
            'ไม่สามารถโหลดรายการ Ticket ได้'
        });
      },
      complete: () => {
        this.isLoadingTickets = false;
      }
    });
  }

  private updateStatsFromTickets() {
    const waitCount = this.tickets.filter(t =>
      this.normalizeState(t.state) === 'wait'
    ).length;
  
    const inProgressCount = this.tickets.filter(t =>
      this.normalizeState(t.state) === 'onprocess'
    ).length;
  
    const resolvedCount = this.tickets.filter(t =>
      this.normalizeState(t.state) === 'complete'
    ).length;
  
    this.stats = {
      open: waitCount,
      inProgress: inProgressCount,
      resolved: resolvedCount
    };
  }

  toggleTicketFiles(ticket: TicketRow) {
    this.expandedTicketId =
      this.expandedTicketId === ticket.id ? null : ticket.id;
  }

  openTicketDetail(ticket: TicketRow) {
    const attachmentHtml = ticket.attachments.length
      ? `
        <div class="ticket-detail-images">
          ${ticket.attachments.map(file => `
            <a href="${this.config.apiServer + file.fileUrl}" target="_blank" class="ticket-detail-image-card">
              <img src="${this.config.apiServer + file.fileUrl}" />
              <div>${this.escapeHtml(file.fileName)}</div>
            </a>
          `).join('')}
        </div>
      `
      : `<div class="ticket-detail-empty">No attachment files</div>`;
  
    const historyHtml = ticket.histories.length
      ? ticket.histories.map(h => {
          const stateClass = this.getTicketStatusClass(h.state);
          const stateLabel = this.getStateDisplayName(h.state);
  
          return `
            <div class="ticket-history-item">
              <div class="ticket-history-dot ${stateClass}"></div>
  
              <div class="ticket-history-content">
                <div>
                  <span class="ticket-history-state ${stateClass}">
                    ${this.escapeHtml(stateLabel)}
                  </span>
                </div>
  
                <div class="ticket-history-by">
                  By: ${this.escapeHtml(h.inchargeByDisplay || '-')}
                </div>
  
                ${
                  h.remark
                    ? `
                      <div class="ticket-history-remark ${stateClass}">
                        ${this.escapeHtml(h.remark)}
                      </div>
                    `
                    : ''
                }
  
                <div class="ticket-history-time">
                  ${this.escapeHtml(h.timeStmp)}
                </div>
              </div>
            </div>
          `;
        }).join('')
      : `<div class="ticket-detail-empty">No status history</div>`;
  
    Swal.fire({
      title: 'Ticket Detail',
      width: 820,
      confirmButtonText: 'Close',
      buttonsStyling: false,
      customClass: {
        popup: 'ticket-detail-popup',
        confirmButton: 'ticket-detail-confirm'
      },
      html: `
        <style>
          .ticket-detail-popup {
            border-radius: 24px !important;
            padding: 0 0 22px 0 !important;
            overflow: hidden;
          }
  
          .ticket-detail-confirm {
            border-radius: 14px !important;
            background: linear-gradient(135deg, #2563eb, #0891b2) !important;
            color: #ffffff !important;
            font-weight: 950 !important;
            padding: 11px 24px !important;
            border: 0 !important;
          }
  
          .ticket-detail-wrap {
            text-align: left;
            line-height: 1.75;
            padding: 4px 6px 12px;
          }
  
          .ticket-detail-card {
            padding: 14px;
            border-radius: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            margin-bottom: 14px;
          }
  
          .ticket-detail-title {
            font-weight: 950;
            color: #1d4ed8;
            margin-bottom: 8px;
          }
  
          .ticket-detail-images {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 12px;
          }
  
          .ticket-detail-image-card {
            display: block;
            text-decoration: none;
            color: #334155;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            overflow: hidden;
            background: #ffffff;
          }
  
          .ticket-detail-image-card img {
            width: 100%;
            height: 110px;
            object-fit: cover;
            display: block;
          }
  
          .ticket-detail-image-card div {
            padding: 8px;
            font-size: 12px;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
  
          .ticket-history-item {
            display: grid;
            grid-template-columns: 18px 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }
  
          .ticket-history-dot {
            width: 12px;
            height: 12px;
            margin-top: 10px;
            border-radius: 999px;
            background: #2563eb;
            box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.12);
          }
  
          .ticket-history-dot.wait {
            background: #f59e0b;
            box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.14);
          }
  
          .ticket-history-dot.onprocess {
            background: #2563eb;
            box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.14);
          }
  
          .ticket-history-dot.complete {
            background: #10b981;
            box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.14);
          }
  
          .ticket-history-dot.deny {
            background: #ef4444;
            box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.14);
          }
  
          .ticket-history-state {
            display: inline-flex;
            align-items: center;
            min-height: 30px;
            padding: 0 13px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 950;
            letter-spacing: 0.5px;
          }
  
          .ticket-history-state.wait {
            color: #92400e;
            background: #fef3c7;
            border: 1px solid #fcd34d;
          }
  
          .ticket-history-state.onprocess {
            color: #1d4ed8;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
          }
  
          .ticket-history-state.complete {
            color: #047857;
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
          }
  
          .ticket-history-state.deny {
            color: #b91c1c;
            background: #fee2e2;
            border: 1px solid #fecaca;
          }
  
          .ticket-history-by {
            margin-top: 7px;
            color: #475569;
            font-size: 13px;
            font-weight: 850;
          }
  
          .ticket-history-time,
          .ticket-detail-empty {
            margin-top: 7px;
            color: #64748b;
            font-size: 12px;
            font-weight: 850;
          }
  
          .ticket-history-remark {
            margin-top: 10px;
            padding: 12px 14px;
            border-radius: 13px;
            color: #0f172a;
            font-size: 13px;
            font-weight: 800;
            white-space: pre-wrap;
          }
  
          .ticket-history-remark.wait {
            background: #fffbeb;
            border-left: 5px solid #f59e0b;
          }
  
          .ticket-history-remark.onprocess {
            background: #eff6ff;
            border-left: 5px solid #2563eb;
          }
  
          .ticket-history-remark.complete {
            background: #ecfdf5;
            border-left: 5px solid #10b981;
          }
  
          .ticket-history-remark.deny {
            background: #fef2f2;
            border-left: 5px solid #ef4444;
          }
        </style>
  
        <div class="ticket-detail-wrap">
          <div class="ticket-detail-card">
            <div><b>Ticket No:</b> ${this.escapeHtml(ticket.ticketNo)}</div>
            <div><b>Project:</b> ${this.escapeHtml(ticket.projectName)}</div>
            <div><b>Area:</b> ${this.escapeHtml(ticket.area)}</div>
            <div><b>Request By:</b> ${this.escapeHtml(ticket.requestByDisplay)}</div>
            <div><b>Request At:</b> ${this.escapeHtml(ticket.requestAt)}</div>
            <div><b>Contact Request:</b> ${this.escapeHtml(ticket.contact || '-')}</div>
            <div><b>Current State:</b> ${this.escapeHtml(ticket.state)}</div>
          </div>
  
          <div class="ticket-detail-card">
            <div class="ticket-detail-title">Problem</div>
            <div><b>Title:</b> ${this.escapeHtml(ticket.problemTitle)}</div>
            <div><b>Detail:</b><br>${this.escapeHtml(ticket.problemDetail || '-')}</div>
          </div>
  
          <div class="ticket-detail-card">
            <div class="ticket-detail-title">Reply</div>
            <div>${this.escapeHtml(ticket.reply || '-')}</div>
          </div>
  
          <div class="ticket-detail-card">
            <div class="ticket-detail-title">Attachments</div>
            ${attachmentHtml}
          </div>
  
          <div class="ticket-detail-card">
            <div class="ticket-detail-title">Ticket Status Timeline</div>
            ${historyHtml}
          </div>
        </div>
      `
    });
  }

  private mapProjectToCard(item: ApiProjectRow, index: number): TicketProject {
    return {
      id: item.id,
      name: item.name,
      subtitle: item.description || 'No description',
      owner: item.ownerName || '-',
      ownerEmpNo: item.ownerEmpNo || '-',
      ownerEmail: item.email || '-',
      status: this.mapProjectState(item.projectState),
      icon: '🛡️',
      color: this.getProjectColor(index)
    };
  }

  private mapProjectState(state?: string): ProjectStatus {
    const value = (state || '').toLowerCase();

    if (value === 'online') return 'Online';
    if (value === 'maintenance') return 'Maintenance';
    if (value === 'offline') return 'Offline';

    return 'Offline';
  }

  private getProjectColor(index: number): 'blue' | 'purple' | 'orange' | 'green' {
    const colors: Array<'blue' | 'purple' | 'orange' | 'green'> = [
      'blue',
      'purple',
      'orange',
      'green'
    ];

    return colors[index % colors.length];
  }

  selectProject(project: TicketProject) {
    this.selectedProject = project;
  }

  getStatusClass(status: ProjectStatus) {
    return status.toLowerCase();
  }

  getPriorityClass(priority: TicketPriority) {
    return String(priority || '').toLowerCase();
  }

  getTicketStatusClass(status: string) {
    const value = this.normalizeState(status);
  
    if (value === 'wait') return 'wait';
    if (value === 'onprocess') return 'onprocess';
    if (value === 'complete') return 'complete';
    if (value === 'deny') return 'deny';
  
    return value;
  }


  getTicketStatusDisplay(status: string) {
    const value = this.normalizeState(status);
  
    if (value === 'wait') return 'Wait';
    if (value === 'onprocess') return 'On Process';
    if (value === 'complete') return 'Complete';
    if (value === 'deny') return 'Deny';
  
    return String(status || '-');
  }



  async createTicket() {
    if (!this.selectedProject) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Project',
        text: 'กรุณาเลือก Project ก่อนสร้าง Ticket'
      });
      return;
    }

    const project = this.selectedProject;

    const requesterDisplay =
      this.name && this.empNo
        ? `${this.name} [${this.empNo}]`
        : this.name || this.empNo || 'Current User';

    const currentUserId = this.userId || 0;

    const modalStyle = `
      <style>
        .ticket-swal-popup {
          border-radius: 26px !important;
          padding: 0 0 22px 0 !important;
          overflow: hidden;
        }

        .ticket-swal-title {
          padding: 24px 28px 6px !important;
          color: #0f172a !important;
          font-size: 26px !important;
          font-weight: 950 !important;
        }

        .swal2-actions {
          gap: 16px !important;
          margin-top: 18px !important;
          margin-bottom: 22px !important;
        }

        .swal2-actions .swal2-styled {
          margin: 0 !important;
        }

        .ticket-swal-confirm {
          border-radius: 14px !important;
          background: linear-gradient(135deg, #2563eb, #0891b2) !important;
          color: #ffffff !important;
          font-weight: 950 !important;
          padding: 11px 22px !important;
          border: 0 !important;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.22) !important;
        }

        .ticket-swal-cancel {
          border-radius: 14px !important;
          background: #e2e8f0 !important;
          color: #475569 !important;
          font-weight: 950 !important;
          padding: 11px 22px !important;
          border: 0 !important;
        }

        .ticket-modal {
          text-align: left;
          padding: 6px 8px 14px;
        }

        .ticket-modal-project {
          margin-bottom: 18px;
          padding: 16px;
          border-radius: 18px;
          background: linear-gradient(135deg, #eff6ff, #ecfeff);
          border: 1px solid #bfdbfe;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .ticket-modal-label {
          color: #2563eb;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .ticket-modal-project-name {
          color: #0f172a;
          font-size: 18px;
          font-weight: 950;
          line-height: 1.35;
        }

        .ticket-modal-sub {
          margin-top: 5px;
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .ticket-modal-status {
          padding: 7px 13px;
          border-radius: 999px;
          color: #047857;
          background: #d1fae5;
          font-size: 12px;
          font-weight: 950;
          white-space: nowrap;
        }

        .ticket-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .ticket-field {
          margin-bottom: 14px;
        }

        .ticket-field label {
          display: block;
          margin-bottom: 7px;
          color: #334155;
          font-size: 13px;
          font-weight: 950;
        }

        .ticket-field label span {
          color: #ef4444;
        }

        .ticket-input,
        .ticket-textarea {
          width: 100%;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a;
          border-radius: 14px;
          padding: 12px 14px;
          outline: none;
          font-size: 14px;
          font-weight: 750;
          box-sizing: border-box;
        }

        .ticket-input:focus,
        .ticket-textarea:focus {
          border-color: rgba(37, 99, 235, 0.45);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.10);
        }

        .ticket-input:disabled {
          background: #e2e8f0;
          color: #475569;
          cursor: not-allowed;
          opacity: 1;
          border-color: #cbd5e1;
        }

        .ticket-textarea {
          resize: vertical;
          min-height: 96px;
        }

        .ticket-file-box {
          border: 1.5px dashed #cbd5e1;
          border-radius: 16px;
          background: #f8fafc;
          padding: 14px;
        }

        .ticket-file-input {
          width: 100%;
          font-size: 13px;
          font-weight: 800;
          color: #334155;
        }

        .ticket-file-help {
          margin-top: 8px;
          color: #64748b;
          font-size: 12px;
          font-weight: 750;
          line-height: 1.5;
        }

        .ticket-modal-note {
          margin-top: 2px;
          padding: 14px;
          border-radius: 16px;
          background: #f1f5f9;
          color: #334155;
          font-size: 13px;
          line-height: 1.65;
          font-weight: 850;
        }

        .ticket-success-box {
          text-align: left;
          line-height: 1.8;
          padding: 6px 8px 12px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 750;
        }

        .ticket-success-box b {
          color: #334155;
        }

        @media (max-width: 720px) {
          .ticket-modal-grid {
            grid-template-columns: 1fr;
          }

          .ticket-modal-project {
            flex-direction: column;
          }
        }
      </style>
    `;

    const result = await Swal.fire({
      title: 'Create Ticket',
      width: 760,
      showCancelButton: true,
      confirmButtonText: 'Submit Ticket',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      reverseButtons: false,
      focusConfirm: false,
      customClass: {
        popup: 'ticket-swal-popup',
        title: 'ticket-swal-title',
        confirmButton: 'ticket-swal-confirm',
        cancelButton: 'ticket-swal-cancel'
      },
      html: `
        ${modalStyle}

        <div class="ticket-modal">
          <div class="ticket-modal-project">
            <div>
              <div class="ticket-modal-label">Selected Project</div>
              <div class="ticket-modal-project-name">
                ${this.escapeHtml(project.name)}
              </div>
              <div class="ticket-modal-sub">
                Owner: ${this.escapeHtml(project.owner)} • ${this.escapeHtml(project.ownerEmpNo)}
              </div>
            </div>

            <div class="ticket-modal-status">
              ${this.escapeHtml(project.status)}
            </div>
          </div>

          <div class="ticket-modal-grid">
            <div class="ticket-field">
              <label>Requester <span>*</span></label>
              <input
                id="ticketRequester"
                class="ticket-input"
                value="${this.escapeHtml(requesterDisplay)}"
                disabled
              />
            </div>

            <div class="ticket-field">
              <label>Line / Area <span>*</span></label>
              <input
                id="ticketLine"
                class="ticket-input"
                placeholder="เช่น Line A-03, MC Store, Plating B"
              />
            </div>

            <div class="ticket-field">
              <label>Priority <span>*</span></label>
              <select id="ticketPriority" class="ticket-input">
                <option value="Low">Low</option>
                <option value="Medium" selected>Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div class="ticket-field">
              <label>Contact</label>
              <input
                id="ticketContact"
                class="ticket-input"
                placeholder="เบอร์, Email, หรือช่องทางติดต่อกลับ"
              />
            </div>
          </div>

          <div class="ticket-field">
            <label>Problem Title <span>*</span></label>
            <input
              id="ticketProblemTitle"
              class="ticket-input"
              placeholder="สรุปปัญหาสั้น ๆ เช่น กด Confirm แล้วข้อมูลไม่ Update"
            />
          </div>

          <div class="ticket-field">
            <label>Problem Detail <span>*</span></label>
            <textarea
              id="ticketProblemDetail"
              class="ticket-textarea"
              rows="4"
              placeholder="อธิบายปัญหา ขั้นตอนที่ทำก่อนเกิดปัญหา หรือ Error ที่พบ"
            ></textarea>
          </div>

          <div class="ticket-field">
            <label>Attach Images</label>
            <div class="ticket-file-box">
              <input
                id="ticketAttachments"
                class="ticket-file-input"
                type="file"
                accept="image/*"
                multiple
              />
              <div class="ticket-file-help">
                รองรับไฟล์รูปหลายไฟล์ เช่น PNG, JPG, JPEG ขนาดไม่เกิน 5 MB ต่อไฟล์
              </div>
            </div>
          </div>

          <div class="ticket-modal-note">
            Ticket นี้จะถูกส่งไปหา
            <b>${this.escapeHtml(project.owner)}</b>
            โดยอัตโนมัติ
          </div>
        </div>
      `,
      preConfirm: () => {
        const line = (document.getElementById('ticketLine') as HTMLInputElement)?.value.trim();
        const priority = (document.getElementById('ticketPriority') as HTMLSelectElement)?.value as TicketPriority;
        const contact = (document.getElementById('ticketContact') as HTMLInputElement)?.value.trim();
        const problemTitle = (document.getElementById('ticketProblemTitle') as HTMLInputElement)?.value.trim();
        const problemDetail = (document.getElementById('ticketProblemDetail') as HTMLTextAreaElement)?.value.trim();

        const attachmentInput = document.getElementById('ticketAttachments') as HTMLInputElement;
        const attachments = attachmentInput?.files ? Array.from(attachmentInput.files) : [];

        const missing: string[] = [];

        if (!currentUserId) missing.push('User ID');
        if (!line) missing.push('Line / Area');
        if (!priority) missing.push('Priority');
        if (!problemTitle) missing.push('Problem Title');
        if (!problemDetail) missing.push('Problem Detail');

        if (missing.length) {
          Swal.showValidationMessage(`กรุณากรอกข้อมูล: ${missing.join(', ')}`);
          return false;
        }

        const maxFileSize = 5 * 1024 * 1024;

        for (const file of attachments) {
          if (!file.type.startsWith('image/')) {
            Swal.showValidationMessage(`ไฟล์ ${file.name} ไม่ใช่ไฟล์รูปภาพ`);
            return false;
          }

          if (file.size > maxFileSize) {
            Swal.showValidationMessage(`ไฟล์ ${file.name} มีขนาดเกิน 5 MB`);
            return false;
          }
        }

        const form: CreateTicketForm = {
          projectId: project.id,
          projectName: project.name,
          owner: project.owner,
          ownerEmail: project.ownerEmail,
          userId: currentUserId,
          line,
          priority,
          problemTitle,
          problemDetail,
          contact,
          attachments
        };

        return form;
      }
    });

    if (!result.isConfirmed || !result.value) return;

    const form = result.value as CreateTicketForm;

    const payload = new FormData();

    payload.append('projectId', String(form.projectId));
    payload.append('userId', String(form.userId));
    payload.append('line', form.line);
    payload.append('priority', form.priority);
    payload.append('contact', form.contact || '');
    payload.append('problemTitle', form.problemTitle);
    payload.append('problemDetail', form.problemDetail);

    for (const file of form.attachments || []) {
      payload.append('attachments', file);
    }

    try {
      Swal.fire({
        title: 'Creating Ticket...',
        text: 'กำลังสร้าง Ticket และอัปโหลดไฟล์แนบ',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await firstValueFrom(
        this.http.post(`${config.apiServer}/api/ticket/create`, payload)
      );

      Swal.close();

      this.fetchTickets();

      await Swal.fire({
        icon: 'success',
        title: 'Ticket Created',
        buttonsStyling: false,
        confirmButtonText: 'OK',
        customClass: {
          popup: 'ticket-swal-popup',
          title: 'ticket-swal-title',
          confirmButton: 'ticket-swal-confirm'
        },
        html: `
          ${modalStyle}

          <div class="ticket-success-box">
            <div><b>Project:</b> ${this.escapeHtml(form.projectName)}</div>
            <div><b>Owner:</b> ${this.escapeHtml(form.owner)}</div>
            <div><b>Requester:</b> ${this.escapeHtml(requesterDisplay)}</div>
            <div><b>Status:</b> wait</div>
            <div><b>Attachments:</b> ${form.attachments?.length || 0} file(s)</div>
          </div>
        `
      });
    } catch (err: any) {
      Swal.close();

      await Swal.fire({
        icon: 'error',
        title: 'Create Ticket Failed',
        text:
          err?.error?.message ||
          err?.error?.error ||
          'ไม่สามารถสร้าง Ticket ได้ กรุณาตรวจสอบ API หรือไฟล์แนบ'
      });

      console.error('Create ticket failed:', err);
    }
  }


  private normalizeState(state: string | undefined | null) {
    return String(state || '')
      .toLowerCase()
      .replaceAll(' ', '')
      .replaceAll('-', '');
  }


  getStateDisplayName(state: string) {
    const value = this.normalizeState(state);
  
    if (value === 'wait') return 'WAIT';
    if (value === 'onprocess') return 'ON PROCESS';
    if (value === 'complete') return 'COMPLETE';
    if (value === 'deny') return 'DENY';
  
    return String(state || '-').toUpperCase();
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