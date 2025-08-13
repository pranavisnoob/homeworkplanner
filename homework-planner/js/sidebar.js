/*
* Sidebar Management: Active link, user info & badge, logout, mobile menu toggle
*/
document.addEventListener('DOMContentLoaded', function () {

    // --- Highlight Active Navigation Link ---
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar-nav a');

    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (currentPage.includes(linkPath)) {
            link.parentElement.classList.add('active');
        } else {
            link.parentElement.classList.remove('active');
        }
    });

    // --- Populate User Info ---
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
        const sidebarUserName = document.getElementById('sidebarUserName');
        const sidebarUserClass = document.getElementById('sidebarUserClass');

        if (sidebarUserAvatar) {
            sidebarUserAvatar.textContent = user.name.charAt(0).toUpperCase();
        }
        if (sidebarUserName) {
            sidebarUserName.textContent = user.name;
        }
        if (sidebarUserClass) {
            sidebarUserClass.textContent = user.class;
        }
    }

    // --- Update Tasks Badge ---
    function updateTasksBadge() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const pendingTasks = tasks.filter(task => !task.completed).length;
        const tasksBadge = document.getElementById('tasksBadge');
        if (tasksBadge) {
            tasksBadge.textContent = pendingTasks;
            tasksBadge.style.display = pendingTasks > 0 ? 'block' : 'none';
        }
    }

    // Initial badge update
    updateTasksBadge();

    // Live update when global event is fired
    window.addEventListener('tasksUpdated', updateTasksBadge);
    window.addEventListener('storage', (event) => {
        if (event.key === 'tasks') {
            updateTasksBadge();
        }
    });

    // --- Logout Button ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        });
    }

    // --- Mobile Menu Toggle ---
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
            document.querySelector('.sidebar').classList.toggle('mobile-open');
        });
    }
});