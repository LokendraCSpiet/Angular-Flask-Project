import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';

interface Task{
  id: number,
  title: string,
  description: string,
  status: string,
  due_date: string,
}
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://127.0.0.1:5000/tasks';

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('access_token');
    // console.log("token",token);
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getTasks(): Observable<Task[]>{
    return this.http.get<Task[]>(this.apiUrl);
  }

  getTask(taskId: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${taskId}`);  //, { headers: this.getHeaders() }
  }

  addTask(task: Task): Observable<any> {
    return this.http.post(this.apiUrl, task);
  }

  updateTask(taskId: number, task: Task): Observable<any> {
    return this.http.put(`${this.apiUrl}/${taskId}`, task);
  }

  deleteTask(taskId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${taskId}`);
  }

}
