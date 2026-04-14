# Perform-X Productivity System

Perform-X is an enterprise-grade productivity suite featuring robust performance tracking, dynamic team assignments, and analytical dashboard data powered by a scalable PHP/MySQL relational architecture.

## XAMPP Setup Instructions

1. **Start XAMPP**
   Open your XAMPP Control Panel and start the **Apache** and **MySQL** modules.

2. **Load Database Schema**
   * Open phpMyAdmin (`http://localhost/phpmyadmin`) in your browser.
   * Go to the **Import** tab.
   * Choose the file named `perform_x.sql` located inside the config directory of this project folder (`c:\xampp\htdocs\Perform-X-master\backend\config\perform_x.sql`).
   * Click **Import** at the bottom. This will automatically create the `perform_x` database and generate the `users`, `tasks`, `teams`, `team_members`, and `performance` tables along with their foreign key relations.

3. **Database Configuration**
   The database configuration relies on root without a password. Make sure `backend/config/database.php` matches your local config:
   ```php
   $host = '127.0.0.1';
   $dbname = 'perform_x';
   $username = 'root';
   $password = '';
   ```

4. **Verify Frontend API Map**
   Open `assets/js/api-config.js` and ensure it maps correctly to your XAMPP domain. E.g.:
   ```javascript
   const API_BASE = 'http://localhost/Perform-X-master/backend';
   ```

## Example API Endpoint Usage

The frontend logic consumes responses via Javascript `fetch()` API calls securely mapped to PHPSESSID browser session cookies via `credentials: 'include'`. 

### Create Task
**Endpoint**: `POST /backend/tasks/create_task.php`
```json
{
  "title": "Build Architecture",
  "description": "Establish the database keys",
  "dueDate": "2026-05-15",
  "priority": "High",
  "category": "Development",
  "start": "09:00",
  "end": "12:00"
}
```

### Dashboard Analytical Hook
**Endpoint**: `GET /backend/reports/dashboard_data.php`
Extracts securely mapped integer responses aggregated from the DB tables.
```json
{
   "status": "success",
   "message": "",
   "data": {
       "total_tasks": 28,
       "completed_tasks": 17,
       "pending_tasks": 11,
       "performance_score": 60.71,
       "charts": {
           "weekly_velocity": [1, 5, 2, 8, 3, 4, 1],
           "monthly_throughput": [0, 0, 0, 17, 0, 0]
       }
   }
}
```

### Team Building Hooks
**Endpoint**: `POST /backend/teams/create_team.php`
Creates a team in `teams` table and dynamically builds `team_members` relationship maps via JSON string array loops.
```json
{
   "name": "Backend DevOps Engineers",
   "members": [2, 14, 21] 
}
```
