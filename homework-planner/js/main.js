// Initialize empty storage if needed
if (!localStorage.getItem('users')) {
  localStorage.setItem('users', JSON.stringify([]));
}

if (!localStorage.getItem('currentUser')) {
  localStorage.setItem('currentUser', JSON.stringify(null));
}

if (!localStorage.getItem('tasks')) {
  localStorage.setItem('tasks', JSON.stringify([]));
}

if (!localStorage.getItem('exams')) {
  localStorage.setItem('exams', JSON.stringify([]));
}

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const navLinks = document.querySelectorAll('.navbar-links a');

  // Initialize JSConfetti
  const jsConfetti = new JSConfetti();

  // Show/hide modals
  function showModal(modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function hideModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  // Helper: Safely get users
  function getUsers() {
    try {
      const stored = JSON.parse(localStorage.getItem('users'));
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  function saveUsers(usersArr) {
    localStorage.setItem('users', JSON.stringify(usersArr));
  }

  // Auth functions
  function login(email, password) {
    const users = getUsers();
    const emailNorm = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === emailNorm && u.password === password);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  }

  function signup(userData) {
    const users = getUsers();
    const emailNorm = userData.email.trim().toLowerCase();

    // REMOVE duplicate blocking completely:
    // If you want to allow duplicate emails, skip the check below entirely
    // If you want to block, uncomment this:
    /*
    if (users.some(u => u.email.toLowerCase() === emailNorm)) {
      return false;
    }
    */

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      email: emailNorm,
      joined: new Date().toISOString()
    };

    saveUsers([...users, newUser]);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return true;
  }

  // Form submissions
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      if (login(email, password)) {
        jsConfetti.addConfetti({
          emojis: ['🌟','✨'],
          confettiNumber: 30,
          confettiRadius: 2
        });

        hideModal(loginModal);
        setTimeout(() => {
          window.location.href = 'dashboard/index.html';
        }, 1200);
      } else {
        alert('Invalid email or password');
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const userData = {
        name: document.getElementById('signupName').value,
        email: document.getElementById('signupEmail').value,
        password: document.getElementById('signupPassword').value,
        class: document.getElementById('signupClass').value
      };

      if (signup(userData)) {
        jsConfetti.addConfetti({
          emojis: ['✨','🌟'],
          confettiNumber: 30,
          confettiRadius: 2
        });

        hideModal(signupModal);
        setTimeout(() => {
          window.location.href = 'dashboard/index.html';
        }, 1200);
      } else {
        alert('Email already registered');
      }
    });
  }

  // Modal triggers
  document.getElementById('loginBtn')?.addEventListener('click', () => showModal(loginModal));
  document.getElementById('signupBtn')?.addEventListener('click', () => showModal(signupModal));
  document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    hideModal(signupModal);
    showModal(loginModal);
  });
  document.getElementById('showSignup')?.addEventListener('click', (e) => {
    e.preventDefault();
    hideModal(loginModal);
    showModal(signupModal);
  });

  // Close modals
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
      hideModal(this.closest('.modal'));
    });
  });

  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      hideModal(e.target);
    }
  });

  // Check auth state on load
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const authButtons = document.getElementById('authButtons');
  const userProfileNav = document.getElementById('userProfileNav');

  if (currentUser && authButtons && userProfileNav) {
    authButtons.style.display = 'none';
    userProfileNav.style.display = 'flex';
    document.getElementById('navUserName').textContent = currentUser.name.split(' ')[0];
    const initial = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('navUserInitial').textContent = initial;
  }
  
  // New feature: Handle navigation for non-logged-in users
  if (!currentUser) {
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        // Prevent default navigation
        e.preventDefault();
        // Show the signup modal
        showModal(signupModal);
      });
    });
  }

  // FIX: Add a listener for the logout button on the homepage
  document.getElementById('navLogoutBtn')?.addEventListener('click', function() {
    localStorage.removeItem('currentUser');
    window.location.reload(); // Reload the page to show login/signup buttons
  });
});