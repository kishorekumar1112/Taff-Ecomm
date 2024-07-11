import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../services/users.service';
import { OtpValidationService } from '../../services/otp-validation.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {

  signUpForm: FormGroup;
  maxDate: Date;
  otpSent = false;
  otpValid = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private otpService: OtpValidationService
  ) {
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
      // terms: [false, [Validators.requiredTrue]],
      otp: ['']
    });

    this.maxDate = new Date();
  }

  get f() {
    return this.signUpForm.controls;
  }

  get email() {
    return this.signUpForm.get('email');
  }

  get otp() {
    return this.signUpForm.get('otp');
  }

  sendOtp() {
    const emailValue = this.email?.value;
    if (emailValue) {
      this.otpService.sendOtp(emailValue).subscribe(
        (response: any) => {
          this.otpSent = true;
          this.snackBar.open('OTP sent successfully. Check your email.', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        (error: any) => {
          console.error('Error sending OTP', error);
          this.snackBar.open('Error sending OTP. Please try again later.', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      );
    }
  }

  validateOtp() {
    const emailValue = this.email?.value;
    const otpValue = this.otp?.value;
    if (emailValue && otpValue) {
      this.otpService.validateOtp(emailValue, otpValue).subscribe(
        (response: any) => {
          this.otpValid = response.valid;
          if (this.otpValid) {
            this.snackBar.open('OTP is valid! You can proceed with sign-up.', 'Close', {
              duration: 3000,
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
          } else {
            this.snackBar.open('Invalid OTP. Please try again.', 'Close', {
              duration: 3000,
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        },
        (error: any) => {
          console.error('Error validating OTP', error);
          this.snackBar.open('Invalid OTP. Please try again.', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      );
    }
  }

  onSubmit() {
    if (this.signUpForm.valid && this.otpValid) {
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
          this.snackBar.open('User registered successfully!', 'Close', {
            duration: 3000, // duration in milliseconds
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        (error: any) => {
          this.snackBar.open('Error registering user. Please try again.', 'Close', {
            duration: 3000, // duration in milliseconds
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      );
    } else {
      console.log('Form is invalid or OTP is not validated');
    }
  }

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
