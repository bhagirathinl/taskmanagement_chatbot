const tools = [
  {
    type: "function",
    function: {
      name: "executeSqlQuery",
      description: `Execute a SQL query against the database. Use this tool to query or modify data based on user requests.

DATABASE SCHEMA:
================

TABLE: users
- id INT PRIMARY KEY AUTO_INCREMENT
- name VARCHAR(100) NOT NULL
- email VARCHAR(150) UNIQUE NOT NULL
- role ENUM('client', 'employee') NOT NULL
- created_at TIMESTAMP

TABLE: projects
- id INT PRIMARY KEY AUTO_INCREMENT
- name VARCHAR(200) NOT NULL
- client_id INT NOT NULL (FOREIGN KEY -> users.id)
- status ENUM('pending', 'in_progress', 'completed', 'on_hold') DEFAULT 'pending'
- deadline DATE
- created_at TIMESTAMP

TABLE: tasks
- id INT PRIMARY KEY AUTO_INCREMENT
- project_id INT NOT NULL (FOREIGN KEY -> projects.id)
- assigned_to INT (FOREIGN KEY -> users.id)
- description TEXT
- status ENUM('pending', 'in_progress', 'completed', 'on_hold') DEFAULT 'pending'
- due_date DATE
- updated_at TIMESTAMP

RELATIONSHIPS:
- projects.client_id -> users.id (client who owns the project)
- tasks.project_id -> projects.id (project the task belongs to)
- tasks.assigned_to -> users.id (employee assigned to task)

QUERY GUIDELINES:
- Use JOINs to get related data (e.g., task with assignee name, project with client name)
- For overdue tasks: WHERE due_date < CURDATE() AND status != 'completed'
- Use CASE statements for conditional aggregation
- Always include relevant names, not just IDs, for user-friendly responses

IMPORTANT - NAME MATCHING:
- ALWAYS use SOUNDEX for name searches to match phonetically similar names: WHERE SOUNDEX(name) = SOUNDEX('search_term')
- Example: WHERE SOUNDEX(u.name) = SOUNDEX('David') will match David, Davide, etc.
- This applies to user names and handles spelling variations/typos
- For project names or exact text searches, use LIKE: WHERE name LIKE '%search_term%'`,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The SQL query to execute. Must be a valid SELECT, INSERT, UPDATE, or DELETE statement."
          }
        },
        required: ["query"]
      }
    }
  }
];

export default tools;
