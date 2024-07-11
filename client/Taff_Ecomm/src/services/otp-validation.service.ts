import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OtpValidationService {
  private apiUrl = 'http://localhost:3000';  // Replace with your backend API URL

  constructor(private http: HttpClient) {}

  sendOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-otp`, { email });
  }

  validateOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/validate-otp`, { email, otp });
  }
}

