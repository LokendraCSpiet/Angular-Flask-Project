import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { TaskComponent } from './task/task.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { AboutUsComponent } from './about-us/about-us.component';

export const routes: Routes = [
    { path:"", pathMatch:"full", redirectTo:"/Home"},
    { path:"Home", component: HomeComponent},
    { path: "Login", component: LoginComponent},
    { path: "Tasks", component:TaskComponent},
    { path: "Contact", component:ContactUsComponent},
    { path: "About", component:AboutUsComponent},
    { path: '**', redirectTo: '/Login' },
];