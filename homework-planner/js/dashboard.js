/**
 * dashboard.js (Fully Merged & Synced)
 * This file combines all dashboard functionality (tasks, exams, stats, modals)
 * with the necessary real-time synchronization listeners to stay updated
 * with changes from other pages like tasks.js.
 */
document.addEventListener('DOMContentLoaded', function () {
  // Redirect if not logged in
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = '../index.html';
    return;
  }

  // Load user data
  const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserClass = document.getElementById('sidebarUserClass');
  const welcomeUserName = document.getElementById('welcomeUserName');

  if (sidebarUserAvatar) sidebarUserAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
  if (sidebarUserName) sidebarUserName.textContent = currentUser.name;
  if (sidebarUserClass) sidebarUserClass.textContent = currentUser.class;
  if (welcomeUserName) welcomeUserName.textContent = currentUser.name.split(' ')[0];

  // **FIX: Unified storage key to sync with tasks.js**
  const TASKS_STORAGE_KEY = 'homework_planner_tasks';
  const EXAMS_STORAGE_KEY = 'homework_planner_exams';

  // Initialize storage if it doesn't exist
  if (!localStorage.getItem(TASKS_STORAGE_KEY)) {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(EXAMS_STORAGE_KEY)) {
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify([]));
  }

  function getTasks() {
    try {
        return JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY)) || [];
    } catch (e) {
        console.error("Error parsing tasks from localStorage", e);
        return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    updateDashboard();
    // This custom event is good for in-page updates, but storage event is for cross-page sync
    window.dispatchEvent(new CustomEvent('tasksUpdated'));
  }
  

  function getExams() {
     try {
        return JSON.parse(localStorage.getItem(EXAMS_STORAGE_KEY)) || [];
    } catch (e) {
        console.error("Error parsing exams from localStorage", e);
        return [];
    }
  }

  function saveExams(exams) {
    localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(exams));
    updateDashboard();
    window.dispatchEvent(new CustomEvent('tasksUpdated'));
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  function formatDueDate(dateString) {
    if (!dateString) return 'No due date';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateString);
    taskDate.setHours(0, 0, 0, 0);
    const timeDiff = taskDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return 'Due Today';
    if (daysDiff === 1) return 'Due Tomorrow';
    if (daysDiff === -1) return 'Due Yesterday';
    if (daysDiff < 0) return `Overdue by ${Math.abs(daysDiff)} days`;
    return `Due in ${daysDiff} days`;
  }


  function updateDashboard() {
    const tasks = getTasks();
    const exams = getExams();
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const todayStr = formatDate(today);

    const todayTasks = tasks.filter(task => task.date === todayStr && !task.completed);
    
    const allTodayTasks = tasks.filter(task => task.date === todayStr);
    const completedTasksCount = allTodayTasks.filter(task => task.completed).length;
    const totalTasksCount = allTodayTasks.length;

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const upcomingExams = exams.filter(exam => {
      const examDate = new Date(exam.date);
      return examDate >= today && examDate <= nextWeek;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const overdueTasks = tasks.filter(task => {
      const taskDate = new Date(task.date);
      return !task.completed && taskDate < today;
    });

    const pendingAssignments = tasks.filter(task => !task.completed).length;

    const elements = {
        totalTasks: document.getElementById('totalTasks'),
        completedTasks: document.getElementById('completedTasks'),
        dueTasksCount: document.getElementById('dueTasksCount'),
        upcomingExams: document.getElementById('upcomingExams'),
        overdueTasks: document.getElementById('overdueTasks'),
        pendingAssignments: document.getElementById('pendingAssignments'),
        tasksBadge: document.getElementById('tasksBadge'),
    };

    if (elements.totalTasks) elements.totalTasks.textContent = totalTasksCount;
    if (elements.completedTasks) elements.completedTasks.textContent = completedTasksCount;
    if (elements.dueTasksCount) elements.dueTasksCount.textContent = todayTasks.length;
    if (elements.upcomingExams) elements.upcomingExams.textContent = upcomingExams.length;
    if (elements.overdueTasks) elements.overdueTasks.textContent = overdueTasks.length;
    if (elements.pendingAssignments) elements.pendingAssignments.textContent = pendingAssignments;
    if (elements.tasksBadge) elements.tasksBadge.textContent = pendingAssignments;


    renderSchedule(todayTasks);
    renderExams(upcomingExams);
  }

  function renderSchedule(tasks) {
    const timeline = document.getElementById('scheduleTimeline');
    if (!timeline) return;
    timeline.innerHTML = '';

    if (tasks.length === 0) {
      timeline.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 20px;">
          <i class="ri-checkbox-circle-line" style="font-size: 48px; color: #28a745; margin-bottom: 1rem; display: block;"></i>
          <h3>All Clear!</h3>
          <p>You have no tasks due today.</p>
        </div>`;
      return;
    }

    const timeGroups = {
      morning: { name: 'Morning', tasks: [] },
      afternoon: { name: 'Afternoon', tasks: [] },
      evening: { name: 'Evening', tasks: [] },
      allDay: { name: 'All Day', tasks: [] }
    };

    tasks.forEach(task => {
      if (!task.time) {
        timeGroups.allDay.tasks.push(task);
        return;
      }
      const [hours] = task.time.split(':').map(Number);
      if (hours >= 6 && hours < 12) timeGroups.morning.tasks.push(task);
      else if (hours >= 12 && hours < 18) timeGroups.afternoon.tasks.push(task);
      else timeGroups.evening.tasks.push(task);
    });

    for (const group of Object.values(timeGroups)) {
      if (group.tasks.length === 0) continue;

      const groupHeader = document.createElement('div');
      groupHeader.className = 'time-group-header';
      groupHeader.innerHTML = `<h3>${group.name}</h3><span>${group.tasks.length} task${group.tasks.length !== 1 ? 's' : ''}</span>`;
      timeline.appendChild(groupHeader);

      group.tasks.forEach(task => {
        const dueText = formatDueDate(task.date);
        const taskEl = document.createElement('div');
        taskEl.className = `timeline-item ${task.completed ? 'completed' : ''}`;
        taskEl.innerHTML = `
          <div class="task-time-badge"><i class="fas fa-clock"></i><span>${task.time || 'All day'}</span></div>
          <div class="task-content">
            <div class="task-header">
                <h3>${task.title}</h3>
                <div class="task-meta">
                    <span class="subject-badge ${task.subject}">${task.subject}</span>
                    <span class="priority-badge ${task.priority}"><i class="fas fa-${task.priority === 'high' ? 'exclamation' : task.priority === 'medium' ? 'equals' : 'arrow-down'}"></i> ${task.priority}</span>
                </div>
            </div>
            <div class="task-due-date">
                <i class="fas fa-calendar-day"></i>
                <span>${dueText}</span>
            </div>
            <div class="task-footer">
                <div class="task-actions">
                    <button class="btn-icon btn-edit-task" data-id="${task.id}" title="Edit task"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-delete-task" data-id="${task.id}" title="Delete task"><i class="fas fa-trash"></i></button>
                </div>
                <button class="btn-icon btn-complete" data-id="${task.id}" title="Mark as complete"><i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i></button>
            </div>
          </div>`;
        timeline.appendChild(taskEl);
      });
    }

    timeline.querySelectorAll('.btn-complete').forEach(btn => {
      btn.addEventListener('click', function () {
        const taskId = parseInt(this.dataset.id);
        const tasks = getTasks().map(t => t.id === taskId ? { ...t, completed: !t.completed, completedAt: new Date().toISOString() } : t);
        saveTasks(tasks);
      });
    });

    timeline.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', function () {
        showConfirmModal('task', parseInt(this.dataset.id));
      });
    });
    
    timeline.querySelectorAll('.btn-edit-task').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = parseInt(this.dataset.id);
            const taskToEdit = getTasks().find(task => task.id === taskId);
            if (taskToEdit) openTaskModalForEdit(taskToEdit);
        });
    });
  }

  function renderExams(exams) {
    const examCards = document.getElementById('examCards');
    if (!examCards) return;
    examCards.innerHTML = '';

    if (exams.length === 0) {
      examCards.innerHTML = `<div class="empty-state" style="text-align: center; padding: 20px;">
                  <i class="ri-book-read-line" style="font-size: 48px; color: #6c757d; margin-bottom: 1rem; display: block;"></i>
                  <h3>No Upcoming Exams</h3>
                  <p>Add an exam to see it here.</p>
                </div>`;
      
      return;
    }

    const today = new Date();
    exams.forEach(exam => {
      const examDate = new Date(exam.date);
      const daysRemaining = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
      const percentage = Math.min(100, Math.max(0, (daysRemaining / 7) * 100));

      const examCard = document.createElement('div');
      examCard.className = `exam-card ${exam.subject}`;
      examCard.innerHTML = `
        <div class="exam-info-main">
            <h3>${exam.title}</h3>
            <div class="exam-date"><i class="fas fa-calendar-day"></i><span>${examDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
            <div class="exam-time"><i class="fas fa-clock"></i><span>${exam.time || 'All day'}</span></div>
            ${exam.location ? `<div class="exam-location"><i class="fas fa-map-marker-alt"></i><span>${exam.location}</span></div>` : ''}
            <div class="exam-countdown"><i class="fas fa-hourglass-half"></i><span>${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining</span></div>
            <div class="exam-progress"><div class="progress-bar" style="width: ${100 - percentage}%"></div></div>
        </div>
        <div class="exam-actions">
            <button class="btn-icon btn-edit-exam" data-id="${exam.id}" title="Edit Exam"><i class="fas fa-edit"></i></button>
            <button class="btn-icon btn-delete-exam" data-id="${exam.id}" title="Delete Exam"><i class="fas fa-trash"></i></button>
        </div>`;
      examCards.appendChild(examCard);
    });
    addExamActionListeners();
  }
  
  function addExamActionListeners() {
    document.querySelectorAll('.btn-delete-exam').forEach(btn => {
        btn.addEventListener('click', function() {
            showConfirmModal('exam', parseInt(this.dataset.id));
        });
    });

    document.querySelectorAll('.btn-edit-exam').forEach(btn => {
        btn.addEventListener('click', function() {
            const examId = parseInt(this.dataset.id);
            const examToEdit = getExams().find(exam => exam.id === examId);
            if (examToEdit) openExamModalForEdit(examToEdit);
        });
    });
  }

  const taskModal = document.getElementById('taskModal');
  const examModal = document.getElementById('examModal');
  const confirmModal = document.getElementById('confirmModal');
  const taskForm = document.getElementById('taskForm');
  const examForm = document.getElementById('examForm');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

  function openTaskModalForEdit(task) {
    if (taskModal) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskSubject').value = task.subject;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskTime').value = task.time;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskNotes').value = task.notes || '';
        let taskIdInput = document.getElementById('taskId');
        if (!taskIdInput) {
            taskIdInput = document.createElement('input');
            taskIdInput.type = 'hidden';
            taskIdInput.id = 'taskId';
            taskForm.prepend(taskIdInput);
        }
        taskIdInput.value = task.id;
        taskModal.style.display = 'block';
    }
  }

  function openExamModalForEdit(exam) {
    if (examModal) {
        document.getElementById('examModalTitle').textContent = 'Edit Exam';
        document.getElementById('examId').value = exam.id;
        document.getElementById('examTitle').value = exam.title;
        document.getElementById('examSubject').value = exam.subject;
        document.getElementById('examDate').value = exam.date;
        document.getElementById('examTime').value = exam.time;
        document.getElementById('examLocation').value = exam.location || '';
        document.getElementById('examNotes').value = exam.notes || '';
        examModal.style.display = 'block';
    }
  }
  
  function showConfirmModal(type, id) {
    if (confirmModal) {
        confirmDeleteBtn.dataset.type = type;
        confirmDeleteBtn.dataset.id = id;
        confirmModal.style.display = 'block';
    }
  }

  confirmDeleteBtn?.addEventListener('click', function() {
    const type = this.dataset.type;
    const id = parseInt(this.dataset.id);

    if (type === 'task') {
        saveTasks(getTasks().filter(task => task.id !== id));
    } else if (type === 'exam') {
        saveExams(getExams().filter(exam => exam.id !== id));
    }
    closeModal();
  });

  document.getElementById('addTaskBtn')?.addEventListener('click', function () {
    if (taskModal) {
        taskForm.reset();
        let taskIdInput = document.getElementById('taskId');
        if(taskIdInput) taskIdInput.value = '';
        document.getElementById('taskDate').value = formatDate(new Date());
        taskModal.style.display = 'block';
    }
  });

  document.getElementById('addExamBtn')?.addEventListener('click', function () {
    if (examModal) {
        examForm.reset();
        document.getElementById('examModalTitle').textContent = 'Add New Exam';
        document.getElementById('examId').value = '';
        document.getElementById('examDate').value = formatDate(new Date());
        examModal.style.display = 'block';
    }
  });

  taskForm?.addEventListener('submit', function (e) {
    e.preventDefault();
    const taskIdInput = document.getElementById('taskId');
    const taskId = taskIdInput ? taskIdInput.value : null;

    const taskData = {
      title: document.getElementById('taskTitle').value,
      subject: document.getElementById('taskSubject').value,
      date: document.getElementById('taskDate').value,
      time: document.getElementById('taskTime').value,
      priority: document.getElementById('taskPriority').value,
      notes: document.getElementById('taskNotes').value,
    };
    
    let tasks = getTasks();
    if (taskId) {
        const idToUpdate = parseInt(taskId);
        tasks = tasks.map(task => task.id === idToUpdate ? {...task, ...taskData} : task);
    } else {
        tasks.push({ ...taskData, id: Date.now(), completed: false, createdAt: new Date().toISOString() });
    }
    saveTasks(tasks);
    closeModal();
  });

  examForm?.addEventListener('submit', function (e) {
    e.preventDefault();
    const examId = document.getElementById('examId').value;
    const examData = {
        title: document.getElementById('examTitle').value,
        subject: document.getElementById('examSubject').value,
        date: document.getElementById('examDate').value,
        time: document.getElementById('examTime').value,
        location: document.getElementById('examLocation').value,
        notes: document.getElementById('examNotes').value,
    };

    let exams = getExams();
    if (examId) {
        const idToUpdate = parseInt(examId);
        exams = exams.map(exam => exam.id === idToUpdate ? { ...exam, ...examData } : exam);
    } else {
        exams.push({ ...examData, id: Date.now(), createdAt: new Date().toISOString() });
    }
    saveExams(exams);
    closeModal();
  });

  function closeModal() {
      if(taskModal) taskModal.style.display = 'none';
      if(examModal) examModal.style.display = 'none';
      if(confirmModal) confirmModal.style.display = 'none';
  }

  document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));
  cancelDeleteBtn?.addEventListener('click', closeModal);
  window.addEventListener('click', function (e) {
    if (e.target == taskModal || e.target == examModal || e.target == confirmModal) {
      closeModal();
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', function () {
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
  });

  document.querySelector('.mobile-menu-toggle')?.addEventListener('click', function() {
    document.querySelector('.sidebar')?.classList.toggle('mobile-open');
  });

  // **FIX: Add real-time sync listener for other tabs**
  window.addEventListener('storage', (event) => {
      // If either tasks or exams are updated, refresh the whole dashboard
      if (event.key === TASKS_STORAGE_KEY || event.key === EXAMS_STORAGE_KEY) {
          updateDashboard();
      }
  });

  // Initial Load
  updateDashboard();
});