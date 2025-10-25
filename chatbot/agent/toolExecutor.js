const API_BASE_URL = process.env.API_BASE_URL;

async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
}

export async function executeToolCall({ function: funcCall }) {
  const { name, arguments: args } = funcCall;
  console.log(`🔧 Executing tool: ${name}`, args);
  
  try {
    let data;
    
    switch (name) {
      // ==================== PROJECT TOOLS ====================
      case 'getAllProjects':
        data = await makeRequest('/projects');
        break;
        
      case 'getProjectById':
        data = await makeRequest(`/projects/${args.projectId}`);
        break;
        
      case 'searchProjectByName':
        data = await makeRequest(`/projects/search/${encodeURIComponent(args.name)}`);
        break;
        
      case 'getProjectSummary':
        data = await makeRequest(`/projects/${args.projectId}/summary`);
        break;
        
      case 'getProjectTasks':
        data = await makeRequest(`/projects/${args.projectId}/tasks`);
        break;
        
      case 'getProjectTeam':
        data = await makeRequest(`/projects/${args.projectId}/team`);
        break;
        
      // ==================== TASK TOOLS ====================
      case 'getAllTasks':
        data = await makeRequest('/tasks');
        break;
        
      case 'getTaskById':
        data = await makeRequest(`/tasks/id/${args.taskId}`);
        break;
        
      case 'getUserTasks':
        data = await makeRequest(`/tasks/user/${args.userId}`);
        break;
        
      case 'getTasksByStatus':
        data = await makeRequest(`/tasks/status/${args.status}`);
        break;
        
      case 'getTasksByPriority':
        data = await makeRequest(`/tasks/priority/${args.priority}`);
        break;
        
      case 'getOverdueTasks':
        data = await makeRequest('/tasks/overdue/all');
        break;
        
      // ==================== USER TOOLS ====================
      case 'getAllUsers':
        data = await makeRequest('/users');
        break;
        
      case 'getUserById':
        data = await makeRequest(`/users/${args.userId}`);
        break;
        
      case 'searchUserByName':
        data = await makeRequest(`/users/search/${encodeURIComponent(args.name)}`);
        break;
        
      case 'getUserWorkload':
        data = await makeRequest(`/users/${args.userId}/workload`);
        break;
        
      // ==================== ANALYTICS TOOLS ====================
      case 'getDashboardStats':
        data = await makeRequest('/analytics/dashboard');
        break;
        
      // ==================== UPDATE TOOLS ====================
      case 'updateTask':
        const taskBody = {};
        if (args.status) taskBody.status = args.status;
        if (args.assigned_to) taskBody.assigned_to = args.assigned_to;
        if (args.priority) taskBody.priority = args.priority;
        if (args.due_date) taskBody.due_date = args.due_date;
        if (args.title) taskBody.title = args.title;
        if (args.description) taskBody.description = args.description;
        data = await makeRequest(`/tasks/${args.taskId}`, 'PUT', taskBody);
        break;
        
      case 'updateProject':
        const projectBody = {};
        if (args.name) projectBody.name = args.name;
        if (args.status) projectBody.status = args.status;
        if (args.deadline) projectBody.deadline = args.deadline;
        data = await makeRequest(`/projects/${args.projectId}`, 'PUT', projectBody);
        break;
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Tool execution error for ${name}:`, error);
    return { success: false, error: error.message };
  }
}