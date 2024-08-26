import { Component, OnInit } from '@angular/core';
import { TaskService } from '../task.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


interface Task {
  id: number,
  title: string,
  description: string,
  status: string,
  due_date: string,
}

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task.component.html',
  styleUrl: './task.component.css'
  // styleUrls: ['./task.component.css'] // Use styleUrls for external stylesheets
})
export class TaskComponent implements OnInit {
  tasks: Task[] = [];
  statuses = ['All', 'Pending', 'Inprogress', 'Completed'];
  selectedStatus: string = 'All';
  filteredTasks: Task[] = [];
  isModalOpen = false;
  isTaskModalOpen = false;
  searchQuery: string = '';
  startDate: string = '';
  endDate: string = '';


  constructor(private taskService: TaskService) { }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe((tasks) => {
      this.tasks = tasks;
      this.updateFilteredTasks();
    });
  }

  deleteTask(taskId: number): void {
    const confirmation = window.confirm('Are you sure you want to delete this task?');
    if (confirmation) {
      this.taskService.deleteTask(taskId).subscribe(() => {
        this.loadTasks();
      });
    }
  }

  filterTasks(status: string): void {
    this.selectedStatus = status;
    this.updateFilteredTasks();
  }

  searchTasks(query: string): void {
    this.searchQuery = query;
    this.updateFilteredTasks();
  }

  filterByDate(startDate: string, endDate: string): void {
    this.startDate = startDate;
    this.endDate = endDate;
    this.updateFilteredTasks();
  }

  updateFilteredTasks(): void {
    this.filteredTasks = this.tasks
      .filter(task => this.selectedStatus === 'All' || task.status.toLowerCase() === this.selectedStatus.toLowerCase())
      .filter(task => task.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || task.description.toLowerCase().includes(this.searchQuery.toLowerCase()))
      .filter(task => {
        const taskDate = new Date(task.due_date);
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        return (!this.startDate || !this.endDate) || (taskDate >= start && taskDate <= end);
      });
  }

  // FOR ADD TASK MODAL
  openModal() {
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false;
  }
  
  newTask: Task = {
    id:0,
    title: '',
    description: '',
    status: 'Pending',
    due_date: '',
  };
  addTask(): void {
    // Add the new task to the task list
    this.taskService.addTask(this.newTask).subscribe(() => {
      this.loadTasks();
      // Reset the form and close the modal
      this.newTask = {
        id:0,
        title: '',
        description: '',
        status: 'Pending',
        due_date: ''
      };
      this.closeModal();
    });
  }
  
  // FOR SINGLE TASK MODEL AND GET TASK
  openTaskModal(taskId: number) {
    this.isTaskModalOpen = true;
    this.loadSelectedTask(taskId);
  }
  closeTaskModal() {
    this.isTaskModalOpen = false;
  }
  

  taskDetail: Task = {
    id: 0,
    title: '',
    description: '',
    status: '',
    due_date: ''
  };
  loadSelectedTask(taskId: number): void {
    this.taskService.getTask(taskId).subscribe((task) => {
      this.taskDetail = { ...task }; // Spread operator to copy task details
    });
  }

  
  updateTask(): void {
    if (this.taskDetail.id) {
      this.taskService.updateTask(this.taskDetail.id, this.taskDetail).subscribe(() => {
        this.loadTasks();
        this.closeTaskModal();
      });
    }
  }
}

