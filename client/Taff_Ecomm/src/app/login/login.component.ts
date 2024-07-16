import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/users.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export function userNameLengthValidator(maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value && value.length > maxLength) {
      return { maxLengthExceeded: true };
    }
    return null;
  };
}

export function passwordLengthValidator(maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value && value.length > maxLength) {
      return { maxLengthExceeded: true };
    }
    return null;
  };
}


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  UserService: any;

  constructor(private fb: FormBuilder, private router: Router, private userService: UserService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(8), userNameLengthValidator(30)]],
      password: ['', [Validators.required, Validators.minLength(6), passwordLengthValidator(25)]],
      // recaptcha: [null, Validators.required] // Assuming recaptcha is required
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {

      this.userService.loginUser(this.loginForm.value).subscribe(
        (response: any) => {
          this.snackBar.open('Login Successful', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/sign-up'])
        },
       (error: any) => {
        this.snackBar.open('Login Failed!. Invalid Username or Password', 'Close', {
          duration: 3000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['error-snackbar']
        });
      }
      );} else {
      this.loginForm.markAllAsTouched();
    }
  }
}
