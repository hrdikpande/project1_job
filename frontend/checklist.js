/**
 * Checklist Manager - Now integrated with backend API
 * Manages checklists with tasks and subtasks using backend database
 */
class ChecklistManager {
    constructor() {
      this.checklists = [];
      this.apiBaseUrl = window.location.origin + '/api';
      this.initializePreloadedChecklists();
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
        console.error('Checklist API request failed:', error);
        throw error;
      }
    }
  
    /**
     * Load checklists from backend
     */
    async loadChecklists() {
      try {
        const response = await this.apiRequest('/checklists');
        this.checklists = response.data || [];
        this.renderAll();
      } catch (error) {
        console.error('Error loading checklists:', error);
        showNotification('Error loading checklists', 'error');
        
        // Fallback to localStorage if backend fails
        try {
          const stored = localStorage.getItem('checklists');
          this.checklists = stored ? JSON.parse(stored) : [];
          this.renderAll();
        } catch (localError) {
          console.error('Error loading from localStorage:', localError);
          this.checklists = [];
        }
      }
    }
  
    /**
     * Save checklists to backend and localStorage backup
     */
    async saveChecklists() {
      try {
        // Save to localStorage as backup
        localStorage.setItem('checklists', JSON.stringify(this.checklists));
        this.renderAll();
      } catch (error) {
        console.error('Error saving checklists:', error);
        showNotification('Error saving checklists', 'error');
      }
    }
  
    /**
     * Initialize with preloaded checklists if none exist
     */
    async initializePreloadedChecklists() {
      await this.loadChecklists();
      
      if (this.checklists.length === 0) {
        const preloadedTasks = [
          { title: "Content Research", priority: "High" },
          { title: "Write Headlines", priority: "High" },
          { title: "Draft Articles", priority: "Medium" },
          { title: "Edit Content", priority: "Medium" },
          { title: "SEO Optimization", priority: "Medium" },
          { title: "Image Selection", priority: "Low" },
          { title: "Publish Articles", priority: "High" },
          { title: "Social Media Promotion", priority: "Low" }
        ];
  
        const preloadedChecklists = [
          { title: "Bangkok Hotel News", theme: "blue" },
          { title: "Bangkok Business News", theme: "green" },
          { title: "Bangkok Gems News", theme: "purple" },
          { title: "Gems News", theme: "red" },
          { title: "Thailand AI News", theme: "indigo" }
        ];
  
        for (const checklistData of preloadedChecklists) {
          try {
            const checklist = await this.createChecklist({
              title: checklistData.title,
              description: "News content management checklist",
              theme: checklistData.theme
            });
  
            // Add tasks to the newly created checklist
            for (const taskData of preloadedTasks) {
              await this.addTask(checklist.id, taskData);
            }
          } catch (error) {
            console.error('Error creating preloaded checklist:', error);
          }
        }
  
        await this.loadChecklists();
      }
    }
  
    /**
     * Generate unique ID for frontend elements
     */
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
  
    /**
     * Create a new checklist
     */
    async createChecklist(data) {
      try {
        console.log('Sending checklist data:', data);
        const response = await this.apiRequest('/checklists', {
          method: 'POST',
          body: JSON.stringify({
            title: data.title,
            description: data.description || "",
            theme: data.theme || "blue"
          })
        });
  
        await this.loadChecklists();
        showNotification('Checklist created successfully');
        return response.data;
      } catch (error) {
        console.error('Error creating checklist:', error);
        const errorMessage = error.message || 'Error creating checklist';
        showNotification(errorMessage, 'error');
        throw error;
      }
    }
  
    /**
     * Delete a checklist
     */
    async deleteChecklist(id) {
      try {
        await this.apiRequest(`/checklists/${id}`, {
          method: 'DELETE'
        });
  
        await this.loadChecklists();
        showNotification('Checklist deleted successfully');
      } catch (error) {
        console.error('Error deleting checklist:', error);
        showNotification(error.message || 'Error deleting checklist', 'error');
      }
    }
  
    /**
     * Add a task to a checklist
     */
    async addTask(checklistId, taskData) {
      try {
        const response = await this.apiRequest(`/checklists/${checklistId}/tasks`, {
          method: 'POST',
          body: JSON.stringify({
            title: taskData.title,
            priority: taskData.priority || "Medium"
          })
        });
  
        await this.loadChecklists();
        return response.data;
      } catch (error) {
        console.error('Error adding task:', error);
        showNotification(error.message || 'Error adding task', 'error');
        throw error;
      }
    }
  
    /**
     * Update a task
     */
    async updateTask(checklistId, taskId, updates) {
      try {
        await this.apiRequest(`/checklists/${checklistId}/tasks/${taskId}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
  
        await this.loadChecklists();
      } catch (error) {
        console.error('Error updating task:', error);
        showNotification(error.message || 'Error updating task', 'error');
      }
    }
  
    /**
     * Delete a task
     */
    async deleteTask(checklistId, taskId) {
      try {
        await this.apiRequest(`/checklists/${checklistId}/tasks/${taskId}`, {
          method: 'DELETE'
        });
  
        await this.loadChecklists();
        showNotification('Task deleted successfully');
      } catch (error) {
        console.error('Error deleting task:', error);
        showNotification(error.message || 'Error deleting task', 'error');
      }
    }
  
    /**
     * Add a subtask
     */
    async addSubtask(checklistId, taskId, subtaskData) {
      try {
        const response = await this.apiRequest(`/checklists/${checklistId}/tasks/${taskId}/subtasks`, {
          method: 'POST',
          body: JSON.stringify({
            title: subtaskData.title
          })
        });
  
        await this.loadChecklists();
        return response.data;
      } catch (error) {
        console.error('Error adding subtask:', error);
        showNotification(error.message || 'Error adding subtask', 'error');
        throw error;
      }
    }
  
    /**
     * Update a subtask
     */
    async updateSubtask(checklistId, taskId, subtaskId, updates) {
      try {
        await this.apiRequest(`/checklists/${checklistId}/tasks/${taskId}/subtasks/${subtaskId}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
  
        await this.loadChecklists();
      } catch (error) {
        console.error('Error updating subtask:', error);
        showNotification(error.message || 'Error updating subtask', 'error');
      }
    }
  
    /**
     * Delete a subtask
     */
    async deleteSubtask(checklistId, taskId, subtaskId) {
      try {
        await this.apiRequest(`/checklists/${checklistId}/tasks/${taskId}/subtasks/${subtaskId}`, {
          method: 'DELETE'
        });
  
        await this.loadChecklists();
        showNotification('Subtask deleted successfully');
      } catch (error) {
        console.error('Error deleting subtask:', error);
        showNotification(error.message || 'Error deleting subtask', 'error');
      }
    }
  
    /**
     * Calculate progress percentage for a checklist
     */
    calculateProgress(checklist) {
      if (!checklist.tasks || !checklist.tasks.length) return 0;
  
      let totalItems = 0;
      let completedItems = 0;
  
      checklist.tasks.forEach(task => {
        totalItems++;
        if (task.completed) completedItems++;
  
        // Count subtasks
        if (task.subtasks) {
          task.subtasks.forEach(subtask => {
            totalItems++;
            if (subtask.completed) completedItems++;
          });
        }
      });
  
      return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    }
  
    /**
     * Render all checklists and dashboard
     */
    renderAll() {
      this.renderChecklists();
      this.renderDashboard();
    }
  
    /**
     * Render checklists in the UI
     */
    renderChecklists() {
      const container = document.getElementById('checklists-container');
      if (!container) return;
  
      container.innerHTML = '';
  
      this.checklists.forEach(checklist => {
        const progress = this.calculateProgress(checklist);
        const checklistDiv = document.createElement('div');
        checklistDiv.className = `checklist-card bg-white p-6 rounded-lg shadow mb-6 theme-${checklist.theme}`;
  
        const tasksHtml = (checklist.tasks || []).map(task => {
          const subtasksHtml = (task.subtasks || []).map(subtask => `
            <div class="flex items-center space-x-2 ml-6 mt-1">
              <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
                     onchange="checklistManager.updateSubtask('${checklist.id}', '${task.id}', '${subtask.id}', {completed: this.checked})"
                     class="rounded">
              <span class="text-sm ${subtask.completed ? 'line-through text-gray-500' : ''}">${this.escapeHtml(subtask.title)}</span>
              <button onclick="checklistManager.deleteSubtask('${checklist.id}', '${task.id}', '${subtask.id}')" 
                      class="text-red-500 hover:text-red-700 text-xs">×</button>
            </div>
          `).join('');
  
          return `
            <div class="task-item border-l-2 pl-3 mb-3 ${task.priority === 'High' ? 'border-red-400' : task.priority === 'Medium' ? 'border-yellow-400' : 'border-green-400'}">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 flex-1">
                  <input type="checkbox" ${task.completed ? 'checked' : ''} 
                         onchange="checklistManager.updateTask('${checklist.id}', '${task.id}', {completed: this.checked})"
                         class="rounded">
                  <span class="font-medium ${task.completed ? 'line-through text-gray-500' : ''}">${this.escapeHtml(task.title)}</span>
                  <span class="text-xs px-2 py-1 rounded priority-${task.priority.toLowerCase()}">${task.priority}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <button onclick="checklistManager.promptAddSubtask('${checklist.id}', '${task.id}')" 
                          class="text-blue-500 hover:text-blue-700 text-sm">+ Sub</button>
                  <button onclick="checklistManager.deleteTask('${checklist.id}', '${task.id}')" 
                          class="text-red-500 hover:text-red-700">×</button>
                </div>
              </div>
              ${subtasksHtml}
            </div>
          `;
        }).join('');
  
        checklistDiv.innerHTML = `
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-xl font-bold">${this.escapeHtml(checklist.title)}</h3>
              <p class="text-gray-600">${this.escapeHtml(checklist.description || '')}</p>
            </div>
            <button onclick="checklistManager.deleteChecklist('${checklist.id}')" 
                    class="text-red-500 hover:text-red-700 font-bold">×</button>
          </div>
          
          <div class="mb-4">
            <div class="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>${progress}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="progress-bar bg-blue-600 h-2 rounded-full" style="width: ${progress}%"></div>
            </div>
          </div>
  
          <div class="tasks-list mb-4">
            ${tasksHtml}
          </div>
  
          <div class="flex space-x-2">
            <button onclick="checklistManager.promptAddTask('${checklist.id}')" 
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Add Task
            </button>
          </div>
        `;
  
        container.appendChild(checklistDiv);
      });
    }
  
    /**
     * Render dashboard statistics
     */
    renderDashboard() {
      const dashboardContainer = document.getElementById('checklist-dashboard');
      if (!dashboardContainer) return;
  
      const totalChecklists = this.checklists.length;
      const totalTasks = this.checklists.reduce((sum, checklist) => sum + (checklist.tasks?.length || 0), 0);
      const completedTasks = this.checklists.reduce((sum, checklist) => {
        return sum + (checklist.tasks?.filter(task => task.completed).length || 0);
      }, 0);
  
      const activeChecklists = this.checklists.filter(checklist => {
        const progress = this.calculateProgress(checklist);
        return progress > 0 && progress < 100;
      });
  
      dashboardContainer.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="stats-card bg-blue-100 p-4 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">${totalChecklists}</div>
            <div class="text-sm text-blue-600">Total Checklists</div>
          </div>
          <div class="stats-card bg-green-100 p-4 rounded-lg">
            <div class="text-2xl font-bold text-green-600">${completedTasks}</div>
            <div class="text-sm text-green-600">Completed Tasks</div>
          </div>
          <div class="stats-card bg-yellow-100 p-4 rounded-lg">
            <div class="text-2xl font-bold text-yellow-600">${totalTasks}</div>
            <div class="text-sm text-yellow-600">Total Tasks</div>
          </div>
          <div class="stats-card bg-purple-100 p-4 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">${activeChecklists.length}</div>
            <div class="text-sm text-purple-600">Active Checklists</div>
          </div>
        </div>
  
        ${activeChecklists.length > 0 ? `
          <div class="bg-white p-4 rounded-lg shadow">
            <h4 class="font-semibold mb-3">Active Checklists</h4>
            ${activeChecklists.map(checklist => {
              const progress = this.calculateProgress(checklist);
              return `
                <div class="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span class="font-medium">${this.escapeHtml(checklist.title)}</span>
                  <span class="text-sm text-gray-600">${progress}%</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      `;
    }
  
    /**
     * Prompt user to add a new task
     */
    async promptAddTask(checklistId) {
      const title = prompt('Enter task title:');
      if (title && title.trim()) {
        const priority = prompt('Enter priority (High, Medium, Low):', 'Medium');
        if (priority && ['High', 'Medium', 'Low'].includes(priority)) {
          await this.addTask(checklistId, { title: title.trim(), priority });
        }
      }
    }
  
    /**
     * Prompt user to add a new subtask
     */
    async promptAddSubtask(checklistId, taskId) {
      const title = prompt('Enter subtask title:');
      if (title && title.trim().length >= 2) {
        await this.addSubtask(checklistId, taskId, { title: title.trim() });
      } else if (title) {
        showNotification('Subtask title must be at least 2 characters long', 'error');
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
  
  // Modal functions for creating new checklists
  function showCreateChecklistModal() {
    const modal = document.getElementById('checklist-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }
  
  function hideCreateChecklistModal() {
    const modal = document.getElementById('checklist-modal');
    if (modal) {
      modal.classList.add('hidden');
      // Reset form
      document.getElementById('checklist-title').value = '';
      document.getElementById('checklist-description').value = '';
      document.getElementById('checklist-theme').value = 'blue';
    }
  }
  
  async function createNewChecklist() {
    const title = document.getElementById('checklist-title').value.trim();
    const description = document.getElementById('checklist-description').value.trim();
    const theme = document.getElementById('checklist-theme').value.toLowerCase();
    
    // Sanitize inputs
    const sanitizedTitle = title.replace(/[<>]/g, '');
    const sanitizedDescription = description.replace(/[<>]/g, '');
  
    if (!title) {
      showNotification('Please enter a checklist title', 'error');
      return;
    }
  
    if (title.length < 3) {
      showNotification('Checklist title must be at least 3 characters long', 'error');
      return;
    }
  
    try {
      await checklistManager.createChecklist({
        title: sanitizedTitle,
        description: sanitizedDescription,
        theme
      });
  
      hideCreateChecklistModal();
    } catch (error) {
      // Error already handled in createChecklist method
    }
  }
  
  // Global reference for easy access
  window.checklistManager = null;
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    window.checklistManager = new ChecklistManager();
  });
  