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

type CreateTicketForm = {
  projectId: number;
  projectName: string;
  owner: string;
  ownerEmail: string;
  userId: number
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

  token: string | undefined = '';
  name: string | undefined = '';
  empNo: string | undefined = '';
  userId: number | null = null;


  projects: TicketProject[] = [];
  selectedProject: TicketProject | null = null;
  isLoadingProjects = false;

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

  stats = {
    open: 18,
    inProgress: 7,
    resolved: 124
  };

  ngOnInit() {
    this.token = localStorage.getItem('ticketPress_token') || '';
    this.name = localStorage.getItem('ticketPress_name') || '';
    this.empNo = localStorage.getItem('ticketPress_empNo') || '';
    this.userId = Number(localStorage.getItem('ticketPress_userId')) || null;

    
    this.fetchProjects();
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
    return priority.toLowerCase();
  }

  getTicketStatusClass(status: TicketStatus) {
    return status.toLowerCase().replace(' ', '-');
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

      const maxFileSize = 5 * 1024 * 1024; // 5 MB

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

    const res: any = await firstValueFrom(
      this.http.post(`${config.apiServer}/api/ticket/create`, payload)
    );

    Swal.close();

    const created = res?.result;

    const newTicket: TicketRow = {
      ticketNo: created?.ticketNo || this.generateTicketNo(),
      project: created?.projectName || form.projectName,
      line: created?.line || created?.area || form.line,
      problem: created?.problemTitle || form.problemTitle,
      requester: requesterDisplay,
      requestAt: this.formatRequestDate(new Date()),
      priority: created?.priority || form.priority,
      status: 'Open',
      owner: form.owner
    };

    this.tickets = [newTicket, ...this.tickets];
    this.stats.open += 1;

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
          <div><b>Ticket No:</b> ${this.escapeHtml(newTicket.ticketNo)}</div>
          <div><b>Project:</b> ${this.escapeHtml(newTicket.project)}</div>
          <div><b>Owner:</b> ${this.escapeHtml(newTicket.owner)}</div>
          <div><b>Requester:</b> ${this.escapeHtml(newTicket.requester)}</div>
          <div><b>Status:</b> Open</div>
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

  private generateTicketNo() {
    const now = new Date();

    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    const seq = String(this.tickets.length + 1).padStart(3, '0');

    return `TK-${yy}${mm}${dd}-${seq}`;
  }

  private formatRequestDate(date: Date) {
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year} ${hh}:${mm}`;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}