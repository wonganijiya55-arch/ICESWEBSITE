# ICES Frontend Architecture Documentation

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Page Inventory](#page-inventory)
4. [Authentication System](#authentication-system)
5. [API Communication](#api-communication)
6. [Admin Data Fetching](#admin-data-fetching)
7. [Styling System](#styling-system)
8. [Security Features](#security-features)
9. [Deployment](#deployment)
10. [Browser Compatibility](#browser-compatibility)

## Technology Stack

### Core Technologies

The ICES frontend is built with vanilla web technologies, requiring no build process or compilation:

| Technology | Version | Purpose |
|------------|---------|---------|
| HTML5 | Latest | Semantic page structure |
| CSS3 | Latest | Styling and responsive design |
| JavaScript | ES6+ (ES2015+) | Client-side interactivity |
| Font Awesome | 6.4.2 | Icon library |

### Why Vanilla JavaScript?

**Advantages**:
- **Zero Build Time**: No compilation, bundling, or transpilation required
- **Simple Deployment**: Direct file upload to GitHub Pages
- **Low Learning Curve**: Standard web APIs, no framework-specific patterns
- **Fast Loading**: No framework overhead (React ~140KB, Vue ~90KB, our site ~20KB JS)
- **Long-term Stability**: No framework updates or migrations needed
- **Browser Native**: Leverages modern browser capabilities directly

**Trade-offs**:
- Manual DOM manipulation (more verbose than framework templates)
- No component system (code reuse via functions/modules)
- State management handled manually via localStorage
- Larger team scaling requires discipline

## Project Structure

```
ICESWEBSITE/
├── docs/                          # Published to GitHub Pages
│   ├── index.html                 # Homepage
│   ├── index.js                   # Main JavaScript (login, registration, navigation)
│   ├── index.css                  # Global styles
│   ├── api.js                     # API client module (ES6 module)
│   ├── logged in.js               # Authentication guard for protected pages
│   ├── admin.js                   # Admin dashboard logic
│   │
│   ├── # Public Pages (No Auth Required)
│   ├── about.html                 # About ICES society
│   ├── gallery.html               # Photo gallery
│   ├── innovations.html           # Student innovation showcase
│   ├── announcements.html         # Society announcements
│   ├── contact.html               # Contact form
│   ├── Executives.html            # Society leadership
│   ├── department.html            # Department information
│   ├── support.html               # Support resources
│   │
│   ├── # Authentication Pages
│   ├── login.html                 # User login (student/admin)
│   ├── register.html              # New user registration
│   ├── forgot-password.html       # Password reset flow
│   │
│   ├── # Student Portal (Auth Required)
│   ├── students.html              # Student dashboard
│   ├── student-events.html        # View and register for events
│   ├── student-payments.html      # Submit payment proofs
│   ├── student-support.html       # Student support resources
│   ├── profile.html               # Student profile management
│   │
│   ├── # Admin Portal (Admin Auth Required)
│   ├── admin.html                 # Admin dashboard
│   ├── studentrecords.html        # View all student records
│   ├── paymentsdata.html          # View all payment submissions
│   ├── updatevents.html           # Create/edit/delete events
│   ├── admin-profile.html         # Admin profile
│   │
│   ├── # Assets
│   ├── images/                    # Logos, photos, graphics
│   │   └── mubasiceslogo.png      # Main logo
│   ├── 404.html                   # Custom 404 page
│   └── README.md                  # Documentation
│
├── src/                           # Not deployed (potential future use)
├── package.json                   # Deployment scripts
├── SYSTEM_OVERVIEW.md             # Executive documentation
├── FRONTEND_ARCHITECTURE.md       # This file
└── SYSTEM_FUTURE_UPGRADE.md       # Upgrade roadmap
```

## Page Inventory

### Public Pages (No Authentication)

#### 1. **index.html** - Homepage
- **Purpose**: Landing page, society introduction
- **Features**: Hero section, slideshow, quick links
- **JavaScript**: `index.js` (navigation, slideshow)
- **CSS**: `index.css`

#### 2. **about.html** - About ICES
- **Purpose**: Society mission, vision, history
- **Features**: Timeline, team introduction
- **Special**: Static content, minimal JS

#### 3. **gallery.html** - Photo Gallery
- **Purpose**: Visual showcase of events and activities
- **Features**: Image grid, lightbox viewer
- **Special**: Responsive image layout

#### 4. **innovations.html** - Innovation Showcase
- **Purpose**: Display student civil engineering projects
- **Features**: Project cards, comment system
- **JavaScript**: Comment form submission (local storage)

#### 5. **announcements.html** - Society Announcements
- **Purpose**: Latest news and updates
- **Features**: Announcement cards, date filtering
- **Special**: Can be managed by admins via backend

#### 6. **contact.html** - Contact Form
- **Purpose**: User inquiries and feedback
- **Features**: Form validation, submission handling
- **JavaScript**: Form submission in `index.js`

### Authentication Pages

#### 7. **login.html** - User Login
- **Purpose**: Authenticate students and admins
- **Features**:
  - Role selection (student/admin radio buttons)
  - Email/password authentication
  - JWT token storage
  - Role-based redirect (students → students.html, admins → admin.html)
- **JavaScript**: `index.js` (login handler)
- **API Endpoint**: `/api/auth/login`
- **Security**: Stores JWT in `localStorage['authToken']`

#### 8. **register.html** - New User Registration
- **Purpose**: Create new student/admin accounts
- **Features**: Multi-step form, validation
- **API Endpoint**: `/api/auth/register`

#### 9. **forgot-password.html** - Password Reset
- **Purpose**: Reset forgotten passwords
- **Features**: Email verification, new password
- **API Endpoint**: `/api/auth/reset-password`

### Student Portal (Requires Student Role)

#### 10. **students.html** - Student Dashboard
- **Purpose**: Student landing page after login
- **Features**: Quick links, profile summary, recent events
- **Auth Guard**: `logged in.js` validates student role
- **Redirect**: Redirects non-students to login

#### 11. **student-events.html** - Event Listings
- **Purpose**: View society events, register for participation
- **Features**: Event cards, registration buttons
- **API Endpoint**: `/api/students/events`

#### 12. **student-payments.html** - Payment Submission
- **Purpose**: Submit payment proofs for membership/events
- **Features**: File upload, payment form
- **API Endpoint**: `/api/students/payments`

#### 13. **student-support.html** - Support Resources
- **Purpose**: Help documents, FAQs for students
- **Features**: Resource links, contact information

#### 14. **profile.html** - Student Profile
- **Purpose**: View/edit student information
- **Features**: Profile form, password change
- **API Endpoint**: `/api/students/profile`

### Admin Portal (Requires Admin Role)

#### 15. **admin.html** - Admin Dashboard
- **Purpose**: Admin landing page, overview metrics
- **Features**: Student count, payment stats, event management
- **Auth Guard**: `logged in.js` validates admin role
- **JavaScript**: `admin.js` (dashboard logic)

#### 16. **studentrecords.html** - Student Management
- **Purpose**: View all registered students
- **Features**:
  - Searchable student table
  - CSV export functionality
  - Student details (ID, name, email, year, status)
- **JavaScript**: `admin.js` (fetchStudents function)
- **API Endpoint**: `/api/admins/students`
- **Data Flow**:
  1. Page loads → `admin.js` imports `safeFetch` from `api.js`
  2. Calls `fetchStudents()` which GETs `/api/admins/students`
  3. JWT token automatically included via `safeFetch`
  4. Renders students in table, enables search

#### 17. **paymentsdata.html** - Payment Management
- **Purpose**: View all payment submissions
- **Features**:
  - Payment table with student name, purpose, amount, date
  - View proof file links
  - Search and CSV export
- **JavaScript**: `admin.js` (fetchPayments function)
- **API Endpoint**: `/api/admins/payments`
- **Data Flow**:
  1. Page loads → `admin.js` calls `fetchPayments()`
  2. GETs `/api/admins/payments` with JWT
  3. Renders payment records in table

#### 18. **updatevents.html** - Event Management
- **Purpose**: Create, edit, delete events
- **Features**:
  - Event creation form
  - Event list with edit/delete buttons
  - Real-time updates after create/delete
- **JavaScript**: `admin.js` (fetchEvents, event form submission)
- **API Endpoints**:
  - GET `/api/admins/events` - Fetch all events
  - POST `/api/admins/events` - Create new event
  - PUT `/api/admins/events/:id` - Update event (future)
  - DELETE `/api/admins/events/:id` - Delete event (future)
- **Data Flow**:
  1. Page loads → `fetchEvents()` GETs event list
  2. Admin submits form → POSTs to `/api/admins/events`
  3. On success → refetches events and re-renders

#### 19. **admin-profile.html** - Admin Profile
- **Purpose**: Admin account management
- **Features**: Profile editing, admin code display

## Authentication System

### Overview

The ICES platform uses JWT (JSON Web Tokens) for stateless authentication. Tokens are stored client-side and included in all API requests.

### Authentication Flow

```
┌─────────┐           ┌──────────┐           ┌─────────┐
│ User    │           │ Frontend │           │ Backend │
└────┬────┘           └─────┬────┘           └────┬────┘
     │                      │                     │
     │  1. Enter credentials│                     │
     ├─────────────────────►│                     │
     │                      │  2. POST /api/login │
     │                      ├────────────────────►│
     │                      │                     │
     │                      │  3. Validate & JWT  │
     │                      │◄────────────────────┤
     │                      │                     │
     │                      │  4. Save token      │
     │                      │     to localStorage │
     │                      │                     │
     │  5. Redirect to      │                     │
     │     dashboard        │                     │
     │◄─────────────────────┤                     │
     │                      │                     │
```

### Token Management (api.js)

**Token Storage Functions**:

```javascript
// Save token after successful login
export function saveToken(token) {
  if (token) localStorage.setItem('authToken', token);
}

// Retrieve token for API calls
export function getToken() {
  return localStorage.getItem('authToken');
}

// Clear token on logout or 401/403
export function clearToken() {
  localStorage.removeItem('authToken');
}
```

**Automatic Token Inclusion**:

Every API call via `safeFetch()` automatically includes the JWT:

```javascript
export async function safeFetch(path, options = {}) {
  // ... setup code ...
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Add JWT token if available
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // ... make request ...
}
```

**Auto-Logout on Token Expiry**:

```javascript
if (!res.ok) {
  // Handle expired/invalid token
  if (res.status === 401 || res.status === 403) {
    clearToken();
    localStorage.removeItem('userData');
    if (typeof window !== 'undefined' && !window.location.pathname.includes('login')) {
      window.location.href = 'login.html';
    }
  }
  // ... error handling ...
}
```

### Login Process (index.js)

```javascript
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value;
  
  try {
    const attempt = await API_TEST.tryLoginVariants(email, password);
    const data = attempt?.res || attempt;
    
    // Save JWT token
    if (data.token && saveToken) {
      saveToken(data.token);
    }
    
    // Save user data
    localStorage.setItem('userData', JSON.stringify({
      role: data.role,
      name: data.user?.name || data.name,
      email: data.user?.email || data.email,
      userId: data.user?.id || data.id
    }));
    
    // Redirect based on role
    if (data.role === 'admin') redirectToPage('admin.html');
    else if (data.role === 'student') redirectToPage('students.html');
  } catch (err) {
    alert(err.error || err.message || 'Login failed');
  }
});
```

### Authentication Guard (logged in.js)

Every protected page includes `logged in.js` which:

1. **Checks Authentication**:
   ```javascript
   const userData = localStorage.getItem('userData');
   if (!userData) {
     redirectCleanly('login.html');
   }
   ```

2. **Validates Role**:
   ```javascript
   if (adminPages.includes(currentPath) && userData.role !== 'admin') {
     localStorage.removeItem('userData');
     redirectCleanly('login.html');
   }
   ```

3. **Session Timeout (20 minutes)**:
   ```javascript
   const IDLE_LIMIT_MS = 20 * 60 * 1000;
   
   function checkIdleLogout() {
     const last = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
     if (Date.now() - last >= IDLE_LIMIT_MS) {
       alert('Session expired due to inactivity.');
       localStorage.removeItem('userData');
       localStorage.removeItem('authToken');
       redirectToPage('login.html');
     }
   }
   ```

### Logout Process (logged in.js)

```javascript
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken'); // Clear JWT token
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    redirectToPage('login.html');
  }
}
```

## API Communication

### API Client Architecture (api.js)

The `api.js` module is an ES6 module that provides:

1. **Environment Detection**: Auto-switches between localhost and production
2. **Request Wrapper**: `safeFetch()` for all API calls
3. **Error Handling**: Consistent error propagation
4. **Token Management**: Automatic JWT inclusion
5. **Timeout Protection**: 15-second default timeout

### API Configuration

```javascript
const RENDER_BASE = 'https://back-end-11-uvgh.onrender.com';
const LOCAL_BASE = 'http://localhost:5000';

export const API_CONFIG = {
  env: useDev ? 'dev' : 'prod',
  baseUrl: (localStorage.getItem('apiBaseOverride') || (useDev ? LOCAL_BASE : RENDER_BASE)),
  endpoints: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    me: '/api/auth/me',
    data: '/api/data',
    items: '/api/items'
  },
  timeout: 15000
};
```

### Making API Calls

**Example: Fetch Students (admin.js)**:

```javascript
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
```

**Example: Create Event (admin.js)**:

```javascript
await safeFetch('/api/admins/events', {
  method: 'POST',
  body: { title, description, date }
});
```

The `body` object is automatically JSON-stringified and the JWT is automatically added to headers.

### Error Handling

**Network Errors**:
```javascript
catch (err) {
  if (err.name === 'AbortError') {
    throw new Error('Request timeout');
  }
  console.error('Network/parse error:', { path, err });
  throw err;
}
```

**HTTP Errors**:
```javascript
if (!res.ok) {
  if (res.status === 401 || res.status === 403) {
    // Auto-logout
    clearToken();
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
  }
  const msg = data?.message || data?.error || res.statusText;
  const err = new Error(msg || `HTTP ${res.status}`);
  err.status = res.status;
  throw err;
}
```

## Admin Data Fetching

### How Admin Pages Load Real Data

All admin pages (`studentrecords.html`, `paymentsdata.html`, `updatevents.html`) follow this pattern:

1. **Import API Client**:
   ```javascript
   ready(async function(){
     let safeFetch;
     try {
       const mod = await import('./api.js');
       safeFetch = mod.safeFetch;
     } catch (e) {
       console.warn('Failed to load API module');
     }
   });
   ```

2. **Define Fetch Function**:
   ```javascript
   async function fetchStudents(){
     try {
       if (!safeFetch) throw new Error('API client unavailable');
       const data = await safeFetch('/api/admins/students', { method: 'GET' });
       return Array.isArray(data) ? data : (data.students || []);
     } catch (error) {
       console.error('Error:', error);
       alert('Failed to load data');
       return [];
     }
   }
   ```

3. **Call on Page Load**:
   ```javascript
   fetchStudents().then(data => {
     students = data;
     renderStudents(students);
   });
   ```

4. **Render Data**:
   ```javascript
   function renderStudents(data){
     const tbody = studentTable.querySelector('tbody');
     tbody.innerHTML = '';
     data.forEach(s => {
       const tr = document.createElement('tr');
       tr.innerHTML = `
         <td>${s.id}</td>
         <td>${s.name}</td>
         <td>${s.email}</td>
         <td>${s.year}</td>
         <td>${s.registration_date}</td>
         <td><span class="badge">${s.status}</span></td>
       `;
       tbody.appendChild(tr);
     });
   }
   ```

### Event Management Example

**Fetch Events**:
```javascript
async function fetchEvents(){
  try {
    if (!safeFetch) throw new Error('API client unavailable');
    const data = await safeFetch('/api/admins/events', { method: 'GET' });
    return Array.isArray(data) ? data : (data.events || []);
  } catch (error) {
    console.error('Error fetching events:', error);
    alert('Failed to load events from API.');
    return [];
  }
}
```

**Create Event**:
```javascript
eventForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('eventTitle')?.value;
  const description = document.getElementById('eventDescription')?.value;
  const date = document.getElementById('eventDate')?.value;
  
  if (!title || !date) {
    alert('Title and date are required');
    return;
  }
  
  try {
    if (!safeFetch) throw new Error('API client unavailable');
    await safeFetch('/api/admins/events', {
      method: 'POST',
      body: { title, description: description || '', date }
    });
    alert('Event created successfully');
    eventForm.reset();
    const updatedEvents = await fetchEvents();
    events = updatedEvents;
    renderEvents();
  } catch (error) {
    console.error('Error creating event:', error);
    alert('Failed to create event: ' + error.message);
  }
});
```

## Styling System

### CSS Architecture

**Global Styles** (`index.css`):
- CSS variables for theming
- Reset and normalize
- Typography
- Layout utilities
- Component styles

**Theme System**:
```css
:root {
  --primary-color: #1a472a;
  --secondary-color: #2d5f3f;
  --accent-color: #4a7c59;
  --text-color: #333;
  --bg-color: #fff;
}

[data-theme="dark"] {
  --text-color: #f0f0f0;
  --bg-color: #1a1a1a;
}
```

**Dark Mode Toggle** (logged in.js):
```javascript
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}
```

### Responsive Design

**Mobile-First Approach**:
```css
/* Base styles (mobile) */
.nav-links { display: none; }

/* Tablet and up */
@media (min-width: 768px) {
  .nav-links { display: flex; }
}

/* Desktop */
@media (min-width: 1024px) {
  .container { max-width: 1200px; }
}
```

**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: ≥ 1024px

## Security Features

### Frontend Security Measures

1. **JWT Token Protection**:
   - Tokens stored in localStorage (XSS risk mitigated by Content Security Policy)
   - Auto-logout on expiry
   - Never sent in URL parameters

2. **Input Validation**:
   - Client-side validation before submission
   - HTML5 required attributes
   - Pattern matching for emails

3. **XSS Prevention**:
   - No `innerHTML` with user data
   - Use `textContent` for user-generated content
   - No `eval()` or `Function()` constructor

4. **CSRF Protection**:
   - JWT tokens in headers (not cookies)
   - SameSite cookie policy (backend)

5. **Role-Based Access**:
   - Auth guard checks role before rendering
   - API validates role server-side
   - Frontend checks are UX, not security

6. **Session Management**:
   - 20-minute inactivity timeout
   - Activity tracking across tabs
   - Manual logout option

7. **HTTPS Only**:
   - GitHub Pages enforces HTTPS
   - API calls only to HTTPS backend
   - No mixed content

### Security Best Practices

**DO**:
- ✅ Validate input client-side AND server-side
- ✅ Use HTTPS for all communication
- ✅ Clear tokens on logout
- ✅ Handle 401/403 gracefully
- ✅ Sanitize user input before display

**DON'T**:
- ❌ Store sensitive data in localStorage (only tokens and minimal user info)
- ❌ Trust client-side validation alone
- ❌ Use `innerHTML` with user data
- ❌ Hardcode credentials in JavaScript
- ❌ Send tokens in URL parameters

## Deployment

### GitHub Pages Deployment

**Process**:
1. Push changes to `main` branch
2. GitHub automatically deploys `docs/` folder
3. Site available at `https://wonganijiya55-arch.github.io/ICESWEBSITE/`

**Configuration** (package.json):
```json
{
  "homepage": "https://wonganijiya55-arch.github.io/ICESWEBSITE/",
  "scripts": {
    "predeploy": "npm run build || echo 'Skipping build for static site'",
    "deploy": "gh-pages -d public"
  }
}
```

**Custom Domain** (optional):
- Add CNAME file to `docs/`
- Configure DNS records
- Enable HTTPS in GitHub settings

### Build Process

**No build required!** Pure HTML/CSS/JS files are served directly.

**Optional optimizations** (future):
- Minify CSS/JS
- Image optimization
- Bundle ES6 modules

## Browser Compatibility

### Supported Browsers

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

### Required Features

- **ES6+ JavaScript**: Modules, async/await, arrow functions, template literals
- **Fetch API**: For network requests
- **LocalStorage**: For token and session storage
- **CSS Grid & Flexbox**: For layouts
- **CSS Variables**: For theming

### Polyfills Not Needed

Modern browsers (2021+) support all features used. No polyfills required for target audience (university students with modern devices).

### Testing Checklist

- [ ] Test on Chrome (Windows/Mac/Linux)
- [ ] Test on Firefox (Windows/Mac/Linux)
- [ ] Test on Safari (Mac/iOS)
- [ ] Test on Edge (Windows)
- [ ] Test on mobile devices (iOS Safari, Chrome Android)
- [ ] Test with JavaScript disabled (graceful degradation)
- [ ] Test with slow network (3G simulation)

## Development Workflow

### Local Development

1. **Clone Repository**:
   ```bash
   git clone https://github.com/wonganijiya55-arch/ICESWEBSITE.git
   cd ICESWEBSITE
   ```

2. **Serve Locally** (optional):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx http-server docs -p 8000
   ```

3. **Open in Browser**:
   ```
   http://localhost:8000/docs/
   ```

4. **Edit Files**:
   - Edit HTML/CSS/JS directly
   - Refresh browser to see changes
   - No compilation step needed

### Testing API Integration

**Switch to Local Backend**:
```javascript
localStorage.setItem('apiEnv', 'dev'); // Use localhost:5000
localStorage.setItem('apiEnv', 'prod'); // Use Render production (default)
```

**Override Base URL**:
```javascript
localStorage.setItem('apiBaseOverride', 'https://custom-backend.com');
```

### Common Tasks

**Update Student Table**:
1. Edit `docs/admin.js`
2. Modify `renderStudents()` function
3. Refresh `studentrecords.html`

**Add New Page**:
1. Create `docs/newpage.html`
2. Include `<script type="module" src="index.js"></script>`
3. Include `<script src="logged in.js"></script>` if auth required
4. Add navigation link in navbar

**Change API Endpoint**:
1. Edit `docs/api.js` → `API_CONFIG.endpoints`
2. Update page-specific fetch calls if needed

## Troubleshooting

### Common Issues

**Issue**: "API client unavailable"
- **Cause**: `api.js` module failed to load
- **Solution**: Check browser console, ensure `api.js` exists, check ES6 module support

**Issue**: Auto-logout on every page load
- **Cause**: Token not being sent or backend rejecting it
- **Solution**: Check `getToken()` returns token, verify Authorization header in Network tab

**Issue**: CORS errors
- **Cause**: Backend not allowing GitHub Pages origin
- **Solution**: Add `https://wonganijiya55-arch.github.io` to backend CORS whitelist

**Issue**: 404 on page reload (GitHub Pages)
- **Cause**: GitHub Pages doesn't support client-side routing
- **Solution**: Use `404.html` with redirect script or avoid deep linking

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Maintained By**: ICES Technical Team
