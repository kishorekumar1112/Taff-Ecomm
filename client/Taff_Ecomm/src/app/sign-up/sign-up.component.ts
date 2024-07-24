import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UserService } from '../../services/users.service';
import { OtpValidationService } from '../../services/otp-validation.service';
import { countryCodeService } from '../../services/countryCode.service';
import { HttpClient } from '@angular/common/http';

export function phoneNumberLengthValidator(maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value && value.length > maxLength) {
      return { maxLengthExceeded: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit {
  signUpForm: FormGroup;
  maxDate: Date;
  otpSent = false;
  otpValid = false;
  roles: any[] = [];
  countryCodes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private otpService: OtpValidationService,
    private countryCodeService : countryCodeService,
    private router: Router,
    private http: HttpClient
  ) {
    this.signUpForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      rolename: ['', [Validators.required]],
      location: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, phoneNumberLengthValidator(10)]],
      countryCode: ['', Validators.required],
      dob: ['', Validators.required],
      otp: [''],
    
    });

    this.maxDate = new Date();
  }

  ngOnInit(): void {
    this.fetchRoles();
    this.fetchCountryCodes();
  }

  fetchRoles(): void {
    this.http.get<any[]>('http://localhost:3000/roles').subscribe(
      data => {
        this.roles = data;
      },
      error => {
        console.error('Error fetching roles:', error);
      }
    );
  }

  fetchCountryCodes(): void {
    this.countryCodeService.getCountryCodes().subscribe(
      data => {
        this.countryCodes = data
          .filter((country: any) => country.idd && country.idd.root)
          .map((country: any) => ({
            country: country.name.common,
            code: `${country.idd.root}${country.idd.suffixes ? country.idd.suffixes[0] : ''}`
          }));
      },
      error => {
        console.error('Error fetching country codes', error);
      }
    );
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
          this.snackBar.open('OTP sent successfully. Check your email.', '', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        },
        (error: any) => {
          console.error('Error sending OTP', error);
          this.snackBar.open('Error sending OTP. Please try again later.', '', {
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
            this.snackBar.open('OTP is valid! You can proceed with sign-up.', '', {
              duration: 3000,
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
          } else {
            this.snackBar.open('Invalid OTP. Please try again.', '', {
              duration: 3000,
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        },
        (error: any) => {
          console.error('Error validating OTP', error);
          this.snackBar.open('Invalid OTP. Please try again.', '', {
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
        this.snackBar.open('Employee must be greater than 18 years.', '', {
          duration: 3000,
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        return;
      }

      console.log('Form Submitted!', this.signUpForm.value);

      this.userService.registerUser(this.signUpForm.value).subscribe(
        (response: any) => {
          this.snackBar.open('User registered successfully!', '', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/home'])
        },
        (error: any) => {
          this.snackBar.open('Error registering user. Please try again.', '', {
            duration: 3000,
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
