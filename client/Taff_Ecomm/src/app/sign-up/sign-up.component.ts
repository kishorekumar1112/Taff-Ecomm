import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/users.service';
@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {

  signUpForm: FormGroup;
  maxDate: Date;

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.signUpForm = this.fb.group({
      // userId : ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      rolename: ['', [Validators.required]],
      location: ['', [Validators.required]],
      // password: ['', [Validators.required, Validators.minLength(6)]],
      // confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: ['', Validators.required],
      countryCode: ['', Validators.required],
      dob: ['', Validators.required],
      // dateOfJoining: [{ value: new Date(), disabled: true }],
      terms: [false, [Validators.requiredTrue]]
    });

    this.maxDate = new Date();
  }

  get f() {
    return this.signUpForm.controls;
  }

  // Add the onSubmit method
  onSubmit() {
    if (this.signUpForm.valid) {
      console.log('Form Submitted!', this.signUpForm.value);

      this.userService.registerUser(this.signUpForm.value).subscribe(
        (response: any) => {
          console.log('User registered successfully!', response);
          // Handle success, e.g., show a success message
        },
        (error: any) => {
          console.error('Error registering user:', error);
          // Handle error, e.g., show an error message
        }
      );
    } else {
      console.log('Form is invalid');
    }
  }
}
