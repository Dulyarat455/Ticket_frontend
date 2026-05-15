import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketCenterComponent } from './ticket-center.component';

describe('TicketCenterComponent', () => {
  let component: TicketCenterComponent;
  let fixture: ComponentFixture<TicketCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketCenterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TicketCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
