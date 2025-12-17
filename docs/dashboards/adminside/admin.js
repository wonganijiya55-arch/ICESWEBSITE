/**
 * admin.js – Admin dashboard logic for student records, payments, and event management
 * Copied for docs hosting; endpoints still point to localhost until backend aligns.
 */
(function(){
  function ready(fn){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  ready(async function(){
    let safeFetch;
    try {
      const mod = await import('../../api.js');
      safeFetch = mod.safeFetch;
      console.info('[Admin] Using API client with base', mod.currentBase());
    } catch (e) {
      console.warn('[Admin] Failed to load API module; admin data views may not work on Pages.', e);
    }
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
    }

    const studentTable = document.getElementById('studentRecordsTable');
    const studentSearch = document.getElementById('studentSearch');
    const exportStudents = document.getElementById('exportStudents');

    if (studentTable) {
      let students = [];
      async function fetchStudents(){
        try {
          if (!safeFetch) throw new Error('API client unavailable');
          const data = await safeFetch('/api/admins/students', { method: 'GET' });
          return Array.isArray(data) ? data : (data.students || []);
        } catch (error) {
          console.error('Error fetching students:', error);
          alert('Failed to load student records (API).');
          return [];
        }
      }
      function renderStudents(data){
        const tbody = studentTable.querySelector('tbody');
        tbody.innerHTML = '';
        if (data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#5a5a66;">No student records found.</td></tr>';
          return;
        }
        data.forEach(s => {
          const tr = document.createElement('tr');
          const regDate = (s.registration_date || s.regDate || '').toString().split(' ')[0] || 'N/A';
          const statusClass = (s.status || 'Pending').toLowerCase();
          tr.innerHTML = `
            <td>${s.id}</td>
            <td>${s.name || s.fullName || ''}</td>
            <td>${s.email}</td>
            <td>${s.year ? 'Year ' + s.year : (s.currentYear || '')}</td>
            <td>${regDate}</td>
            <td><span class="badge badge-${statusClass}">${s.status || 'Pending'}</span></td>`;
          tbody.appendChild(tr);
        });
      }
      fetchStudents().then(data => { students = data; renderStudents(students); });
      if(studentSearch){
        studentSearch.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase();
          const filtered = students.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
          renderStudents(filtered);
        });
      }
      if(exportStudents){
        exportStudents.addEventListener('click', () => {
          const csv = ['ID,Name,Email,Year,Registration Date,Status'];
          students.forEach(s => { csv.push(`${s.id},"${s.name || s.fullName || ''}",${s.email},${s.year ? 'Year ' + s.year : (s.currentYear || '')},${s.registration_date || s.regDate || ''},${s.status || 'Pending'}`); });
          const blob = new Blob([csv.join('\n')], {type:'text/csv'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'student_records.csv'; a.click();
        });
      }
    }

    const adminTable = document.getElementById('adminRecordsTable');
    const adminSearch = document.getElementById('adminSearch');
    const exportAdmins = document.getElementById('exportAdmins');

    if (adminTable) {
      let admins = [];
      async function fetchAdmins(){
        try {
          if (!safeFetch) throw new Error('API client unavailable');
          const data = await safeFetch('/api/admins', { method: 'GET' });
          return Array.isArray(data) ? data : (data.admins || []);
        } catch (error) {
          console.error('Error fetching admins:', error);
          alert('Failed to load admin records (API).');
          return [];
        }
      }
      function renderAdmins(data){
        const tbody = adminTable.querySelector('tbody');
        tbody.innerHTML = '';
        if (data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#5a5a66;">No admin records found.</td></tr>';
          return;
        }
        data.forEach(a => {
          const tr = document.createElement('tr');
          const adminCode = a.admin_code || 'N/A';
          tr.innerHTML = `
            <td>${a.id}</td>
            <td>${a.username || a.name || ''}</td>
            <td>${a.email}</td>
            <td><span class="badge badge-active">${adminCode}</span></td>
            <td><button class="btn-secondary btn-sm">View Details</button></td>`;
          tbody.appendChild(tr);
        });
      }
      fetchAdmins().then(data => { admins = data; renderAdmins(admins); });
      if(adminSearch){
        adminSearch.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase();
          const filtered = admins.filter(a => a.username.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
          renderAdmins(filtered);
        });
      }
      if(exportAdmins){
        exportAdmins.addEventListener('click', () => {
          const csv = ['ID,Username,Email,Admin Code'];
          admins.forEach(a => { csv.push(`${a.id},"${a.username || a.name || ''}",${a.email},${a.admin_code || 'N/A'}`); });
          const blob = new Blob([csv.join('\n')], {type:'text/csv'});
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url; link.download = 'admin_records.csv'; link.click();
        });
      }
    }

    const paymentTable = document.getElementById('paymentDataTable');
    const paymentSearch = document.getElementById('paymentSearch');
    const exportPayments = document.getElementById('exportPayments');

    if (paymentTable) {
      let payments = [];
      async function fetchPayments(){
        try {
          if (!safeFetch) throw new Error('API client unavailable');
          const data = await safeFetch('/api/admins/payments', { method: 'GET' });
          return Array.isArray(data) ? data : (data.payments || []);
        } catch (error) {
          console.error('Error fetching payments:', error);
          alert('Failed to load payment records (API).');
          return [];
        }
      }
      function renderPayments(data){
        const tbody = paymentTable.querySelector('tbody');
        tbody.innerHTML = '';
        if (data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#5a5a66;">No payment records found.</td></tr>';
          return;
        }
        data.forEach(p => {
          const tr = document.createElement('tr');
          const studentName = p.student_name || 'N/A';
          const proofButton = p.proof_file 
            ? `<a href="${p.proof_file}" target="_blank" class="btn-secondary btn-sm"><i class="fas fa-download"></i> View Proof</a>`
            : '<span style="color:#999;">No proof uploaded</span>';
          tr.innerHTML = `
            <td>${p.id}</td>
            <td>${studentName}</td>
            <td>${p.purpose}</td>
            <td>MWK ${p.amount}</td>
            <td>${p.method}</td>
            <td>${p.date}</td>
            <td>${proofButton}</td>`;
          tbody.appendChild(tr);
        });
      }
      fetchPayments().then(data => { payments = data; renderPayments(payments); });
      if(paymentSearch){
        paymentSearch.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase();
          const filtered = payments.filter(p => (p.student_name && p.student_name.toLowerCase().includes(q)) || p.purpose.toLowerCase().includes(q));
          renderPayments(filtered);
        });
      }
      if(exportPayments){
        exportPayments.addEventListener('click', () => {
          const csv = ['ID,Student,Purpose,Amount,Method,Date,Proof File'];
          payments.forEach(p => {
            const studentName = p.student_name || 'N/A';
            const proofFile = p.proof_file || 'No proof uploaded';
            csv.push(`${p.id},"${studentName}","${p.purpose}",${p.amount},${p.method},${p.date},"${proofFile}"`);
          });
          const blob = new Blob([csv.join('\n')], {type:'text/csv'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'payment_records.csv'; a.click();
        });
      }
    }

    const eventForm = document.getElementById('eventForm');
    const eventList = document.getElementById('eventList');
    if (eventForm && eventList) {
      let events = [];
      async function fetchEvents(){
        return [
          {id:1, title:'Infrastructure Innovation Forum', date:'2024-12-10', description:'Annual showcase of student infrastructure projects.'},
          {id:2, title:'Sustainable Materials Workshop', date:'2024-12-15', description:'Hands-on workshop on eco-friendly building materials.'},
          {id:3, title:'Bridge Design Challenge', date:'2025-01-20', description:'Compete to design the most efficient bridge structure.'},
        ];
      }
      function renderEvents(){
        eventList.innerHTML = '';
        events.forEach((e, idx) => {
          const card = document.createElement('div');
          card.className = 'event-card';
          card.innerHTML = `
            <h4>${e.title}</h4>
            <p><strong>Date:</strong> ${e.date}</p>
            <p>${e.description}</p>
            <button class="btn-secondary" data-idx="${idx}">Edit</button>
            <button class="btn-danger" data-idx="${idx}">Delete</button>`;
          eventList.appendChild(card);
        });
      }
      fetchEvents().then(data => { events = data; renderEvents(); });
      eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const desc = document.getElementById('eventDescription').value.trim();
        if(!title || !date || !desc) return;
        const editIdx = eventForm.dataset.editIdx;
        if(editIdx !== undefined && editIdx !== ''){ events[+editIdx] = {id: events[+editIdx].id, title, date, description:desc}; delete eventForm.dataset.editIdx; }
        else { events.push({id:Date.now(), title, date, description:desc}); }
        console.log('Save event to backend:', {title, date, description:desc});
        eventForm.reset();
        renderEvents();
        document.getElementById('eventSuccess').style.display='block';
        setTimeout(()=> document.getElementById('eventSuccess').style.display='none', 3000);
      });
      eventList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-secondary');
        const delBtn = e.target.closest('.btn-danger');
        if(editBtn){ const idx = +editBtn.dataset.idx; const ev = events[idx]; document.getElementById('eventTitle').value = ev.title; document.getElementById('eventDate').value = ev.date; document.getElementById('eventDescription').value = ev.description; eventForm.dataset.editIdx = idx; window.scrollTo({top:0, behavior:'smooth'}); }
        if(delBtn){ const idx = +delBtn.dataset.idx; if(confirm('Delete this event?')){ events.splice(idx, 1); console.log('Delete event from backend'); renderEvents(); } }
      });
    }
  });
})();
