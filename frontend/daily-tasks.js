/**
 * Daily Task Management System
 * Handles daily tasks, progress tracking, and progress reports
 */
class DailyTaskManager {
  constructor() {
    this.dailyTasks = [];
    this.progressReports = [];
    this.apiBaseUrl = window.location.origin + '/api';
  }

  /**
   * Make API request to backend
   */
  async apiRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Daily Task API request failed:', error);
      throw error;
    }
  }

  /**
   * Load daily tasks from backend
   */
  async loadDailyTasks(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.assigned_to) queryParams.append('assigned_to', filters.assigned_to);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.due_date) queryParams.append('due_date', filters.due_date);

      const response = await this.apiRequest(`/daily-tasks?${queryParams.toString()}`);
      this.dailyTasks = response.data || [];
      this.renderDailyTasks();
    } catch (error) {
      console.error('Error loading daily tasks:', error);
      showNotification('Error loading daily tasks', 'error');
    }
  }

  /**
   * Load progress reports from backend
   */
  async loadProgressReports() {
    try {
      const response = await this.apiRequest('/progress-reports');
      this.progressReports = response.data || [];
      this.renderProgressReports();
    } catch (error) {
      console.error('Error loading progress reports:', error);
      showNotification('Error loading progress reports', 'error');
    }
  }

  /**
   * Create a new daily task
   */
  async createDailyTask(taskData) {
    try {
      const response = await this.apiRequest('/daily-tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });

      await this.loadDailyTasks();
      showNotification('Daily task created successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating daily task:', error);
      showNotification(error.message || 'Error creating daily task', 'error');
      throw error;
    }
  }

  /**
   * Update a daily task
   */
  async updateDailyTask(taskId, updates) {
    try {
      await this.apiRequest(`/daily-tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      await this.loadDailyTasks();
      showNotification('Daily task updated successfully');
    } catch (error) {
      console.error('Error updating daily task:', error);
      showNotification(error.message || 'Error updating daily task', 'error');
    }
  }

  /**
   * Delete a daily task
   */
  async deleteDailyTask(taskId) {
    if (confirm('Are you sure you want to delete this daily task?')) {
      try {
        await this.apiRequest(`/daily-tasks/${taskId}`, {
          method: 'DELETE'
        });

        await this.loadDailyTasks();
        showNotification('Daily task deleted successfully');
      } catch (error) {
        console.error('Error deleting daily task:', error);
        showNotification(error.message || 'Error deleting daily task', 'error');
      }
    }
  }

  /**
   * Add progress to a daily task
   */
  async addTaskProgress(taskId, progressData) {
    try {
      const response = await this.apiRequest(`/daily-tasks/${taskId}/progress`, {
        method: 'POST',
        body: JSON.stringify(progressData)
      });

      await this.loadDailyTasks();
      showNotification('Progress added successfully');
      return response.data;
    } catch (error) {
      console.error('Error adding progress:', error);
      showNotification(error.message || 'Error adding progress', 'error');
      throw error;
    }
  }

  /**
   * Create a new progress report
   */
  async createProgressReport(reportData) {
    try {
      const response = await this.apiRequest('/progress-reports', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });

      await this.loadProgressReports();
      showNotification('Progress report submitted successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating progress report:', error);
      showNotification(error.message || 'Error creating progress report', 'error');
      throw error;
    }
  }

  /**
   * Get status color class
   */
  getStatusColor(status) {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'blocked': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get priority color class
   */
  getPriorityColor(priority) {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get mood emoji
   */
  getMoodEmoji(rating) {
    const emojis = {
      1: '😞',
      2: '😐',
      3: '😊',
      4: '😄',
      5: '🤩'
    };
    return emojis[rating] || '😊';
  }

  /**
   * Get productivity emoji
   */
  getProductivityEmoji(score) {
    const emojis = {
      1: '🐌',
      2: '🐢',
      3: '🚶',
      4: '🏃',
      5: '🚀'
    };
    return emojis[score] || '🚶';
  }

  /**
   * Render daily tasks in the UI
   */
  renderDailyTasks() {
    const container = document.getElementById('daily-tasks-container');
    if (!container) return;

    container.innerHTML = '';

    if (this.dailyTasks.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-500">No daily tasks found. Create your first task!</p>
        </div>
      `;
      return;
    }

    this.dailyTasks.forEach(task => {
      const taskCard = document.createElement('div');
      taskCard.className = 'daily-task-card bg-white p-6 rounded-lg shadow mb-4 border-l-4 border-blue-500';

      const progressPercentage = task.actual_hours > 0 && task.estimated_hours > 0 
        ? Math.min((task.actual_hours / task.estimated_hours) * 100, 100) 
        : 0;

      taskCard.innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-bold mb-2">${this.escapeHtml(task.title)}</h3>
            <p class="text-gray-600 mb-2">${this.escapeHtml(task.description || '')}</p>
            <div class="flex items-center space-x-4 text-sm">
              <span class="text-gray-600">👤 ${this.escapeHtml(task.assigned_to)}</span>
              <span class="inline-block px-2 py-1 rounded text-xs font-medium ${this.getStatusColor(task.status)}">
                ${task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
              <span class="inline-block px-2 py-1 rounded text-xs font-medium ${this.getPriorityColor(task.priority)}">
                ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
              <span class="text-gray-600">📅 Due: ${new Date(task.due_date).toLocaleDateString()}</span>
            </div>
          </div>
          <button onclick="dailyTaskManager.deleteDailyTask(${task.id})" 
                  class="text-red-500 hover:text-red-700 font-bold text-xl">×</button>
        </div>
        
        <div class="mb-4">
          <div class="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>${progressPercentage.toFixed(1)}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="progress-bar bg-blue-600 h-2 rounded-full" style="width: ${progressPercentage}%"></div>
          </div>
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>Estimated: ${task.estimated_hours}h</span>
            <span>Actual: ${task.actual_hours}h</span>
          </div>
        </div>

        <div class="flex space-x-2">
          <button onclick="dailyTaskManager.promptAddProgress(${task.id})" 
                  class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Add Progress
          </button>
          <button onclick="dailyTaskManager.promptUpdateTask(${task.id})" 
                  class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Update Task
          </button>
        </div>

        <div class="text-xs text-gray-500 mt-2">
          Created: ${new Date(task.created_at).toLocaleDateString()}
        </div>
      `;

      container.appendChild(taskCard);
    });
  }

  /**
   * Render progress reports in the UI
   */
  renderProgressReports() {
    const container = document.getElementById('progress-reports-container');
    if (!container) return;

    container.innerHTML = '';

    if (this.progressReports.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-500">No progress reports found. Submit your first report!</p>
        </div>
      `;
      return;
    }

    // Show only recent reports (last 5)
    const recentReports = this.progressReports.slice(0, 5);

    recentReports.forEach(report => {
      const reportCard = document.createElement('div');
      reportCard.className = 'progress-report-card bg-white p-6 rounded-lg shadow mb-4 border-l-4 border-green-500';

      reportCard.innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h4 class="text-lg font-bold mb-2">${this.escapeHtml(report.reporter_name)} - ${new Date(report.report_date).toLocaleDateString()}</h4>
            <div class="flex items-center space-x-4 text-sm mb-2">
              <span class="text-gray-600">⏰ ${report.hours_worked}h worked</span>
              <span class="text-gray-600">${this.getMoodEmoji(report.mood_rating)} Mood: ${report.mood_rating}/5</span>
              <span class="text-gray-600">${this.getProductivityEmoji(report.productivity_score)} Productivity: ${report.productivity_score}/5</span>
            </div>
          </div>
          <button onclick="dailyTaskManager.deleteProgressReport(${report.id})" 
                  class="text-red-500 hover:text-red-700 font-bold text-xl">×</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h5 class="font-semibold text-green-600 mb-1">✅ Completed</h5>
            <p class="text-sm text-gray-700">${this.escapeHtml(report.tasks_completed || 'None')}</p>
          </div>
          <div>
            <h5 class="font-semibold text-blue-600 mb-1">🔄 In Progress</h5>
            <p class="text-sm text-gray-700">${this.escapeHtml(report.tasks_in_progress || 'None')}</p>
          </div>
        </div>

        ${report.tasks_blocked ? `
          <div class="mb-4">
            <h5 class="font-semibold text-red-600 mb-1">🚫 Blocked</h5>
            <p class="text-sm text-gray-700">${this.escapeHtml(report.tasks_blocked)}</p>
          </div>
        ` : ''}

        ${report.challenges ? `
          <div class="mb-4">
            <h5 class="font-semibold text-orange-600 mb-1">⚠️ Challenges</h5>
            <p class="text-sm text-gray-700">${this.escapeHtml(report.challenges)}</p>
          </div>
        ` : ''}

        ${report.next_day_plan ? `
          <div class="mb-4">
            <h5 class="font-semibold text-purple-600 mb-1">📋 Tomorrow's Plan</h5>
            <p class="text-sm text-gray-700">${this.escapeHtml(report.next_day_plan)}</p>
          </div>
        ` : ''}

        <div class="text-xs text-gray-500">
          Submitted: ${new Date(report.created_at).toLocaleString()}
        </div>
      `;

      container.appendChild(reportCard);
    });
  }

  /**
   * Prompt user to add progress to a task
   */
  async promptAddProgress(taskId) {
    const progressDate = prompt('Enter progress date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!progressDate) return;

    const hoursSpent = prompt('Enter hours spent:');
    if (!hoursSpent || isNaN(hoursSpent)) {
      showNotification('Please enter a valid number for hours spent', 'error');
      return;
    }

    const progressPercentage = prompt('Enter progress percentage (0-100):');
    if (!progressPercentage || isNaN(progressPercentage) || progressPercentage < 0 || progressPercentage > 100) {
      showNotification('Please enter a valid percentage between 0 and 100', 'error');
      return;
    }

    const notes = prompt('Enter notes (optional):');

    await this.addTaskProgress(taskId, {
      progress_date: progressDate,
      hours_spent: parseFloat(hoursSpent),
      progress_percentage: parseInt(progressPercentage),
      notes: notes || ''
    });
  }

  /**
   * Prompt user to update a task
   */
  async promptUpdateTask(taskId) {
    const task = this.dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = prompt(`Current status: ${task.status}\nEnter new status (pending/in-progress/completed/blocked):`);
    if (!newStatus || !['pending', 'in-progress', 'completed', 'blocked'].includes(newStatus)) {
      showNotification('Please enter a valid status', 'error');
      return;
    }

    await this.updateDailyTask(taskId, { status: newStatus });
  }

  /**
   * Delete a progress report
   */
  async deleteProgressReport(reportId) {
    if (confirm('Are you sure you want to delete this progress report?')) {
      try {
        await this.apiRequest(`/progress-reports/${reportId}`, {
          method: 'DELETE'
        });

        await this.loadProgressReports();
        showNotification('Progress report deleted successfully');
      } catch (error) {
        console.error('Error deleting progress report:', error);
        showNotification(error.message || 'Error deleting progress report', 'error');
      }
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }
}

// Global instance
let dailyTaskManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  dailyTaskManager = new DailyTaskManager();
});

// Modal functions
function showCreateDailyTaskModal() {
  const modal = document.getElementById('daily-task-modal');
  if (modal) {
    modal.classList.remove('hidden');
    // Set default date to today
    document.getElementById('daily-task-due-date').value = new Date().toISOString().split('T')[0];
  }
}

function hideCreateDailyTaskModal() {
  const modal = document.getElementById('daily-task-modal');
  if (modal) {
    modal.classList.add('hidden');
    // Reset form
    document.getElementById('daily-task-title').value = '';
    document.getElementById('daily-task-description').value = '';
    document.getElementById('daily-task-assigned-to').value = '';
    document.getElementById('daily-task-due-date').value = '';
    document.getElementById('daily-task-priority').value = 'medium';
    document.getElementById('daily-task-status').value = 'pending';
    document.getElementById('daily-task-estimated-hours').value = '';
  }
}

function showCreateProgressReportModal() {
  const modal = document.getElementById('progress-report-modal');
  if (modal) {
    modal.classList.remove('hidden');
    // Set default date to today
    document.getElementById('progress-report-date').value = new Date().toISOString().split('T')[0];
  }
}

function hideCreateProgressReportModal() {
  const modal = document.getElementById('progress-report-modal');
  if (modal) {
    modal.classList.add('hidden');
    // Reset form
    document.getElementById('progress-reporter-name').value = '';
    document.getElementById('progress-report-date').value = '';
    document.getElementById('progress-tasks-completed').value = '';
    document.getElementById('progress-tasks-in-progress').value = '';
    document.getElementById('progress-tasks-blocked').value = '';
    document.getElementById('progress-hours-worked').value = '';
    document.getElementById('progress-mood-rating').value = '3';
    document.getElementById('progress-productivity-score').value = '3';
    document.getElementById('progress-challenges').value = '';
    document.getElementById('progress-next-day-plan').value = '';
  }
}

async function createNewDailyTask() {
  const title = document.getElementById('daily-task-title').value.trim();
  const description = document.getElementById('daily-task-description').value.trim();
  const assignedTo = document.getElementById('daily-task-assigned-to').value.trim();
  const dueDate = document.getElementById('daily-task-due-date').value;
  const priority = document.getElementById('daily-task-priority').value;
  const status = document.getElementById('daily-task-status').value;
  const estimatedHours = document.getElementById('daily-task-estimated-hours').value;

  if (!title) {
    showNotification('Please enter a task title', 'error');
    return;
  }

  if (!assignedTo) {
    showNotification('Please enter an assignee', 'error');
    return;
  }

  if (!dueDate) {
    showNotification('Please select a due date', 'error');
    return;
  }

  try {
    await dailyTaskManager.createDailyTask({
      title,
      description,
      assigned_to: assignedTo,
      due_date: dueDate,
      priority,
      status,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : 0
    });

    hideCreateDailyTaskModal();
  } catch (error) {
    // Error already handled in createDailyTask method
  }
}

async function createNewProgressReport() {
  const reporterName = document.getElementById('progress-reporter-name').value.trim();
  const reportDate = document.getElementById('progress-report-date').value;
  const tasksCompleted = document.getElementById('progress-tasks-completed').value.trim();
  const tasksInProgress = document.getElementById('progress-tasks-in-progress').value.trim();
  const tasksBlocked = document.getElementById('progress-tasks-blocked').value.trim();
  const hoursWorked = document.getElementById('progress-hours-worked').value;
  const moodRating = document.getElementById('progress-mood-rating').value;
  const productivityScore = document.getElementById('progress-productivity-score').value;
  const challenges = document.getElementById('progress-challenges').value.trim();
  const nextDayPlan = document.getElementById('progress-next-day-plan').value.trim();

  if (!reporterName) {
    showNotification('Please enter your name', 'error');
    return;
  }

  if (!reportDate) {
    showNotification('Please select a report date', 'error');
    return;
  }

  try {
    await dailyTaskManager.createProgressReport({
      reporter_name: reporterName,
      report_date: reportDate,
      tasks_completed: tasksCompleted,
      tasks_in_progress: tasksInProgress,
      tasks_blocked: tasksBlocked,
      hours_worked: hoursWorked ? parseFloat(hoursWorked) : 0,
      mood_rating: parseInt(moodRating),
      productivity_score: parseInt(productivityScore),
      challenges,
      next_day_plan: nextDayPlan
    });

    hideCreateProgressReportModal();
  } catch (error) {
    // Error already handled in createProgressReport method
  }
}

function applyDailyTaskFilters() {
  const assignedTo = document.getElementById('filter-assigned-to').value.trim();
  const status = document.getElementById('filter-status').value;
  const dueDate = document.getElementById('filter-due-date').value;

  const filters = {};
  if (assignedTo) filters.assigned_to = assignedTo;
  if (status) filters.status = status;
  if (dueDate) filters.due_date = dueDate;

  dailyTaskManager.loadDailyTasks(filters);
}

// Global reference for easy access
window.dailyTaskManager = null;

// Update navigation function to include daily tasks
function showSection(sectionName) {
  const sections = ['dashboard', 'projects', 'daily-tasks', 'tasks', 'articles', 'checklists'];
  sections.forEach(section => {
    const element = document.getElementById(section);
    if (section === sectionName) {
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
  });

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Find and activate the correct button
  const activeButton = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
  if (activeButton) {
    activeButton.classList.add('active');
  }

  // Load data when sections are shown
  if (sectionName === 'projects' && window.projectManager) {
    window.projectManager.loadProjects();
  }
  
  if (sectionName === 'daily-tasks' && window.dailyTaskManager) {
    window.dailyTaskManager.loadDailyTasks();
    window.dailyTaskManager.loadProgressReports();
  }
}
