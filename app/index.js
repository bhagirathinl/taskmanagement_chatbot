require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
const port = process.env.PORT;

// Enable CORS for all origins (or specify specific origins)
app.use(cors({
  origin: '*', // Allow all origins, or specify ['http://localhost:5173', 'http://localhost:4500']
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test DB connection
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err);
    process.exit(1);
  });

// ==================== PROJECT ENDPOINTS ====================

// 🔍 Get all projects
app.get('/projects', async (req, res) => {
  try {
    console.log('Fetching all projects');
    const [results] = await pool.query('SELECT * FROM projects');
    res.json(results);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 🔍 Get single project by ID
app.get('/projects/:projectId', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM projects WHERE id = ?',
      [req.params.projectId]
    );
    if (results.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 🔍 Search projects by name
app.get('/projects/search/:name', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM projects WHERE name LIKE ?',
      [`%${req.params.name}%`]
    );
    res.json(results);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 📊 Get project summary with task statistics
app.get('/projects/:projectId/summary', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT 
        p.id,
        p.name AS project_name,
        p.status AS project_status,
        p.deadline,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) AS pending_tasks,
        SUM(CASE WHEN t.status = 'blocked' THEN 1 ELSE 0 END) AS blocked_tasks,
        GROUP_CONCAT(DISTINCT t.assigned_to) AS team_member_ids
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.id = ?
      GROUP BY p.id`,
      [req.params.projectId]
    );
    if (results.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 📋 Get all tasks for a project with assignee details
app.get('/projects/:projectId/tasks', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT 
        t.id,  
        t.description,
        t.status,
        t.due_date,
        t.assigned_to,
        u.name AS assigned_to_name,
        u.email AS assigned_to_email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = ?
      ORDER BY 
        
        t.due_date`,
      [req.params.projectId]
    );
    res.json(results);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 👥 Get all team members working on a project
app.get('/projects/:projectId/team', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT DISTINCT
        u.id,
        u.name,
        u.email,
        u.role,
        COUNT(t.id) AS assigned_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
      FROM users u
      JOIN tasks t ON u.id = t.assigned_to
      WHERE t.project_id = ?
      GROUP BY u.id`,
      [req.params.projectId]
    );
    res.json(results);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ==================== TASK ENDPOINTS ====================

// 🔍 Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT 
        t.*,
        p.name AS project_name,
        u.name AS assigned_to_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ORDER BY t.due_date`
    );
    res.json(results);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 🔍 Get single task by ID
app.get('/tasks/id/:taskId', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT 
        t.*,
        p.name AS project_name,
        u.name AS assigned_to_name,
        u.email AS assigned_to_email
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?`,
      [req.params.taskId]
    );
    if (results.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 👤 Get tasks by user ID
app.get('/tasks/user/:userId', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT 
        t.*,
        p.name AS project_name,
        p.status AS project_status
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = ?
      ORDER BY 
        FIELD(t.status, 'in_progress', 'pending', 'blocked', 'completed'),
        t.due_date`,
      [req.params.userId]
    );
    res.json(results);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 🔍 Get tasks by status
app.get('/tasks/status/:status', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT 
        t.*,
        p.name AS project_name,
        u.name AS assigned_to_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.status = ?
      ORDER BY t.due_date`,
      [req.params.status]
    );
    res.json(results);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 🔍 Get overdue tasks
app.get('/tasks/overdue/all', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT 
        t.*,
        p.name AS project_name,
        u.name AS assigned_to_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.due_date < CURDATE() 
        AND t.status != 'completed'
      ORDER BY t.due_date`
    );
    res.json(results);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 🔍 Get tasks by priority
app.get('/tasks/priority/:priority', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT 
        t.*,
        p.name AS project_name,
        u.name AS assigned_to_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ORDER BY t.due_date`
    );
    res.json(results);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ==================== USER ENDPOINTS ====================

// 🔍 Get all users
app.get('/users', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM users');
    res.json(results);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 🔍 Get single user by ID
app.get('/users/:userId', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.params.userId]
    );
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 🔍 Search users by name
app.get('/users/search/:name', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM users WHERE name LIKE ?',
      [`%${req.params.name}%`]
    );
    res.json(results);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 📊 Get user workload summary
app.get('/users/:userId/workload', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) AS pending_tasks,
        SUM(CASE WHEN t.status = 'blocked' THEN 1 ELSE 0 END) AS blocked_tasks,
        SUM(CASE WHEN t.due_date < CURDATE() AND t.status != 'completed' THEN 1 ELSE 0 END) AS overdue_tasks
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to
      WHERE u.id = ?
      GROUP BY u.id`,
      [req.params.userId]
    );
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ==================== ANALYTICS ENDPOINTS ====================

// 📊 Get overall dashboard statistics
app.get('/analytics/dashboard', async (req, res) => {
  try {
    const [projectStats] = await pool.query(
      `SELECT 
        COUNT(*) AS total_projects,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS active_projects,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_projects
      FROM projects`
    );

    const [taskStats] = await pool.query(
      `SELECT 
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_tasks,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) AS blocked_tasks,
        SUM(CASE WHEN due_date < CURDATE() AND status != 'completed' THEN 1 ELSE 0 END) AS overdue_tasks
      FROM tasks`
    );

    const [userStats] = await pool.query(
      `SELECT COUNT(*) AS total_users FROM users`
    );

    res.json({
      projects: projectStats[0],
      tasks: taskStats[0],
      users: userStats[0]
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ==================== UPDATE ENDPOINTS ====================

// ✏️ Update task
app.put('/tasks/:taskId', async (req, res) => {
  try {
    const { status, assigned_to, priority, due_date, title, description } = req.body;
    const updates = [];
    const values = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (assigned_to) {
      updates.push('assigned_to = ?');
      values.push(assigned_to);
    }
    if (priority) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (due_date) {
      updates.push('due_date = ?');
      values.push(due_date);
    }
    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(req.params.taskId);

    const [result] = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true, message: 'Task updated successfully' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ✏️ Update project
app.put('/projects/:projectId', async (req, res) => {
  try {
    const { name, status, deadline } = req.body;
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (deadline) {
      updates.push('deadline = ?');
      values.push(deadline);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(req.params.projectId);

    const [result] = await pool.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true, message: 'Project updated successfully' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ==================== DYNAMIC SQL ENDPOINT ====================

// 🔧 Execute dynamic SQL query (for AI-generated queries)
app.post('/sql/execute', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Normalize query for validation
    const normalizedQuery = query.trim().toUpperCase();

    // Allow SELECT, INSERT, UPDATE, DELETE
    const allowedOperations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    const operation = allowedOperations.find(op => normalizedQuery.startsWith(op));

    if (!operation) {
      return res.status(403).json({
        error: 'Only SELECT, INSERT, UPDATE, DELETE operations are allowed'
      });
    }

    // Block dangerous operations
    const dangerousPatterns = [
      /DROP\s+/i,
      /TRUNCATE\s+/i,
      /ALTER\s+/i,
      /CREATE\s+/i,
      /GRANT\s+/i,
      /REVOKE\s+/i,
      /;\s*DROP/i,
      /;\s*DELETE/i,
      /;\s*UPDATE/i,
      /--/,
      /\/\*/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        return res.status(403).json({
          error: 'Query contains potentially dangerous operations'
        });
      }
    }

    console.log(`🔧 Executing dynamic SQL: ${query}`);

    const [results] = await pool.query(query);

    // For SELECT queries, return results directly
    // For INSERT/UPDATE/DELETE, return affected rows info
    if (operation === 'SELECT') {
      res.json({
        success: true,
        data: results,
        rowCount: results.length
      });
    } else {
      res.json({
        success: true,
        affectedRows: results.affectedRows,
        insertId: results.insertId || null,
        message: `${operation} operation completed successfully`
      });
    }
  } catch (err) {
    console.error('SQL Execution Error:', err);
    res.status(500).json({
      error: 'Query execution failed',
      details: err.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 API running at http://localhost:${port}`);
  console.log('📚 Available endpoints:');
  console.log('  GET  /projects');
  console.log('  GET  /projects/:projectId');
  console.log('  GET  /projects/search/:name');
  console.log('  GET  /projects/:projectId/summary');
  console.log('  GET  /projects/:projectId/tasks');
  console.log('  GET  /projects/:projectId/team');
  console.log('  GET  /tasks');
  console.log('  GET  /tasks/id/:taskId');
  console.log('  GET  /tasks/user/:userId');
  console.log('  GET  /tasks/status/:status');
  console.log('  GET  /tasks/priority/:priority');
  console.log('  GET  /tasks/overdue/all');
  console.log('  GET  /users');
  console.log('  GET  /users/:userId');
  console.log('  GET  /users/search/:name');
  console.log('  GET  /users/:userId/workload');
  console.log('  GET  /analytics/dashboard');
  console.log('  PUT  /tasks/:taskId');
  console.log('  PUT  /projects/:projectId');
  console.log('  POST /sql/execute');
});