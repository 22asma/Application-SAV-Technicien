import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechDetails } from './tech-details';

describe('TechDetails', () => {
  let component: TechDetails;
  let fixture: ComponentFixture<TechDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TechDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
