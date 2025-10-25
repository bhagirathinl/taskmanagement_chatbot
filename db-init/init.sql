-- db-init/init.sql

CREATE DATABASE IF NOT EXISTS chatbot_db;
USE chatbot_db;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  role ENUM('client', 'employee') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  client_id INT NOT NULL,
  status ENUM('pending', 'in_progress', 'completed', 'on_hold')  DEFAULT 'pending',
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id)
);

-- Tasks table
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  assigned_to INT,
  description TEXT,
  status ENUM('pending', 'in_progress', 'completed', 'on_hold') DEFAULT 'pending',
  due_date DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Sample data
INSERT INTO users (name, email, role) VALUES
('Alice Johnson', 'alice@clientco.com', 'client'),
('Bob Smith', 'bob@clientco.com', 'client'),
('Carol Lee', 'carol@agency.com', 'employee'),
('David Kim', 'david@agency.com', 'employee'),
('Eva Chen', 'eva@agency.com', 'employee');

INSERT INTO projects (name, client_id, status, deadline) VALUES
('Website Redesign', 1, 'in_progress', '2025-11-15'),('Social Media Campaign', 2, 'pending', '2025-12-01'),
('Product Launch Strategy', 1, 'on_hold', '2025-12-20');

INSERT INTO tasks (project_id, assigned_to, description, status, due_date) VALUES
(1, 3, 'Create wireframes for homepage', 'completed', '2025-10-10'),
(1, 4, 'Develop responsive layout', 'in_progress', '2025-10-25'),
(1, 5, 'Write homepage copy', 'pending', '2025-10-28'),
(2, 4, 'Design Instagram ad creatives', 'pending', '2025-11-05'),
(2, 5, 'Plan content calendar', 'pending', '2025-11-07'),
(3, 3, 'Research competitor strategies', 'completed', '2025-09-30'),
(3, 5, 'Draft launch email sequence', 'on_hold', '2025-11-15');