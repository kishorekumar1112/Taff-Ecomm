import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OtpValidationService {
  private apiUrl = 'http://localhost:3000'; 

  constructor(private http: HttpClient) {}

  sendOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-otp`, { email });
  }

  resendOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-reset-otp`, { email })
  }

  validateOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/validate-otp`, { email, otp });
  }

  resetPassword(email: string, newPassword: string, confirmNewPassword: string ): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { email,newPassword, confirmNewPassword });
  }
}

