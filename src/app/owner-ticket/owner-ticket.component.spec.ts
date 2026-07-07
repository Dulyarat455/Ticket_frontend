import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerTicketComponent } from './owner-ticket.component';

describe('OwnerTicketComponent', () => {
  let component: OwnerTicketComponent;
  let fixture: ComponentFixture<OwnerTicketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerTicketComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerTicketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
