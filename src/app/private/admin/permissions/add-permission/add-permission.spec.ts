import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPermission } from './add-permission';

describe('AddPermission', () => {
  let component: AddPermission;
  let fixture: ComponentFixture<AddPermission>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddPermission]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPermission);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
