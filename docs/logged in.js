/**
 * Logged in.js – moved to docs root; imports adjusted
 */
(function(){
  function ready(fn){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  ready(function(){
    function resolveDocsPath(fileName){
      try {
        const p = window.location.pathname;
        const baseMatch = p.match(/^(.*?)\/docs\//);
        const basePath = baseMatch ? baseMatch[1] : '';
        return basePath + '/docs/' + fileName;
      } catch { return '/docs/' + fileName; }
    }

    function checkAuthentication() {
      const userData = localStorage.getItem('userData');
      if (!userData) {
        alert('Please login to access this page');
        window.location.href = resolveDocsPath('login.html');
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
          window.location.href = resolveDocsPath('login.html');
          return false;
        }
        if (isStudentOnlyPage && user.role !== 'student') {
          alert('Access denied. This page is for students only.');
          localStorage.removeItem('userData');
          window.location.href = resolveDocsPath('login.html');
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
        window.location.href = resolveDocsPath('login.html');
        return false;
      }
    }

    function handleLogout() {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userData');
        localStorage.removeItem('lastActivityAt');
        window.location.href = resolveDocsPath('index.html');
      }
    }

    const THEME_KEY = 'ices_theme_pref_v1';
    function applyTheme(theme){
      const html = document.documentElement;
      if(theme === 'dark') html.setAttribute('data-theme','dark');
      else html.removeAttribute('data-theme');
    }
    function initTheme(){
      let pref = localStorage.getItem(THEME_KEY);
      if(!pref){
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        pref = prefersDark ? 'dark' : 'light';
      }
      applyTheme(pref);
      updateToggleUI(pref);
    }
    function toggleTheme(){
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
      updateToggleUI(next);
    }
    function updateToggleUI(theme){
      const btn = document.getElementById('themeToggleBtn');
      if(!btn) return;
      const icon = btn.querySelector('i');
      const label = btn.querySelector('.label');
      if(theme === 'dark') { icon.className = 'fas fa-moon'; label.textContent = 'Dark'; btn.title = 'Switch to light theme'; }
      else { icon.className = 'fas fa-sun'; label.textContent = 'Light'; btn.title = 'Switch to dark theme'; }
    }
    window.addEventListener('storage', (e) => {
      if(e.key === THEME_KEY && e.newValue){ applyTheme(e.newValue); updateToggleUI(e.newValue); }
    });

    checkAuthentication();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const userSectionEl = document.querySelector('.user-section');
    if(userSectionEl && !document.getElementById('themeToggleBtn')){
      const toggle = document.createElement('button');
      toggle.id = 'themeToggleBtn';
      toggle.type = 'button';
      toggle.className = 'theme-toggle';
      toggle.innerHTML = '<i class="fas fa-sun"></i><span class="label">Light</span>';
      toggle.addEventListener('click', toggleTheme);
      const logout = document.getElementById('logoutBtn');
      if(logout) userSectionEl.insertBefore(toggle, logout); else userSectionEl.appendChild(toggle);
    }
    initTheme();

    window.addEventListener('storage', (e) => {
      if (e.key === 'userData' && !e.newValue) {
        window.location.href = resolveDocsPath('index.html');
      }
    });

    // ================= Session Activity & Auto-Logout (20 min) =================
    const IDLE_LIMIT_MS = 20 * 60 * 1000; // 20 minutes
    const LAST_ACTIVITY_KEY = 'lastActivityAt';
    function markActivity(){
      try { localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now())); } catch(e){}
    }
    function getLastActivity(){
      const v = localStorage.getItem(LAST_ACTIVITY_KEY); const n = v ? parseInt(v,10) : 0; return Number.isFinite(n)?n:0;
    }
    function autoLogout(reason){
      try { localStorage.removeItem('userData'); localStorage.removeItem(LAST_ACTIVITY_KEY); } catch(e){}
      try { alert(reason || 'You have been logged out.'); } catch(e){}
      window.location.href = resolveDocsPath('login.html');
    }
    function checkIdleLogout(){
      const userData = localStorage.getItem('userData');
      if (!userData) return;
      const last = getLastActivity();
      if (!last) { markActivity(); return; }
      if (Date.now() - last >= IDLE_LIMIT_MS) {
        autoLogout('Session expired due to 20 minutes of inactivity.');
      }
    }
    ['mousemove','keydown','click','scroll','touchstart'].forEach(evt => window.addEventListener(evt, markActivity, { passive:true }));
    window.addEventListener('storage', (e) => { if (e.key === LAST_ACTIVITY_KEY) { /* sync */ } });
    markActivity();
    setInterval(checkIdleLogout, 30000);

    (async function initApiTest(){
      const statusEl = document.getElementById('test-status');
      const nameEl = document.getElementById('test-name');
      const emailEl = document.getElementById('test-email');
      const passEl = document.getElementById('test-password');
      const btnRegister = document.getElementById('btn-test-register');
      const btnLogin = document.getElementById('btn-test-login');
      if (!btnRegister && !btnLogin) return;

      let API, safeFetch;
      try {
        const mod = await import('./api.js');
        API = mod.API;
        safeFetch = mod.safeFetch;
      } catch (e) {
        console.warn('API module not available for dashboard tests:', e);
        return;
      }

      function setStatus(msg){ if (statusEl) statusEl.textContent = msg; console.log('[API Test]', msg); }

      if (btnRegister) {
        btnRegister.addEventListener('click', async () => {
          const name = nameEl?.value?.trim();
          const email = emailEl?.value?.trim();
          const password = passEl?.value || '';
          if (!name || !email || !password) { alert('Enter name, email, and password'); return; }
          setStatus('Registering...');
          try {
            const res = await API.registerUser({ name, email, password, year: 1 });
            alert(res.message || 'Registration successful');
            setStatus('Registration OK');
          } catch (err) { setStatus('Registration failed'); }
        });
      }

      if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
          const email = emailEl?.value?.trim();
          const password = passEl?.value || '';
          if (!email || !password) { alert('Enter email and password'); return; }
          setStatus('Logging in...');
          try {
            const data = await API.loginUser({ email, password });
            if (data.role) {
              localStorage.setItem('userData', JSON.stringify({ userId: data.userId, email: data.email, name: data.name || data.username || '', role: data.role, loginTime: new Date().toISOString() }));
              alert('Login successful');
              setStatus('Login OK');
            } else { alert(data.message || 'Login failed'); setStatus('Login failed'); }
          } catch (err) { setStatus('Login failed'); }
        });
      }
    })();

    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const userSection = document.querySelector('.user-section');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        if (navLinks) navLinks.classList.toggle('active');
        if (userSection) userSection.classList.toggle('active');
        hamburger.classList.toggle('active');
      });
    }
    document.addEventListener('click', (e) => {
      if (hamburger && navLinks && userSection) {
        const isClickInsideNav = navLinks.contains(e.target);
        const isClickInsideUser = userSection.contains(e.target);
        const isClickOnHamburger = hamburger.contains(e.target);
        if (!isClickInsideNav && !isClickInsideUser && !isClickOnHamburger) {
          navLinks.classList.remove('active');
          userSection.classList.remove('active');
          hamburger.classList.remove('active');
        }
      }
    });

    // Event Registration
    const eventForm = document.getElementById('eventRegistrationForm');
    if (eventForm) {
      eventForm.addEventListener('submit', function(e){
        e.preventDefault();
        const select = document.getElementById('eventSelect');
        if (!select || !select.value) { alert('Please choose an event'); return; }
        const success = document.getElementById('eventSuccess');
        if (success) success.style.display = 'block';
        eventForm.reset();
      });
    }

    // Payments Form
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
      const purposeSelect = document.getElementById('paymentPurpose');
      const eventFields = document.getElementById('eventPaymentFields');
      const eventSelect = document.getElementById('eventPaymentSelect');
      const amountInput = document.getElementById('amount');
      const methodSelect = document.getElementById('method');
      const proofInput = document.getElementById('paymentProof');
      const instructionsBox = document.getElementById('paymentInstructions');
      const mobileMoneyInfo = document.getElementById('mobileMoneyInfo');
      const bankTransferInfo = document.getElementById('bankTransferInfo');

      if (purposeSelect && eventFields) {
        purposeSelect.addEventListener('change', () => {
          const isEvent = purposeSelect.value === 'event';
          eventFields.style.display = isEvent ? 'block' : 'none';
          if (amountInput) {
            if (purposeSelect.value === 'membership') { amountInput.value = '2500'; amountInput.readOnly = true; }
            else { amountInput.value = ''; amountInput.readOnly = false; }
          }
        });
      }
      if (methodSelect && instructionsBox && mobileMoneyInfo && bankTransferInfo) {
        methodSelect.addEventListener('change', () => {
          const method = methodSelect.value;
          if (method === 'mobile_money') { instructionsBox.style.display = 'block'; mobileMoneyInfo.style.display = 'block'; bankTransferInfo.style.display = 'none'; }
          else if (method === 'bank_transfer') { instructionsBox.style.display = 'block'; mobileMoneyInfo.style.display = 'none'; bankTransferInfo.style.display = 'block'; }
          else { instructionsBox.style.display = 'none'; mobileMoneyInfo.style.display = 'none'; bankTransferInfo.style.display = 'none'; }
        });
      }
      paymentForm.addEventListener('submit', function(e){
        e.preventDefault();
        if (!purposeSelect || !purposeSelect.value) { alert('Please select a payment purpose'); return; }
        if (purposeSelect.value === 'event' && eventSelect && !eventSelect.value) { alert('Please choose an event for the event payment'); return; }
        const amount = parseFloat(amountInput && amountInput.value || '');
        if (!Number.isFinite(amount) || amount <= 0) { alert('Please enter a valid amount'); return; }
        if (!methodSelect || !methodSelect.value) { alert('Please select a payment method'); return; }
        if (!proofInput || !proofInput.files || proofInput.files.length === 0) { alert('Please upload your payment proof'); return; }
        const file = proofInput.files[0];
        const MAX_BYTES = 700 * 1024;
        if (file.size > MAX_BYTES) { alert('Payment proof file must be less than 700KB'); return; }
        const success = document.getElementById('paymentSuccess');
        if (success) success.style.display = 'block';
        paymentForm.reset();
        if (eventFields) eventFields.style.display = 'none';
        if (instructionsBox) instructionsBox.style.display = 'none';
      });
    }

    // Profile Form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      const editBtn = document.getElementById('editBtn');
      const saveBtn = document.getElementById('saveBtn');
      const successMsg = document.getElementById('profileSuccess');
      const photoUpload = document.getElementById('photoUpload');
      const profilePhoto = document.getElementById('profilePhoto');
      const displayName = document.getElementById('displayName');
      const fullNameInput = document.getElementById('fullName');
      const formInputs = profileForm.querySelectorAll('input, textarea, select');
      formInputs.forEach(input => input.disabled = true);
      if (saveBtn) saveBtn.style.display = 'none';
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          formInputs.forEach(input => input.disabled = false);
          editBtn.style.display = 'none';
          if (saveBtn) saveBtn.style.display = 'inline-block';
          if (successMsg) successMsg.style.display = 'none';
        });
      }
      if (saveBtn) {
        profileForm.addEventListener('submit', (e) => {
          e.preventDefault();
          if (fullNameInput && displayName) { displayName.textContent = fullNameInput.value || 'Your Name'; }
          formInputs.forEach(input => input.disabled = true);
          saveBtn.style.display = 'none';
          if (editBtn) editBtn.style.display = 'inline-block';
          if (successMsg) successMsg.style.display = 'block';
          console.log('Profile saved:', new FormData(profileForm));
        });
      }
      if (photoUpload && profilePhoto) {
        photoUpload.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) { alert('Please upload a valid image file'); photoUpload.value = ''; return; }
          const MAX_SIZE = 700 * 1024;
          if (file.size > MAX_SIZE) { alert('Profile photo must be less than 700KB'); photoUpload.value = ''; return; }
          const reader = new FileReader();
          reader.onload = (ev) => { profilePhoto.src = ev.target.result; };
          reader.readAsDataURL(file);
        });
      }
    }

    // Community Support Chat
    const chatThread = document.getElementById('chatThread');
    const chatComposer = document.getElementById('chatComposer');
    const chatInput = document.getElementById('chatInput');
    if (chatThread && chatComposer && chatInput) {
      const STORE_KEY = 'ices_chat_messages_v1';
      let messages = [];
      try { const raw = localStorage.getItem(STORE_KEY); if (raw) messages = JSON.parse(raw); } catch(e){ console.warn('Failed reading messages', e); }
      function persist(){ localStorage.setItem(STORE_KEY, JSON.stringify(messages)); }
      function getUserInitials(){
        const nameEl = document.getElementById('displayName');
        const name = (nameEl && nameEl.textContent.trim()) || 'ICES Member';
        return name.split(/\s+/).slice(0,2).map(p=>p[0].toUpperCase()).join('');
      }
      function formatTime(ts){ const d = new Date(ts); return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
      function render(){
        chatThread.innerHTML = '';
        messages.forEach((m, idx) => {
          const msg = document.createElement('div');
          msg.className = 'chat-message' + (m.mine ? ' mine' : '');
          msg.innerHTML = `
            <div class="chat-header">
              <div class="chat-avatar">${m.initials}</div>
              <p class="chat-author">${m.author}</p>
              <span class="chat-time">${formatTime(m.timestamp)}</span>
            </div>
            <div class="chat-body">${m.text.replace(/</g,'&lt;')}</div>
            <div class="chat-actions">
              <button class="chat-action-btn like-btn" data-idx="${idx}"><i class="fas fa-thumbs-up"></i> Like</button>
              <span class="like-count">${m.likes || 0} likes</span>
              <button class="chat-action-btn reply-btn" data-idx="${idx}"><i class="fas fa-reply"></i> Reply</button>
            </div>`;
          if (m.replies && m.replies.length) {
            const replyWrap = document.createElement('div');
            replyWrap.className = 'reply-thread';
            m.replies.forEach(r => {
              const rEl = document.createElement('div');
              rEl.className = 'reply-message';
              rEl.innerHTML = `
                <div class="reply-header">
                  <span class="reply-author">${r.author}</span>
                  <span class="reply-time">${formatTime(r.timestamp)}</span>
                </div>
                <div class="reply-body">${r.text.replace(/</g,'&lt;')}</div>`;
              replyWrap.appendChild(rEl);
            });
            msg.appendChild(replyWrap);
          }
          chatThread.appendChild(msg);
        });
        chatThread.scrollTop = chatThread.scrollHeight;
      }
      render();
      chatComposer.addEventListener('submit', e => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;
        messages.push({ text, author: (document.getElementById('displayName')?.textContent.trim()) || 'You', initials: getUserInitials(), timestamp: Date.now(), likes: 0, mine: true, replies: [] });
        chatInput.value = '';
        persist();
        render();
      });
      chatThread.addEventListener('click', e => {
        const likeBtn = e.target.closest('.like-btn');
        const replyBtn = e.target.closest('.reply-btn');
        if (likeBtn){ const idx = +likeBtn.dataset.idx; messages[idx].likes = (messages[idx].likes || 0) + 1; persist(); render(); }
        if (replyBtn){ const idx = +replyBtn.dataset.idx; const replyText = prompt('Reply to message:'); if (replyText && replyText.trim()){ messages[idx].replies = messages[idx].replies || []; messages[idx].replies.push({ text: replyText.trim(), author: (document.getElementById('displayName')?.textContent.trim()) || 'You', timestamp: Date.now() }); persist(); render(); } }
      });
    }
  });
})();
