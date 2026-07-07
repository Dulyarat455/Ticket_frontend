import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerReportComponent } from './owner-report.component';

describe('OwnerReportComponent', () => {
  let component: OwnerReportComponent;
  let fixture: ComponentFixture<OwnerReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
