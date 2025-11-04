/**
 * Bulletin Generator Service with AI Integration (ES6 Module)
 * Generates personalized news bulletins using templates OR AI
 * Set USE_AI_BULLETIN=true to use OpenAI, false for templates
 */

import axios from 'axios';
import OpenAI from 'openai';

// Configuration
const TASKS_API_BASE_URL = process.env.API_BASE_URL || 'http://app:3000';
const USE_AI_BULLETIN = process.env.USE_AI_BULLETIN === 'true';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize OpenAI client if using AI mode
let openai = null;
if (USE_AI_BULLETIN && OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY
  });
  console.log('✨ AI Bulletin Generation: ENABLED');
} else if (USE_AI_BULLETIN && !OPENAI_API_KEY) {
  console.warn('⚠️  USE_AI_BULLETIN is true but OPENAI_API_KEY is not set. Falling back to templates.');
} else {
  console.log('📝 Template Bulletin Generation: ENABLED');
}

/**
 * Fetch user data from Tasks API
 */
async function fetchUserData(userId) {
  try {
    const response = await axios.get(`${TASKS_API_BASE_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error.message);
    throw new Error('Failed to fetch user data');
  }
}

/**
 * Fetch user's tasks
 */
async function fetchUserTasks(userId) {
  try {
    const response = await axios.get(`${TASKS_API_BASE_URL}/tasks/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tasks for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * Fetch user's projects (for clients)
 */
async function fetchUserProjects(userId) {
  try {
    const response = await axios.get(`${TASKS_API_BASE_URL}/projects`);
    const allProjects = response.data;
    return allProjects.filter(project => project.client_id === userId);
  } catch (error) {
    console.error(`Error fetching projects for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * Fetch project tasks for progress calculation
 */
async function fetchProjectTasks(projectId) {
  try {
    const response = await axios.get(`${TASKS_API_BASE_URL}/projects/${projectId}/tasks`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tasks for project ${projectId}:`, error.message);
    return [];
  }
}

/**
 * Analyze task urgency based on due date
 */
function analyzeTaskUrgency(tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const urgent = [];
  const dueSoon = [];
  const upcoming = [];

  tasks.forEach(task => {
    if (!task.due_date || task.status === 'completed') return;

    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      urgent.push({ ...task, daysOverdue: Math.abs(daysUntilDue) });
    } else if (daysUntilDue === 0) {
      urgent.push({ ...task, dueToday: true });
    } else if (daysUntilDue <= 3) {
      dueSoon.push({ ...task, daysUntilDue });
    } else {
      upcoming.push(task);
    }
  });

  return { urgent, dueSoon, upcoming };
}

/**
 * Generate greeting based on time of day
 */
function generateGreeting(userName) {
  const hour = new Date().getHours();
  let timeOfDay;

  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'night';
  }

  return `Good ${timeOfDay}, ${userName}!`;
}

/**
 * Generate bulletin for EMPLOYEE role using TEMPLATES
 */
function generateEmployeeBulletinTemplate(user, tasks, urgencyAnalysis) {
  const { urgent, dueSoon, upcoming } = urgencyAnalysis;
  
  const greeting = generateGreeting(user.name);
  const sections = [greeting];

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (activeTasks.length === 0) {
    sections.push("Great news! You have no active tasks at the moment. Enjoy your day!");
    return {
      greeting,
      summary: "No active tasks",
      fullScript: sections.join(' '),
      metadata: {
        totalTasks: 0,
        urgentTasks: 0,
        dueSoonTasks: 0,
        generatedBy: 'template'
      }
    };
  }

  sections.push(`Here's your task briefing.`);
  sections.push(`You have ${activeTasks.length} active ${activeTasks.length === 1 ? 'task' : 'tasks'}.`);

  if (urgent.length > 0) {
    sections.push('');
    sections.push(`URGENT: ${urgent.length} ${urgent.length === 1 ? 'task requires' : 'tasks require'} immediate attention.`);
    
    urgent.slice(0, 2).forEach(task => {
      if (task.dueToday) {
        sections.push(`${task.description} is due today.`);
      } else if (task.daysOverdue) {
        sections.push(`${task.description} is ${task.daysOverdue} ${task.daysOverdue === 1 ? 'day' : 'days'} overdue.`);
      }
    });
  }

  if (dueSoon.length > 0) {
    sections.push('');
    sections.push(`Coming up: ${dueSoon.length} ${dueSoon.length === 1 ? 'task is' : 'tasks are'} due within the next 3 days.`);
    
    if (dueSoon.length <= 2) {
      dueSoon.forEach(task => {
        sections.push(`${task.description} is due in ${task.daysUntilDue} ${task.daysUntilDue === 1 ? 'day' : 'days'}.`);
      });
    }
  }

  const inProgress = activeTasks.filter(t => t.status === 'in_progress').length;
  const pending = activeTasks.filter(t => t.status === 'pending').length;

  if (inProgress > 0 || pending > 0) {
    sections.push('');
    if (inProgress > 0) {
      sections.push(`${inProgress} ${inProgress === 1 ? 'task is' : 'tasks are'} currently in progress.`);
    }
    if (pending > 0) {
      sections.push(`${pending} ${pending === 1 ? 'task is' : 'tasks are'} waiting to be started.`);
    }
  }

  if (completedTasks.length > 0) {
    sections.push('');
    sections.push(`Well done! You've completed ${completedTasks.length} ${completedTasks.length === 1 ? 'task' : 'tasks'} recently.`);
  }

  sections.push('');
  if (urgent.length > 0) {
    sections.push("Focus on the urgent items first. You've got this!");
  } else {
    sections.push("Have a productive day!");
  }

  return {
    greeting,
    summary: `${activeTasks.length} active tasks, ${urgent.length} urgent`,
    urgent: urgent.length > 0 ? urgent[0].description : null,
    fullScript: sections.join(' '),
    metadata: {
      totalTasks: activeTasks.length,
      urgentTasks: urgent.length,
      dueSoonTasks: dueSoon.length,
      inProgressTasks: inProgress,
      pendingTasks: pending,
      completedTasks: completedTasks.length,
      generatedBy: 'template'
    }
  };
}

/**
 * Generate bulletin for CLIENT role using TEMPLATES
 */
async function generateClientBulletinTemplate(user, projects) {
  const greeting = generateGreeting(user.name);
  const sections = [greeting];

  if (projects.length === 0) {
    sections.push("You currently have no active projects.");
    return {
      greeting,
      summary: "No active projects",
      fullScript: sections.join(' '),
      metadata: {
        totalProjects: 0,
        generatedBy: 'template'
      }
    };
  }

  sections.push("Here's your project update.");
  sections.push(`You have ${projects.length} ${projects.length === 1 ? 'project' : 'projects'}.`);

  const byStatus = {
    pending: projects.filter(p => p.status === 'pending').length,
    in_progress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    on_hold: projects.filter(p => p.status === 'on_hold').length
  };

  sections.push('');
  if (byStatus.in_progress > 0) {
    sections.push(`${byStatus.in_progress} ${byStatus.in_progress === 1 ? 'project is' : 'projects are'} currently in progress.`);
  }
  if (byStatus.pending > 0) {
    sections.push(`${byStatus.pending} ${byStatus.pending === 1 ? 'project is' : 'projects are'} pending to start.`);
  }
  if (byStatus.on_hold > 0) {
    sections.push(`${byStatus.on_hold} ${byStatus.on_hold === 1 ? 'project is' : 'projects are'} on hold.`);
  }
  if (byStatus.completed > 0) {
    sections.push(`Congratulations! ${byStatus.completed} ${byStatus.completed === 1 ? 'project has been' : 'projects have been'} completed.`);
  }

  const activeProjects = projects.filter(p => p.status === 'in_progress');
  if (activeProjects.length > 0 && activeProjects.length <= 3) {
    sections.push('');
    sections.push('Active projects:');
    
    for (const project of activeProjects) {
      sections.push(`${project.name}.`);
      
      try {
        const projectTasks = await fetchProjectTasks(project.id);
        const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
        const totalTasks = projectTasks.length;
        
        if (totalTasks > 0) {
          const progress = Math.round((completedTasks / totalTasks) * 100);
          sections.push(`Progress: ${progress} percent complete.`);
        }
      } catch (error) {
        // Skip if we can't get tasks
      }
    }
  }

  sections.push('');
  sections.push("Your team is working hard to deliver quality results. Have a great day!");

  return {
    greeting,
    summary: `${projects.length} projects, ${byStatus.in_progress} in progress`,
    fullScript: sections.join(' '),
    metadata: {
      totalProjects: projects.length,
      projectsByStatus: byStatus,
      generatedBy: 'template'
    }
  };
}

/**
 * Generate bulletin using AI (OpenAI)
 */
async function generateBulletinWithAI(user, tasks, projects, urgencyAnalysis) {
  if (!openai) {
    console.warn('⚠️  OpenAI not initialized, falling back to template');
    if (user.role === 'employee') {
      return generateEmployeeBulletinTemplate(user, tasks, urgencyAnalysis);
    } else {
      return await generateClientBulletinTemplate(user, projects);
    }
  }

  try {
    console.log(`🤖 Generating AI bulletin for ${user.name} (${user.role})...`);

    // Prepare data for AI
    let dataContext = '';
    let metadata = {};

    if (user.role === 'employee') {
      const { urgent, dueSoon, upcoming } = urgencyAnalysis;
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      const completedTasks = tasks.filter(t => t.status === 'completed');

      dataContext = `
Role: Employee
Name: ${user.name}
Total Active Tasks: ${activeTasks.length}
Urgent Tasks (overdue or due today): ${urgent.length}
${urgent.length > 0 ? `Urgent Items: ${urgent.map(t => `"${t.description}"${t.dueToday ? ' (due today)' : t.daysOverdue ? ` (${t.daysOverdue} days overdue)` : ''}`).join(', ')}` : ''}
Due Soon (within 3 days): ${dueSoon.length}
${dueSoon.length > 0 ? `Due Soon: ${dueSoon.map(t => `"${t.description}" (due in ${t.daysUntilDue} days)`).join(', ')}` : ''}
In Progress: ${activeTasks.filter(t => t.status === 'in_progress').length}
Pending: ${activeTasks.filter(t => t.status === 'pending').length}
Recently Completed: ${completedTasks.length}
      `.trim();

      metadata = {
        totalTasks: activeTasks.length,
        urgentTasks: urgent.length,
        dueSoonTasks: dueSoon.length,
        completedTasks: completedTasks.length,
        generatedBy: 'ai'
      };
    } else {
      // Client
      const byStatus = {
        pending: projects.filter(p => p.status === 'pending').length,
        in_progress: projects.filter(p => p.status === 'in_progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
        on_hold: projects.filter(p => p.status === 'on_hold').length
      };

      const activeProjects = projects.filter(p => p.status === 'in_progress');
      let projectDetails = '';
      
      for (const project of activeProjects.slice(0, 3)) {
        try {
          const projectTasks = await fetchProjectTasks(project.id);
          const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
          const totalTasks = projectTasks.length;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          projectDetails += `\n- "${project.name}": ${progress}% complete (${completedTasks}/${totalTasks} tasks done)`;
        } catch (error) {
          projectDetails += `\n- "${project.name}": Active`;
        }
      }

      dataContext = `
Role: Client (Project Owner)
Name: ${user.name}
Total Projects: ${projects.length}
In Progress: ${byStatus.in_progress}
Pending: ${byStatus.pending}
On Hold: ${byStatus.on_hold}
Completed: ${byStatus.completed}
${projectDetails}
      `.trim();

      metadata = {
        totalProjects: projects.length,
        projectsByStatus: byStatus,
        generatedBy: 'ai'
      };
    }

    // Create AI prompt
    const tone = user.role === 'client' ? 'professional yet warm' : 'casual, friendly, and motivating';
    const length = '60 seconds when read aloud (about 150 words)';
    
    const prompt = `You are a friendly AI assistant creating a personalized morning briefing.

Context:
${dataContext}

Create a natural, conversational bulletin that:
1. Starts with a personalized greeting
2. Highlights the most important information first (urgent items, critical updates)
3. ${user.role === 'employee' ? 'Celebrates recent achievements if any' : 'Shows project progress and status'}
4. Provides actionable insights or gentle reminders
5. Ends with an encouraging note

Tone: ${tone}
Length: ${length}
Style: Natural speech, as if talking to a friend/colleague. Use contractions (you've, let's, here's). Be conversational.

Important: Do NOT use emojis. Do NOT use markdown formatting. Just natural text suitable for text-to-speech.

Generate the bulletin:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cost-effective
      messages: [
        {
          role: "system",
          content: "You are a helpful, friendly assistant that creates personalized daily briefings. You speak naturally and conversationally, like a colleague checking in."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.8 // More creative and varied
    });

    const aiScript = completion.choices[0].message.content.trim();

    console.log(`✅ AI bulletin generated (${aiScript.length} chars)`);

    return {
      greeting: generateGreeting(user.name), // For consistency
      summary: user.role === 'employee' 
        ? `${metadata.totalTasks} active tasks, ${metadata.urgentTasks} urgent`
        : `${metadata.totalProjects} projects, ${metadata.projectsByStatus.in_progress} in progress`,
      fullScript: aiScript,
      metadata: {
        ...metadata,
        tokensUsed: completion.usage.total_tokens,
        model: 'gpt-4o-mini'
      }
    };

  } catch (error) {
    console.error('❌ Error generating AI bulletin:', error.message);
    console.log('⚠️  Falling back to template generation');
    
    // Fallback to template
    if (user.role === 'employee') {
      return generateEmployeeBulletinTemplate(user, tasks, urgencyAnalysis);
    } else {
      return await generateClientBulletinTemplate(user, projects);
    }
  }
}

/**
 * Main function to generate bulletin for any user
 */
async function generateBulletin(userId) {
  try {
    console.log(`📰 Generating bulletin for user ${userId}...`);
    
    // Fetch user data
    const user = await fetchUserData(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    let bulletin;
    let tasks = [];
    let projects = [];
    let urgencyAnalysis = null;

    // Fetch role-specific data
    if (user.role === 'client') {
      projects = await fetchUserProjects(userId);
    } else if (user.role === 'employee') {
      tasks = await fetchUserTasks(userId);
      urgencyAnalysis = analyzeTaskUrgency(tasks);
    } else {
      throw new Error('Unknown user role');
    }

    // Generate bulletin using AI or template
    if (USE_AI_BULLETIN && openai) {
      bulletin = await generateBulletinWithAI(user, tasks, projects, urgencyAnalysis);
    } else {
      // Use template generation
      if (user.role === 'client') {
        bulletin = await generateClientBulletinTemplate(user, projects);
      } else {
        bulletin = generateEmployeeBulletinTemplate(user, tasks, urgencyAnalysis);
      }
    }

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
      bulletin,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating bulletin:', error.message);
    throw error;
  }
}

export {
  generateBulletin,
  fetchUserData,
  fetchUserTasks,
  fetchUserProjects
};