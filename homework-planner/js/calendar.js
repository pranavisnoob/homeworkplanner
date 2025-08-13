/*
* **FIXED:** Automatic "Important Days" logic is now correctly implemented.
* **FIXED:** Manual "Important Days" toggle now works alongside the automatic feature.
* **FIXED:** Deletion animation has been restored.
* **FIXED:** The day-details modal no longer closes after an item is deleted.
* **FIXED:** Add Task/Exam functionality is restored.
*/
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  // Initialize important days if not exists
  if (!localStorage.getItem('importantDays')) {
    localStorage.setItem('importantDays', JSON.stringify([]));
  }
  
  // --- DOM ELEMENT DECLARATIONS ---
  const calendarEl = document.getElementById('calendar');
  const eventModal = document.getElementById('eventModal');
  const dayDetailsModal = document.getElementById('dayDetailsModal');
  const confirmModal = document.getElementById('confirmModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

  // --- DATA HANDLING FUNCTIONS ---
  function getTasks() { return JSON.parse(localStorage.getItem('homework_planner_tasks')) || []; }
  function saveTasks(tasks) { 
      localStorage.setItem('homework_planner_tasks', JSON.stringify(tasks));
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
  }
  function getExams() { return JSON.parse(localStorage.getItem('homework_planner_exams')) || []; }
  function saveExams(exams) { 
      localStorage.setItem('homework_planner_exams', JSON.stringify(exams));
      window.dispatchEvent(new CustomEvent('examsUpdated'));
  }
  function getEvents() { return JSON.parse(localStorage.getItem('events')) || []; }
  function getImportantDays() { return JSON.parse(localStorage.getItem('importantDays')) || []; }
  function saveImportantDays(days) { localStorage.setItem('importantDays', JSON.stringify(days)); }
  
  // --- HELPER FUNCTIONS ---
  function add30Minutes(timeStr) {
    if (!timeStr) return '00:30';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    date.setMinutes(date.getMinutes() + 30);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  
  function formatDateTimeForInput(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // --- MODAL HANDLING ---
  function showConfirmModal(type, id) {
    if (confirmModal) {
        confirmDeleteBtn.dataset.type = type;
        confirmDeleteBtn.dataset.id = id;
        confirmModal.style.display = 'block';
    }
  }
  
  function closeAllModals() {
    if(eventModal) eventModal.style.display = 'none';
    if(dayDetailsModal) dayDetailsModal.style.display = 'none';
    if(confirmModal) confirmModal.style.display = 'none';
  }

  // --- DELETE LOGIC ---
  confirmDeleteBtn?.addEventListener('click', function() {
    const type = this.dataset.type;
    const id = parseInt(this.dataset.id);

    const itemElement = dayDetailsModal.querySelector(`.event-card[data-id='${id}'][data-type='${type}']`);
    if (itemElement) {
        itemElement.classList.add('deleting');
        
        itemElement.addEventListener('animationend', () => {
            if (type === 'task') {
                saveTasks(getTasks().filter(task => task.id !== id));
            } else if (type === 'exam') {
                saveExams(getExams().filter(exam => exam.id !== id));
            }
            const currentDate = dayDetailsModal?.dataset.currentDate;
            if (currentDate) {
              refreshDayDetails(currentDate);
              updateImportantDays(); // Re-check importance after deletion
            }
        });
    }
    
    if(confirmModal) confirmModal.style.display = 'none'; // Only close the confirm modal
  });

  function deleteItem(type, id) {
      showConfirmModal(type, id);
  }

  // --- IMPORTANT DAYS LOGIC ---
  function calculateAutoImportance(dateStr) {
    const tasks = getTasks();
    const exams = getExams();
    const hasHighPriorityTask = tasks.some(task => task.date === dateStr && task.priority === 'high');
    const hasExam = exams.some(exam => exam.date === dateStr);
    return hasHighPriorityTask || hasExam;
  }

  function toggleDayImportance(dateStr) {
    const importantDays = getImportantDays();
    const index = importantDays.indexOf(dateStr);
    
    if (index > -1) {
      importantDays.splice(index, 1);
    } else {
      importantDays.push(dateStr);
    }
    
    saveImportantDays(importantDays);
    return !(index > -1);
  }

  function updateImportantDays() {
    document.querySelectorAll('.fc-day').forEach(dayEl => {
        const dateStr = dayEl.dataset.date;
        if (dateStr) {
            const isManuallyImportant = getImportantDays().includes(dateStr);
            const isAutoImportant = calculateAutoImportance(dateStr);
            if (isManuallyImportant || isAutoImportant) {
                dayEl.classList.add('important-day');
            } else {
                dayEl.classList.remove('important-day');
            }
        }
    });
  }

  // --- CALENDAR AND EVENT RENDERING ---
  function refreshDayDetails(dateStr) {
    if (!dayDetailsModal) return;

    const tasksForDate = getTasks().filter(task => task.date === dateStr);
    const examsForDate = getExams().filter(exam => exam.date === dateStr);
    const tasksList = document.getElementById('dayTasksList');
    const examsList = document.getElementById('dayExamsList');

    if (tasksList) {
        tasksList.innerHTML = '';
        if (tasksForDate.length === 0) {
            tasksList.innerHTML = '<div class="no-events">No tasks for this day</div>';
        } else {
            tasksForDate.forEach(task => {
                const taskEl = document.createElement('div');
                taskEl.className = `event-card task ${task.priority}-priority`;
                taskEl.dataset.id = task.id;
                taskEl.dataset.type = 'task';
                taskEl.innerHTML = `
                  <div class="event-icon"><i class="fas fa-tasks"></i></div>
                  <div class="event-details">
                    <div class="event-title">${task.title}</div>
                    <div class="event-time"><i class="fas fa-clock"></i> ${task.time || 'All day'}</div>
                  </div>
                  <div class="event-actions">
                    <button class="btn-icon btn-edit" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-delete" title="Delete"><i class="fas fa-trash"></i></button>
                  </div>`;
                tasksList.appendChild(taskEl);
            });
        }
    }

    if (examsList) {
        examsList.innerHTML = '';
        if (examsForDate.length === 0) {
            examsList.innerHTML = '<div class="no-events">No exams for this day</div>';
        } else {
            examsForDate.forEach(exam => {
                const examEl = document.createElement('div');
                examEl.className = 'event-card exam';
                examEl.dataset.id = exam.id;
                examEl.dataset.type = 'exam';
                examEl.innerHTML = `
                  <div class="event-icon"><i class="fas fa-graduation-cap"></i></div>
                  <div class="event-details">
                    <div class="event-title">${exam.title}</div>
                    <div class="event-time"><i class="fas fa-clock"></i> ${exam.time || 'All day'}</div>
                  </div>
                  <div class="event-actions">
                    <button class="btn-icon btn-edit" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-delete" title="Delete"><i class="fas fa-trash"></i></button>
                  </div>`;
                examsList.appendChild(examEl);
            });
        }
    }
  }

  function editItem(id, type) {
    if (type === 'task') {
      const task = getTasks().find(t => t.id === parseInt(id));
      if (task && eventModal) {
        document.getElementById('eventModalTitle').textContent = 'Edit Task';
        document.getElementById('eventId').value = `task_${task.id}`;
        document.getElementById('eventTitle').value = task.title;
        document.getElementById('eventType').value = 'task';
        document.getElementById('eventSubject').value = task.subject || '';
        document.getElementById('eventStart').value = `${task.date}T${task.time || '12:00'}`;
        document.getElementById('eventEnd').value = `${task.date}T${task.time ? add30Minutes(task.time) : '12:30'}`;
        document.getElementById('eventNotes').value = task.notes || '';
        dayDetailsModal.style.display = 'none';
        eventModal.style.display = 'block';
      }
    } 
    else if (type === 'exam') {
      const exam = getExams().find(e => e.id === parseInt(id));
      if (exam && eventModal) {
        document.getElementById('eventModalTitle').textContent = 'Edit Exam';
        document.getElementById('eventId').value = `exam_${exam.id}`;
        document.getElementById('eventTitle').value = exam.title;
        document.getElementById('eventType').value = 'exam';
        document.getElementById('eventSubject').value = exam.subject || '';
        document.getElementById('eventStart').value = `${exam.date}T${exam.time || '09:00'}`;
        document.getElementById('eventEnd').value = `${exam.date}T${exam.time ? add30Minutes(exam.time) : '11:00'}`;
        document.getElementById('eventNotes').value = exam.notes || '';
        dayDetailsModal.style.display = 'none';
        eventModal.style.display = 'block';
      }
    }
  }

  // --- EVENT LISTENERS ---
  dayDetailsModal?.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-edit, .btn-delete');
    if (!btn) return;
    
    const card = btn.closest('.event-card');
    if (!card) return;

    const id = card.dataset.id;
    const type = card.dataset.type;
    
    if (btn.classList.contains('btn-edit')) {
      editItem(id, type);
    } else {
      deleteItem(type, id);
    }
  });

  document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeAllModals));
  cancelDeleteBtn?.addEventListener('click', closeAllModals);
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeAllModals();
    }
  });
  
  document.getElementById('eventForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const eventId = document.getElementById('eventId').value;
    const eventType = document.getElementById('eventType').value;
    const eventData = {
      id: eventId ? parseInt(eventId.split('_')[1]) : Date.now(),
      title: document.getElementById('eventTitle').value,
      subject: document.getElementById('eventSubject').value,
      date: document.getElementById('eventStart').value.split('T')[0],
      time: document.getElementById('eventStart').value.split('T')[1],
      notes: document.getElementById('eventNotes').value
    };
    
    if (eventType === 'task') {
      let tasks = getTasks();
      if (eventId) {
        tasks = tasks.map(t => t.id === eventData.id ? {...t, ...eventData} : t);
      } else {
        tasks.push({...eventData, completed: false, priority: 'medium', createdAt: new Date().toISOString()});
      }
      saveTasks(tasks);
    } 
    else if (eventType === 'exam') {
      let exams = getExams();
      if (eventId) {
        exams = exams.map(e => e.id === eventData.id ? {...e, ...eventData} : e);
      } else {
        exams.push({...eventData, createdAt: new Date().toISOString()});
      }
      saveExams(exams);
    } 
    
    closeAllModals();
    const currentDate = dayDetailsModal?.dataset.currentDate;
    if (currentDate) {
      refreshDayDetails(currentDate);
    }
    updateImportantDays();
  });
  
  document.getElementById('addTaskForDayBtn')?.addEventListener('click', function() {
    const currentDate = dayDetailsModal?.dataset.currentDate;
    if (!currentDate) return;
    document.getElementById('eventModalTitle').textContent = 'Add New Task';
    document.getElementById('eventId').value = '';
    document.getElementById('eventType').value = 'task';
    document.getElementById('eventStart').value = `${currentDate}T12:00`;
    document.getElementById('eventEnd').value = `${currentDate}T12:30`;
    dayDetailsModal.style.display = 'none';
    eventModal.style.display = 'block';
  });
  
  document.getElementById('addExamForDayBtn')?.addEventListener('click', function() {
    const currentDate = dayDetailsModal?.dataset.currentDate;
    if (!currentDate) return;
    document.getElementById('eventModalTitle').textContent = 'Add New Exam';
    document.getElementById('eventId').value = '';
    document.getElementById('eventType').value = 'exam';
    document.getElementById('eventStart').value = `${currentDate}T09:00`;
    document.getElementById('eventEnd').value = `${currentDate}T11:00`;
    dayDetailsModal.style.display = 'none';
    eventModal.style.display = 'block';
  });


  // --- FULLCALENDAR INITIALIZATION ---
  if (calendarEl) {
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        height: 'parent',
        contentHeight: 'auto',
        events: [], 
        eventDidMount: function(info) {
            info.el.style.display = 'none';
        },
        dateClick: function(info) {
            if (!dayDetailsModal) return;
            const dateStr = info.dateStr;
            dayDetailsModal.dataset.currentDate = dateStr;
            document.getElementById('dayDate').textContent = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            
            const importantDayToggle = document.getElementById('importantDayToggle');
            const autoIndicator = document.getElementById('autoImportantIndicator');
            const isAuto = calculateAutoImportance(dateStr);

            if(importantDayToggle) {
                importantDayToggle.checked = getImportantDays().includes(dateStr) || isAuto;
                importantDayToggle.disabled = isAuto;
                importantDayToggle.onchange = function() {
                    toggleDayImportance(dateStr);
                    updateImportantDays();
                };
            }
            if (autoIndicator) {
                autoIndicator.style.display = isAuto ? 'flex' : 'none';
            }

            refreshDayDetails(dateStr);
            dayDetailsModal.style.display = 'block';
        },
        datesSet: function() {
            updateImportantDays();
        }
    });
    calendar.render();
    updateImportantDays(); // Initial call to set important days on load
  }
});