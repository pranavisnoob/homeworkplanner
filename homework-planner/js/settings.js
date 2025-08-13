document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  // --- DOM ELEMENTS ---
  const enableNotifications = document.getElementById('enableNotifications');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  const exportDataBtn = document.getElementById('exportDataBtn');
  const resetDataBtn = document.getElementById('resetDataBtn');
  
  const passwordModal = document.getElementById('passwordModal');
  const confirmModal = document.getElementById('confirmModal');
  const passwordForm = document.getElementById('passwordForm');

  // --- SETTINGS MANAGEMENT ---
  function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('settings')) || {
      notifications: true,
    };
    if (enableNotifications) enableNotifications.checked = settings.notifications;
  }

  function saveSettings() {
    const settings = {
      notifications: enableNotifications.checked,
    };
    localStorage.setItem('settings', JSON.stringify(settings));
  }

  // --- NOTIFICATION TOGGLE ---
  enableNotifications?.addEventListener('change', saveSettings);

  // --- MODAL HANDLING ---
  function showModal(modal) { if(modal) modal.style.display = 'block'; }
  function hideModal(modal) { if(modal) modal.style.display = 'none'; }
  
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => hideModal(btn.closest('.modal')));
  });
  window.addEventListener('click', e => {
      if (e.target.classList.contains('modal')) hideModal(e.target);
  });
  
  // --- CONFIRMATION MODAL ---
  let confirmCallback = null;
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmText = document.getElementById('confirmText');
  const confirmActionBtn = document.getElementById('confirmActionBtn');
  const cancelActionBtn = document.getElementById('cancelActionBtn');

  function showConfirmModal(title, text, onConfirm) {
      if(confirmTitle) confirmTitle.textContent = title;
      if(confirmText) confirmText.textContent = text;
      confirmCallback = onConfirm;
      showModal(confirmModal);
  }
  
  confirmActionBtn?.addEventListener('click', () => {
      if (typeof confirmCallback === 'function') {
          confirmCallback();
      }
      hideModal(confirmModal);
  });
  cancelActionBtn?.addEventListener('click', () => hideModal(confirmModal));

  // --- ACCOUNT MANAGEMENT ---
  changePasswordBtn?.addEventListener('click', () => showModal(passwordModal));
  
  passwordForm?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser.password !== currentPassword) {
      alert('Current password is incorrect.');
      return;
    }
    
    // Update password
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem('users', JSON.stringify(users));
      
      currentUser.password = newPassword;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      alert('Password changed successfully.');
      hideModal(passwordModal);
      this.reset();
    }
  });

  deleteAccountBtn?.addEventListener('click', function() {
      showConfirmModal('Delete Account', 'Are you sure you want to permanently delete your account? All your data will be lost.', () => {
          const users = JSON.parse(localStorage.getItem('users')) || [];
          const updatedUsers = users.filter(u => u.email !== user.email);
          localStorage.setItem('users', JSON.stringify(updatedUsers));
          
          // Clear all data associated with the user
          localStorage.removeItem('currentUser');
          localStorage.removeItem('tasks');
          localStorage.removeItem('exams');
          localStorage.removeItem('settings');
          
          alert('Account deleted successfully.');
          window.location.href = '../index.html';
      });
  });

  // --- DATA MANAGEMENT ---
  exportDataBtn?.addEventListener('click', function() {
    const data = {
      tasks: JSON.parse(localStorage.getItem('tasks')) || [],
      exams: JSON.parse(localStorage.getItem('exams')) || [],
      settings: JSON.parse(localStorage.getItem('settings')) || {}
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportName = `studyplanner-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  });

  resetDataBtn?.addEventListener('click', function() {
      showConfirmModal('Reset All Data', 'Are you sure you want to delete all your tasks, exams, and settings? This cannot be undone.', () => {
          localStorage.removeItem('tasks');
          localStorage.removeItem('exams');
          localStorage.removeItem('settings');
          alert('All data has been reset.');
          window.location.reload();
      });
  });

  // --- INITIAL LOAD ---
  loadSettings();
});
