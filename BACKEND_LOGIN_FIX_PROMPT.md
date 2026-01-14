# Backend Login Issue - Fix Required

## Problem Summary
Admins are being redirected to the student dashboard instead of the admin dashboard after login. This happens because:
1. The backend may be checking the `students` table before the `admins` table during login
2. If an admin's email exists in both tables, they are authenticated as a student
3. The role returned by the backend determines the frontend redirection

## Current Frontend Behavior

### Registration Flow
- **Endpoint**: `POST /api/auth/register`
- **Payload Sent**:
  ```json
  {
    "name": "User Full Name",
    "email": "user@example.com",
    "password": "userpassword",
    "year": 1,
    "reg_number": "REG12345",
    "role": "admin"  // or "student"
  }
  ```
- **Frontend sends the `role` field explicitly** - the backend must use this to determine which table to insert into

### Login Flow
- **Endpoint**: `POST /api/auth/login` (also tries `/api/login` and `/api/auth/login` as fallbacks)
- **Payload Sent**:
  ```json
  {
    "email": "user@example.com",
    "password": "userpassword"
  }
  ```
- **Expected Response**:
  ```json
  {
    "token": "JWT_TOKEN_HERE",
    "role": "admin",  // CRITICAL: Must be "admin" or "student"
    "user": {
      "id": 123,
      "name": "User Full Name",
      "email": "user@example.com"
    },
    "message": "Login successful"
  }
  ```

### Frontend Redirection Logic
After successful login, the frontend:
1. Saves the JWT token
2. Stores user data in `localStorage` including the `role`
3. **Redirects based on `data.role`**:
   - If `data.role === 'admin'` → redirect to `admin.html`
   - If `data.role === 'student'` → redirect to `students.html`
   - Otherwise → show error

## Required Backend Fixes

### 1. Registration Endpoint (`/api/auth/register`)
**MUST** handle the `role` field from the request body:
- If `role === "admin"` → Insert ONLY into the `admins` table
- If `role === "student"` → Insert ONLY into the `students` table
- **NEVER** insert the same email into both tables
- Return appropriate success message

**Example Backend Logic**:
```javascript
// Pseudocode
if (req.body.role === 'admin') {
  // Insert into admins table
  await db.admins.create({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    year: req.body.year,
    reg_number: req.body.reg_number
  });
} else {
  // Insert into students table
  await db.students.create({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    year: req.body.year,
    reg_number: req.body.reg_number
  });
}
```

### 2. Login Endpoint (`/api/auth/login`)
**CRITICAL FIX**: Check the `admins` table FIRST, then the `students` table.

**Current (WRONG) Logic**:
```javascript
// BAD: Checks students first
let user = await db.students.findByEmail(email);
if (!user) {
  user = await db.admins.findByEmail(email);
}
```

**Required (CORRECT) Logic**:
```javascript
// GOOD: Check admins first, prioritizing admin role
let user = await db.admins.findByEmail(email);
let role = 'admin';

if (!user) {
  user = await db.students.findByEmail(email);
  role = 'student';
}

if (!user) {
  return res.status(401).json({ error: 'Invalid credentials' });
}

// Verify password
const isValid = await bcrypt.compare(password, user.password);
if (!isValid) {
  return res.status(401).json({ error: 'Invalid credentials' });
}

// Generate JWT token
const token = jwt.sign({ id: user.id, role: role }, JWT_SECRET);

// IMPORTANT: Return the role in the response
return res.json({
  token: token,
  role: role,  // MUST include this
  user: {
    id: user.id,
    name: user.name,
    email: user.email
  },
  message: 'Login successful'
});
```

### 3. Database Constraint (Recommended)
Add a **UNIQUE constraint** on the email field in both tables to prevent the same email from being registered in both `students` and `admins` tables:

```sql
-- For students table
ALTER TABLE students ADD UNIQUE (email);

-- For admins table
ALTER TABLE admins ADD UNIQUE (email);
```

If an email already exists in one table, registration in the other table should fail with an appropriate error message.

### 4. Data Cleanup (If Needed)
If there are already duplicate emails in both tables, you need to:
1. Identify all emails that exist in both tables
2. Decide which role each user should have
3. Remove the duplicate entries from the incorrect table

**Query to find duplicates**:
```sql
SELECT email FROM students 
WHERE email IN (SELECT email FROM admins);
```

## Testing Checklist
After implementing these fixes, test:
- [ ] Register a new admin → should be added ONLY to `admins` table
- [ ] Register a new student → should be added ONLY to `students` table
- [ ] Login as admin → should return `role: "admin"` and redirect to admin dashboard
- [ ] Login as student → should return `role: "student"` and redirect to student dashboard
- [ ] Attempt to register same email twice (once as admin, once as student) → should fail with error

## Summary
**The backend MUST**:
1. Use the `role` field from registration to insert into the correct table
2. Check the `admins` table FIRST during login
3. Return the correct `role` field in the login response
4. Prevent duplicate emails across both tables
