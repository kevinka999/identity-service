# How to Integrate with Identity Service

Quick guide for third-party systems that want to use the authentication service.

---

## 📋 What You Need to Know

### Core Concept

The Identity Service provides **centralized authentication** for multiple applications. Each application has its own context, but shares the same user base.

**Golden rule:** Identity is global, access is contextual per application.

### What You NEED to Have

✅ **A valid `clientId`** - Provided by the Identity Service team  
✅ **A valid `clientSecret`** - Provided by the Identity Service team  
✅ **HTTP cookie support** - To automatically receive the refresh token  
✅ **Ability to send HTTP headers** - Especially `x-client-id` and `x-client-secret`

**⚠️ Important about `clientSecret`:**

- The `clientSecret` is a sensitive credential and must be kept secure
- **Never expose the `clientSecret`** in the frontend or in public client code
- Use only in secure server-side environments
- For frontend applications, consider using a backend proxy to protect the `clientSecret`

### What You DON'T Need

❌ **Don't need** to manually manage refresh tokens (comes as cookie)  
❌ **Don't need** to implement password hashing logic  
❌ **Don't need** to create user tables - Everything is managed by Identity Service

---

## 🚀 Quick Start

### 1. Get Your Credentials

Contact the Identity Service team to obtain:

- Your unique `clientId`
- Your `clientSecret` (keep it secure!)
- The API base URL (e.g., `https://auth.example.com`)

### 2. Configure Required Headers

**All requests** must include:

```http
x-client-id: your-client-id-here
x-client-secret: your-client-secret-here
```

Without these headers, all requests will return `401 Unauthorized`.

### 3. Available Endpoints

```
POST /auth/signup      - Create new user
POST /auth/login       - Login with email/password
POST /auth/login/google - Login with Google OAuth
POST /auth/refresh     - Renew access token
POST /auth/logout      - Logout
```

---

## 📝 Step-by-Step Integration

### Step 1: Create User (Signup)

**When to use:** First time a user registers in your application.

**Request:**

```http
POST /auth/signup
Headers:
  Content-Type: application/json
  x-client-id: your-client-id
  x-client-secret: your-client-secret

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "emailVerified": false,
  "applications": [...],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**What happens:**

- If email already exists but is not in your application → user is automatically associated
- If email already exists in your application → error `409 Conflict`
- If it's a new email → user is created and associated with your application

**What you need to do:**

- Store the user `id` (optional, for reference)
- Redirect to login after successful signup

---

### Step 2: Login

**When to use:** User already has an account and wants to login.

**Request:**

```http
POST /auth/login
Headers:
  Content-Type: application/json
  x-client-id: your-client-id
  x-client-secret: your-client-secret

Body:
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Important:**

- The `refreshToken` comes automatically as an **HTTP-only cookie**
- You **don't need** to do anything with the cookie, the browser manages it automatically
- Just save the `accessToken` to use in authenticated requests

**What you need to do:**

- Save the `accessToken` (localStorage, sessionStorage, or memory)
- Use the `accessToken` in the `Authorization: Bearer <token>` header in authenticated requests
- Configure `credentials: 'include'` in fetch requests to send/receive cookies

---

### Step 3: Use the Access Token

**When to use:** In all requests that need authentication.

**How to send:**

```http
GET /your-api/protected-endpoint
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  x-client-id: your-client-id
  x-client-secret: your-client-secret
```

**Token validity:**

- Access token expires in **30 minutes**
- You need to renew it before it expires using the refresh token

**What you need to do:**

- Intercept HTTP requests to automatically add the token
- Detect when the token expires (401 error)
- Call the refresh endpoint when necessary

---

### Step 4: Renew Token (Refresh)

**When to use:** When the access token expires or is about to expire.

**Request:**

```http
POST /auth/refresh
Headers:
  Authorization: Bearer <current-access-token>
  x-client-id: your-client-id
  x-client-secret: your-client-secret
  Cookie: refreshToken=... (sent automatically by browser)
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Important:**

- The refresh token is in the cookie (managed automatically by the browser)
- You only need to send the current access token in the `Authorization` header
- The refresh token **is not renewed**, it remains valid for 3 days

**What you need to do:**

- Implement automatic refresh when receiving 401 error
- Update the saved access token with the new token received
- If refresh fails → redirect to login screen

**Logic example:**

```typescript
// Pseudocode
try {
  const response = await fetch('/your-api/protected', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) {
    // Token expired, try refresh
    const newToken = await refreshToken(accessToken);
    // Try again with new token
    return fetch('/your-api/protected', {
      headers: { Authorization: `Bearer ${newToken}` },
    });
  }
} catch (error) {
  // Refresh failed, redirect to login
  redirectToLogin();
}
```

---

### Step 5: Logout

**When to use:** When the user wants to exit the application.

**Request:**

```http
POST /auth/logout
Headers:
  Authorization: Bearer <access-token>
  x-client-id: your-client-id
  x-client-secret: your-client-secret
```

**Response:**

```json
{
  "message": "Logout realizado com sucesso"
}
```

**What happens:**

- The refresh token is removed from the database
- The current access token remains valid until it expires (but cannot be renewed)
- Next refresh attempt will fail

**What you need to do:**

- Remove the access token from local storage
- Clear any authentication state in your application
- Redirect to login screen

---

## 🔑 Understanding Tokens

### Access Token

**What it is:** JWT that proves the user is authenticated

**Where to use:** In all authenticated requests

**How to send:**

```http
Authorization: Bearer <access-token>
```

**Validity:** 30 minutes

**Structure (decoded):**

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "aud": "your-client-id",
  "iat": 1234567890,
  "exp": 1234570000
}
```

**⚠️ Important:** The `aud` field contains your `clientId`. Microservices must validate that `aud === your-client-id`.

### Refresh Token

**What it is:** Token used to renew the access token

**Where it is:** HTTP-only cookie (managed automatically)

**What you need to do:** Nothing! The browser manages it automatically.

**Validity:** 3 days

**When to use:** Automatically when the access token expires

---

## 🎯 Common Use Cases

### Case 1: Web Frontend Application

**What you need:**

- JavaScript/TypeScript
- Ability to make HTTP requests (fetch/axios)
- Cookie support (modern browser)

**Flow:**

1. User fills signup form → `POST /auth/signup`
2. User logs in → `POST /auth/login` → save `accessToken`
3. In each authenticated request → add `Authorization: Bearer <token>`
4. When token expires → `POST /auth/refresh` → update token
5. User logs out → `POST /auth/logout` → clear local token

**Minimal example:**

```typescript
// ⚠️ WARNING: This example exposes clientSecret in frontend!
// In production, use a backend proxy to protect clientSecret
const CLIENT_ID = 'your-client-id';
const CLIENT_SECRET = 'your-client-secret'; // ⚠️ NEVER expose in frontend!

// Login
const login = async (email: string, password: string) => {
  const res = await fetch('https://auth.example.com/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CLIENT_ID,
      'x-client-secret': CLIENT_SECRET, // ⚠️ Use backend proxy in production!
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({ email, password }),
  });

  const { accessToken } = await res.json();
  localStorage.setItem('accessToken', accessToken);
};

// Authenticated request
const fetchProtected = async () => {
  const token = localStorage.getItem('accessToken');

  const res = await fetch('https://api.example.com/protected', {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-client-id': CLIENT_ID,
      'x-client-secret': CLIENT_SECRET, // ⚠️ Use backend proxy in production!
    },
    credentials: 'include',
  });

  if (res.status === 401) {
    // Token expired, refresh
    await refreshToken();
    // Try again...
  }

  return res.json();
};
```

### Case 2: Backend Microservice

**What you need:**

- JWT library (e.g., `jsonwebtoken` for Node.js)
- The `ACCESS_TOKEN_SECRET` (provided by the team)
- Your `clientId` for validation

**Flow:**

1. Receive request with `Authorization: Bearer <token>`
2. Validate JWT signature using `ACCESS_TOKEN_SECRET`
3. Check expiration (`exp`)
4. **Validate `aud` === your `clientId`** (CRITICAL!)
5. Extract `sub` (user ID) and use in logic

**Minimal example (Node.js/NestJS):**

```typescript
import { JwtService } from '@nestjs/jwt';

// Validate token
const payload = await jwtService.verifyAsync(token, {
  secret: process.env.ACCESS_TOKEN_SECRET,
});

// Validate audience (CRITICAL!)
if (payload.aud !== process.env.MY_CLIENT_ID) {
  throw new UnauthorizedException('Invalid token audience');
}

// Use user ID
const userId = payload.sub;
```

### Case 3: Mobile Application

**What you need:**

- HTTP client (e.g., axios, fetch)
- Cookie manager or local storage

**Differences:**

- Cookies may not work automatically
- You may need to manage the refresh token manually
- Consider using Secure Storage for tokens

**Flow similar to web frontend, but:**

- Save refresh token manually (if no cookie support)
- Send refresh token in body or custom header (if necessary)

---

## ⚠️ What You DON'T Need to Do

### ❌ Don't need:

1. **Manage refresh tokens manually** - Comes as HTTP-only cookie
2. **Validate passwords on your side** - Identity Service does this
3. **Hash passwords** - Identity Service manages this
4. **Create user tables** - Everything is managed by Identity Service
5. **Manage sessions** - Tokens are stateless
6. **Implement OAuth from scratch** - Identity Service already handles Google login
7. **Worry about multiple users** - Identity Service manages isolation

### ✅ You only need:

1. **Send HTTP requests** with correct headers
2. **Save the access token** and use it in requests
3. **Refresh** when the token expires
4. **Validate `aud`** if you are a backend microservice

---

## 🔒 Security - What You MUST Do

### ✅ Mandatory:

1. **Always validate `aud` in microservices**

   ```typescript
   if (payload.aud !== myClientId) {
     throw new UnauthorizedException();
   }
   ```

2. **Use HTTPS in production**
   - Tokens and cookies must only travel over HTTPS

3. **Protect the `clientSecret`**
   - The `clientSecret` must be sent in the `x-client-secret` header in all requests
   - **Never expose the `clientSecret`** in the frontend or in public client code
   - For frontend applications, use a backend proxy to protect the `clientSecret`
   - Store the `clientSecret` in secure environment variables

4. **Implement automatic refresh**
   - Don't let the user see token expired errors

### ⚠️ Recommended:

1. **Don't store tokens in localStorage** (if possible)
   - Prefer httpOnly cookies (but this requires backend proxy)

2. **Implement session timeout**
   - After X minutes of inactivity, logout

3. **Validate `x-client-id` header**
   - In microservices, always verify that the header matches `aud`

---

## 📊 Request Summary

### Endpoints Table

| Endpoint             | Method | Auth Required?        | Cookie Required?       |
| -------------------- | ------ | --------------------- | ---------------------- |
| `/auth/signup`       | POST   | ❌ No                 | ❌ No                  |
| `/auth/login`        | POST   | ❌ No                 | ❌ No (receives)       |
| `/auth/login/google` | POST   | ❌ No                 | ❌ No (receives)       |
| `/auth/refresh`      | POST   | ✅ Yes (access token) | ✅ Yes (refresh token) |
| `/auth/logout`       | POST   | ✅ Yes (access token) | ❌ No                  |

### Required Headers

| Header                           | When to Use         | Required? |
| -------------------------------- | ------------------- | --------- |
| `x-client-id`                    | All requests        | ✅ Yes    |
| `x-client-secret`                | All requests        | ✅ Yes    |
| `Content-Type: application/json` | POST with body      | ✅ Yes    |
| `Authorization: Bearer <token>`  | Protected endpoints | ✅ Yes    |

**⚠️ Important:** The `x-client-secret` is required in all requests. Never expose the `clientSecret` in the frontend - use a backend proxy for frontend applications.

---

## 🐛 Common Error Handling

### 401 Unauthorized

**Possible causes:**

- Token expired → Refresh
- Invalid token → Redirect to login
- `x-client-id` missing or invalid → Check header
- Invalid credentials (login) → Show error to user

**Action:**

```typescript
if (error.status === 401) {
  // Try refresh if have refresh token
  try {
    const newToken = await refreshToken();
    // Retry request
  } catch {
    // Refresh failed, logout
    redirectToLogin();
  }
}
```

### 403 Forbidden

**Possible causes:**

- User blocked in application
- Application inactive

**Action:** Redirect to login and show appropriate message

### 409 Conflict

**Possible causes:**

- Signup attempt with email already existing in application

**Action:** Suggest login instead of signup

---

## 📞 Next Steps

1. **Get your `clientId`** - Contact the team
2. **Configure environment variables** - API URL and `clientId`
3. **Implement authentication flow** - Signup → Login → Refresh → Logout
4. **Test integration** - Use Swagger UI in development (`/api`)
5. **Implement error handling** - 401, 403, 409

---

## 💡 Final Tips

- **Development:** Use Swagger UI (`/api`) to test endpoints
- **Production:** Always use HTTPS
- **Tokens:** Access tokens are short (30min) for security
- **Refresh:** Implement proactive refresh (5min before expiring)
- **Logs:** Don't log complete tokens in production

---

## 📚 Additional Resources

- **Complete documentation:** See `README.md` for technical details
- **Swagger UI:** Available at `/api` when `NODE_ENV=development`
- **Support:** Contact the team for questions

---

**Last updated:** January 2024
