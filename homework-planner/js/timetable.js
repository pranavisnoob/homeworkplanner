document.addEventListener('DOMContentLoaded', function () {
    // Redirect if not logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = '../index.html';
        return;
    }

    // Load user data into sidebar
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserClass = document.getElementById('sidebarUserClass');

    if (sidebarUserAvatar) sidebarUserAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    if (sidebarUserName) sidebarUserName.textContent = currentUser.name;
    if (sidebarUserClass) sidebarUserClass.textContent = currentUser.class;
    
    // DOM Elements
    const timetableGrid = document.getElementById('timetableGrid');
    const currentWeekRangeElement = document.getElementById('currentWeekRange');
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    const noEventsMessage = document.getElementById('noEventsMessage');

    let currentWeekStart = new Date(); // Start with the current week

    // Helper function to format dates for the header
    function formatDateDisplay(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    // Helper function to get the start of the week (Monday)
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday (0)
        return new Date(d.setDate(diff));
    }

    // Function to generate time slots (e.g., 8 AM to 8 PM)
    function generateTimeSlots() {
        const timeSlots = [];
        for (let i = 8; i <= 20; i++) { // From 8:00 to 20:00
            timeSlots.push(`${String(i).padStart(2, '0')}:00`);
        }
        return timeSlots;
    }

    // Function to render the timetable grid structure
    function renderTimetableGrid() {
        if (!timetableGrid) return;
        timetableGrid.innerHTML = ''; // Clear existing grid

        const timeHeaderCorner = document.createElement('div');
        timeHeaderCorner.classList.add('time-column-header');
        timetableGrid.appendChild(timeHeaderCorner);

        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        daysOfWeek.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header');
            dayHeader.textContent = day;
            timetableGrid.appendChild(dayHeader);
        });

        const timeSlots = generateTimeSlots();
        timeSlots.forEach(time => {
            const timeSlotDiv = document.createElement('div');
            timeSlotDiv.classList.add('time-slot');
            // Format time for display (e.g., 8 AM)
            const hour = parseInt(time.split(':')[0]);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 === 0 ? 12 : hour % 12;
            timeSlotDiv.textContent = `${displayHour} ${ampm}`;
            timetableGrid.appendChild(timeSlotDiv);

            for (let j = 0; j < 7; j++) {
                const gridCell = document.createElement('div');
                gridCell.classList.add('grid-cell');
                gridCell.dataset.dayIndex = j;
                gridCell.dataset.time = time;
                timetableGrid.appendChild(gridCell);
            }
        });
    }

    // Function to fetch tasks and exams from localStorage
    function fetchEvents() {
        // FIX: Use the correct, consistent storage keys used by other scripts
        const tasks = JSON.parse(localStorage.getItem('homework_planner_tasks')) || [];
        const exams = JSON.parse(localStorage.getItem('homework_planner_exams')) || [];
        return {
            tasks,
            exams
        };
    }

    // Function to place events onto the timetable grid
    function placeEvents(tasks, exams) {
        const startOfWeek = getStartOfWeek(currentWeekStart);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        let eventsFound = false;

        // Clear previous event cards
        document.querySelectorAll('.event-card').forEach(card => card.remove());

        const allEvents = [
            ...tasks.map(task => ({ ...task, type: 'task' })),
            ...exams.map(exam => ({ ...exam, type: 'exam' }))
        ];

        allEvents.forEach(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0,0,0,0); // Normalize date

            if (eventDate >= startOfWeek && eventDate <= endOfWeek) {
                eventsFound = true;
                const dayIndex = (eventDate.getDay() + 6) % 7; // 0=Mon, 6=Sun
                
                if (event.time) {
                    const eventHour = event.time.split(':')[0];
                    const targetCell = document.querySelector(`.grid-cell[data-day-index='${dayIndex}'][data-time^='${eventHour}']`);
                    
                    if (targetCell) {
                        const eventCard = document.createElement('div');
                        eventCard.classList.add('event-card', event.type);
                        eventCard.innerHTML = `<h4>${event.title}</h4><p>${event.subject || ''}</p>`;
                        targetCell.appendChild(eventCard);
                    }
                }
            }
        });

        if (noEventsMessage) {
            noEventsMessage.style.display = eventsFound ? 'none' : 'block';
        }
    }

    // Main function to generate and update the timetable
    function generateTimetable() {
        renderTimetableGrid();

        const startOfWeek = getStartOfWeek(currentWeekStart);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        if (currentWeekRangeElement) {
            currentWeekRangeElement.textContent = `${formatDateDisplay(startOfWeek)} - ${formatDateDisplay(endOfWeek)}`;
        }

        const { tasks, exams } = fetchEvents();
        placeEvents(tasks, exams);
    }

    // Event listeners for week navigation
    prevWeekBtn?.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        generateTimetable();
    });

    nextWeekBtn?.addEventListener('click', () => {
        // FIX: Changed from getDate() - 7 to getDate() + 7
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        generateTimetable();
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', function () {
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    });
    
    document.querySelector('.mobile-menu-toggle')?.addEventListener('click', function() {
        document.querySelector('.sidebar')?.classList.toggle('mobile-open');
    });

    // Initial generation of the timetable and listener for updates
    generateTimetable();
    // Re-render the timetable whenever tasks or exams are updated
    window.addEventListener('tasksUpdated', generateTimetable);
    window.addEventListener('examsUpdated', generateTimetable);
    // Also listen for cross-tab storage changes
    window.addEventListener('storage', (event) => {
        if (event.key === 'homework_planner_tasks' || event.key === 'homework_planner_exams') {
            generateTimetable();
        }
    });
});