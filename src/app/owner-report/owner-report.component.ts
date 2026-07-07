import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


type ReportStatus = 'Wait' | 'On Process' | 'Complete' | 'Deny';
type ReportPriority = 'Low' | 'Medium' | 'High' | 'Critical';

type ProjectReportRow = {
  projectName: string;
  total: number;
  wait: number;
  onProcess: number;
  complete: number;
  deny: number;
  avgLeadTime: string;
};

type AgingTicket = {
  ticketNo: string;
  projectName: string;
  problemTitle: string;
  requester: string;
  priority: ReportPriority;
  status: ReportStatus;
  agingHours: number;
};

type ActivityRow = {
  ticketNo: string;
  action: string;
  by: string;
  time: string;
  status: ReportStatus;
};


type TrendMonthRow = {
  month: string;
  total: number;
};

type PrioritySummaryRow = {
  priority: ReportPriority;
  count: number;
};


@Component({
  selector: 'app-owner-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-report.component.html',
  styleUrl: './owner-report.component.css'
})
export class OwnerReportComponent {

  dateFrom = '';
  dateTo = '';
  selectedProject = 'All';
  selectedStatus: ReportStatus | 'All' = 'All';

  projects = ['All', 'Calling', 'Material Control', 'Plating Report', 'PBASS Sync'];

  summary = {
    total: 42,
    wait: 8,
    onProcess: 11,
    complete: 19,
    deny: 4,
    avgLeadTime: '5.4 hrs'
  };

  projectRows: ProjectReportRow[] = [
    {
      projectName: 'Calling',
      total: 15,
      wait: 3,
      onProcess: 4,
      complete: 7,
      deny: 1,
      avgLeadTime: '4.2 hrs'
    },
    {
      projectName: 'Material Control',
      total: 12,
      wait: 2,
      onProcess: 4,
      complete: 5,
      deny: 1,
      avgLeadTime: '6.1 hrs'
    },
    {
      projectName: 'Plating Report',
      total: 9,
      wait: 2,
      onProcess: 2,
      complete: 4,
      deny: 1,
      avgLeadTime: '5.8 hrs'
    },
    {
      projectName: 'PBASS Sync',
      total: 6,
      wait: 1,
      onProcess: 1,
      complete: 3,
      deny: 1,
      avgLeadTime: '3.7 hrs'
    }
  ];

  agingTickets: AgingTicket[] = [
    {
      ticketNo: 'TK202607060001',
      projectName: 'Calling',
      problemTitle: 'ขึ้น 404 รอบ 2',
      requester: 'test [LE519]',
      priority: 'Medium',
      status: 'On Process',
      agingHours: 18
    },
    {
      ticketNo: 'TK202607040003',
      projectName: 'Calling',
      problemTitle: 'เข้า web ไม่ได้',
      requester: 'test [LE519]',
      priority: 'Medium',
      status: 'Wait',
      agingHours: 44
    },
    {
      ticketNo: 'TK202607040004',
      projectName: 'Material Control',
      problemTitle: 'Stock Out แล้ว Storage ไม่ Update',
      requester: 'PD Line A',
      priority: 'High',
      status: 'On Process',
      agingHours: 31
    }
  ];

  activities: ActivityRow[] = [
    {
      ticketNo: 'TK202607060001',
      action: 'Owner updated status to On Process',
      by: 'test [LE519]',
      time: '06/07/2026 16:07',
      status: 'On Process'
    },
    {
      ticketNo: 'TK202607040002',
      action: 'Ticket completed',
      by: 'test [LE519]',
      time: '04/07/2026 11:29',
      status: 'Complete'
    },
    {
      ticketNo: 'TK202607040001',
      action: 'Ticket denied',
      by: 'test [LE519]',
      time: '04/07/2026 11:26',
      status: 'Deny'
    }
  ];


  trendRows: TrendMonthRow[] = [
    { month: 'Feb', total: 3 },
    { month: 'Mar', total: 5 },
    { month: 'Apr', total: 4 },
    { month: 'May', total: 9 },
    { month: 'Jun', total: 7 },
    { month: 'Jul', total: 14 }
  ];
  
  priorityRows: PrioritySummaryRow[] = [
    { priority: 'Low', count: 8 },
    { priority: 'Medium', count: 22 },
    { priority: 'High', count: 9 },
    { priority: 'Critical', count: 3 }
  ];

  get completeRate() {
    if (!this.summary.total) return 0;
    return Math.round((this.summary.complete / this.summary.total) * 100);
  }

  get denyRate() {
    if (!this.summary.total) return 0;
    return Math.round((this.summary.deny / this.summary.total) * 100);
  }


  get maxTrendTotal() {
    const values = this.trendRows.map(r => r.total);
    return Math.max(...values, 1);
  }
  
  get maxPriorityTotal() {
    const values = this.priorityRows.map(r => r.count);
    return Math.max(...values, 1);
  }
  

  
  getTrendHeight(value: number) {
    return Math.max(12, Math.round((value / this.maxTrendTotal) * 100));
  }
  
  getPriorityPercent(value: number) {
    return Math.round((value / this.maxPriorityTotal) * 100);
  }

  getStatusClass(status: ReportStatus | string) {
    const value = String(status || '').toLowerCase().replaceAll(' ', '-');

    if (value === 'wait') return 'wait';
    if (value === 'on-process') return 'on-process';
    if (value === 'complete') return 'complete';
    if (value === 'deny') return 'deny';

    return value;
  }

  getPriorityClass(priority: ReportPriority | string) {
    return String(priority || '').toLowerCase();
  }

  getBarPercent(value: number, total: number) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }

  clearFilter() {
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedProject = 'All';
    this.selectedStatus = 'All';
  }



}
