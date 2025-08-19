// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Global state
let currentUser = null;
let tasks = [];
let articles = [];

/**
 * API helper function for making HTTP requests
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    console.error('API request failed:', error);
    throw error;
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
  try {
    showLoading(true);
    await loadData();
    showSection('dashboard');
  } catch (error) {
    console.error('Error initializing application:', error);
    showNotification('Error initializing application. Please refresh the page.', 'error');
  } finally {
    showLoading(false);
  }
});

// Navigation function
function showSection(sectionName) {
  const sections = ['dashboard', 'tasks', 'articles', 'checklists'];
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
}

// Load data from backend APIs
async function loadData() {
  try {
    const [tasksResponse, articlesResponse] = await Promise.all([
      apiRequest('/tasks'),
      apiRequest('/articles')
    ]);

    tasks = tasksResponse.data || [];
    articles = articlesResponse.data || [];

    updateStats();
    renderTasks();
    renderArticles();
    renderChecklistDashboard();
  } catch (error) {
    console.error('Error loading data:', error);
    showNotification('Error loading data', 'error');
  }
}

// Task Management Functions
async function addTask() {
  const taskName = document.getElementById('task-name').value.trim();
  const creatorName = document.getElementById('creator-name').value.trim();

  if (!taskName || !creatorName) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  if (taskName.length < 3) {
    showNotification('Task name must be at least 3 characters long', 'error');
    return;
  }

  if (creatorName.length < 2) {
    showNotification('Creator name must be at least 2 characters long', 'error');
    return;
  }

  try {
    await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        name: taskName,
        creator: creatorName
      })
    });

    document.getElementById('task-name').value = '';
    document.getElementById('creator-name').value = '';
    await loadData();
    showNotification('Task added successfully');
  } catch (error) {
    console.error('Error adding task:', error);
    showNotification(error.message || 'Error adding task', 'error');
  }
}

async function updateTaskStatus(taskId, status, approver = null) {
  try {
    const updates = { status };
    if (approver) {
      updates.approver = approver;
    }

    await apiRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    await loadData();
    showNotification(`Task ${status} successfully`);
  } catch (error) {
    console.error('Error updating task:', error);
    showNotification(error.message || 'Error updating task', 'error');
  }
}

async function approveTask(taskId) {
  const approver = prompt('Enter approver name:');
  if (approver && approver.trim()) {
    await updateTaskStatus(taskId, 'approved', approver.trim());
  }
}

async function rejectTask(taskId) {
  await updateTaskStatus(taskId, 'rejected');
}

async function setTaskTimer(taskId) {
  const timer = prompt('Enter timer (e.g., "2 hours", "3 days", or specific datetime):');
  if (timer && timer.trim()) {
    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ timer: timer.trim() })
      });

      await loadData();
      showNotification('Timer set successfully');
    } catch (error) {
      console.error('Error setting timer:', error);
      showNotification(error.message || 'Error setting timer', 'error');
    }
  }
}

async function completeTask(taskId) {
  try {
    await apiRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: true })
    });

    await loadData();
    showNotification('Task completed successfully');
  } catch (error) {
    console.error('Error completing task:', error);
    showNotification(error.message || 'Error completing task', 'error');
  }
}

async function deleteTask(taskId) {
  if (confirm('Are you sure you want to delete this task?')) {
    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: 'DELETE'
      });

      await loadData();
      showNotification('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      showNotification(error.message || 'Error deleting task', 'error');
    }
  }
}

// Render tasks in the UI
function renderTasks() {
  const tasksList = document.getElementById('tasks-list');
  if (!tasksList) return;

  tasksList.innerHTML = '';

  tasks.forEach(task => {
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card bg-gray-50 p-4 rounded-lg mb-4 border-l-4';

    // Status-based styling
    let statusClass = 'border-gray-400';
    if (task.status === 'approved') statusClass = 'border-green-400';
    else if (task.status === 'rejected') statusClass = 'border-red-400';
    else if (task.completed) statusClass = 'border-purple-400';

    taskCard.className += ` ${statusClass}`;

    const timerInfo = task.timer ? `<div class="text-sm text-gray-600 mt-1">⏰ Timer: ${formatTimer(task.timer)}</div>` : '';
    const approverInfo = task.approver ? `<div class="text-sm text-gray-600 mt-1">✅ Approved by: ${task.approver}</div>` : '';

    taskCard.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="font-semibold text-lg ${task.completed ? 'line-through text-gray-500' : ''}">${escapeHtml(task.name)}</h3>
          <div class="text-sm text-gray-600 mt-1">👤 Created by: ${escapeHtml(task.creator)}</div>
          <div class="text-sm mt-1">
            <span class="inline-block px-2 py-1 rounded text-xs font-medium 
              ${task.status === 'approved' ? 'bg-green-100 text-green-800' :
                task.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'}">
              ${task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </span>
          </div>
          ${approverInfo}
          ${timerInfo}
          ${task.completed ? '<div class="text-sm text-purple-600 mt-1">✓ Completed</div>' : ''}
          <div class="text-xs text-gray-500 mt-2">Added: ${new Date(task.created_at).toLocaleDateString()}</div>
        </div>
        <div class="flex flex-col space-y-1 ml-4">
          ${!task.completed && task.status === 'pending' ? `
            <button onclick="approveTask(${task.id})" class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">Approve</button>
            <button onclick="rejectTask(${task.id})" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">Reject</button>
          ` : ''}
          ${!task.completed && task.status === 'approved' ? `
            <button onclick="setTaskTimer(${task.id})" class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">Set Timer</button>
            <button onclick="completeTask(${task.id})" class="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600">Complete</button>
          ` : ''}
          <button onclick="deleteTask(${task.id})" class="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600">Delete</button>
        </div>
      </div>
    `;

    tasksList.appendChild(taskCard);
  });
}

// Article Management Functions
async function addArticle() {
  const headline = document.getElementById('article-headline').value.trim();
  const link = document.getElementById('article-link').value.trim();

  if (!headline || !link) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  if (headline.length < 5) {
    showNotification('Article headline must be at least 5 characters long', 'error');
    return;
  }

  // Basic URL validation
  try {
    new URL(link);
  } catch (e) {
    showNotification('Please enter a valid URL', 'error');
    return;
  }

  try {
    await apiRequest('/articles', {
      method: 'POST',
      body: JSON.stringify({
        headline: headline,
        link: link
      })
    });

    document.getElementById('article-headline').value = '';
    document.getElementById('article-link').value = '';
    await loadData();
    showNotification('Article added successfully');
  } catch (error) {
    console.error('Error adding article:', error);
    showNotification(error.message || 'Error adding article', 'error');
  }
}

async function deleteArticle(articleId) {
  if (confirm('Are you sure you want to delete this article?')) {
    try {
      await apiRequest(`/articles/${articleId}`, {
        method: 'DELETE'
      });

      await loadData();
      showNotification('Article deleted successfully');
    } catch (error) {
      console.error('Error deleting article:', error);
      showNotification(error.message || 'Error deleting article', 'error');
    }
  }
}

// Render articles in the UI
function renderArticles() {
  const articlesList = document.getElementById('articles-list');
  if (!articlesList) return;

  articlesList.innerHTML = '';

  articles.forEach(article => {
    const articleCard = document.createElement('div');
    articleCard.className = 'article-card bg-gray-50 p-4 rounded-lg mb-4 border-l-4 border-blue-400';

    articleCard.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="font-semibold text-lg mb-2">${escapeHtml(article.headline)}</h3>
          <a href="${escapeHtml(article.link)}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm break-all">
            ${escapeHtml(article.link)}
          </a>
          <div class="text-xs text-gray-500 mt-2">Added: ${new Date(article.created_at).toLocaleDateString()}</div>
        </div>
        <button onclick="deleteArticle(${article.id})" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 ml-4">
          Delete
        </button>
      </div>
    `;

    articlesList.appendChild(articleCard);
  });
}

// Statistics and Dashboard Functions
function updateStats() {
  // Task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const approvedTasks = tasks.filter(task => task.status === 'approved').length;

  // Update dashboard elements
  const elements = {
    'total-tasks': totalTasks,
    'completed-tasks': completedTasks,
    'pending-tasks': pendingTasks,
    'total-articles': articles.length
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  });
}

// Utility Functions
function formatTimer(timer) {
  if (!timer) return '';
  
  // If it looks like a date, format it
  const date = new Date(timer);
  if (!isNaN(date.getTime())) {
    return date.toLocaleString();
  }
  
  // Otherwise return as-is
  return timer;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function showLoading(show) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.toggle('hidden', !show);
  }
}

function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
  }`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Initialize checklist manager after DOM is loaded
let checklistManager;
document.addEventListener('DOMContentLoaded', function() {
  checklistManager = new ChecklistManager();
});

function renderChecklistDashboard() {
  if (checklistManager) {
    checklistManager.renderDashboard();
  }
}
