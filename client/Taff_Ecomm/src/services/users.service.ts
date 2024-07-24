import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:3000'; 

  constructor(private http: HttpClient) { }

  registerUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-employee`, userData);
  }
  
  loginUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, userData);
  }

  getUserEmailByUsername(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/email/${username}`)
  }
  

}
