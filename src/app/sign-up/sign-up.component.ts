import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

import config from '../../config';

type UserRole = 'user' | 'owner' | 'admin' | string;

type UserRow = {
  id: number;
  name: string;
  empNo: string;
  rfId: string;
  role: UserRole;
  status: string;

  mapGroupSectionUserId?: number | null;

  sectionId?: number | null;
  sectionName?: string;

  groupId?: number | null;
  groupName?: string;
};

type MasterOption = {
  id: number;
  name: string;
};

type CreateUserForm = {
  name: string;
  password: string;
  empNo: string;
  rfId: string;
  role: UserRole;
  sectionId: number | null;
  groupId: number | null;
};

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent implements OnInit {
  constructor(private http: HttpClient) {}

  searchText = '';
  isLoading = false;
  isLoadingMaster = false;

  users: UserRow[] = [];
  sections: MasterOption[] = [];
  groups: MasterOption[] = [];

  ngOnInit() {
    this.loadUsers();
    this.loadMasterData();
  }

  get totalUsers() {
    return this.users.length;
  }

  get totalAdmin() {
    return this.users.filter(u => this.normalizeRole(u.role) === 'admin').length;
  }

  get totalOwner() {
    return this.users.filter(u => this.normalizeRole(u.role) === 'owner').length;
  }

  get totalUser() {
    return this.users.filter(u => this.normalizeRole(u.role) === 'user').length;
  }

  get filteredUsers() {
    const keyword = this.searchText.trim().toLowerCase();

    if (!keyword) return this.users;

    return this.users.filter(user =>
      String(user.name || '').toLowerCase().includes(keyword) ||
      String(user.empNo || '').toLowerCase().includes(keyword) ||
      String(user.rfId || '').toLowerCase().includes(keyword) ||
      String(user.role || '').toLowerCase().includes(keyword) ||
      String(user.sectionName || '').toLowerCase().includes(keyword) ||
      String(user.groupName || '').toLowerCase().includes(keyword)
    );
  }

  loadUsers() {
    this.isLoading = true;

    this.http.get<any>(`${config.apiServer}/api/user/list`).subscribe({
      next: (res) => {
        const rows = res.results || [];

        this.users = rows.map((item: any) => ({
          id: Number(item.id),
          name: item.name || '-',
          empNo: item.empNo || '-',
          rfId: item.rfId || '-',
          role: item.role || 'user',
          status: item.status || '-',

          mapGroupSectionUserId: item.mapGroupSectionUserId || null,

          sectionId: item.sectionId || null,
          sectionName: item.sectionName || '-',

          groupId: item.groupId || null,
          groupName: item.groupName || '-'
        }));
      },
      error: (err) => {
        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Load User Failed',
          text:
            err.error?.message ||
            err.error?.error ||
            'ไม่สามารถโหลดข้อมูล User ได้'
        });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  loadMasterData() {
    this.isLoadingMaster = true;

    this.http.get<any>(`${config.apiServer}/api/section/list`).subscribe({
      next: (res) => {
        const rows = res.results || res.data || [];

        this.sections = rows.map((item: any) => ({
          id: Number(item.id),
          name: item.name || '-'
        }));
      },
      error: (err) => {
        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Load Section Failed',
          text:
            err.error?.message ||
            err.error?.error ||
            'ไม่สามารถโหลดข้อมูล Section ได้'
        });
      }
    });

    this.http.get<any>(`${config.apiServer}/api/group/list`).subscribe({
      next: (res) => {
        const rows = res.results || res.data || [];

        this.groups = rows.map((item: any) => ({
          id: Number(item.id),
          name: item.name || '-'
        }));
      },
      error: (err) => {
        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Load Group Failed',
          text:
            err.error?.message ||
            err.error?.error ||
            'ไม่สามารถโหลดข้อมูล Group ได้'
        });
      },
      complete: () => {
        this.isLoadingMaster = false;
      }
    });
  }

  openCreateUserModal() {
    if (!this.sections.length || !this.groups.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Master Data Missing',
        text: 'ไม่พบข้อมูล Section หรือ Group กรุณาตรวจสอบ API /api/section/list และ /api/group/list'
      });
      return;
    }

    const sectionOptions = this.sections.map(section => `
      <option value="${section.id}">
        ${this.escapeHtml(section.name)}
      </option>
    `).join('');
    
    const groupOptions = this.groups.map(group => `
      <option value="${group.id}">
        ${this.escapeHtml(group.name)}
      </option>
    `).join('');

    const modalStyle = `
      <style>
        .signup-swal-popup {
          border-radius: 26px !important;
          padding: 0 0 24px 0 !important;
          overflow: hidden !important;
        }

        .signup-modal-head {
          padding: 22px 24px;
          background: linear-gradient(135deg, #061024, #1d4ed8);
          color: #ffffff;
          text-align: left;
        }

        .signup-modal-head h3 {
          margin: 0;
          font-size: 22px;
          font-weight: 950;
        }

        .signup-modal-head p {
          margin: 8px 0 0;
          color: #dbeafe;
          font-size: 13px;
          font-weight: 800;
        }

        .signup-modal-body {
          padding: 20px 22px 4px;
          text-align: left;
        }

        .signup-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .signup-form-row {
          display: grid;
          gap: 7px;
        }

        .signup-form-row.full {
          grid-column: 1 / -1;
        }

        .signup-form-row label {
          color: #334155;
          font-size: 12px;
          font-weight: 950;
        }

        .signup-form-row label span {
          color: #ef4444;
        }

        .signup-form-row input,
        .signup-form-row select {
          width: 100%;
          height: 42px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #f8fafc;
          color: #0f172a;
          padding: 0 12px;
          outline: none;
          font-size: 13px;
          font-weight: 850;
        }

        .signup-form-row input:focus,
        .signup-form-row select:focus {
          background: #ffffff;
          border-color: #60a5fa;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.10);
        }

        .signup-note {
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 14px;
          background: #eff6ff;
          color: #334155;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.6;
        }

        .swal2-actions {
          gap: 14px !important;
          margin-top: 18px !important;
        }

        .signup-confirm-btn,
        .signup-cancel-btn {
          min-width: 120px !important;
          min-height: 42px !important;
          border-radius: 14px !important;
          border: 0 !important;
          font-size: 13px !important;
          font-weight: 950 !important;
        }

        .signup-confirm-btn {
          color: #ffffff !important;
          background: linear-gradient(135deg, #2563eb, #0891b2) !important;
        }

        .signup-cancel-btn {
          color: #475569 !important;
          background: #e2e8f0 !important;
        }

        @media (max-width: 720px) {
          .signup-form-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;

    Swal.fire<CreateUserForm>({
      width: 760,
      showCancelButton: true,
      confirmButtonText: 'Create Member',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      customClass: {
        popup: 'signup-swal-popup',
        confirmButton: 'signup-confirm-btn',
        cancelButton: 'signup-cancel-btn'
      },
      html: `
        ${modalStyle}

        <div class="signup-modal-head">
          <h3>Add New Member</h3>
          <p>สร้าง User ใหม่ พร้อม Map Section และ Group ในขั้นตอนเดียว</p>
        </div>

        <div class="signup-modal-body">
          <div class="signup-form-grid">

            <div class="signup-form-row">
              <label>Name <span>*</span></label>
              <input id="signup-name" type="text" placeholder="Employee name" />
            </div>

            <div class="signup-form-row">
              <label>Password <span>*</span></label>
              <input id="signup-password" type="password" placeholder="Password" />
            </div>

            <div class="signup-form-row">
              <label>Employee No.</label>
              <input id="signup-empNo" type="text" placeholder="Example: LE519" />
            </div>

            <div class="signup-form-row">
              <label>RFID</label>
              <input id="signup-rfId" type="text" placeholder="RFID card no." />
            </div>

            <div class="signup-form-row">
              <label>Role</label>
              <select id="signup-role">
                <option value="user">User</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div class="signup-form-row">
              <label>Section <span>*</span></label>
              <select id="signup-sectionId">
                <option value="">-- Select Section --</option>
                ${sectionOptions}
              </select>
            </div>

            <div class="signup-form-row">
              <label>Group <span>*</span></label>
              <select id="signup-groupId">
                <option value="">-- Select Group --</option>
                ${groupOptions}
              </select>
            </div>

          </div>

          <div class="signup-note">
            ระบบจะสร้าง User และ Map ไปยัง Section / Group ที่เลือกให้อัตโนมัติ
          </div>
        </div>
      `,
      preConfirm: () => {
        const name = (document.getElementById('signup-name') as HTMLInputElement)?.value.trim();
        const password = (document.getElementById('signup-password') as HTMLInputElement)?.value.trim();
        const empNo = (document.getElementById('signup-empNo') as HTMLInputElement)?.value.trim();
        const rfId = (document.getElementById('signup-rfId') as HTMLInputElement)?.value.trim();
        const role = (document.getElementById('signup-role') as HTMLSelectElement)?.value;
        const sectionIdRaw = (document.getElementById('signup-sectionId') as HTMLSelectElement)?.value;
        const groupIdRaw = (document.getElementById('signup-groupId') as HTMLSelectElement)?.value;

        const sectionId = Number(sectionIdRaw);
        const groupId = Number(groupIdRaw);

        if (!name) {
          Swal.showValidationMessage('กรุณากรอก Name');
          return false;
        }

        if (!password) {
          Swal.showValidationMessage('กรุณากรอก Password');
          return false;
        }

        if (!sectionId || Number.isNaN(sectionId)) {
          Swal.showValidationMessage('กรุณาเลือก Section');
          return false;
        }

        if (!groupId || Number.isNaN(groupId)) {
          Swal.showValidationMessage('กรุณาเลือก Group');
          return false;
        }

        return {
          name,
          password,
          empNo,
          rfId,
          role,
          sectionId,
          groupId
        };
      }
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;

      this.createUser(result.value);
    });
  }

  createUser(form: CreateUserForm) {
    Swal.fire({
      title: 'Creating...',
      text: 'กำลังสร้าง Member',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.http.post<any>(`${config.apiServer}/api/user/create`, form).subscribe({
      next: async () => {
        Swal.close();

        await Swal.fire({
          icon: 'success',
          title: 'Create Success',
          text: 'เพิ่ม Member สำเร็จ'
        });

        this.loadUsers();
      },
      error: (err) => {
        Swal.close();

        const message = err.error?.message || err.error?.error || '';

        if (message === 'user_already') {
          Swal.fire({
            icon: 'warning',
            title: 'User Already Exists',
            text: 'มี User นี้อยู่ในระบบแล้ว'
          });
          return;
        }

        if (message === 'section_not_found') {
          Swal.fire({
            icon: 'warning',
            title: 'Section Not Found',
            text: 'ไม่พบ Section นี้'
          });
          return;
        }

        if (message === 'group_not_found') {
          Swal.fire({
            icon: 'warning',
            title: 'Group Not Found',
            text: 'ไม่พบ Group นี้'
          });
          return;
        }

        if (message === 'missing_required_fields') {
          Swal.fire({
            icon: 'warning',
            title: 'Missing Required Fields',
            text: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ'
          });
          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Create Failed',
          text: message || 'ไม่สามารถเพิ่ม Member ได้'
        });

        console.error(err);
      }
    });
  }

  clearSearch() {
    this.searchText = '';
  }

  getRoleClass(role: UserRole | string) {
    return this.normalizeRole(role);
  }

  private normalizeRole(role: UserRole | string | undefined | null) {
    return String(role || 'user')
      .toLowerCase()
      .replaceAll(' ', '-');
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