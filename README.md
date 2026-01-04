# Identity Service

Centralized authentication and identity service for multiple applications and microservices.

## 📋 Overview

The **Identity Service** provides centralized authentication and identity management, allowing multiple applications to share the same user system while maintaining context isolation and permissions per application.

### Core Concept

> **Identity is global, access is contextual per application**

The same user can exist across multiple applications, but each application has its own context of information and specific tokens.

### Key Features

- ✅ **Global and unique** user in the system
- ✅ Support for authentication via **email/password** and **OAuth (Google)**
- ✅ **Application-specific** tokens (JWT with `aud` claim)
- ✅ Isolation of permissions and context between applications
- ✅ Refresh tokens linked to `(user + application)`
- ✅ Session control per application

---

## 🚀 Setup and Installation

### Prerequisites

- Node.js (version 18 or higher)
- pnpm (or npm/yarn)
- MongoDB (version 5.0 or higher)

### Installation

```bash
# Install dependencies
pnpm install

# Configure environment variables (see section below)
cp .env.example .env

# Run in development mode
pnpm run start:dev
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017

# JWT Secrets
ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-here
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-here

# Google OAuth (optional, only needed if using Google login)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Admin
ADMIN_PASS_KEY=your-admin-pass-key-here
```

**⚠️ Important:** 
- Use secure and random keys for JWT secrets in production
- Never commit the `.env` file to the repository
- In production, use system environment variables or a secrets manager

---

## 📚 Integration Guide

This guide explains how third-party systems should integrate with the Identity Service.

### Important Concepts

#### Application (Auth Service Client)

An **Application** represents who consumes the authentication service. It can be:
- A web frontend application
- A backend microservice
- Any service that needs to authenticate users

Each Application has:
- `clientId`: Unique identifier used in the `x-client-id` header
- `clientSecret`: Secret used for validation (managed internally)
- `isActive`: Application activation status

#### Application Identification

**All requests** must include the following headers with your Application credentials:

```http
x-client-id: your-client-id-here
x-client-secret: your-client-secret-here
```

Without these headers, the request will be rejected with status `401 Unauthorized`.

**⚠️ Important about `clientSecret`:**
- The `clientSecret` is a sensitive credential and must be kept secure
- **Never expose the `clientSecret`** in the frontend or in public client code
- Use only in secure server-side environments
- For frontend applications, consider using a backend proxy to protect the `clientSecret`

---

## 🔐 Authentication Endpoints

### Base URL

```
http://localhost:3000/auth
```

In production, replace with your server URL.

---

### 1. Create User (Signup)

Creates a new user in the system and associates them with your Application.

**Endpoint:** `POST /auth/signup`

**Headers:**
```http
Content-Type: application/json
x-client-id: your-client-id
x-client-secret: your-client-secret
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Validations:**
- `name`: Required, minimum 1 character
- `email`: Required, must be a valid email
- `password`: Required, minimum 6 characters

**Success Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "emailVerified": false,
  "applications": [
    {
      "applicationId": "507f191e810c19729de860ea",
      "role": "user",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Special Behaviors:**

1. **User already exists but is not associated with the Application:**
   - The user is automatically associated with your Application
   - If the user doesn't have a local password, it is added
   - Returns the updated user data

2. **User already exists and is already associated with the Application:**
   - Returns error `409 Conflict`:
   ```json
   {
     "statusCode": 409,
     "message": "User already exists and is associated with this application"
   }
   ```

**Request Example (cURL):**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -H "x-client-id: your-client-id" \
  -H "x-client-secret: your-client-secret" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

---

### 2. Login (Email/Password)

Authenticates an existing user and returns access tokens.

**Endpoint:** `POST /auth/login`

**Headers:**
```http
Content-Type: application/json
x-client-id: your-client-id
x-client-secret: your-client-secret
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Validations:**
- `email`: Required
- `password`: Required

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Important about Refresh Token:**
The `refreshToken` is automatically sent as an **HTTP-only cookie** named `refreshToken`. It does not appear in the JSON response body for security reasons.

**Cookie Properties:**
- Name: `refreshToken`
- `httpOnly: true` (not accessible via JavaScript)
- `secure: true` (HTTPS only in production)
- `sameSite: 'lax'` (CSRF protection)
- Validity: 24 hours

**Possible Errors:**

1. **Invalid credentials (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

2. **User not associated with Application (401):**
```json
{
  "statusCode": 401,
  "message": "User is not associated with this application"
}
```

3. **User blocked (401):**
```json
{
  "statusCode": 401,
  "message": "User is blocked in this application"
}
```

**Request Example (cURL):**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -H "x-client-id: your-client-id" \
  -H "x-client-secret: your-client-secret" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }' \
  -c cookies.txt
```

**Note:** The `-c cookies.txt` flag saves the received cookies for later use.

---

### 3. Login with Google (OAuth)

Authenticates a user using Google credentials.

**Endpoint:** `POST /auth/login/google`

**Headers:**
```http
Content-Type: application/json
x-client-id: your-client-id
x-client-secret: your-client-secret
```

**Body:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
}
```

The `credential` is the ID token returned by Google Sign-In on the frontend.

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Behavior:**
- If the user doesn't exist, they are created automatically
- If the user exists but is not associated with the Application, they are associated
- The Google email is automatically verified (`emailVerified: true`)
- The `refreshToken` is sent as a cookie (same behavior as normal login)

**Request Example (cURL):**
```bash
curl -X POST http://localhost:3000/auth/login/google \
  -H "Content-Type: application/json" \
  -H "x-client-id: your-client-id" \
  -H "x-client-secret: your-client-secret" \
  -d '{
    "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
  }' \
  -c cookies.txt
```

---

### 4. Refresh Token

Renews the access token using the stored refresh token.

**Endpoint:** `POST /auth/refresh`

**Headers:**
```http
x-client-id: your-client-id
x-client-secret: your-client-secret
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Important:**
- The refresh token must be sent as a **cookie** (not in body or header)
- The current access token must be sent in the `Authorization: Bearer <token>` header
- The `x-client-id` must match the token's `aud`

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Note:** The refresh token **is not renewed** in this operation. It remains valid until it expires (3 days) or is invalidated via logout.

**Possible Errors:**

1. **Refresh token not found (401):**
```json
{
  "statusCode": 401,
  "message": "Refresh token not found"
}
```

2. **Refresh token expired (401):**
```json
{
  "statusCode": 401,
  "message": "Refresh token expired"
}
```

3. **Invalid refresh token (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid refresh token"
}
```

4. **User not active in Application (403):**
```json
{
  "statusCode": 403,
  "message": "User is not active in this application"
}
```

**Request Example (cURL):**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "x-client-id: your-client-id" \
  -H "x-client-secret: your-client-secret" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -b cookies.txt
```

**Note:** The `-b cookies.txt` flag sends the previously saved cookies.

---

### 5. Logout

Invalidates the user's refresh token in the current Application.

**Endpoint:** `POST /auth/logout`

**Headers:**
```http
x-client-id: your-client-id
x-client-secret: your-client-secret
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

**Behavior:**
- Removes the refresh token from the database for the `(user + application)` combination
- The current access token remains valid until it expires (not invalidated immediately)
- After logout, the user will no longer be able to refresh and will need to login again

**Request Example (cURL):**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "x-client-id: your-client-id" \
  -H "x-client-secret: your-client-secret" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔑 JWT Token Structure

### Access Token

The access token is a JWT containing the following claims:

```json
{
  "sub": "507f1f77bcf86cd799439011",  // User ID
  "email": "john@example.com",         // User email
  "aud": "your-client-id",               // Application clientId (IMPORTANT!)
  "iat": 1705312800,                   // Issued at (timestamp)
  "exp": 1705314600                    // Expiration (timestamp)
}
```

**Properties:**
- **Validity:** 30 minutes
- **Format:** JWT (JSON Web Token)
- **Algorithm:** HS256 (HMAC SHA-256)

**⚠️ Critical Claim: `aud` (Audience)**

The `aud` field contains the `clientId` of the Application that requested the token. This field is **essential** for validation in microservices:

- Tokens are **application-specific**
- A token issued for Application A **cannot** be used in Application B
- Microservices must validate that `aud === your-client-id`

### Refresh Token

The refresh token is also a JWT, but with a simpler structure:

```json
{
  "sub": "507f1f77bcf86cd799439011",  // User ID
  "aud": "your-client-id",              // Application clientId
  "iat": 1705312800,                   // Issued at
  "exp": 1705406400                    // Expiration (3 days)
}
```

**Properties:**
- **Validity:** 3 days
- **Storage:** Database (hash) + HTTP-only Cookie
- **Usage:** Only for renewing access tokens

---

## 🛡️ Token Validation in Microservices

When a microservice receives an access token, it must validate:

### 1. Basic JWT Validation

```typescript
// Pseudocode
const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);

// Check expiration
if (payload.exp < Date.now() / 1000) {
  throw new Error('Token expired');
}
```

### 2. Audience (`aud`) Validation

**⚠️ CRITICAL:** Always validate that `aud` matches your Application's `clientId`:

```typescript
// Pseudocode
const myClientId = process.env.MY_CLIENT_ID;

if (payload.aud !== myClientId) {
  throw new UnauthorizedException(
    'Token audience does not match this application'
  );
}
```

### 3. Issuer (`iss`) Validation - Optional

If you configure an issuer in the Identity Service, also validate:

```typescript
if (payload.iss !== 'identity-service') {
  throw new UnauthorizedException('Invalid token issuer');
}
```

### 4. `x-client-id` Header Validation

In addition to validating the token, always verify that the `x-client-id` header matches the `aud`:

```typescript
const clientIdFromHeader = request.headers['x-client-id'];

if (payload.aud !== clientIdFromHeader) {
  throw new UnauthorizedException(
    'Token audience does not match x-client-id header'
  );
}
```

**Why is this important?**
- Prevents token reuse between services
- Ensures permission isolation
- Prevents context leakage between applications

---

## 📝 Integration Examples

### Example: React/Next.js Frontend

```typescript
// services/auth.ts
const API_BASE_URL = 'http://localhost:3000';
const CLIENT_ID = 'your-client-id';
const CLIENT_SECRET = 'your-client-secret'; // ⚠️ Never expose in frontend!

export async function signup(name: string, email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CLIENT_ID,
      'x-client-secret': CLIENT_SECRET,
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CLIENT_ID,
      'x-client-secret': CLIENT_SECRET,
    },
    credentials: 'include', // Important for receiving cookies
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  
  // Save access token
  localStorage.setItem('accessToken', data.accessToken);
  
  return data;
}

export async function refreshToken(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'x-client-id': CLIENT_ID,
      'x-client-secret': CLIENT_SECRET,
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include', // Sends cookies automatically
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
  
  return data.accessToken;
}

export async function logout(accessToken: string) {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'x-client-id': CLIENT_ID,
      'x-client-secret': CLIENT_SECRET,
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  localStorage.removeItem('accessToken');
}
```

### Example: NestJS Backend (Microservice)

```typescript
// guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      });

      // Validate audience
      const myClientId = this.configService.get('MY_CLIENT_ID');
      if (payload.aud !== myClientId) {
        throw new UnauthorizedException('Invalid token audience');
      }

      // Validate x-client-id header
      const clientIdFromHeader = request.headers['x-client-id'];
      if (payload.aud !== clientIdFromHeader) {
        throw new UnauthorizedException('Token audience does not match header');
      }

      request.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

---

## 🔄 Complete Authentication Flow

### 1. First Access (New User)

```
1. Client → POST /auth/signup
   ↓
2. Identity Service creates user and associates with Application
   ↓
3. Client receives user data
   ↓
4. Client → POST /auth/login
   ↓
5. Identity Service returns accessToken (JSON) + refreshToken (Cookie)
   ↓
6. Client saves accessToken and uses it in authenticated requests
```

### 2. Login (Existing User)

```
1. Client → POST /auth/login
   ↓
2. Identity Service validates credentials
   ↓
3. Identity Service returns accessToken (JSON) + refreshToken (Cookie)
   ↓
4. Client saves accessToken
```

### 3. Token Renewal

```
1. Access token is about to expire (e.g., 5 min remaining)
   ↓
2. Client → POST /auth/refresh
   (with current accessToken + refreshToken in cookie)
   ↓
3. Identity Service validates refreshToken and generates new accessToken
   ↓
4. Client receives new accessToken and updates storage
```

### 4. Logout

```
1. Client → POST /auth/logout
   (with accessToken in Authorization header)
   ↓
2. Identity Service removes refreshToken from database
   ↓
3. Client removes accessToken from local storage
   ↓
4. Next refresh attempt will fail
```

---

## ⚠️ Best Practices and Considerations

### Security

1. **Never expose the `clientSecret`** in the frontend or in public client code
   - The `clientSecret` must be sent in the `x-client-secret` header in all requests
   - For frontend applications, use a backend proxy to protect the `clientSecret`
2. **Always use HTTPS** in production to protect tokens and cookies
3. **Always validate `aud`** in microservices
4. **Do not store tokens in localStorage** if possible (prefer httpOnly cookies)
5. **Implement automatic refresh** before the access token expires

### Performance

1. **Cache the access token** on the client (avoids unnecessary requests)
2. **Proactive refresh** (renew before expiring, e.g., 5 minutes before)
3. **Error handling** for refresh (redirect to login if necessary)

### Error Handling

Always handle the following scenarios:

- **401 Unauthorized:** Invalid/expired token → Try refresh or redirect to login
- **403 Forbidden:** User blocked or Application inactive → Redirect to login
- **409 Conflict:** User already exists → Show appropriate message or login

---

## 🧪 Testing the API

### Swagger UI (Development)

When `NODE_ENV=development`, the Swagger UI is available at:

```
http://localhost:3000/api
```

Use this interface to test endpoints interactively.

### cURL Examples

See each endpoint section above for complete cURL request examples.

---

## 📦 Available Scripts

```bash
# Development (watch mode)
pnpm run start:dev

# Production
pnpm run start:prod

# Build
pnpm run build

# Tests
pnpm run test
pnpm run test:e2e
pnpm run test:cov

# Linting
pnpm run lint
```

---

## 🏗️ Architecture

The project follows a clean architecture with separation of concerns:

```
src/
├── application/          # Use cases and controllers
│   └── usecases/
│       ├── auth/
│       │   ├── signup/
│       │   ├── login/
│       │   ├── refresh/
│       │   └── logout/
│       └── admin/
│           └── create-application/
├── domain/              # Entities and interfaces
│   ├── entities/
│   ├── repositories/
│   └── services/
└── infrastructure/      # Concrete implementations
    ├── auth/
    ├── database/
    ├── guards/
    └── repositories/
```

---

## 📄 License

This project is private and has no public license.

---

## 🤝 Support

For questions or integration issues, contact the development team.
