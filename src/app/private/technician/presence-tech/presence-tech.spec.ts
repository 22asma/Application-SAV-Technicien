import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresenceTech } from './presence-tech';

describe('PresenceTech', () => {
  let component: PresenceTech;
  let fixture: ComponentFixture<PresenceTech>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PresenceTech]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PresenceTech);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
