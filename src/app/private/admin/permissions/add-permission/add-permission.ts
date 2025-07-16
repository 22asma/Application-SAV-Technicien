import { Component, HostBinding, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-permission',
  standalone: false,
  templateUrl: './add-permission.html',
  styleUrl: './add-permission.css'
})
export class AddPermission {
  permissionForm: FormGroup;
  isMainPermission: boolean;
  @HostBinding('@modalAnimation') animation = true;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddPermission>,
    @Inject(MAT_DIALOG_DATA) public data: { isMainPermission: boolean, mainPermissionId?: string }
  ) {
    this.isMainPermission = data.isMainPermission;
    
    this.permissionForm = this.fb.group({
      name: ['', Validators.required],
      ...(this.isMainPermission ? {} : { mainPermissionId: [data.mainPermissionId] })
    });
  }

  onSubmit(): void {
    if (this.permissionForm.valid) {
      this.dialogRef.close(this.permissionForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

}
