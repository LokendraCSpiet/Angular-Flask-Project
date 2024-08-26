import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, RouterLink, CommonModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'taskApp';
  routes = ['Home','Tasks','Contact', 'Login']
  selectedRoute:string = '';
  // token = localStorage.getItem('access_token')


  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    localStorage.setItem('access_token', '');
    
    this.router.events.subscribe(() => {
      this.updateSelectedRoute();
    });
  }

  updateSelectedRoute() {
    const currentUrl = this.router.url.split('/')[1];
    this.selectedRoute = this.routes.includes(currentUrl) ? currentUrl : 'Login';
  }

  selectRoute(route: string) {
    this.selectedRoute = route;
    // console.log(this.selectedRoute)
    if (this.selectedRoute == 'Tasks' && localStorage.getItem('access_token') == ''){
      this.selectedRoute = 'Login'
      this.router.navigate(['/Login']);
    }
  }
}