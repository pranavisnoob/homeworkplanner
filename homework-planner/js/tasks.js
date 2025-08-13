/**
 * tasks.js (Corrected & Complete)
 * This file preserves all original functionality (modals, sorting, filtering)
 * while fixing the sync, double-add, and delete bugs that affect the
 * sidebar badge count.
 */
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const tasksGrid = document.getElementById('tasksGrid');
  const emptyState = document.getElementById('emptyState');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const addTaskEmptyBtn = document.getElementById('addTaskEmptyBtn');
  const searchInput = document.getElementById('searchInput');
  const filterStatus = document.getElementById('filterStatus');
  const sortTasks = document.getElementById('sortTasks');
  const totalTasksStat = document.getElementById('totalTasksStat');
  const completedTasksStat = document.getElementById('completedTasksStat');
  const pendingTasksStat = document.getElementById('pendingTasksStat');
  const overdueTasksStat = document.getElementById('overdueTasksStat');
  const taskModal = document.getElementById('taskModal');
  const taskForm = document.getElementById('taskForm');
  const taskModalTitle = document.getElementById('taskModalTitle');
  const taskIdInput = document.getElementById('taskId');
  const taskTitleInput = document.getElementById('taskTitle');
  const taskSubjectInput = document.getElementById('taskSubject');
  const taskDateInput = document.getElementById('taskDate');
  const taskTimeInput = document.getElementById('taskTime');
  const taskPriorityInput = document.getElementById('taskPriority');
  const taskNotesInput = document.getElementById('taskNotes');
  const deleteTaskBtn = document.getElementById('deleteTaskBtn');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  const confirmModal = document.getElementById('confirmModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  // **FIX: Unified storage key to sync with dashboard.js**
  const TASKS_STORAGE_KEY = 'homework_planner_tasks';

  // Fetch from storage
  function getTasks() {
    return JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY)) || [];
  }

  function saveTasks(updatedTasks) {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
    // This function will now handle re-rendering and updating all stats/badges
    filterAndSortTasks();
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('tasksUpdated'));
  }

  function updateTasksBadge() {
    const tasksFromStorage = getTasks();
    const pendingTasks = tasksFromStorage.filter(task => !task.completed).length;
    const badge = document.getElementById('tasksBadge');
    if (badge) {
        badge.textContent = pendingTasks;
        badge.style.display = pendingTasks > 0 ? 'block' : 'none';
    }
  }

  function renderTasks(tasksArray) {
    tasksGrid.innerHTML = '';
    if (tasksArray.length === 0) {
      emptyState.style.display = 'flex';
      tasksGrid.style.display = 'none';
      return;
    }
    emptyState.style.display = 'none';
    tasksGrid.style.display = 'grid';

    const fragment = document.createDocumentFragment();
    const subjectNames = {
      math: "Mathematics",
      science: "Science",
      english: "English",
      history: "History",
      other: "Other"
    };
    const priorityIcons = {
      high: 'fa-exclamation',
      medium: 'fa-equals',
      low: 'fa-arrow-down'
    };

    tasksArray.forEach(task => {
      const taskCard = document.createElement('div');
      taskCard.className = `task-card ${task.priority}-priority ${task.completed ? 'completed' : ''} ${isOverdue(task.date) && !task.completed ? 'overdue' : ''}`;
      taskCard.dataset.id = task.id;
      const dueText = formatDueDate(task.date);
      const subjectClass = `subject-${task.subject}`;
      taskCard.innerHTML = `
        <div class="task-header">
          <div class="task-title-wrapper">
            <h3 class="task-title">${task.title}</h3>
            <span class="task-subject ${subjectClass}">
              <i class="fas fa-book"></i> ${subjectNames[task.subject] || 'Other'}
            </span>
          </div>
          <span class="priority-badge priority-${task.priority}">
            <i class="fas ${priorityIcons[task.priority]}"></i>
            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
          </span>
        </div>
        <div class="task-meta">
          <div class="task-meta-item">
            <i class="fas fa-calendar-day"></i>
            <span class="task-due ${isOverdue(task.date) && !task.completed ? 'overdue-text' : ''}">
              ${dueText}
            </span>
          </div>
          ${task.time ? `
          <div class="task-meta-item">
            <i class="fas fa-clock"></i>
            <span>${formatTime(task.time)}</span>
          </div>` : ''}
        </div>
        ${task.notes ? `
        <div class="task-notes">
          <i class="fas fa-sticky-note"></i>
          <p>${task.notes}</p>
        </div>` : ''}
        <div class="task-actions">
          <button class="btn-icon btn-edit" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn-icon btn-delete" title="Delete"><i class="fas fa-trash"></i></button>
          <button class="btn-icon btn-complete" title="${task.completed ? 'Mark Incomplete' : 'Complete'}"><i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i></button>
        </div>
      `;
      fragment.appendChild(taskCard);
    });

    tasksGrid.appendChild(fragment);
  }

  function filterAndSortTasks() {
    const tasks = getTasks();
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;
    const sortBy = sortTasks.value;

    let filteredTasks = tasks.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(searchTerm);
      const notesMatch = task.notes && task.notes.toLowerCase().includes(searchTerm);
      if (searchTerm && !titleMatch && !notesMatch) {
          return false;
      }
      switch (statusFilter) {
        case 'completed': return task.completed;
        case 'pending': return !task.completed;
        case 'overdue': return isOverdue(task.date) && !task.completed;
        default: return true;
      }
    });

    filteredTasks.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      switch (sortBy) {
        case 'date-asc': return dateA - dateB;
        case 'date-desc': return dateB - dateA;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'subject': return a.subject.localeCompare(b.subject);
        default: return 0;
      }
    });

    renderTasks(filteredTasks);
    updateStats();
    updateTasksBadge();
  }

  function updateStats() {
    const tasks = getTasks();
    totalTasksStat.textContent = tasks.length;
    completedTasksStat.textContent = tasks.filter(t => t.completed).length;
    pendingTasksStat.textContent = tasks.filter(t => !t.completed).length;
    overdueTasksStat.textContent = tasks.filter(t => isOverdue(t.date) && !t.completed).length;
  }

  function isOverdue(dateString) {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const taskDate = new Date(dateString);
    taskDate.setHours(0,0,0,0);
    return taskDate < today;
  }

  function formatDueDate(dateString) {
    if (!dateString) return 'No due date';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateString);
    taskDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) return 'Due: Today';
    if (daysDiff === 1) return 'Due: Tomorrow';
    if (daysDiff === -1) return 'Due: Yesterday';
    if (daysDiff < 0) return `Overdue: ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''} ago`;
    return `Due in: ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`;
  }

  function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  function editTask(taskId) {
    const task = getTasks().find(t => t.id === taskId);
    if (!task) return;
    taskModalTitle.textContent = 'Edit Task';
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskSubjectInput.value = task.subject;
    taskDateInput.value = task.date;
    taskTimeInput.value = task.time || '';
    taskPriorityInput.value = task.priority;
    taskNotesInput.value = task.notes || '';
    deleteTaskBtn.style.display = 'block';
    taskModal.style.display = 'flex';
  }

  function toggleComplete(taskId) {
    const updatedTasks = getTasks().map(task => {
      if (task.id === taskId) {
        return { ...task, completed: !task.completed, completedAt: task.completed ? null : new Date().toISOString() };
      }
      return task;
    });
    saveTasks(updatedTasks);
  }

  function confirmDeleteTask(taskId) {
      confirmDeleteBtn.dataset.id = taskId;
      confirmModal.style.display = 'flex';
  }

  function addNewTask() {
    taskModalTitle.textContent = 'Add New Task';
    taskForm.reset();
    taskIdInput.value = '';
    taskDateInput.value = new Date().toISOString().split('T')[0];
    taskPriorityInput.value = 'medium';
    deleteTaskBtn.style.display = 'none';
    taskModal.style.display = 'flex';
  }

  function saveTask(e) {
    e.preventDefault();
    if (!taskTitleInput.value.trim()) return alert('Please enter a task title');
    if (!taskSubjectInput.value) return alert('Please select a subject');
    if (!taskDateInput.value) return alert('Please select a date');

    const tasks = getTasks();
    const taskId = taskIdInput.value;
    const taskData = {
      id: taskId ? parseInt(taskId) : Date.now(),
      title: taskTitleInput.value.trim(),
      subject: taskSubjectInput.value,
      date: taskDateInput.value,
      time: taskTimeInput.value || null,
      priority: taskPriorityInput.value,
      notes: taskNotesInput.value.trim() || null,
      completed: taskId ? tasks.find(t => t.id === parseInt(taskId))?.completed || false : false,
      createdAt: taskId ? tasks.find(t => t.id === parseInt(taskId))?.createdAt || new Date().toISOString() : new Date().toISOString()
    };
    const updatedTasks = taskId
      ? tasks.map(task => task.id === parseInt(taskId) ? taskData : task)
      : [...tasks, taskData];
    saveTasks(updatedTasks);
    closeModal();
  }

  function closeModal() {
    taskModal.style.display = 'none';
    confirmModal.style.display = 'none';
  }

  // **FIX: Use event delegation for reliable button clicks**
  tasksGrid.addEventListener('click', function(e) {
      const target = e.target;
      const editBtn = target.closest('.btn-edit');
      const deleteBtn = target.closest('.btn-delete');
      const completeBtn = target.closest('.btn-complete');
      
      if (!editBtn && !deleteBtn && !completeBtn) return;

      const taskCard = target.closest('.task-card');
      const taskId = parseInt(taskCard.dataset.id);

      if (editBtn) {
          editTask(taskId);
      } else if (deleteBtn) {
          confirmDeleteTask(taskId);
      } else if (completeBtn) {
          toggleComplete(taskId);
      }
  });

  // Other Event Listeners
  addTaskBtn.addEventListener('click', addNewTask);
  addTaskEmptyBtn.addEventListener('click', addNewTask);
  searchInput.addEventListener('input', filterAndSortTasks);
  filterStatus.addEventListener('change', filterAndSortTasks);
  sortTasks.addEventListener('change', filterAndSortTasks);
  taskForm.addEventListener('submit', saveTask);
  deleteTaskBtn.addEventListener('click', () => { if (taskIdInput.value) confirmDeleteTask(parseInt(taskIdInput.value)); });
  confirmDeleteBtn.addEventListener('click', () => { 
      const idToDelete = parseInt(confirmDeleteBtn.dataset.id);
      const updatedTasks = getTasks().filter(task => task.id !== idToDelete);
      saveTasks(updatedTasks);
      closeModal(); 
  });
  cancelDeleteBtn.addEventListener('click', closeModal);
  closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
  window.addEventListener('click', e => { if (e.target === taskModal || e.target === confirmModal) closeModal(); });

  // **FIX: Add real-time sync listener for other tabs**
  window.addEventListener('storage', (event) => {
      if (event.key === TASKS_STORAGE_KEY) {
          filterAndSortTasks();
      }
  });

  // Init
  filterAndSortTasks();
});