/**
 * Task Management API Service
 * Provides methods to interact with the task management system API
 */

export interface Task {
  id: number;
  project_id: number;
  assigned_to: number;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  due_date: string;
  updated_at: string;
  project_name: string;
  assigned_to_name: string;
  assigned_to_email?: string;
  project_status?: string;
}

export interface Project {
  id: number;
  name: string;
  client_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  deadline: string;
  created_at: string;
}

export interface ProjectSummary {
  id: number;
  project_name: string;
  project_status: string;
  deadline: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  blocked_tasks: number;
  team_member_ids: string;
}

export interface UserWorkload {
  id: number;
  name: string;
  email: string;
  role: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  blocked_tasks: number;
  overdue_tasks: number;
}

export interface DashboardAnalytics {
  projects: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
  };
  tasks: {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    pending_tasks: number;
    blocked_tasks: number;
    overdue_tasks: number;
  };
  users: {
    total_users: number;
  };
}

export class TaskManagementService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Update the base URL for the task management API
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchApi<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error(`TaskManagementService error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    return this.fetchApi<Task[]>('/tasks');
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: number): Promise<Task> {
    return this.fetchApi<Task>(`/tasks/id/${taskId}`);
  }

  /**
   * Get tasks for a specific user
   */
  async getTasksByUser(userId: number): Promise<Task[]> {
    return this.fetchApi<Task[]>(`/tasks/user/${userId}`);
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status: 'pending' | 'in_progress' | 'completed' | 'on_hold'): Promise<Task[]> {
    return this.fetchApi<Task[]>(`/tasks/status/${status}`);
  }

  /**
   * Get all overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    return this.fetchApi<Task[]>('/tasks/overdue/all');
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    return this.fetchApi<Project[]>('/projects');
  }

  /**
   * Get project summary with task statistics
   */
  async getProjectSummary(projectId: number): Promise<ProjectSummary> {
    return this.fetchApi<ProjectSummary>(`/projects/${projectId}/summary`);
  }

  /**
   * Get tasks for a specific project
   */
  async getProjectTasks(projectId: number): Promise<Task[]> {
    return this.fetchApi<Task[]>(`/projects/${projectId}/tasks`);
  }

  /**
   * Get user workload
   */
  async getUserWorkload(userId: number): Promise<UserWorkload> {
    return this.fetchApi<UserWorkload>(`/users/${userId}/workload`);
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    return this.fetchApi<DashboardAnalytics>('/analytics/dashboard');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.fetchApi<{ status: string; timestamp: string }>('/health');
  }
}

// Export singleton instance
export const taskManagementService = new TaskManagementService();
