/**
 * Project Management System
 * Handles projects, milestones, resource allocation, and global search
 */
class ProjectManager {
  constructor() {
    this.projects = [];
    this.apiBaseUrl = window.location.origin + '/api';
    this.clockInterval = null;
    this.initializeClocks();
  }

  /**
   * Initialize digital clocks for Indian and Thailand time
   */
  initializeClocks() {
    this.updateClocks();
    this.clockInterval = setInterval(() => this.updateClocks(), 1000);
  }

  /**
   * Update the digital clocks
   */
  updateClocks() {
    const now = new Date();
    
    // Indian Time (IST - UTC+5:30)
    const indianTimeElement = document.getElementById('indian-time');
    const indianDateElement = document.getElementById('indian-date');
    
    if (indianTimeElement) {
      indianTimeElement.textContent = now.toLocaleTimeString('en-IN', {
        hour12: false,
        timeZone: 'Asia/Kolkata'
      });
    }
    
    if (indianDateElement) {
      indianDateElement.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
    }

    // Thailand Time (ICT - UTC+7)
    const thailandTimeElement = document.getElementById('thailand-time');
    const thailandDateElement = document.getElementById('thailand-date');
    
    if (thailandTimeElement) {
      thailandTimeElement.textContent = now.toLocaleTimeString('en-TH', {
        hour12: false,
        timeZone: 'Asia/Bangkok'
      });
    }
    
    if (thailandDateElement) {
      thailandDateElement.textContent = now.toLocaleDateString('en-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Bangkok'
      });
    }
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
      console.error('Project API request failed:', error);
      throw error;
    }
  }

  /**
   * Load projects from backend
   */
  async loadProjects() {
    try {
      const response = await this.apiRequest('/projects');
      this.projects = response.data || [];
      this.renderProjects();
    } catch (error) {
      console.error('Error loading projects:', error);
      showNotification('Error loading projects', 'error');
    }
  }

  /**
   * Create a new project
   */
  async createProject(projectData) {
    try {
      const response = await this.apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });

      await this.loadProjects();
      showNotification('Project created successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      showNotification(error.message || 'Error creating project', 'error');
      throw error;
    }
  }

  /**
   * Update a project
   */
  async updateProject(projectId, updates) {
    try {
      await this.apiRequest(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      await this.loadProjects();
      showNotification('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification(error.message || 'Error updating project', 'error');
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project? This will also delete all associated milestones and resource allocations.')) {
      try {
        await this.apiRequest(`/projects/${projectId}`, {
          method: 'DELETE'
        });

        await this.loadProjects();
        showNotification('Project deleted successfully');
      } catch (error) {
        console.error('Error deleting project:', error);
        showNotification(error.message || 'Error deleting project', 'error');
      }
    }
  }

  /**
   * Add a task to a project
   */
  async addTaskToProject(projectId, taskId) {
    try {
      await this.apiRequest(`/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ taskId })
      });

      await this.loadProjects();
      showNotification('Task added to project successfully');
    } catch (error) {
      console.error('Error adding task to project:', error);
      showNotification(error.message || 'Error adding task to project', 'error');
    }
  }

  /**
   * Remove a task from a project
   */
  async removeTaskFromProject(projectId, taskId) {
    try {
      await this.apiRequest(`/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE'
      });

      await this.loadProjects();
      showNotification('Task removed from project successfully');
    } catch (error) {
      console.error('Error removing task from project:', error);
      showNotification(error.message || 'Error removing task from project', 'error');
    }
  }

  /**
   * Add a milestone to a project
   */
  async addMilestone(projectId, milestoneData) {
    try {
      const response = await this.apiRequest(`/projects/${projectId}/milestones`, {
        method: 'POST',
        body: JSON.stringify(milestoneData)
      });

      await this.loadProjects();
      showNotification('Milestone added successfully');
      return response.data;
    } catch (error) {
      console.error('Error adding milestone:', error);
      showNotification(error.message || 'Error adding milestone', 'error');
      throw error;
    }
  }

  /**
   * Update a milestone
   */
  async updateMilestone(projectId, milestoneId, updates) {
    try {
      await this.apiRequest(`/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      await this.loadProjects();
      showNotification('Milestone updated successfully');
    } catch (error) {
      console.error('Error updating milestone:', error);
      showNotification(error.message || 'Error updating milestone', 'error');
    }
  }

  /**
   * Delete a milestone
   */
  async deleteMilestone(projectId, milestoneId) {
    try {
      await this.apiRequest(`/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'DELETE'
      });

      await this.loadProjects();
      showNotification('Milestone deleted successfully');
    } catch (error) {
      console.error('Error deleting milestone:', error);
      showNotification(error.message || 'Error deleting milestone', 'error');
    }
  }

  /**
   * Add a resource allocation to a project
   */
  async addResource(projectId, resourceData) {
    try {
      const response = await this.apiRequest(`/projects/${projectId}/resources`, {
        method: 'POST',
        body: JSON.stringify(resourceData)
      });

      await this.loadProjects();
      showNotification('Resource allocation added successfully');
      return response.data;
    } catch (error) {
      console.error('Error adding resource allocation:', error);
      showNotification(error.message || 'Error adding resource allocation', 'error');
      throw error;
    }
  }

  /**
   * Update a resource allocation
   */
  async updateResource(projectId, resourceId, updates) {
    try {
      await this.apiRequest(`/projects/${projectId}/resources/${resourceId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      await this.loadProjects();
      showNotification('Resource allocation updated successfully');
    } catch (error) {
      console.error('Error updating resource allocation:', error);
      showNotification(error.message || 'Error updating resource allocation', 'error');
    }
  }

  /**
   * Delete a resource allocation
   */
  async deleteResource(projectId, resourceId) {
    try {
      await this.apiRequest(`/projects/${projectId}/resources/${resourceId}`, {
        method: 'DELETE'
      });

      await this.loadProjects();
      showNotification('Resource allocation deleted successfully');
    } catch (error) {
      console.error('Error deleting resource allocation:', error);
      showNotification(error.message || 'Error deleting resource allocation', 'error');
    }
  }

  /**
   * Calculate project progress based on milestones
   */
  calculateProjectProgress(project) {
    if (!project.milestones || !project.milestones.length) return 0;
    
    const completedMilestones = project.milestones.filter(m => m.completed).length;
    return Math.round((completedMilestones / project.milestones.length) * 100);
  }

  /**
   * Get status color class
   */
  getStatusColor(status) {
    const colors = {
      'planning': 'bg-blue-100 text-blue-800',
      'active': 'bg-green-100 text-green-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-purple-100 text-purple-800',
      'cancelled': 'bg-red-100 text-red-800'
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
   * Render projects in the UI
   */
  renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    container.innerHTML = '';

    this.projects.forEach(project => {
      const progress = this.calculateProjectProgress(project);
      const projectDiv = document.createElement('div');
      projectDiv.className = 'project-card bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-blue-500';

      const tasksHtml = (project.tasks || []).map(task => `
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
          <span class="text-sm ${task.completed ? 'line-through text-gray-500' : ''}">${this.escapeHtml(task.name)}</span>
          <button onclick="projectManager.removeTaskFromProject(${project.id}, ${task.id})" 
                  class="text-red-500 hover:text-red-700 text-xs">Remove</button>
        </div>
      `).join('');

      const milestonesHtml = (project.milestones || []).map(milestone => `
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
          <div class="flex items-center space-x-2">
            <input type="checkbox" ${milestone.completed ? 'checked' : ''} 
                   onchange="projectManager.updateMilestone(${project.id}, ${milestone.id}, {completed: this.checked})"
                   class="rounded">
            <span class="text-sm ${milestone.completed ? 'line-through text-gray-500' : ''}">${this.escapeHtml(milestone.title)}</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs text-gray-500">${milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : 'No due date'}</span>
            <button onclick="projectManager.deleteMilestone(${project.id}, ${milestone.id})" 
                    class="text-red-500 hover:text-red-700 text-xs">×</button>
          </div>
        </div>
      `).join('');

      const resourcesHtml = (project.resources || []).map(resource => `
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
          <div>
            <span class="text-sm font-medium">${this.escapeHtml(resource.resource_name)}</span>
            <span class="text-xs text-gray-500 ml-2">${this.escapeHtml(resource.role)}</span>
          </div>
          <button onclick="projectManager.deleteResource(${project.id}, ${resource.id})" 
                  class="text-red-500 hover:text-red-700 text-xs">×</button>
        </div>
      `).join('');

      projectDiv.innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2">${this.escapeHtml(project.name)}</h3>
            <p class="text-gray-600 mb-2">${this.escapeHtml(project.description || '')}</p>
            <div class="flex items-center space-x-4 text-sm">
              <span class="inline-block px-2 py-1 rounded text-xs font-medium ${this.getStatusColor(project.status)}">
                ${project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
              <span class="inline-block px-2 py-1 rounded text-xs font-medium ${this.getPriorityColor(project.priority)}">
                ${project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
              </span>
              ${project.manager ? `<span class="text-gray-600">👤 ${this.escapeHtml(project.manager)}</span>` : ''}
              ${project.budget ? `<span class="text-gray-600">💰 $${project.budget.toLocaleString()}</span>` : ''}
            </div>
          </div>
          <button onclick="projectManager.deleteProject(${project.id})" 
                  class="text-red-500 hover:text-red-700 font-bold text-xl">×</button>
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

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <h4 class="font-semibold mb-2">Tasks (${project.tasks?.length || 0})</h4>
            <div class="max-h-32 overflow-y-auto">
              ${tasksHtml || '<p class="text-gray-500 text-sm">No tasks assigned</p>'}
            </div>
            <button onclick="projectManager.promptAddTask(${project.id})" 
                    class="mt-2 text-blue-600 hover:text-blue-800 text-sm">+ Add Task</button>
          </div>
          
          <div>
            <h4 class="font-semibold mb-2">Milestones (${project.milestones?.length || 0})</h4>
            <div class="max-h-32 overflow-y-auto">
              ${milestonesHtml || '<p class="text-gray-500 text-sm">No milestones</p>'}
            </div>
            <button onclick="projectManager.promptAddMilestone(${project.id})" 
                    class="mt-2 text-blue-600 hover:text-blue-800 text-sm">+ Add Milestone</button>
          </div>
          
          <div>
            <h4 class="font-semibold mb-2">Resources (${project.resources?.length || 0})</h4>
            <div class="max-h-32 overflow-y-auto">
              ${resourcesHtml || '<p class="text-gray-500 text-sm">No resources allocated</p>'}
            </div>
            <button onclick="projectManager.promptAddResource(${project.id})" 
                    class="mt-2 text-blue-600 hover:text-blue-800 text-sm">+ Add Resource</button>
          </div>
        </div>

        <div class="text-xs text-gray-500">
          Created: ${new Date(project.created_at).toLocaleDateString()}
          ${project.start_date ? ` | Start: ${new Date(project.start_date).toLocaleDateString()}` : ''}
          ${project.end_date ? ` | End: ${new Date(project.end_date).toLocaleDateString()}` : ''}
        </div>
      `;

      container.appendChild(projectDiv);
    });
  }

  /**
   * Prompt user to add a task to project
   */
  async promptAddTask(projectId) {
    // Get available tasks that are not already assigned to this project
    try {
      const tasksResponse = await fetch(`${this.apiBaseUrl}/tasks`);
      const tasksData = await tasksResponse.json();
      const availableTasks = tasksData.data.filter(task => 
        !this.projects.find(p => p.id === projectId)?.tasks?.some(pt => pt.id === task.id)
      );

      if (availableTasks.length === 0) {
        showNotification('No available tasks to assign', 'error');
        return;
      }

      const taskNames = availableTasks.map(task => `${task.id}: ${task.name}`).join('\n');
      const taskId = prompt(`Available tasks:\n${taskNames}\n\nEnter task ID to assign:`);
      
      if (taskId && !isNaN(taskId)) {
        await this.addTaskToProject(projectId, parseInt(taskId));
      }
    } catch (error) {
      console.error('Error getting available tasks:', error);
      showNotification('Error getting available tasks', 'error');
    }
  }

  /**
   * Prompt user to add a milestone
   */
  async promptAddMilestone(projectId) {
    const title = prompt('Enter milestone title:');
    if (title && title.trim().length >= 3) {
      const description = prompt('Enter milestone description (optional):');
      const dueDate = prompt('Enter due date (YYYY-MM-DD, optional):');
      
      await this.addMilestone(projectId, {
        title: title.trim(),
        description: description || '',
        due_date: dueDate || null
      });
    } else if (title) {
      showNotification('Milestone title must be at least 3 characters long', 'error');
    }
  }

  /**
   * Prompt user to add a resource
   */
  async promptAddResource(projectId) {
    const resourceName = prompt('Enter resource name:');
    if (resourceName && resourceName.trim().length >= 2) {
      const role = prompt('Enter role:');
      if (role) {
        const hoursPerWeek = prompt('Enter hours per week (default: 40):');
        const hourlyRate = prompt('Enter hourly rate (optional):');
        
        await this.addResource(projectId, {
          resource_name: resourceName.trim(),
          role: role.trim(),
          hours_per_week: hoursPerWeek ? parseFloat(hoursPerWeek) : 40,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : 0
        });
      } else {
        showNotification('Role is required', 'error');
      }
    } else if (resourceName) {
      showNotification('Resource name must be at least 2 characters long', 'error');
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

/**
 * Global Search System
 */
class GlobalSearch {
  constructor() {
    this.apiBaseUrl = window.location.origin + '/api';
  }

  /**
   * Perform global search across all content
   */
  async performSearch(query) {
    if (!query || query.trim().length < 2) {
      showNotification('Please enter at least 2 characters to search', 'error');
      return;
    }

    try {
      showLoading(true);
      
      // Search in parallel across all endpoints
      const [projectsResponse, tasksResponse, articlesResponse, checklistsResponse] = await Promise.all([
        fetch(`${this.apiBaseUrl}/projects`),
        fetch(`${this.apiBaseUrl}/tasks`),
        fetch(`${this.apiBaseUrl}/articles`),
        fetch(`${this.apiBaseUrl}/checklists`)
      ]);

      const [projectsData, tasksData, articlesData, checklistsData] = await Promise.all([
        projectsResponse.json(),
        tasksResponse.json(),
        articlesResponse.json(),
        checklistsResponse.json()
      ]);

      const results = {
        projects: this.filterProjects(projectsData.data || [], query),
        tasks: this.filterTasks(tasksData.data || [], query),
        articles: this.filterArticles(articlesData.data || [], query),
        checklists: this.filterChecklists(checklistsData.data || [], query)
      };

      this.displaySearchResults(results, query);
    } catch (error) {
      console.error('Error performing search:', error);
      showNotification('Error performing search', 'error');
    } finally {
      showLoading(false);
    }
  }

  /**
   * Filter projects based on search query
   */
  filterProjects(projects, query) {
    const lowerQuery = query.toLowerCase();
    return projects.filter(project => 
      project.name.toLowerCase().includes(lowerQuery) ||
      project.description.toLowerCase().includes(lowerQuery) ||
      (project.manager && project.manager.toLowerCase().includes(lowerQuery)) ||
      project.status.toLowerCase().includes(lowerQuery) ||
      project.priority.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Filter tasks based on search query
   */
  filterTasks(tasks, query) {
    const lowerQuery = query.toLowerCase();
    return tasks.filter(task => 
      task.name.toLowerCase().includes(lowerQuery) ||
      task.creator.toLowerCase().includes(lowerQuery) ||
      task.status.toLowerCase().includes(lowerQuery) ||
      (task.approver && task.approver.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Filter articles based on search query
   */
  filterArticles(articles, query) {
    const lowerQuery = query.toLowerCase();
    return articles.filter(article => 
      article.headline.toLowerCase().includes(lowerQuery) ||
      article.link.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Filter checklists based on search query
   */
  filterChecklists(checklists, query) {
    const lowerQuery = query.toLowerCase();
    return checklists.filter(checklist => 
      checklist.title.toLowerCase().includes(lowerQuery) ||
      checklist.description.toLowerCase().includes(lowerQuery) ||
      checklist.theme.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Display search results in modal
   */
  displaySearchResults(results, query) {
    const modal = document.getElementById('search-modal');
    const resultsContainer = document.getElementById('search-results');
    
    if (!modal || !resultsContainer) return;

    const totalResults = results.projects.length + results.tasks.length + 
                        results.articles.length + results.checklists.length;

    if (totalResults === 0) {
      resultsContainer.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-500">No results found for "${query}"</p>
        </div>
      `;
    } else {
      resultsContainer.innerHTML = `
        <div class="mb-4">
          <p class="text-sm text-gray-600">Found ${totalResults} results for "${query}"</p>
        </div>
        
        ${this.renderSearchSection('Projects', results.projects, 'project')}
        ${this.renderSearchSection('Tasks', results.tasks, 'task')}
        ${this.renderSearchSection('Articles', results.articles, 'article')}
        ${this.renderSearchSection('Checklists', results.checklists, 'checklist')}
      `;
    }

    modal.classList.remove('hidden');
  }

  /**
   * Render a search results section
   */
  renderSearchSection(title, items, type) {
    if (items.length === 0) return '';

    return `
      <div class="mb-6">
        <h4 class="font-semibold text-lg mb-3">${title} (${items.length})</h4>
        <div class="space-y-2">
          ${items.map(item => this.renderSearchItem(item, type)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render a single search result item
   */
  renderSearchItem(item, type) {
    const itemClass = 'p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer';
    
    switch (type) {
      case 'project':
        return `
          <div class="${itemClass}" onclick="showSection('projects')">
            <div class="font-medium">${this.escapeHtml(item.name)}</div>
            <div class="text-sm text-gray-600">${this.escapeHtml(item.description || '')}</div>
            <div class="text-xs text-gray-500 mt-1">
              Status: ${item.status} | Priority: ${item.priority}
              ${item.manager ? ` | Manager: ${this.escapeHtml(item.manager)}` : ''}
            </div>
          </div>
        `;
      
      case 'task':
        return `
          <div class="${itemClass}" onclick="showSection('tasks')">
            <div class="font-medium">${this.escapeHtml(item.name)}</div>
            <div class="text-sm text-gray-600">Created by: ${this.escapeHtml(item.creator)}</div>
            <div class="text-xs text-gray-500 mt-1">
              Status: ${item.status} ${item.completed ? '| Completed' : ''}
            </div>
          </div>
        `;
      
      case 'article':
        return `
          <div class="${itemClass}">
            <div class="font-medium">${this.escapeHtml(item.headline)}</div>
            <a href="${this.escapeHtml(item.link)}" target="_blank" class="text-sm text-blue-600 hover:text-blue-800">
              ${this.escapeHtml(item.link)}
            </a>
          </div>
        `;
      
      case 'checklist':
        return `
          <div class="${itemClass}" onclick="showSection('checklists')">
            <div class="font-medium">${this.escapeHtml(item.title)}</div>
            <div class="text-sm text-gray-600">${this.escapeHtml(item.description || '')}</div>
            <div class="text-xs text-gray-500 mt-1">Theme: ${item.theme}</div>
          </div>
        `;
      
      default:
        return '';
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

// Global instances
let projectManager;
let globalSearch;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  projectManager = new ProjectManager();
  globalSearch = new GlobalSearch();
});

// Modal functions
function showCreateProjectModal() {
  const modal = document.getElementById('project-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function hideCreateProjectModal() {
  const modal = document.getElementById('project-modal');
  if (modal) {
    modal.classList.add('hidden');
    // Reset form
    document.getElementById('project-name').value = '';
    document.getElementById('project-description').value = '';
    document.getElementById('project-start-date').value = '';
    document.getElementById('project-end-date').value = '';
    document.getElementById('project-status').value = 'planning';
    document.getElementById('project-priority').value = 'medium';
    document.getElementById('project-manager').value = '';
    document.getElementById('project-budget').value = '';
  }
}

async function createNewProject() {
  const name = document.getElementById('project-name').value.trim();
  const description = document.getElementById('project-description').value.trim();
  const startDate = document.getElementById('project-start-date').value;
  const endDate = document.getElementById('project-end-date').value;
  const status = document.getElementById('project-status').value;
  const priority = document.getElementById('project-priority').value;
  const manager = document.getElementById('project-manager').value.trim();
  const budget = document.getElementById('project-budget').value;

  if (!name) {
    showNotification('Please enter a project name', 'error');
    return;
  }

  if (name.length < 3) {
    showNotification('Project name must be at least 3 characters long', 'error');
    return;
  }

  try {
    await projectManager.createProject({
      name,
      description,
      start_date: startDate || null,
      end_date: endDate || null,
      status,
      priority,
      manager,
      budget: budget ? parseFloat(budget) : null
    });

    hideCreateProjectModal();
  } catch (error) {
    // Error already handled in createProject method
  }
}

function performGlobalSearch() {
  const query = document.getElementById('global-search').value.trim();
  if (globalSearch) {
    globalSearch.performSearch(query);
  }
}

function hideSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Global reference for easy access
window.projectManager = null;
window.globalSearch = null;

// Update navigation function to include projects
function showSection(sectionName) {
  const sections = ['dashboard', 'projects', 'tasks', 'articles', 'checklists'];
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

  // Load projects data when projects section is shown
  if (sectionName === 'projects' && projectManager) {
    projectManager.loadProjects();
  }
}
