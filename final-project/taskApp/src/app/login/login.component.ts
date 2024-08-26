import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


interface User {
  username: string;
  password: string;
}
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  user: User = { username: '', password: '' };
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) { }

  login(): void {
    console.log("logins",this.user);
    if (this.user.username != ''){
    this.authService.login(this.user).subscribe(
      response => {
        console.log("getToken",response.access_token);
        localStorage.setItem('access_token', response.access_token);
        this.router.navigate(['/Tasks']);
      },
      error => {
        this.errorMessage = 'Invalid credentials';
      }
    );
    }else{
      alert("Please Enter Details")
    }
  }

  register(): void {
    this.authService.register(this.user).subscribe(
      response => {
        // this.login();
        this.user.username = ''
        this.user.password = ''
        this.errorMessage = 'User Successfully Register';
      },
      error => {
        this.errorMessage = 'Registration failed';
      }
    );
  }
}
