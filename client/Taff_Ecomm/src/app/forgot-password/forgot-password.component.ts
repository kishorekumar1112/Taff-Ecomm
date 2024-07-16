import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { OtpValidationService } from '../../services/otp-validation.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  forgotPasswordForm: FormGroup;
  isEmailEntered = false;
  hidePassword = true;
  otpSent = false;
  otpValid = false;

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar, private router: Router, private otpService: OtpValidationService) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required],
      otp: ['']
    });
  }

  get f() {
    return this.forgotPasswordForm.controls;
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  get otp() {
    return this.forgotPasswordForm.get('otp');
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  // sendOrResendOtp() {
  //   if (this.otpSent) {
  //     this.resendOtp();
  //   } else {
  //     this.sendOtp();
  //   }
  // }

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

  // resendOtp() {
  //   const emailValue = this.email?.value;
  //   if (emailValue) {
  //     this.otpService.resendOtp(emailValue).subscribe(
  //       (response: any) => {
  //         this.otpSent = true;
  //         this.snackBar.open('OTP sent successfully. Check your email.', '', {
  //           duration: 3000,
  //           verticalPosition: 'top',
  //           panelClass: ['success-snackbar']
  //         });
  //       },
  //       (error: any) => {
  //         console.error('Error sending OTP', error);
  //         this.snackBar.open('Error sending OTP. Please try again later.', '', {
  //           duration: 3000,
  //           verticalPosition: 'top',
  //           panelClass: ['error-snackbar']
  //         });
  //       }
  //     );
  //   }
  // }

  validateOtp() {
    const emailValue = this.email?.value;
    const otpValue = this.otp?.value;
    if (emailValue && otpValue) {
      this.otpService.validateOtp(emailValue, otpValue).subscribe(
        (response: any) => {
          this.otpValid = response.valid;
          if (this.otpValid) {
            this.snackBar.open('OTP is valid! You can proceed with reset password.', '', {
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

  resetPassword() {
    const emailValue = this.email?.value;
    const otpValue = this.otp?.value;
    const newPassword = this.forgotPasswordForm.get('newPassword')?.value;
    const confirmNewPassword = this.forgotPasswordForm.get('confirmNewPassword')?.value;

    if (emailValue && otpValue && newPassword && confirmNewPassword) {
      this.otpService.resetPassword(emailValue, otpValue, newPassword, confirmNewPassword).subscribe(
        (response: any) => {
          this.snackBar.open('Password reset successfully.', '', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/login']);
        },
        (error: any) => {
          console.error('Error resetting password', error);
          this.snackBar.open('Error resetting password. Please try again later.', '', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      );
    }
  }


  onSubmit() {
    if (this.forgotPasswordForm.valid && this.otpValid) {
      this.resetPassword();
      
    }
  }

}
