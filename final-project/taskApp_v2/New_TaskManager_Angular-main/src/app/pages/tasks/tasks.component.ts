import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { MatModule } from '../../AppModules/mat/mat.module';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { EditModalComponent } from '../../edit-modal/edit-modal.component';
import{tasksData} from '../../db'
import { Task } from '../../data-model';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ApiService } from '../../api.service';


interface Subtask {
  name: string;
  done: boolean;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule,MatModule,FormsModule,EditModalComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent {
  value='';
  searchValue = '';
  selectedFilter = 'all';
  displayedColumns: string[] = ['completed', 'title', 'subtasks', 'status', 'priority', 'dateRange', 'actions'];
;
  dataSource: MatTableDataSource<Task>=new MatTableDataSource<Task>();
  ifIsHandset: boolean = false;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dayFilter: string = 'all';
  statusFilter: string = 'all';
  
  constructor(private dialog: MatDialog,private breakpointObserver: BreakpointObserver, private taskService: ApiService) {

    
    this.loadTasks();
  }
  loadTasks(): void {

    this.taskService.getTasks().subscribe(
      (tasksData) => {
        this.dataSource = new MatTableDataSource<Task>(tasksData);
        console.log(tasksData); // Debugging line
        
      },
      (error) => {
        console.error('Error fetching tasks:', error);
      }
    );
  }

  
  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.ifIsHandset = result.matches;
        if (this.ifIsHandset) {
          this.displayedColumns = ['completed', 'title', 'status', 'actions'];
        } else {
          this.displayedColumns = ['completed', 'title', 'subtasks', 'status', 'priority', 'dateRange', 'actions'];
        }
      });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.filterPredicate = this.customFilterPredicate;
  }

  applyFilter() {
    this.dataSource.filter = JSON.stringify({
      day: this.dayFilter,
      status: this.statusFilter,
      search: this.searchValue
    });
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  customFilterPredicate(data: Task, filter: string): boolean {
    const filterObject = JSON.parse(filter);
    const day = filterObject.day;
    const status = filterObject.status;
    const search = filterObject.search.toLowerCase();
  
    let matchesDay = true;
    if (day !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
  
      if (day === 'today') {
        matchesDay = data.startDate <= today && data.endDate >= today;
      } else if (day === 'tomorrow') {
        matchesDay = data.startDate <= tomorrow && data.endDate >= tomorrow;
      }
    }
  
    let matchesStatus = true;
    if (status !== 'all') {
      matchesStatus = data.status.toLowerCase() === status.toLowerCase();
    }
  
    let matchesSearch = true;
    if (search) {
      matchesSearch = data.title.toLowerCase().includes(search) ||
                      data.desc.toLowerCase().includes(search);
    }
  
    return matchesDay && matchesStatus && matchesSearch;
  }
  
  

  openEditDialog(task: Task): void {
    const dialogRef = this.dialog.open(EditModalComponent, {
    width: '90%',
    maxWidth: '600px',
      data: {...task}
    });
    

    dialogRef.afterClosed().subscribe((result: Task | undefined) => {
      if (result) {
        // Update the task in your data source
        const index = this.dataSource.data.findIndex(t => t === task);
        if (index !== -1) {
          this.dataSource.data[index] = result;
          this.dataSource._updateChangeSubscription(); // Notify the table of the data change
        }
      }
    });
    
  }
  openAddTaskDialog(): void {
    const dialogRef = this.dialog.open(EditModalComponent, {
      width: '500px',
      data: null
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Add the new task to the data source
        this.dataSource.data = [...this.dataSource.data, result];
      }
    });
  }
  
  onTaskCompletionChange(task: Task, completed: boolean) {
    task.status = completed ? 'Completed' : 'In Progress';
    task.subtasks.forEach(subtask => subtask.done = completed);
  
    // Call the update API
    this.taskService.updateTask(task).subscribe(
      updatedTask => {
        // Update the local data source after successful update
        const index = this.dataSource.data.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          this.dataSource.data[index] = updatedTask;
          this.dataSource._updateChangeSubscription();
        }
      },
      error => {
        console.error('Failed to update task:', error);
        
      }
    );
  }
  
  onSubtaskCompletionChange(task: Task, subtask: Subtask, completed: boolean) {
    subtask.done = completed;
    const allSubtasksDone = task.subtasks.every(sub => sub.done);
    task.status = allSubtasksDone ? 'Completed' : 'In Progress';
  
    // Call the update API
    this.taskService.updateTask(task).subscribe(
      updatedTask => {
        const index = this.dataSource.data.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          this.dataSource.data[index] = updatedTask;
          this.dataSource._updateChangeSubscription();
        }
      },
      error => {
        console.error('Failed to update task:', error);
      
      }
    );
  }
  deleteTask(task: Task) {
    // Call the delete API
    this.taskService.deleteTask(task.id).subscribe(
      () => {
        // Remove the task from the local data source after successful deletion
        const index = this.dataSource.data.indexOf(task);
        if (index > -1) {
          this.dataSource.data.splice(index, 1);
          this.dataSource._updateChangeSubscription();
        }
      },
      error => {
        console.error('Failed to delete task:', error);
      }
    );
  }

  clearSearch() {
    this.searchValue = '';
    this.applyFilter();  // Reapply the filter to reset the list to the default state
  }
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'in progress':
        return 'status-in-progress';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  }
  
  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      case 'critical':
          return 'priority-critical';
      case 'normal':
            return 'priority-normal';
      default:
        return '';
    }
  }


}
