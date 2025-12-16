# 🚀 Quick Start Guide - OTP Password Reset

## ⚡ 60-Second Setup

### 1. Configure Email (`.env` file)
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
PORT=5000
```

### 2. Start Server
```bash
cd backend
npm start
```

### 3. Open in Browser
```
http://localhost:5000/docs/forgot-password.html
```

---

## 📋 Quick Reference

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/password-reset/request-otp` | POST | Send OTP |
| `/api/password-reset/verify-otp` | POST | Verify OTP |
| `/api/password-reset/reset-password` | POST | Reset Password |

### Flow
```
Email → OTP → New Password → Done ✅
```

### Timings
- **OTP Expiry**: 10 minutes
- **Resend Cooldown**: 60 seconds
- **Max Attempts**: 5 tries

### Security
- ✅ Bcrypt hashing
- ✅ Token-based auth
- ✅ Rate limiting
- ✅ Auto cleanup
- ✅ No email enumeration

---

## 🎯 Testing in 3 Steps

1. **Request OTP**
   - Enter email
   - Click "Send OTP"
   - Check inbox

2. **Verify OTP**
   - Enter 6-digit code
   - Click "Verify OTP"

3. **Reset Password**
   - Enter new password
   - Confirm password
   - Click "Reset Password"

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| No email received | Check spam, verify `.env` credentials |
| Invalid OTP | Check expiry, verify correct code |
| Server error | Check backend console logs |
| Frontend error | Open browser console (F12) |

---

## 📁 Key Files

```
backend/
├── routes/passwordResetOTP.js    ← Main backend logic
├── utils/sendEmail.js            ← Email sender
└── server.js                     ← Route registration

docs/
└── forgot-password.html          ← Complete UI
```

---

## 🎨 UI Preview

**Step 1**: Email Input  
**Step 2**: 6-Digit OTP Entry  
**Step 3**: New Password Form  

**Features**: Beautiful animations, auto-focus, paste support, real-time validation

---

## 📞 Support

- **Full Guide**: `PASSWORD_RESET_OTP_GUIDE.md`
- **Test Guide**: `test-password-reset.js`
- **Summary**: `OTP_IMPLEMENTATION_SUMMARY.md`

---

## ✅ Checklist

- [ ] Email configured in `.env`
- [ ] Server running on port 5000
- [ ] Database has test user
- [ ] Tested complete flow
- [ ] Verified email delivery
- [ ] Checked all 3 steps work

---

**Status**: Production Ready 🚀  
**Last Updated**: Nov 10, 2025
