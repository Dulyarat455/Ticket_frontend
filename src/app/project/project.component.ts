import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import config from '../../config';




type ProjectMemberRow = {
  id: number;
  projectId: number;
  userId: number;
  name: string;
  empNo: string;
  display: string;
  email: string;
  phone: string;
  timeStmp?: string;
};

type ProjectRow = {
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

  // latest ProjectStatus
  projectState?: string;
  projectStateTime?: string | null;

  members: ProjectMemberRow[];
  memberCount: number;
};



type CreateProjectForm = {
  name: string;
  description: string;
  email: string;
  phone: string;
  userId: number;
};

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent implements OnInit {
  constructor(private http: HttpClient) {}

  projects: ProjectRow[] = [];
  searchText = '';
  isLoading = false;

  userId: number | null = null;

  expandedProjectId: number | null = null;
  users: any[] = [];

  ngOnInit() {
    this.userId = Number(localStorage.getItem('ticketPress_userId')) || null;
    this.loadProjects();
    this.loadUsers();
  }

  get filteredProjects() {
    const keyword = this.searchText.trim().toLowerCase();

    if (!keyword) return this.projects;

    return this.projects.filter(p =>
      p.name?.toLowerCase().includes(keyword) ||
      p.description?.toLowerCase().includes(keyword) ||
      p.email?.toLowerCase().includes(keyword) ||
      p.phone?.toLowerCase().includes(keyword)
    );
  }


  getProjectStateClass(state?: string) {
    const value = (state || '').toLowerCase();
  
    if (value === 'online') return 'online';
    if (value === 'maintenance') return 'maintenance';
    if (value === 'offline') return 'offline';
  
    return 'unknown';
  }

 
  loadProjects() {
    this.isLoading = true;

    this.http.get<any>(`${config.apiServer}/api/project/list`).subscribe({
      next: (res) => {
        this.projects = res.results || [];
      },
      error: (err) => {
        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Load Project Failed',
          text: err.error?.message || err.error?.error || 'ไม่สามารถโหลดข้อมูล Project ได้'
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  async openCreateProjectModal() {
    if (this.userId == null) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing User ID',
        text: 'ไม่พบข้อมูล User ID กรุณาเข้าสู่ระบบใหม่'
      });
      return;
    }

    const currentUserId = this.userId;

    const modalStyle = `
      <style>
        .project-swal-popup {
          border-radius: 26px !important;
          padding: 0 0 24px 0 !important;
          overflow: hidden;
        }

        .project-swal-title {
          padding: 24px 28px 6px !important;
          color: #0f172a !important;
          font-size: 26px !important;
          font-weight: 950 !important;
        }

        .project-swal-confirm {
          border-radius: 14px !important;
          background: linear-gradient(135deg, #2563eb, #0891b2) !important;
          color: #ffffff !important;
          font-weight: 950 !important;
          padding: 11px 22px !important;
          border: 0 !important;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.22) !important;
        }

        .project-swal-cancel {
          border-radius: 14px !important;
          background: #e2e8f0 !important;
          color: #475569 !important;
          font-weight: 950 !important;
          padding: 11px 22px !important;
          border: 0 !important;
        }

        .swal2-actions {
          gap: 16px !important;
          margin-top: 18px !important;
          margin-bottom: 24px !important;
        }

        .swal2-actions .swal2-styled {
          margin: 0 !important;
        }

        .project-modal {
          text-align: left;
          padding: 6px 8px 14px;
        }

        .project-modal-header {
          margin-bottom: 18px;
          padding: 16px;
          border-radius: 18px;
          background: linear-gradient(135deg, #eff6ff, #ecfeff);
          border: 1px solid #bfdbfe;
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .project-modal-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          font-size: 20px;
          flex: 0 0 auto;
        }

        .project-modal-label {
          color: #2563eb;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .project-modal-title {
          color: #0f172a;
          font-size: 18px;
          font-weight: 950;
          line-height: 1.35;
        }

        .project-modal-sub {
          margin-top: 5px;
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.5;
        }

        .project-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .project-field {
          margin-bottom: 14px;
        }

        .project-field label {
          display: block;
          margin-bottom: 7px;
          color: #334155;
          font-size: 13px;
          font-weight: 950;
        }

        .project-field label span {
          color: #ef4444;
        }

        .project-input,
        .project-textarea {
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

        .project-input:focus,
        .project-textarea:focus {
          border-color: rgba(37, 99, 235, 0.45);
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.10);
        }

        .project-textarea {
          resize: vertical;
          min-height: 92px;
        }

        .project-modal-note {
          margin-top: 2px;
          padding: 14px;
          border-radius: 16px;
          background: #f1f5f9;
          color: #334155;
          font-size: 13px;
          line-height: 1.65;
          font-weight: 850;
        }

        .project-success-box {
          text-align: left;
          line-height: 1.8;
          padding: 6px 8px 12px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 750;
        }

        .project-success-box b {
          color: #334155;
        }

        @media (max-width: 720px) {
          .project-modal-grid {
            grid-template-columns: 1fr;
          }

          .project-modal-header {
            flex-direction: column;
          }
        }
      </style>
    `;

    const result = await Swal.fire({
      title: 'Add Project',
      width: 720,
      showCancelButton: true,
      confirmButtonText: 'Save Project',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      focusConfirm: false,
      customClass: {
        popup: 'project-swal-popup',
        title: 'project-swal-title',
        confirmButton: 'project-swal-confirm',
        cancelButton: 'project-swal-cancel'
      },
      html: `
        ${modalStyle}

        <div class="project-modal">
          <div class="project-modal-header">
            <div class="project-modal-icon">
              <i class="fas fa-sitemap"></i>
            </div>

            <div>
              <div class="project-modal-label">Project Master</div>
              <div class="project-modal-title">Create New Project</div>
              <div class="project-modal-sub">
                เพิ่ม Project ที่สามารถรับ Ticket จาก User และ route ไปหา Owner ได้
              </div>
            </div>
          </div>

          <div class="project-field">
            <label>Project Name <span>*</span></label>
            <input
              id="projectName"
              class="project-input"
              placeholder="เช่น Material Control System"
            />
          </div>

          <div class="project-field">
            <label>Description</label>
            <textarea
              id="projectDescription"
              class="project-textarea"
              rows="3"
              placeholder="อธิบายรายละเอียดของ Project หรือ Module ที่ดูแล"
            ></textarea>
          </div>

          <div class="project-modal-grid">
            <div class="project-field">
              <label>Email</label>
              <input
                id="projectEmail"
                class="project-input"
                placeholder="owner-support@company.local"
              />
            </div>

            <div class="project-field">
              <label>Phone</label>
              <input
                id="projectPhone"
                class="project-input"
                placeholder="เบอร์โทร หรือเบอร์ติดต่อภายใน"
              />
            </div>
          </div>

        </div>
      `,
      preConfirm: () => {
        const name = (document.getElementById('projectName') as HTMLInputElement)?.value.trim();
        const description = (document.getElementById('projectDescription') as HTMLTextAreaElement)?.value.trim();
        const email = (document.getElementById('projectEmail') as HTMLInputElement)?.value.trim();
        const phone = (document.getElementById('projectPhone') as HTMLInputElement)?.value.trim();

        if (!name) {
          Swal.showValidationMessage('กรุณากรอก Project Name');
          return false;
        }

        const form: CreateProjectForm = {
          name,
          description: description || '',
          email: email || '',
          phone: phone || '',
          userId: currentUserId
        };

        return form;
      }
    });

    if (!result.isConfirmed || !result.value) return;

    const form = result.value as CreateProjectForm;
    this.createProject(form, modalStyle);
  }

  createProject(form: CreateProjectForm, modalStyle: string) {
    this.isLoading = true;

    this.http.post<any>(`${config.apiServer}/api/project/create`, form).subscribe({
      next: async (res) => {
        if (res.message === 'add_project_success') {
          await Swal.fire({
            icon: 'success',
            title: 'Project Created',
            buttonsStyling: false,
            confirmButtonText: 'OK',
            customClass: {
              popup: 'project-swal-popup',
              title: 'project-swal-title',
              confirmButton: 'project-swal-confirm'
            },
            html: `
              ${modalStyle}

              <div class="project-success-box">
                <div><b>Project:</b> ${this.escapeHtml(form.name)}</div>
                <div><b>Email:</b> ${this.escapeHtml(form.email || '-')}</div>
                <div><b>Phone:</b> ${this.escapeHtml(form.phone || '-')}</div>
              </div>
            `
          });

          this.loadProjects();
          return;
        }

        Swal.fire({
          icon: 'info',
          title: 'Result',
          text: res.message || 'Unknown response'
        });
      },
      error: (err) => {
        console.error(err);

        const message = err.error?.message || err.error?.error || 'ไม่สามารถเพิ่ม Project ได้';

        if (message === 'Project_name_already') {
          Swal.fire({
            icon: 'warning',
            title: 'Project Already Exists',
            text: 'มี Project นี้อยู่ในระบบแล้วสำหรับ User คนนี้'
          });
          return;
        }

        if (message === 'missing_required_fields') {
          Swal.fire({
            icon: 'warning',
            title: 'Missing Required Fields',
            text: 'กรุณากรอก Project Name และตรวจสอบ User ID'
          });
          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Create Project Failed',
          text: message
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }





  canAddMember(project: ProjectRow) {
    return this.userId != null && project.userId === this.userId;
  }
  
  toggleMembers(project: ProjectRow) {
    this.expandedProjectId =
      this.expandedProjectId === project.id ? null : project.id;
  }
  
  loadUsers() {
    this.http.get<any>(`${config.apiServer}/api/user/list`).subscribe({
      next: (res) => {
        this.users = res.results || [];
      },
      error: (err) => {
        console.error(err);
      }
    });
  }


  
  async openAddMemberModal(project: ProjectRow) {
    if (!this.canAddMember(project)) return;
  
    if (!this.users.length) {
      this.loadUsers();
    }
  
    const userOptions = this.users
      .map(u => `
        <option value="${u.id}">
          ${this.escapeHtml(u.name || '-')} ${u.empNo ? `[${this.escapeHtml(u.empNo)}]` : ''}
        </option>
      `)
      .join('');
  
    const result = await Swal.fire({
      title: 'Add Member',
      width: 620,
      showCancelButton: true,
      confirmButtonText: 'Add Member',
      cancelButtonText: 'Cancel',
      html: `
        <div style="text-align:left">
          <div style="margin-bottom:14px">
            <b>Project:</b> ${this.escapeHtml(project.name)}
          </div>
  
          <label>User <span style="color:red">*</span></label>
          <select id="memberUserId" class="swal2-input" style="width:100%">
            <option value="">Select user</option>
            ${userOptions}
          </select>
  
          <label>Email</label>
          <input id="memberEmail" class="swal2-input" placeholder="email">
  
          <label>Phone</label>
          <input id="memberPhone" class="swal2-input" placeholder="phone">
        </div>
      `,
      preConfirm: () => {
        const userId = Number((document.getElementById('memberUserId') as HTMLSelectElement)?.value || 0);
        const email = (document.getElementById('memberEmail') as HTMLInputElement)?.value.trim();
        const phone = (document.getElementById('memberPhone') as HTMLInputElement)?.value.trim();
  
        if (!userId) {
          Swal.showValidationMessage('กรุณาเลือก User');
          return false;
        }
  
        return {
          projectId: project.id,
          userId,
          email: email || '',
          phone: phone || ''
        };
      }
    });
  
    if (!result.isConfirmed || !result.value) return;
  
    this.http.post<any>(`${config.apiServer}/api/project/addMember`, result.value).subscribe({
      next: async () => {
        await Swal.fire({
          icon: 'success',
          title: 'Add Member Success'
        });
  
        this.loadProjects();
      },
      error: (err) => {
        const message = err.error?.message || err.error?.error || 'เพิ่ม Member ไม่สำเร็จ';
  
        Swal.fire({
          icon: 'error',
          title: 'Add Member Failed',
          text: message
        });
      }
    });
  }






  clearSearch() {
    this.searchText = '';
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