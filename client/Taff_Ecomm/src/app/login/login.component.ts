import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      // recaptcha: [null, Validators.required] // Assuming recaptcha is required
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      // Handle form submission logic here
      console.log(this.loginForm.value);
      this.router.navigate(['/sign up']); // Navigate to sign-up page
    } else {
      // Mark all fields as touched to display validation messages
      this.loginForm.markAllAsTouched();
    }
  }
}
