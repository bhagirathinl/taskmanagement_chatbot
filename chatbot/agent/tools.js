const tools = [
  // ==================== PROJECT TOOLS ====================
  {
    type: "function",
    function: {
      name: "getAllProjects",
      description: "Get a list of all projects with their IDs, names, status, and deadlines. Use this first to find project IDs.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getProjectById",
      description: "Get detailed information about a specific project by its ID",
      parameters: {
        type: "object",
        properties: {
          projectId: { 
            type: "string", 
            description: "The ID of the project" 
          }
        },
        required: ["projectId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchProjectByName",
      description: "Search for projects by name (partial match supported). Use this when user mentions a project name.",
      parameters: {
        type: "object",
        properties: {
          name: { 
            type: "string", 
            description: "Project name or partial name to search for" 
          }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getProjectSummary",
      description: "Get comprehensive summary of a project including task statistics, completion rates, and team member IDs",
      parameters: {
        type: "object",
        properties: {
          projectId: { 
            type: "string", 
            description: "The ID of the project" 
          }
        },
        required: ["projectId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getProjectTasks",
      description: "Get all tasks for a specific project with assignee details, status, priority, and due dates",
      parameters: {
        type: "object",
        properties: {
          projectId: { 
            type: "string", 
            description: "The ID of the project" 
          }
        },
        required: ["projectId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getProjectTeam",
      description: "Get all team members working on a project with their task counts and completion statistics",
      parameters: {
        type: "object",
        properties: {
          projectId: { 
            type: "string", 
            description: "The ID of the project" 
          }
        },
        required: ["projectId"]
      }
    }
  },

  // ==================== TASK TOOLS ====================
  {
    type: "function",
    function: {
      name: "getAllTasks",
      description: "Get all tasks across all projects with project names and assignee information",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getTaskById",
      description: "Get detailed information about a specific task",
      parameters: {
        type: "object",
        properties: {
          taskId: { 
            type: "string", 
            description: "The ID of the task" 
          }
        },
        required: ["taskId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getUserTasks",
      description: "Get all tasks assigned to a specific user with project information",
      parameters: {
        type: "object",
        properties: {
          userId: { 
            type: "string", 
            description: "The ID of the user" 
          }
        },
        required: ["userId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getTasksByStatus",
      description: "Get all tasks with a specific status (completed, in_progress, pending, blocked)",
      parameters: {
        type: "object",
        properties: {
          status: { 
            type: "string", 
            description: "Task status: completed, in_progress, pending, or blocked",
            enum: ["completed", "in_progress", "pending", "blocked"]
          }
        },
        required: ["status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getTasksByPriority",
      description: "Get all tasks with a specific priority level",
      parameters: {
        type: "object",
        properties: {
          priority: { 
            type: "string", 
            description: "Priority level: high, medium, or low",
            enum: ["high", "medium", "low"]
          }
        },
        required: ["priority"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getOverdueTasks",
      description: "Get all overdue tasks (past due date and not completed)",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },

  // ==================== USER TOOLS ====================
  {
    type: "function",
    function: {
      name: "getAllUsers",
      description: "Get a list of all users/team members",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getUserById",
      description: "Get detailed information about a specific user",
      parameters: {
        type: "object",
        properties: {
          userId: { 
            type: "string", 
            description: "The ID of the user" 
          }
        },
        required: ["userId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchUserByName",
      description: "Search for users by name (partial match supported)",
      parameters: {
        type: "object",
        properties: {
          name: { 
            type: "string", 
            description: "User name or partial name to search for" 
          }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getUserWorkload",
      description: "Get comprehensive workload summary for a user including total, completed, in-progress, pending, blocked, and overdue tasks",
      parameters: {
        type: "object",
        properties: {
          userId: { 
            type: "string", 
            description: "The ID of the user" 
          }
        },
        required: ["userId"]
      }
    }
  },

  // ==================== ANALYTICS TOOLS ====================
  {
    type: "function",
    function: {
      name: "getDashboardStats",
      description: "Get overall statistics including project counts, task counts by status, and total users",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },

  // ==================== UPDATE TOOLS ====================
  {
    type: "function",
    function: {
      name: "updateTask",
      description: "Update a task's status, assignee, priority, due date, title, or description",
      parameters: {
        type: "object",
        properties: {
          taskId: { 
            type: "string", 
            description: "The ID of the task to update" 
          },
          status: { 
            type: "string", 
            description: "New status (optional): completed, in_progress, pending, or blocked" 
          },
          assigned_to: { 
            type: "string", 
            description: "New assignee user ID (optional)" 
          },
          priority: { 
            type: "string", 
            description: "New priority (optional): high, medium, or low" 
          },
          due_date: { 
            type: "string", 
            description: "New due date (optional) in YYYY-MM-DD format" 
          }
        },
        required: ["taskId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "updateProject",
      description: "Update a project's name, status, or deadline",
      parameters: {
        type: "object",
        properties: {
          projectId: { 
            type: "string", 
            description: "The ID of the project to update" 
          },
          name: { 
            type: "string", 
            description: "New project name (optional)" 
          },
          status: { 
            type: "string", 
            description: "New status (optional): in_progress, completed, or pending" 
          },
          deadline: { 
            type: "string", 
            description: "New deadline (optional) in YYYY-MM-DD format" 
          }
        },
        required: ["projectId"]
      }
    }
  }
];

export default tools;