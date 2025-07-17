import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Login } from './components/login/login';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { AuthRoutingModule } from './auth-routing-module';
import { NotFound } from './components/not-found/not-found';



@NgModule({
  declarations: [
    Login,
    ForgotPassword,
    NotFound
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthRoutingModule,
  ]
})
export class AuthModule { }
