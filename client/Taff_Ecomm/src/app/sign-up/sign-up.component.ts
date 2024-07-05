import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {

  signUpForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.signUpForm = this.fb.group({
      // userId : ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      location: ['', [Validators.required]],
      // password: ['', [Validators.required, Validators.minLength(6)]],
      // confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: ['', Validators.required],
      countryCode: ['', Validators.required],
      dob: ['', Validators.required],
      // dateOfJoining: [{ value: new Date(), disabled: true }],
      terms: [false, [Validators.requiredTrue]]
    });
  }

  get f() {
    return this.signUpForm.controls;
  }

  // Add the onSubmit method
  onSubmit() {
    if (this.signUpForm.valid) {
      console.log('Form Submitted!', this.signUpForm.value);
    } else {
      console.log('Form is invalid');
    }
  }
}
