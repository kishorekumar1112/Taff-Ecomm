import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/users.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  UserService: any;

  constructor(private fb: FormBuilder, private router: Router, private userService: UserService) {}

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
          console.log('Login successfully!', response);
          this.router.navigate(['/sign-up']);
          // Handle success, e.g., show a success message
        },
      // Handle form submission logic here
      // console.log(this.loginForm.value);
       // Navigate to sign-up page
      );} else {
      // Mark all fields as touched to display validation messages
      this.loginForm.markAllAsTouched();
    }
  }
}
