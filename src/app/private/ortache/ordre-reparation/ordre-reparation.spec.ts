import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdreReparation } from './ordre-reparation';

describe('OrdreReparation', () => {
  let component: OrdreReparation;
  let fixture: ComponentFixture<OrdreReparation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrdreReparation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdreReparation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
