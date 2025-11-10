/**
 * Logged in.js – central scripts for student dashboard pages
 * - Mobile nav hamburger toggle
 * - Event registration form submission (no personal fields)
 * - Payments form dynamic fields and validation (file proof <= 700KB)
 */

(function(){
  // Utility: on DOM ready
  function ready(fn){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  ready(function(){
    // 1) Mobile nav toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
    }

    // 2) Event Registration Form (studentside/events.html)
    const eventForm = document.getElementById('eventRegistrationForm');
    if (eventForm) {
      eventForm.addEventListener('submit', function(e){
        e.preventDefault();
        const select = document.getElementById('eventSelect');
        if (!select || !select.value) {
          alert('Please choose an event');
          return;
        }
        const success = document.getElementById('eventSuccess');
        if (success) success.style.display = 'block';
        eventForm.reset();
      });
    }

    // 3) Payments Form (studentside/payments.html)
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

      // Show/hide event selector based on purpose
      if (purposeSelect && eventFields) {
        purposeSelect.addEventListener('change', () => {
          const isEvent = purposeSelect.value === 'event';
          eventFields.style.display = isEvent ? 'block' : 'none';
          
          // Auto-fill amount: Membership = 2500 MWK (fixed), Event = user enters manually
          if (amountInput) {
            if (purposeSelect.value === 'membership') {
              amountInput.value = '2500';
              amountInput.readOnly = true;
            } else {
              amountInput.value = '';
              amountInput.readOnly = false;
            }
          }
        });
      }

      // Show/hide payment instructions based on selected method
      if (methodSelect && instructionsBox && mobileMoneyInfo && bankTransferInfo) {
        methodSelect.addEventListener('change', () => {
          const method = methodSelect.value;
          if (method === 'mobile_money') {
            instructionsBox.style.display = 'block';
            mobileMoneyInfo.style.display = 'block';
            bankTransferInfo.style.display = 'none';
          } else if (method === 'bank_transfer') {
            instructionsBox.style.display = 'block';
            mobileMoneyInfo.style.display = 'none';
            bankTransferInfo.style.display = 'block';
          } else {
            instructionsBox.style.display = 'none';
            mobileMoneyInfo.style.display = 'none';
            bankTransferInfo.style.display = 'none';
          }
        });
      }

      paymentForm.addEventListener('submit', function(e){
        e.preventDefault();
        // Validate purpose
        if (!purposeSelect || !purposeSelect.value) {
          alert('Please select a payment purpose');
          return;
        }
        // If event payment, ensure an event is chosen
        if (purposeSelect.value === 'event' && eventSelect && !eventSelect.value) {
          alert('Please choose an event for the event payment');
          return;
        }
        // Validate amount
        const amount = parseFloat(amountInput && amountInput.value || '');
        if (!Number.isFinite(amount) || amount <= 0) {
          alert('Please enter a valid amount');
          return;
        }
        // Validate method
        if (!methodSelect || !methodSelect.value) {
          alert('Please select a payment method');
          return;
        }
        // Validate payment proof file size (<= 700KB)
        if (!proofInput || !proofInput.files || proofInput.files.length === 0) {
          alert('Please upload your payment proof');
          return;
        }
        const file = proofInput.files[0];
        const MAX_BYTES = 700 * 1024; // 700KB
        if (file.size > MAX_BYTES) {
          alert('Payment proof file must be less than 700KB');
          return;
        }

        const success = document.getElementById('paymentSuccess');
        if (success) success.style.display = 'block';
        paymentForm.reset();
        if (eventFields) eventFields.style.display = 'none';
        if (instructionsBox) instructionsBox.style.display = 'none';
      });
    }

    // 4) Profile Form (profile.html)
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      const editBtn = document.getElementById('editBtn');
      const saveBtn = document.getElementById('saveBtn');
      const successMsg = document.getElementById('profileSuccess');
      const photoUpload = document.getElementById('photoUpload');
      const profilePhoto = document.getElementById('profilePhoto');
      const displayName = document.getElementById('displayName');
      const fullNameInput = document.getElementById('fullName');

      // All form inputs
      const formInputs = profileForm.querySelectorAll('input, textarea, select');

      // Initially disable all inputs (read-only mode)
      formInputs.forEach(input => input.disabled = true);
      if (saveBtn) saveBtn.style.display = 'none';

      // Edit button: enable form for editing
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          formInputs.forEach(input => input.disabled = false);
          editBtn.style.display = 'none';
          if (saveBtn) saveBtn.style.display = 'inline-block';
          if (successMsg) successMsg.style.display = 'none';
        });
      }

      // Save button: lock form and show success
      if (saveBtn) {
        profileForm.addEventListener('submit', (e) => {
          e.preventDefault();
          
          // Update display name from form
          if (fullNameInput && displayName) {
            displayName.textContent = fullNameInput.value || 'Your Name';
          }

          // Lock all inputs again
          formInputs.forEach(input => input.disabled = true);
          saveBtn.style.display = 'none';
          if (editBtn) editBtn.style.display = 'inline-block';
          if (successMsg) successMsg.style.display = 'block';

          // In a real app, send data to server here
          console.log('Profile saved:', new FormData(profileForm));
        });
      }

      // Profile photo upload
      if (photoUpload && profilePhoto) {
        photoUpload.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
            if (!file) return;
          
            // Validate file type
            if (!file.type.startsWith('image/')) {
              alert('Please upload a valid image file');
              photoUpload.value = '';
              return;
            }
          
            // Validate file size (<= 700KB)
            const MAX_SIZE = 700 * 1024;
            if (file.size > MAX_SIZE) {
              alert('Profile photo must be less than 700KB');
              photoUpload.value = '';
              return;
            }
          
            // Preview image
            if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              profilePhoto.src = ev.target.result;
            };
            reader.readAsDataURL(file);
          }
        });
      }
    }

    // 5) Community Support Chat (studentside/support.html)
    const chatThread = document.getElementById('chatThread');
    const chatComposer = document.getElementById('chatComposer');
    const chatInput = document.getElementById('chatInput');

    if (chatThread && chatComposer && chatInput) {
      // Local storage key
      const STORE_KEY = 'ices_chat_messages_v1';

      // Load existing messages
      let messages = [];
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) messages = JSON.parse(raw);
      } catch(e){ console.warn('Failed reading messages', e); }

      // Simple helper: save
      function persist(){
        localStorage.setItem(STORE_KEY, JSON.stringify(messages));
      }

      // Generate pseudo user initials (demo) – in real app use logged in user info
      function getUserInitials(){
        const nameEl = document.getElementById('displayName');
        const name = (nameEl && nameEl.textContent.trim()) || 'ICES Member';
        return name.split(/\s+/).slice(0,2).map(p=>p[0].toUpperCase()).join('');
      }

      // Format time
      function formatTime(ts){
        const d = new Date(ts);
        return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      }

      // Render all messages
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
            </div>
          `;

          // Replies
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
                <div class="reply-body">${r.text.replace(/</g,'&lt;')}</div>
              `;
              replyWrap.appendChild(rEl);
            });
            msg.appendChild(replyWrap);
          }

          chatThread.appendChild(msg);
        });
        chatThread.scrollTop = chatThread.scrollHeight;
      }

      render();

      // Send new top-level message
      chatComposer.addEventListener('submit', e => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;
        messages.push({
          text,
          author: (document.getElementById('displayName')?.textContent.trim()) || 'You',
          initials: getUserInitials(),
          timestamp: Date.now(),
          likes: 0,
          mine: true,
          replies: []
        });
        chatInput.value = '';
        persist();
        render();
      });

      // Delegate like & reply
      chatThread.addEventListener('click', e => {
        const likeBtn = e.target.closest('.like-btn');
        const replyBtn = e.target.closest('.reply-btn');
        if (likeBtn){
          const idx = +likeBtn.dataset.idx;
            messages[idx].likes = (messages[idx].likes || 0) + 1;
            persist();
            render();
        }
        if (replyBtn){
          const idx = +replyBtn.dataset.idx;
          const replyText = prompt('Reply to message:');
          if (replyText && replyText.trim()){
            messages[idx].replies = messages[idx].replies || [];
            messages[idx].replies.push({
              text: replyText.trim(),
              author: (document.getElementById('displayName')?.textContent.trim()) || 'You',
              timestamp: Date.now()
            });
            persist();
            render();
          }
        }
      });
    }
  });
})();
