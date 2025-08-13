/*
* **Notification System:** This centralized script handles desktop and in-app notifications.
* **Permission Handling:** Checks for notification permission.
* **Task Checking:** Periodically checks for tasks due today.
* **Notification Dispatch:** Sends a desktop notification if permission is granted and the task hasn't been notified yet.
* **In-App Panel:** Manages the display of notifications in the header panel.
*/
document.addEventListener('DOMContentLoaded', () => {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationList = document.getElementById('notificationList');

    // --- In-App Notification Panel ---
    notificationBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (notificationPanel) {
            notificationPanel.style.display = notificationPanel.style.display === 'block' ? 'none' : 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (notificationPanel && !notificationPanel.contains(e.target) && e.target !== notificationBtn) {
            notificationPanel.style.display = 'none';
        }
    });

    function renderNotifications() {
        const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        if (!notificationList || !notificationBadge) return;

        notificationList.innerHTML = '';
        if (notifications.length === 0) {
            notificationList.innerHTML = '<p style="padding: 1rem; text-align: center; color: #6c757d;">No new notifications.</p>';
        } else {
            notifications.forEach(notif => {
                const item = document.createElement('div');
                item.className = 'notification-item';
                item.innerHTML = `
                    <i class="fas fa-tasks"></i>
                    <div>
                        <p><strong>${notif.title}</strong> is due today!</p>
                        <span>${new Date(notif.timestamp).toLocaleString()}</span>
                    </div>
                `;
                notificationList.prepend(item); // Show newest first
            });
        }
        notificationBadge.textContent = notifications.length;
        notificationBadge.style.display = notifications.length > 0 ? 'flex' : 'none';
    }

    // --- Desktop Notification Logic ---
    function sendDesktopNotification(task) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification('Task Reminder', {
                body: `Your task "${task.title}" is due today!`,
                icon: 'https://cdn-icons-png.flaticon.com/512/2232/2232688.png'
            });
        }
    }

    function checkTasksForNotifications() {
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        if (!settings.notifications) return;

        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        const notifiedTaskIds = new Set(notifications.map(n => n.id));

        const today = new Date().toISOString().split('T')[0];

        const dueTodayTasks = tasks.filter(task => task.date === today && !task.completed);

        dueTodayTasks.forEach(task => {
            if (!notifiedTaskIds.has(task.id)) {
                // Send desktop notification
                sendDesktopNotification(task);

                // Add to in-app notification list
                notifications.push({
                    id: task.id,
                    title: task.title,
                    timestamp: new Date().toISOString()
                });
                notifiedTaskIds.add(task.id);
            }
        });
        
        // Limit to 20 notifications
        if (notifications.length > 20) {
            notifications = notifications.slice(notifications.length - 20);
        }

        localStorage.setItem('notifications', JSON.stringify(notifications));
        renderNotifications();
    }

    // Initial check and render
    checkTasksForNotifications();
    setInterval(checkTasksForNotifications, 60000); // Check every minute
});