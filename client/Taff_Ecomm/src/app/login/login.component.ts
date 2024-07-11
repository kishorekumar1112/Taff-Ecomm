import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/users.service';
import { MatSnackBar } from '@angular/material/snack-bar';


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
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
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
          duration: 3000, // duration in milliseconds
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['error-snackbar']
        });
      }
      );} else {
      // Mark all fields as touched to display validation messages
      this.loginForm.markAllAsTouched();
    }
  }
}
