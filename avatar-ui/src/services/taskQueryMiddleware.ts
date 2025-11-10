/**
 * Task Query Middleware
 * Detects task-related queries and routes them to the appropriate API endpoints
 */

import {
  TaskManagementService,
  Task,
  ProjectSummary,
  UserWorkload,
  DashboardAnalytics,
} from './taskManagementService';

export interface QueryIntent {
  isTaskQuery: boolean;
  queryType:
    | 'all_tasks'
    | 'task_by_id'
    | 'tasks_by_user'
    | 'tasks_by_status'
    | 'overdue_tasks'
    | 'project_summary'
    | 'project_tasks'
    | 'user_workload'
    | 'dashboard'
    | 'all_projects'
    | 'unknown';
  parameters: {
    taskId?: number;
    userId?: number;
    projectId?: number;
    status?: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  };
  confidence: number;
}

export class TaskQueryMiddleware {
  private taskService: TaskManagementService;

  constructor(taskService: TaskManagementService) {
    this.taskService = taskService;
  }

  /**
   * Detect if a message is a task-related query and extract intent
   */
  detectIntent(message: string): QueryIntent {
    const lowerMessage = message.toLowerCase();

    // Check for task ID queries
    const taskIdMatch = lowerMessage.match(/task\s*(?:id|number|#)?\s*(\d+)|(?:task|id)\s*(\d+)/i);
    if (taskIdMatch) {
      const taskIdStr = taskIdMatch[1] || taskIdMatch[2] || '';
      const taskId = parseInt(taskIdStr);
      if (!isNaN(taskId)) {
        return {
          isTaskQuery: true,
          queryType: 'task_by_id',
          parameters: { taskId },
          confidence: 0.95,
        };
      }
    }

    // Check for user ID queries
    const userIdMatch = lowerMessage.match(/user\s*(?:id)?\s*(\d+)|tasks?\s+for\s+user\s+(\d+)/i);
    if (userIdMatch) {
      const userIdStr = userIdMatch[1] || userIdMatch[2] || '';
      const userId = parseInt(userIdStr);
      if (!isNaN(userId)) {
        return {
          isTaskQuery: true,
          queryType: 'tasks_by_user',
          parameters: { userId },
          confidence: 0.9,
        };
      }
    }

    // Check for project ID queries
    const projectIdMatch = lowerMessage.match(
      /project\s*(?:id)?\s*(\d+)|tasks?\s+for\s+project\s+(\d+)|project\s+(\d+)\s+tasks?/i,
    );
    if (projectIdMatch) {
      const projectIdStr = projectIdMatch[1] || projectIdMatch[2] || projectIdMatch[3] || '';
      const projectId = parseInt(projectIdStr);
      if (!isNaN(projectId)) {
        if (lowerMessage.includes('summary')) {
          return {
            isTaskQuery: true,
            queryType: 'project_summary',
            parameters: { projectId },
            confidence: 0.9,
          };
        }
        return {
          isTaskQuery: true,
          queryType: 'project_tasks',
          parameters: { projectId },
          confidence: 0.9,
        };
      }
    }

    // Check for workload queries
    if (lowerMessage.match(/workload|work\s+load|how\s+much\s+work/i)) {
      const userIdMatch = lowerMessage.match(/user\s*(\d+)/i);
      if (userIdMatch && userIdMatch[1]) {
        const userId = parseInt(userIdMatch[1]);
        if (!isNaN(userId)) {
          return {
            isTaskQuery: true,
            queryType: 'user_workload',
            parameters: { userId },
            confidence: 0.85,
          };
        }
      }
    }

    // Check for status-based queries
    const statusKeywords: Record<string, 'pending' | 'in_progress' | 'completed' | 'on_hold'> = {
      pending: 'pending',
      'in progress': 'in_progress',
      'in-progress': 'in_progress',
      active: 'in_progress',
      completed: 'completed',
      done: 'completed',
      finished: 'completed',
      'on hold': 'on_hold',
      'on-hold': 'on_hold',
      blocked: 'on_hold',
    };

    for (const [keyword, status] of Object.entries(statusKeywords)) {
      if (lowerMessage.includes(keyword)) {
        return {
          isTaskQuery: true,
          queryType: 'tasks_by_status',
          parameters: { status },
          confidence: 0.85,
        };
      }
    }

    // Check for overdue tasks
    if (lowerMessage.match(/overdue|over\s+due|late|past\s+due|missed\s+deadline/i)) {
      return {
        isTaskQuery: true,
        queryType: 'overdue_tasks',
        parameters: {},
        confidence: 0.9,
      };
    }

    // Check for dashboard/analytics
    if (lowerMessage.match(/dashboard|analytics|statistics|stats|overview|summary(?!\s+for)/i)) {
      return {
        isTaskQuery: true,
        queryType: 'dashboard',
        parameters: {},
        confidence: 0.8,
      };
    }

    // Check for all projects
    if (lowerMessage.match(/(?:all|list|show)\s+projects?|projects?\s+list/i)) {
      return {
        isTaskQuery: true,
        queryType: 'all_projects',
        parameters: {},
        confidence: 0.85,
      };
    }

    // Check for all tasks (general query)
    if (
      lowerMessage.match(
        /(?:all|show|list|get|view)\s+(?:the\s+)?tasks?|tasks?\s+(?:list|all)|what\s+(?:are\s+)?(?:the\s+)?tasks?/i,
      )
    ) {
      return {
        isTaskQuery: true,
        queryType: 'all_tasks',
        parameters: {},
        confidence: 0.75,
      };
    }

    // Not a task query
    return {
      isTaskQuery: false,
      queryType: 'unknown',
      parameters: {},
      confidence: 0,
    };
  }

  /**
   * Execute the detected query and get results
   */
  async executeQuery(intent: QueryIntent): Promise<unknown> {
    if (!intent.isTaskQuery) {
      throw new Error('Not a task query');
    }

    switch (intent.queryType) {
      case 'all_tasks':
        return await this.taskService.getAllTasks();

      case 'task_by_id':
        if (!intent.parameters.taskId) throw new Error('Task ID is required');
        return await this.taskService.getTaskById(intent.parameters.taskId);

      case 'tasks_by_user':
        if (!intent.parameters.userId) throw new Error('User ID is required');
        return await this.taskService.getTasksByUser(intent.parameters.userId);

      case 'tasks_by_status':
        if (!intent.parameters.status) throw new Error('Status is required');
        return await this.taskService.getTasksByStatus(intent.parameters.status);

      case 'overdue_tasks':
        return await this.taskService.getOverdueTasks();

      case 'project_summary':
        if (!intent.parameters.projectId) throw new Error('Project ID is required');
        return await this.taskService.getProjectSummary(intent.parameters.projectId);

      case 'project_tasks':
        if (!intent.parameters.projectId) throw new Error('Project ID is required');
        return await this.taskService.getProjectTasks(intent.parameters.projectId);

      case 'user_workload':
        if (!intent.parameters.userId) throw new Error('User ID is required');
        return await this.taskService.getUserWorkload(intent.parameters.userId);

      case 'dashboard':
        return await this.taskService.getDashboardAnalytics();

      case 'all_projects':
        return await this.taskService.getAllProjects();

      default:
        throw new Error(`Unknown query type: ${intent.queryType}`);
    }
  }

  /**
   * Format the query results into natural language for the avatar
   */
  formatResponse(intent: QueryIntent, data: unknown): string {
    switch (intent.queryType) {
      case 'all_tasks':
        return this.formatAllTasks(data as Task[]);

      case 'task_by_id':
        return this.formatTaskDetails(data as Task);

      case 'tasks_by_user':
        return this.formatUserTasks(data as Task[], intent.parameters.userId);

      case 'tasks_by_status':
        return this.formatTasksByStatus(data as Task[], intent.parameters.status);

      case 'overdue_tasks':
        return this.formatOverdueTasks(data as Task[]);

      case 'project_summary':
        return this.formatProjectSummary(data as ProjectSummary);

      case 'project_tasks':
        return this.formatProjectTasks(data as Task[], intent.parameters.projectId);

      case 'user_workload':
        return this.formatUserWorkload(data as UserWorkload);

      case 'dashboard':
        return this.formatDashboard(data as DashboardAnalytics);

      case 'all_projects':
        return this.formatAllProjects(data as any[]);

      default:
        return 'I found some information, but I am not sure how to present it.';
    }
  }

  /**
   * Format all tasks
   */
  private formatAllTasks(tasks: Task[]): string {
    if (tasks.length === 0) {
      return 'There are currently no tasks in the system.';
    }

    const summary = `I found ${tasks.length} task${tasks.length === 1 ? '' : 's'}. `;
    const taskList = tasks
      .slice(0, 5)
      .map(
        (task) =>
          `Task ${task.id}: ${task.description} (${task.status}, assigned to ${task.assigned_to_name}, due ${task.due_date})`,
      )
      .join('. ');

    const more = tasks.length > 5 ? ` And ${tasks.length - 5} more tasks.` : '';

    return summary + taskList + more;
  }

  /**
   * Format task details
   */
  private formatTaskDetails(task: Task): string {
    return `Task ${task.id}: ${task.description}. Status: ${task.status}. Assigned to: ${task.assigned_to_name} (${task.assigned_to_email}). Project: ${task.project_name}. Due date: ${task.due_date}. Last updated: ${task.updated_at}.`;
  }

  /**
   * Format user tasks
   */
  private formatUserTasks(tasks: Task[], userId?: number): string {
    if (tasks.length === 0) {
      return `User ${userId} has no tasks assigned.`;
    }

    const userName = tasks[0]?.assigned_to_name || `User ${userId}`;
    const summary = `${userName} has ${tasks.length} task${tasks.length === 1 ? '' : 's'}. `;

    const byStatus = {
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      on_hold: tasks.filter((t) => t.status === 'on_hold').length,
    };

    const statusSummary = `${byStatus.in_progress} in progress, ${byStatus.pending} pending, ${byStatus.completed} completed, ${byStatus.on_hold} on hold. `;

    const topTasks = tasks
      .slice(0, 3)
      .map((task) => `${task.description} (${task.status}, due ${task.due_date})`)
      .join('. ');

    return summary + statusSummary + topTasks;
  }

  /**
   * Format tasks by status
   */
  private formatTasksByStatus(tasks: Task[], status?: string): string {
    if (tasks.length === 0) {
      return `There are no tasks with status "${status}".`;
    }

    const summary = `I found ${tasks.length} ${status} task${tasks.length === 1 ? '' : 's'}. `;
    const taskList = tasks
      .slice(0, 5)
      .map(
        (task) =>
          `Task ${task.id}: ${task.description} (assigned to ${task.assigned_to_name}, due ${task.due_date})`,
      )
      .join('. ');

    const more = tasks.length > 5 ? ` And ${tasks.length - 5} more.` : '';

    return summary + taskList + more;
  }

  /**
   * Format overdue tasks
   */
  private formatOverdueTasks(tasks: Task[]): string {
    if (tasks.length === 0) {
      return 'Great news! There are no overdue tasks.';
    }

    const summary = `Alert! There are ${tasks.length} overdue task${tasks.length === 1 ? '' : 's'}. `;
    const taskList = tasks
      .slice(0, 5)
      .map(
        (task) =>
          `Task ${task.id}: ${task.description} (${task.status}, assigned to ${task.assigned_to_name}, was due ${task.due_date})`,
      )
      .join('. ');

    const more = tasks.length > 5 ? ` And ${tasks.length - 5} more overdue tasks.` : '';

    return summary + taskList + more;
  }

  /**
   * Format project summary
   */
  private formatProjectSummary(summary: ProjectSummary): string {
    return `Project "${summary.project_name}" summary: Status is ${summary.project_status}, deadline is ${summary.deadline}. Total tasks: ${summary.total_tasks}. Breakdown: ${summary.completed_tasks} completed, ${summary.in_progress_tasks} in progress, ${summary.pending_tasks} pending, ${summary.blocked_tasks} blocked. Team members: ${summary.team_member_ids}.`;
  }

  /**
   * Format project tasks
   */
  private formatProjectTasks(tasks: Task[], projectId?: number): string {
    if (tasks.length === 0) {
      return `Project ${projectId} has no tasks.`;
    }

    const projectName = tasks[0]?.project_name || `Project ${projectId}`;
    const summary = `${projectName} has ${tasks.length} task${tasks.length === 1 ? '' : 's'}. `;

    const taskList = tasks
      .slice(0, 5)
      .map(
        (task) =>
          `Task ${task.id}: ${task.description} (${task.status}, assigned to ${task.assigned_to_name}, due ${task.due_date})`,
      )
      .join('. ');

    const more = tasks.length > 5 ? ` And ${tasks.length - 5} more tasks.` : '';

    return summary + taskList + more;
  }

  /**
   * Format user workload
   */
  private formatUserWorkload(workload: UserWorkload): string {
    return `${workload.name}'s workload: Total tasks: ${workload.total_tasks}. Breakdown: ${workload.completed_tasks} completed, ${workload.in_progress_tasks} in progress, ${workload.pending_tasks} pending, ${workload.blocked_tasks} blocked. Overdue tasks: ${workload.overdue_tasks}. Email: ${workload.email}. Role: ${workload.role}.`;
  }

  /**
   * Format dashboard analytics
   */
  private formatDashboard(analytics: DashboardAnalytics): string {
    return `Dashboard Overview: Projects - ${analytics.projects.total_projects} total, ${analytics.projects.active_projects} active, ${analytics.projects.completed_projects} completed. Tasks - ${analytics.tasks.total_tasks} total, ${analytics.tasks.completed_tasks} completed, ${analytics.tasks.in_progress_tasks} in progress, ${analytics.tasks.pending_tasks} pending, ${analytics.tasks.blocked_tasks} blocked, ${analytics.tasks.overdue_tasks} overdue. Total users: ${analytics.users.total_users}.`;
  }

  /**
   * Format all projects
   */
  private formatAllProjects(projects: any[]): string {
    if (projects.length === 0) {
      return 'There are currently no projects in the system.';
    }

    const summary = `I found ${projects.length} project${projects.length === 1 ? '' : 's'}. `;
    const projectList = projects
      .slice(0, 5)
      .map((project) => `Project ${project.id}: ${project.name} (${project.status}, deadline ${project.deadline})`)
      .join('. ');

    const more = projects.length > 5 ? ` And ${projects.length - 5} more projects.` : '';

    return summary + projectList + more;
  }

  /**
   * Process a user message - detect intent, execute query, format response
   */
  async processMessage(message: string): Promise<{ isHandled: boolean; response?: string }> {
    const intent = this.detectIntent(message);

    if (!intent.isTaskQuery || intent.confidence < 0.7) {
      return { isHandled: false };
    }

    try {
      const data = await this.executeQuery(intent);
      const response = this.formatResponse(intent, data);

      return {
        isHandled: true,
        response,
      };
    } catch (error) {
      console.error('TaskQueryMiddleware error:', error);
      return {
        isHandled: true,
        response: `I encountered an error while fetching task information: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
