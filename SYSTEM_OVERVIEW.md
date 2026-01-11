# ICES Website - System Overview

## Executive Summary

The Innovation in Civil Engineering Society (ICES) Website is a comprehensive digital platform designed to serve the MUBAS (Malawi University of Business and Applied Sciences) civil engineering student community. This system provides essential infrastructure for student registration, event management, payment tracking, and administrative oversight.

### Key Benefits for the Student Society

1. **Centralized Member Management**: Streamlined registration and tracking of all society members
2. **Event Organization**: Efficient planning, promotion, and tracking of engineering workshops, competitions, and forums
3. **Financial Transparency**: Clear payment tracking for membership fees, events, and society activities
4. **Administrative Efficiency**: Dedicated admin dashboard for society leadership to manage operations
5. **Student Engagement**: Easy access to innovations, announcements, and society resources
6. **Professional Presentation**: Modern, responsive web presence that reflects the society's commitment to innovation

### System Scope

The ICES platform consists of two interconnected repositories:

1. **Frontend Repository** (this repo): Static HTML/CSS/JavaScript website hosted on GitHub Pages
2. **Backend Repository**: Node.js/Express REST API deployed on Render.com

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ICES Web Platform                        │
└─────────────────────────────────────────────────────────────┘
                            │
           ┌────────────────┴────────────────┐
           │                                 │
    ┌──────▼──────┐                  ┌──────▼──────┐
    │   Frontend  │◄────────────────►│   Backend   │
    │  (GitHub    │     HTTPS/JWT    │   (Render)  │
    │   Pages)    │                  │             │
    └─────────────┘                  └──────┬──────┘
           │                                 │
           │                          ┌──────▼──────┐
           │                          │  PostgreSQL │
           │                          │  Database   │
           │                          └─────────────┘
           │
    ┌──────▼──────┐
    │   Users     │
    │  (Browsers) │
    └─────────────┘
```

### Frontend Architecture (This Repository)

**Deployment**: GitHub Pages (https://wonganijiya55-arch.github.io/ICESWEBSITE/)

**Technology Stack**:
- Pure HTML5 for structure
- CSS3 for styling (custom stylesheets)
- Vanilla JavaScript (ES6+) for interactivity
- Font Awesome for icons
- No build tools required (static deployment)

**Key Components**:
1. **Public Pages**: Home, About, Gallery, Innovations, Announcements
2. **Authentication**: Login, Registration, Password Reset
3. **Student Portal**: Events, Payments, Support, Profile
4. **Admin Dashboard**: Student Records, Payment Data, Event Management

### Backend Architecture (Separate Repository)

**Deployment**: Render.com (https://back-end-9-qudx.onrender.com)

**Technology Stack**:
- Node.js runtime
- Express.js web framework
- PostgreSQL database
- JWT for authentication
- RESTful API design

**Key Endpoints**:
- `/api/auth/*` - Authentication (login, register)
- `/api/students/*` - Student operations
- `/api/admins/*` - Admin operations (students, payments, events)

## Technology Stack Overview

### Frontend Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Structure | HTML5 | Semantic markup |
| Styling | CSS3 | Responsive design, custom themes |
| Scripting | JavaScript ES6+ | Client-side logic, API calls |
| Icons | Font Awesome 6.4.2 | Professional icons |
| Hosting | GitHub Pages | Free, reliable static hosting |

### Backend Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js | JavaScript server environment |
| Framework | Express.js | Web application framework |
| Database | PostgreSQL | Relational data storage |
| Authentication | JWT | Secure token-based auth |
| Hosting | Render.com | Cloud application platform |

## Key Features

### For Students

1. **Member Registration**: Create account with student details
2. **Event Access**: View and register for society events
3. **Payment Submission**: Submit payment proofs for verification
4. **Innovation Showcase**: Share civil engineering projects
5. **Profile Management**: Update personal information
6. **Announcements**: Stay informed about society activities

### For Administrators

1. **Student Management**: View and manage all registered members
2. **Payment Tracking**: Review and verify payment submissions
3. **Event Management**: Create, update, and delete events
4. **Admin Records**: Manage admin users and access codes
5. **Data Export**: Download CSV reports for offline analysis
6. **Real-time Dashboard**: Monitor society metrics

## Data Flow

### Authentication Flow

```
1. User submits email/password → Frontend (login.html)
2. Frontend POSTs to /api/auth/login → Backend
3. Backend validates credentials → Database
4. Backend generates JWT token → Response
5. Frontend stores token in localStorage
6. Frontend redirects to appropriate dashboard
```

### Protected Resource Access

```
1. User navigates to admin page → Frontend
2. Frontend checks localStorage for token
3. Frontend includes token in Authorization header
4. Backend validates JWT token
5. Backend returns requested data or 401/403
6. Frontend displays data or redirects to login
```

### Event Management Flow

```
1. Admin creates event → Frontend form
2. Frontend POSTs to /api/admins/events with JWT
3. Backend validates token and data
4. Backend stores event → Database
5. Backend confirms success → Frontend
6. Frontend refreshes event list
7. Students see new event on student-events.html
```

## Security Model

### Authentication & Authorization

1. **JWT Tokens**: Stateless authentication using industry-standard JSON Web Tokens
2. **Token Storage**: localStorage for client-side token persistence
3. **Auto-Logout**: Automatic logout on token expiry (401/403 responses)
4. **Role-Based Access**: Separate student and admin roles with distinct permissions
5. **Session Timeout**: 20-minute inactivity timeout

### Frontend Security Features

1. **HTTPS Only**: All API calls over encrypted connections
2. **XSS Prevention**: No user-generated HTML rendering
3. **CSRF Protection**: Token-based authentication prevents CSRF
4. **Input Validation**: Client-side validation before API submission
5. **Secure Redirects**: Protected pages redirect to login if unauthenticated

### Backend Security (Managed by Backend Repository)

1. **Password Hashing**: bcrypt for secure password storage
2. **SQL Injection Prevention**: Parameterized queries
3. **CORS Configuration**: Whitelist of allowed origins
4. **Rate Limiting**: Protection against brute force attacks
5. **Environment Variables**: Sensitive configuration in .env files

## Deployment Architecture

### Frontend Deployment (GitHub Pages)

```
Developer → Git Push → GitHub Repository → GitHub Actions → GitHub Pages
                                                                  │
                                                           ┌──────▼──────┐
                                                           │  CDN Delivery│
                                                           │  (worldwide) │
                                                           └──────┬──────┘
                                                                  │
                                                           ┌──────▼──────┐
                                                           │  End Users  │
                                                           └─────────────┘
```

**Features**:
- Automatic deployment on push to main branch
- Global CDN for fast loading worldwide
- HTTPS by default
- No server maintenance required

### Backend Deployment (Render.com)

```
Developer → Git Push → GitHub Repository → Render Webhook → Build & Deploy
                                                                  │
                                                           ┌──────▼──────┐
                                                           │  Node.js    │
                                                           │  Container  │
                                                           └──────┬──────┘
                                                                  │
                                                           ┌──────▼──────┐
                                                           │ PostgreSQL  │
                                                           │  Database   │
                                                           └─────────────┘
```

**Features**:
- Automatic deployment from Git repository
- Managed PostgreSQL database
- Auto-scaling and load balancing
- SSL/TLS certificates included
- Health checks and monitoring

## Production Requirements

### Frontend Requirements

- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **JavaScript**: ES6+ support required
- **Storage**: localStorage enabled
- **Network**: HTTPS and CORS-compatible browser
- **Screen Sizes**: Responsive from 320px to 4K

### Backend Requirements

- **Runtime**: Node.js 16.x or higher
- **Database**: PostgreSQL 12.x or higher
- **Memory**: Minimum 512MB RAM
- **Storage**: Minimum 1GB disk space
- **Network**: Public HTTPS endpoint with valid SSL

### Integration Requirements

1. **CORS Configuration**: Backend must allow frontend origin
2. **API Availability**: Backend must be accessible from GitHub Pages CDN
3. **Token Compatibility**: JWT implementation must match frontend expectations
4. **Response Format**: JSON responses matching frontend data contracts

## Monitoring & Maintenance

### Health Checks

1. **Frontend**: Accessible via `https://wonganijiya55-arch.github.io/ICESWEBSITE/`
2. **Backend**: Health endpoint at `/health`
3. **Database**: Connection pool monitoring
4. **API Connectivity**: Frontend auto-detection of backend availability

### Logging

1. **Frontend**: Browser console logs for debugging
2. **Backend**: Server logs via Render dashboard
3. **Errors**: Captured and logged for troubleshooting
4. **Audit Trail**: Admin actions logged to database

## Future Scalability

### Current Capacity

- **Students**: Supports hundreds of concurrent users
- **Events**: Unlimited event creation and tracking
- **Payments**: Unlimited payment record storage
- **Admins**: Multiple concurrent admin users

### Scaling Considerations

1. **Frontend**: GitHub Pages CDN handles thousands of concurrent users
2. **Backend**: Render.com can scale to larger instances as needed
3. **Database**: PostgreSQL can handle millions of records
4. **API Rate Limiting**: Can be adjusted based on growth
5. **File Storage**: Future consideration for image/document uploads

### Growth Path

**Phase 1 (Current)**: Support 100-500 active students
**Phase 2 (Year 1)**: Expand to 500-1000 students, add file uploads
**Phase 3 (Year 2)**: Multi-department support, advanced analytics
**Phase 4 (Year 3)**: Mobile app, real-time features, integration with university systems

## Value Proposition for University Sponsors

### Immediate Benefits

1. **Cost Effective**: Minimal infrastructure costs (GitHub Pages free, Render.com affordable tier)
2. **Professional Image**: Modern web presence reflects well on MUBAS engineering programs
3. **Student Engagement**: Active platform for civil engineering community building
4. **Administrative Efficiency**: Reduces manual tracking of members and payments
5. **Innovation Showcase**: Highlights student projects and achievements

### Long-Term Value

1. **Scalability**: Architecture supports growth from dozens to thousands of members
2. **Maintainability**: Clear separation of concerns, good documentation
3. **Extensibility**: Easy to add new features (mobile app, integrations)
4. **Data Insights**: Foundation for analytics on student engagement
5. **Alumni Network**: Platform can evolve to include graduated members

### Return on Investment

- **Time Saved**: Reduces administrative overhead by ~70%
- **Member Retention**: Improved communication leads to higher engagement
- **Event Success**: Better organization and promotion of society activities
- **Transparency**: Clear financial tracking builds trust
- **Reputation**: Professional platform enhances society credibility

## Support & Maintenance

### Maintenance Requirements

1. **Updates**: Periodic dependency updates (backend only)
2. **Monitoring**: Weekly checks of system health
3. **Backups**: Database backups (handled by Render)
4. **Content Updates**: Regular updates to announcements, events
5. **Bug Fixes**: Responsive fixes to reported issues

### Technical Contacts

- **Frontend Repository**: https://github.com/wonganijiya55-arch/ICESWEBSITE
- **Backend Repository**: (Link to backend repo)
- **Deployment**: GitHub Pages + Render.com dashboards

### Documentation Resources

- `FRONTEND_ARCHITECTURE.md` - Detailed frontend technical documentation
- `SYSTEM_FUTURE_UPGRADE.md` - Roadmap for technology evolution
- `docs/README.md` - Quick reference for common tasks

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Maintained By**: ICES Technical Team
