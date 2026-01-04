# Identity Service

Centralized authentication and identity management service for multiple applications and microservices.

## 📋 Overview

The **Identity Service** is a central authentication service that allows multiple applications to share the same user system while maintaining context isolation and permissions per application.

### Core Concept

> **Identity is global, access is contextual per application**

The same user can exist across multiple applications, but each application has its own context of information and specific tokens.

## 🔄 How It Works

### Authentication Flow

1. **Login**: User logs in (email/password or Google OAuth)
   - Identity Service creates an **access token** (JWT signed with RSA private key)
   - Identity Service creates a **refresh token** (JWT signed with RSA private key)
   - Refresh token is sent as HTTP-only cookie
   - Access token is returned in the JSON response

2. **Token Usage**: External systems or gateways receive the access token
   - Validate the token using the corresponding **RSA public key**
   - Check if the token hasn't expired and if the `aud` (audience) matches the application's `clientId`
   - Extract user information (`sub`, `email`, etc.) from the token payload

3. **Renewal**: When the access token expires (30 minutes)
   - Client system calls the `/auth/refresh` endpoint
   - Sends the current access token in the `Authorization` header
   - Sends the refresh token in the cookie
   - Identity Service validates both and returns a new access token
   - Refresh token remains valid for 3 days

### Technical Features

- **JWT Tokens with RSA (RS256)**: Signed with private key, validated with public key
- **Application-specific tokens**: Each token contains the `aud` (audience) with the application's `clientId`
- **Distributed validation**: External systems can validate tokens locally using the public key, without needing to query the Identity Service
- **Secure refresh token**: Stored as HTTP-only cookie and also in the database (hash)

### Required Environment Variables

```env
# JWT Access Token - RSA Keys
JWT_ACCESS_TOKEN_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE

# JWT Refresh Token - RSA Keys
JWT_REFRESH_TOKEN_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----
JWT_REFRESH_TOKEN_PUBLIC_KEY=-----BEGIN RSA PUBLIC KEY-----\n...\n-----END RSA PUBLIC KEY-----

# MongoDB
MONGO_URI=mongodb://localhost:27017

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Admin
ADMIN_PASS_KEY=your-admin-pass-key-here
```

**⚠️ Important:**

- Private keys are used only in Identity Service to **sign** tokens
- Public keys are used to **validate** tokens (Identity Service and external systems)
- External systems need public keys to validate tokens - share them securely

---

## 📚 Integration

### Important Concepts

Each application using the Identity Service needs to have:

- `clientId`: Unique identifier used in the `x-client-id` header
- `clientSecret`: Secret used for validation (managed internally)
- `isActive`: Application activation status

**All requests** must include the headers:

```http
x-client-id: your-client-id-here
x-client-secret: your-client-secret-here
```

**⚠️ Important about `clientSecret`:**

- Never expose the `clientSecret` in the frontend or in public code
- Use only in secure server-side environments
- For frontend applications, use a backend proxy to protect the `clientSecret`

---

## 🔐 Main Endpoints

- `POST /auth/signup` - Create new user
- `POST /auth/login` - Login with email/password
- `POST /auth/login/google` - Login with Google OAuth
- `POST /auth/refresh` - Renew access token
- `POST /auth/logout` - Invalidate refresh token

**All requests** must include the `x-client-id` and `x-client-secret` headers.

**Login Response:**

- `accessToken`: Returned in the JSON response
- `refreshToken`: Automatically sent as HTTP-only cookie (does not appear in JSON)

---

## 🔑 JWT Token Structure

### Access Token

The access token is a JWT containing the following claims:

```json
{
  "sub": "507f1f77bcf86cd799439011", // User ID
  "email": "john@example.com", // User email
  "aud": "your-client-id", // Application clientId (IMPORTANT!)
  "iat": 1705312800, // Issued at (timestamp)
  "exp": 1705314600 // Expiration (timestamp)
}
```

**Properties:**

- **Validity:** 30 minutes
- **Format:** JWT (JSON Web Token)
- **Algorithm:** RS256 (RSA SHA-256)
- **Key Type:** Asymmetric (RSA) - Public key required for validation

**⚠️ Critical Claim: `aud` (Audience)**

The `aud` field contains the `clientId` of the Application that requested the token. This field is **essential** for validation in microservices:

- Tokens are **application-specific**
- A token issued for Application A **cannot** be used in Application B
- Microservices must validate that `aud === your-client-id`

### Refresh Token

The refresh token is also a JWT, but with a simpler structure:

```json
{
  "sub": "507f1f77bcf86cd799439011", // User ID
  "aud": "your-client-id", // Application clientId
  "iat": 1705312800, // Issued at
  "exp": 1705406400 // Expiration (3 days)
}
```

**Properties:**

- **Validity:** 3 days
- **Storage:** Database (hash) + HTTP-only Cookie
- **Usage:** Only for renewing access tokens

---

## 🛡️ Token Validation in External Systems

When an external system or gateway receives an access token, it must validate:

1. **Basic JWT validation**: Verify signature using RSA public key
2. **`aud` validation**: Verify that `aud` matches the application's `clientId`
3. **Expiration validation**: Verify that the token hasn't expired
4. **Header validation**: Verify that the `x-client-id` header matches the token's `aud`

**Validation example:**

```typescript
// Use the PUBLIC key (not private) to verify tokens
const publicKey = process.env.JWT_ACCESS_TOKEN_PUBLIC_KEY?.replace(
  /\\n/g,
  '\n',
);
const payload = jwt.verify(token, publicKey, {
  algorithms: ['RS256'],
});

// Validate audience (CRITICAL!)
if (payload.aud !== process.env.MY_CLIENT_ID) {
  throw new UnauthorizedException('Invalid token audience');
}

// Validate x-client-id header
const clientIdFromHeader = request.headers['x-client-id'];
if (payload.aud !== clientIdFromHeader) {
  throw new UnauthorizedException('Token audience does not match header');
}
```

**Why is this important?**

- Prevents token reuse between services
- Ensures permission isolation
- Prevents context leakage between applications

---

## 🔄 Complete Authentication Flow

### 1. Login

```
Client → POST /auth/login
   ↓
Identity Service validates credentials
   ↓
Returns accessToken (JSON) + refreshToken (HTTP-only Cookie)
   ↓
Client saves accessToken and uses it in authenticated requests
```

### 2. Token Usage

```
Client sends accessToken in Authorization: Bearer <token> header
   ↓
System/Gateway validates token using RSA public key
   ↓
Checks expiration and audience (aud)
   ↓
Allows access if valid
```

### 3. Token Renewal

```
Access token is about to expire (e.g., 5 min remaining)
   ↓
Client → POST /auth/refresh
   (with current accessToken + refreshToken in cookie)
   ↓
Identity Service validates refreshToken and generates new accessToken
   ↓
Client receives new accessToken and updates storage
```

### 4. Logout

```
Client → POST /auth/logout
   (with accessToken in Authorization header)
   ↓
Identity Service removes refreshToken from database
   ↓
Next refresh attempt will fail
```

---

## ⚠️ Best Practices

### Security

- Never expose the `clientSecret` in the frontend
- Use HTTPS in production
- Always validate `aud` in microservices
- Implement automatic renewal before token expires

### Error Handling

- **401 Unauthorized:** Invalid/expired token → Try refresh or redirect to login
- **403 Forbidden:** User blocked or application inactive → Redirect to login
- **409 Conflict:** User already exists → Show appropriate message or login

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
