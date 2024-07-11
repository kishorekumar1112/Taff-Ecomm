import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../services/users.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {

  signUpForm: FormGroup;
  maxDate: Date;

  constructor(private fb: FormBuilder, private userService: UserService, private snackBar: MatSnackBar) {
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
      const dob = new Date(this.signUpForm.value.dob);
      const age = this.calculateAge(dob);
      
      if (age < 18) {
        this.snackBar.open('Employee must be greater than 18 years.', 'Close', {
          duration: 3000, // duration in milliseconds
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        return; // Prevent form submission
      }

      console.log('Form Submitted!', this.signUpForm.value);

      this.userService.registerUser(this.signUpForm.value).subscribe(
        (response: any) => {
          // console.log('User registered successfully!', response);
          // Handle success, e.g., show a success message
          this.snackBar.open('User registered successfully!', 'Close', {
            duration: 3000, // duration in milliseconds
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        (error: any) => {
          // console.error('Error registering user:', error);
          // Handle error, e.g., show an error message
          this.snackBar.open('Error registering user. Please try again.', 'Close', {
            duration: 3000, // duration in milliseconds
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      );
    } else {
      console.log('Form is invalid');
    }
  }

  // Helper method to calculate age
  calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }
}
