(() => {
  const S = window.PerformXShared;
  if (!S) {
    console.error('PerformXShared not available for notifications');
    return;
  }

  // Notification System for Task Lifecycle Events
  class TaskNotificationSystem {
    constructor() {
      this.activeTimers = new Map();
      this.taskSchedule = new Map();
      this.priorityConflicts = new Map();
      this.notificationHistory = [];
      this.maxHistorySize = 50;
      
      // Initialize notification listeners
      this.init();
    }

    init() {
      // Start time-based monitoring
      this.startTimeMonitoring();
      
      // Listen for task events
      this.setupEventListeners();
      
      console.log('Task Notification System initialized');
    }

    // TIME-BASED ALERT: When current_time == task.assigned_time
    startTimeMonitoring() {
      // Check every minute for task start times
      setInterval(() => {
        this.checkTaskStartTimes();
      }, 60000); // Check every minute

      // Initial check
      this.checkTaskStartTimes();
    }

    async checkTaskStartTimes() {
      try {
        const response = await fetch(window.apiUrl('tasks/get_tasks.php'), { 
          credentials: 'include' 
        });
        
        if (!response.ok) return;
        
        const result = await response.json();
        if (result.status !== 'success') return;
        
        const tasks = result.data || [];
        const currentTime = new Date();
        
        tasks.forEach(task => {
          if (task.status === 'Completed') return;
          
          const taskStartTime = new Date(task.assigned_time || task.created_at);
          
          // Check if current time matches task start time (within 1 minute window)
          const timeDiff = Math.abs(currentTime - taskStartTime);
          const isStartingNow = timeDiff <= 60000; // 1 minute window
          
          if (isStartingNow && !this.hasNotifiedTaskStart(task.id)) {
            this.triggerTaskStartNotification(task);
            this.markTaskStartNotified(task.id);
          }
        });
      } catch (error) {
        console.error('Error checking task start times:', error);
      }
    }

    triggerTaskStartNotification(task) {
      const message = `Task '${task.name}' is starting now.`;
      this.showNotification(message, 'info', 'task-start');
      this.addToHistory('task_start', task.id, message);
    }

    // TASK ASSIGNED: When new task is created
    setupEventListeners() {
      // Listen for task creation events
      document.addEventListener('taskCreated', (event) => {
        const task = event.detail;
        this.handleTaskAssigned(task);
      });

      // Listen for task assignment events
      document.addEventListener('taskAssigned', (event) => {
        const task = event.detail;
        this.handleTaskAssigned(task);
      });

      // Listen for task status changes
      document.addEventListener('taskStatusChanged', (event) => {
        const { task, oldStatus, newStatus } = event.detail;
        this.handleTaskStatusChange(task, oldStatus, newStatus);
      });

      // Hook into existing task creation if possible
      this.hookIntoTaskCreation();
    }

    handleTaskAssigned(task) {
      // Check for priority conflicts
      if (this.hasPriorityConflict(task)) {
        this.rejectTaskWithConflict(task);
        return;
      }

      const message = `You have been assigned a new task: ${task.name}`;
      this.showNotification(message, 'success', 'task-assigned');
      this.addToHistory('task_assigned', task.id, message);
      
      // Schedule time-based alert for this task
      this.scheduleTaskStartAlert(task);
    }

    // TASK COMPLETED: When task.status changes to 'Completed'
    handleTaskStatusChange(task, oldStatus, newStatus) {
      if (newStatus === 'Completed' && oldStatus !== 'Completed') {
        const message = `Task '${task.name}' has been completed.`;
        this.showNotification(message, 'success', 'task-completed');
        this.addToHistory('task_completed', task.id, message);
        
        // Remove from active monitoring
        this.removeTaskFromMonitoring(task.id);
      }
    }

    // PRIORITY CONFLICT DETECTED: When assigning a task
    hasPriorityConflict(newTask) {
      const tasks = this.taskSchedule.get(new Date(newTask.assigned_time).toDateString()) || [];
      
      return tasks.some(existingTask => {
        return existingTask.priority === newTask.priority &&
               this.isTimeConflict(existingTask, newTask);
      });
    }

    isTimeConflict(task1, task2) {
      const time1 = new Date(task1.assigned_time || task1.created_at);
      const time2 = new Date(task2.assigned_time || task2.created_at);
      
      // Consider tasks conflicting if within 30 minutes of each other
      const timeDiff = Math.abs(time1 - time2);
      return timeDiff <= 30 * 60 * 1000; // 30 minutes in milliseconds
    }

    rejectTaskWithConflict(task) {
      const message = `Cannot assign task '${task.name}': Priority conflict detected with existing task at the same time.`;
      this.showNotification(message, 'error', 'priority-conflict');
      this.addToHistory('priority_conflict', task.id, message);
      
      // Trigger rejection event
      document.dispatchEvent(new CustomEvent('taskRejected', {
        detail: { task, reason: 'priority_conflict' }
      }));
    }

    // Schedule task start alert
    scheduleTaskStartAlert(task) {
      if (!task.assigned_time) return;
      
      const taskTime = new Date(task.assigned_time);
      const currentTime = new Date();
      
      if (taskTime <= currentTime) return; // Task time is in the past
      
      const timeUntilTask = taskTime - currentTime;
      
      // Schedule notification for task start time
      const timerId = setTimeout(() => {
        this.triggerTaskStartNotification(task);
      }, timeUntilTask);
      
      this.activeTimers.set(task.id, timerId);
      
      // Add to schedule
      const dateKey = taskTime.toDateString();
      if (!this.taskSchedule.has(dateKey)) {
        this.taskSchedule.set(dateKey, []);
      }
      this.taskSchedule.get(dateKey).push(task);
    }

    // Utility methods
    hasNotifiedTaskStart(taskId) {
      return this.notificationHistory.some(
        entry => entry.type === 'task_start' && entry.taskId === taskId
      );
    }

    markTaskStartNotified(taskId) {
      this.notificationHistory.push({
        type: 'task_start',
        taskId: taskId,
        timestamp: new Date(),
        notified: true
      });
      
      // Trim history if too large
      if (this.notificationHistory.length > this.maxHistorySize) {
        this.notificationHistory = this.notificationHistory.slice(-this.maxHistorySize);
      }
    }

    removeTaskFromMonitoring(taskId) {
      // Clear timer if exists
      if (this.activeTimers.has(taskId)) {
        clearTimeout(this.activeTimers.get(taskId));
        this.activeTimers.delete(taskId);
      }
      
      // Remove from schedule
      for (const [date, tasks] of this.taskSchedule.entries()) {
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        if (filteredTasks.length !== tasks.length) {
          this.taskSchedule.set(date, filteredTasks);
        }
      }
    }

    showNotification(message, type = 'info', category = 'general') {
      // Use existing notification system from shared.js
      // This will show in the bell dropdown with proper badge indicator
      if (S && S.addNotification) {
        S.addNotification(message, type);
      } else {
        // Fallback to toast if shared system not available
        console.warn('Shared notification system not available, using toast fallback');
        if (typeof toast === 'function') {
          toast(message, type);
        }
      }
    }

    addToHistory(type, taskId, message) {
      this.notificationHistory.push({
        type,
        taskId,
        message,
        timestamp: new Date()
      });
      
      // Trim history if needed
      if (this.notificationHistory.length > this.maxHistorySize) {
        this.notificationHistory = this.notificationHistory.slice(-this.maxHistorySize);
      }
    }

    // Hook into existing task creation systems
    hookIntoTaskCreation() {
      // Override fetch to intercept task creation calls
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const [url, options] = args;
        
        // Check if this is a task creation request
        if (url.includes('tasks/create_task.php') && options?.method === 'POST') {
          try {
            const response = await originalFetch.apply(window, args);
            const clonedResponse = response.clone();
            
            clonedResponse.json().then(data => {
              if (data.status === 'success' && data.data) {
                // Trigger task assigned event
                document.dispatchEvent(new CustomEvent('taskAssigned', {
                  detail: data.data
                }));
              }
            }).catch(err => console.error('Error parsing task creation response:', err));
            
            return response;
          } catch (error) {
            console.error('Error in fetch override:', error);
            return originalFetch.apply(window, args);
          }
        }
        
        return originalFetch.apply(window, args);
      };
    }

    // Public API methods
    getNotificationHistory() {
      return [...this.notificationHistory];
    }

    getActiveTimers() {
      return Array.from(this.activeTimers.entries());
    }

    getTaskSchedule() {
      return Array.from(this.taskSchedule.entries()).map(([date, tasks]) => ({
        date,
        tasks: [...tasks]
      }));
    }

    clearHistory() {
      this.notificationHistory = [];
    }

    // Cleanup method
    destroy() {
      // Clear all active timers
      for (const timerId of this.activeTimers.values()) {
        clearTimeout(timerId);
      }
      this.activeTimers.clear();
      this.taskSchedule.clear();
      this.notificationHistory = [];
    }
  }

  // Initialize the notification system
  window.TaskNotifications = new TaskNotificationSystem();
  
  // Make it globally available
  window.PerformXNotifications = {
    triggerTaskAssigned: (task) => {
      document.dispatchEvent(new CustomEvent('taskAssigned', { detail: task }));
    },
    triggerTaskCompleted: (task) => {
      document.dispatchEvent(new CustomEvent('taskStatusChanged', { 
        detail: { task, oldStatus: task.status, newStatus: 'Completed' }
      }));
    },
    getHistory: () => window.TaskNotifications.getNotificationHistory(),
    clearHistory: () => window.TaskNotifications.clearHistory(),
    getSchedule: () => window.TaskNotifications.getTaskSchedule()
  };

})();
