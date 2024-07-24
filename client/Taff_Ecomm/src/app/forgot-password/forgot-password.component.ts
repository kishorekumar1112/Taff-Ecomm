import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/users.service';
import { OtpValidationService } from '../../services/otp-validation.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  forgotPasswordForm: FormGroup;
  hidePassword = true;
  otpSent = false;
  otpValid = false;

  constructor(
    private fb: FormBuilder, 
    private snackBar: MatSnackBar, 
    private router: Router, 
    private route: ActivatedRoute, 
    private userService: UserService, 
    private otpService: OtpValidationService
  ) {
    this.forgotPasswordForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required],
      otp: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const username = params['username'];
      if (username) {
        this.forgotPasswordForm.get('username')?.setValue(username);
        this.fetchEmail(username);
      }
    });
  }

  fetchEmail(username: string): void {
    this.userService.getUserEmailByUsername(username).subscribe(
      (response: any) => {
        this.forgotPasswordForm.get('email')?.setValue(response.email);
      },
      (error: any) => {
        this.snackBar.open('Username not found', '', {
          duration: 3000,
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    );
  }

  sendOtp(): void {
    const emailValue = this.forgotPasswordForm.get('email')?.value;
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

  resendOtp() {
    const emailValue = this.forgotPasswordForm.get('email')?.value;
    if (emailValue) {
      this.otpService.resendOtp(emailValue).subscribe(
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
          this.snackBar.open('User not found.', '', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      );
    }
  }


  validateOtp(): void {
    const emailValue = this.forgotPasswordForm.get('email')?.value;
    const otpValue = this.forgotPasswordForm.get('otp')?.value;
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

  resetPassword(): void {
    const emailValue = this.forgotPasswordForm.get('email')?.value;
    // const otpValue = this.forgotPasswordForm.get('otp')?.value;
    const newPassword = this.forgotPasswordForm.get('newPassword')?.value;
    const confirmNewPassword = this.forgotPasswordForm.get('confirmNewPassword')?.value;
    // const username = this.forgotPasswordForm.get('username')?.value;

    if (newPassword !== confirmNewPassword) {
      this.snackBar.open('Passwords do not match.', '', {
        duration: 3000,
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (emailValue && newPassword && confirmNewPassword) {
      this.otpService.resetPassword(emailValue, newPassword, confirmNewPassword).subscribe(
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

  onSubmit(): void {
    if (this.forgotPasswordForm.valid && this.otpValid) {
      this.resetPassword();
    } else {
      this.forgotPasswordForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
