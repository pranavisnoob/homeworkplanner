document.addEventListener('DOMContentLoaded', function() {
    // --- Loading Screen Functions ---
    function showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling during load
        }
    }

    function hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        }
    }

    // Hide the loading screen once the page content has finished loading
    window.addEventListener('load', hideLoadingScreen);

    // Show the loading screen when a navigation link is clicked
    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('a');
        if (target && target.href && target.href.startsWith(window.location.origin)) {
            showLoadingScreen();
        }
    });

    // Handle back/forward navigation
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            hideLoadingScreen();
        }
    });
});