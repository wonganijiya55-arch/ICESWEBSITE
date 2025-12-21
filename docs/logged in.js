(function(){
  function ready(fn){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  ready(function(){

    // Clean redirect helper: removes all query params & hash
    function redirectTo(path) {
      window.location.replace(path.split('?')[0].split('#')[0]);
    }

    function checkAuthentication() {
      const userData = localStorage.getItem('userData');
      if (!userData) {
        alert('Please login to access this page');
        redirectTo('/docs/login.html');
        return false;
      }
      try {
        const user = JSON.parse(userData);
        const currentPath = window.location.pathname.toLowerCase();
        const adminPages = ['admin.html','paymentsdata.html','studentrecords.html','updatevents.html','admin-profile.html'];
        const studentPages = ['students.html','student-events.html','student-payments.html','student-support.html','profile.html'];
        const isAdminOnlyPage = adminPages.some(p => currentPath.endsWith('/' + p));
        const isStudentOnlyPage = studentPages.some(p => currentPath.endsWith('/' + p));

        if (isAdminOnlyPage && user.role !== 'admin') {
          alert('Access denied. This page is for administrators only.');
          localStorage.removeItem('userData');
          redirectTo('/docs/login.html');
          return false;
        }
        if (isStudentOnlyPage && user.role !== 'student') {
          alert('Access denied. This page is for students only.');
          localStorage.removeItem('userData');
          redirectTo('/docs/login.html');
          return false;
        }

        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
          const displayName = user.name || user.username || (user.email ? user.email.split('@')[0] : 'User');
          userNameElement.textContent = displayName;
        }
        return true;
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userData');
        redirectTo('/docs/login.html');
        return false;
      }
    }

    function handleLogout() {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userData');
        localStorage.removeItem('lastActivityAt');
        redirectTo('/docs/index.html');
      }
    }

    checkAuthentication();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Optional: strip query params on page load (prevents loops)
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }

  });
})();
