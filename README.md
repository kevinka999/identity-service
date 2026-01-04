# Identity Service

Serviço de autenticação e identidade centralizada para múltiplas aplicações e microsserviços.

## 📋 Visão Geral

O **Identity Service** fornece autenticação e gerenciamento de identidade centralizado, permitindo que múltiplas aplicações compartilhem o mesmo sistema de usuários enquanto mantêm isolamento de contexto e permissões por aplicação.

### Conceito Fundamental

> **Identidade é global, acesso é contextual por aplicação**

Um mesmo usuário pode existir em várias aplicações, mas cada aplicação tem seu próprio contexto de informação e tokens específicos.

### Principais Características

- ✅ Usuário **global e único** no sistema
- ✅ Suporte a autenticação via **email/senha** e **OAuth (Google)**
- ✅ Tokens **específicos por aplicação** (JWT com `aud` claim)
- ✅ Isolamento de permissões e contexto entre aplicações
- ✅ Refresh tokens vinculados a `(user + application)`
- ✅ Controle de sessão por aplicação

---

## 🚀 Configuração e Instalação

### Pré-requisitos

- Node.js (versão 18 ou superior)
- pnpm (ou npm/yarn)
- MongoDB (versão 5.0 ou superior)

### Instalação

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente (veja seção abaixo)
cp .env.example .env

# Executar em modo desenvolvimento
pnpm run start:dev
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Servidor
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017

# JWT Secrets
ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-here
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-here

# Google OAuth (opcional, necessário apenas se usar login com Google)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**⚠️ Importante:** 
- Use chaves seguras e aleatórias para os secrets JWT em produção
- Nunca commite o arquivo `.env` no repositório
- Em produção, use variáveis de ambiente do sistema ou um gerenciador de secrets

---

## 📚 Guia de Integração

Este guia explica como sistemas terceiros devem integrar com o Identity Service.

### Conceitos Importantes

#### Application (Cliente do Auth Service)

Uma **Application** representa quem consome o serviço de autenticação. Pode ser:
- Uma aplicação web frontend
- Um microsserviço backend
- Qualquer serviço que precisa autenticar usuários

Cada Application possui:
- `clientId`: Identificador único usado no header `x-client-id`
- `clientSecret`: Secret usado para validação (gerenciado internamente)
- `isActive`: Status de ativação da aplicação

#### Identificação da Application

**Todas as requisições** devem incluir o header `x-client-id` com o `clientId` da sua Application:

```http
x-client-id: seu-client-id-aqui
```

Sem este header, a requisição será rejeitada com status `401 Unauthorized`.

---

## 🔐 Endpoints de Autenticação

### Base URL

```
http://localhost:3000/auth
```

Em produção, substitua pela URL do seu servidor.

---

### 1. Criar Usuário (Signup)

Cria um novo usuário no sistema e o associa à sua Application.

**Endpoint:** `POST /auth/signup`

**Headers:**
```http
Content-Type: application/json
x-client-id: seu-client-id
```

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senhaSegura123"
```

**Validações:**
- `name`: Obrigatório, mínimo 1 caractere
- `email`: Obrigatório, deve ser um email válido
- `password`: Obrigatório, mínimo 6 caracteres

**Resposta de Sucesso (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "joao@example.com",
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

**Comportamentos Especiais:**

1. **Usuário já existe mas não está associado à Application:**
   - O usuário é automaticamente associado à sua Application
   - Se o usuário não tiver senha local, ela é adicionada
   - Retorna os dados do usuário atualizado

2. **Usuário já existe e já está associado à Application:**
   - Retorna erro `409 Conflict`:
   ```json
   {
     "statusCode": 409,
     "message": "User already exists and is associated with this application"
   }
   ```

**Exemplo de Requisição (cURL):**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -H "x-client-id: seu-client-id" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senhaSegura123"
  }'
```

---

### 2. Login (Email/Senha)

Autentica um usuário existente e retorna tokens de acesso.

**Endpoint:** `POST /auth/login`

**Headers:**
```http
Content-Type: application/json
x-client-id: seu-client-id
```

**Body:**
```json
{
  "email": "joao@example.com",
  "password": "senhaSegura123"
}
```

**Validações:**
- `email`: Obrigatório
- `password`: Obrigatório

**Resposta de Sucesso (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Importante sobre Refresh Token:**
O `refreshToken` é enviado automaticamente como um **cookie HTTP-only** chamado `refreshToken`. Ele não aparece no corpo da resposta JSON por questões de segurança.

**Propriedades do Cookie:**
- Nome: `refreshToken`
- `httpOnly: true` (não acessível via JavaScript)
- `secure: true` (apenas HTTPS em produção)
- `sameSite: 'lax'` (proteção CSRF)
- Validade: 24 horas

**Erros Possíveis:**

1. **Credenciais inválidas (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

2. **Usuário não associado à Application (401):**
```json
{
  "statusCode": 401,
  "message": "User is not associated with this application"
}
```

3. **Usuário bloqueado (401):**
```json
{
  "statusCode": 401,
  "message": "User is blocked in this application"
}
```

**Exemplo de Requisição (cURL):**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -H "x-client-id: seu-client-id" \
  -d '{
    "email": "joao@example.com",
    "password": "senhaSegura123"
  }' \
  -c cookies.txt
```

**Nota:** O flag `-c cookies.txt` salva os cookies recebidos para uso posterior.

---

### 3. Login com Google (OAuth)

Autentica um usuário usando credenciais do Google.

**Endpoint:** `POST /auth/login/google`

**Headers:**
```http
Content-Type: application/json
x-client-id: seu-client-id
```

**Body:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
}
```

O `credential` é o ID token retornado pelo Google Sign-In no frontend.

**Resposta de Sucesso (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Comportamento:**
- Se o usuário não existir, ele é criado automaticamente
- Se o usuário existir mas não estiver associado à Application, ele é associado
- O email do Google é automaticamente verificado (`emailVerified: true`)
- O `refreshToken` é enviado como cookie (mesmo comportamento do login normal)

**Exemplo de Requisição (cURL):**
```bash
curl -X POST http://localhost:3000/auth/login/google \
  -H "Content-Type: application/json" \
  -H "x-client-id: seu-client-id" \
  -d '{
    "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
  }' \
  -c cookies.txt
```

---

### 4. Refresh Token

Renova o access token usando o refresh token armazenado.

**Endpoint:** `POST /auth/refresh`

**Headers:**
```http
x-client-id: seu-client-id
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Importante:**
- O refresh token deve ser enviado como **cookie** (não no body ou header)
- O access token atual deve ser enviado no header `Authorization: Bearer <token>`
- O `x-client-id` deve corresponder ao `aud` do token

**Resposta de Sucesso (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Nota:** O refresh token **não é renovado** nesta operação. Ele continua válido até expirar (3 dias) ou ser invalidado via logout.

**Erros Possíveis:**

1. **Refresh token não encontrado (401):**
```json
{
  "statusCode": 401,
  "message": "Refresh token not found"
}
```

2. **Refresh token expirado (401):**
```json
{
  "statusCode": 401,
  "message": "Refresh token expired"
}
```

3. **Refresh token inválido (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid refresh token"
}
```

4. **Usuário não ativo na Application (403):**
```json
{
  "statusCode": 403,
  "message": "User is not active in this application"
}
```

**Exemplo de Requisição (cURL):**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "x-client-id: seu-client-id" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -b cookies.txt
```

**Nota:** O flag `-b cookies.txt` envia os cookies salvos anteriormente.

---

### 5. Logout

Invalida o refresh token do usuário na Application atual.

**Endpoint:** `POST /auth/logout`

**Headers:**
```http
x-client-id: seu-client-id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200 OK):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

**Comportamento:**
- Remove o refresh token do banco de dados para a combinação `(user + application)`
- O access token atual continua válido até expirar (não é invalidado imediatamente)
- Após o logout, o usuário não poderá mais fazer refresh e precisará fazer login novamente

**Exemplo de Requisição (cURL):**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "x-client-id: seu-client-id" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔑 Estrutura dos Tokens JWT

### Access Token

O access token é um JWT que contém as seguintes claims:

```json
{
  "sub": "507f1f77bcf86cd799439011",  // User ID
  "email": "joao@example.com",         // Email do usuário
  "aud": "seu-client-id",               // Application clientId (IMPORTANTE!)
  "iat": 1705312800,                   // Issued at (timestamp)
  "exp": 1705314600                    // Expiration (timestamp)
}
```

**Propriedades:**
- **Validade:** 30 minutos
- **Formato:** JWT (JSON Web Token)
- **Algoritmo:** HS256 (HMAC SHA-256)

**⚠️ Claim Crítica: `aud` (Audience)**

O campo `aud` contém o `clientId` da Application que solicitou o token. Este campo é **essencial** para validação em microsserviços:

- Tokens são **específicos por Application**
- Um token emitido para Application A **não pode** ser usado em Application B
- Microsserviços devem validar que `aud === seu-client-id`

### Refresh Token

O refresh token também é um JWT, mas com estrutura mais simples:

```json
{
  "sub": "507f1f77bcf86cd799439011",  // User ID
  "aud": "seu-client-id",              // Application clientId
  "iat": 1705312800,                   // Issued at
  "exp": 1705406400                    // Expiration (3 dias)
}
```

**Propriedades:**
- **Validade:** 3 dias
- **Armazenamento:** Banco de dados (hash) + Cookie HTTP-only
- **Uso:** Apenas para renovar access tokens

---

## 🛡️ Validação de Tokens em Microsserviços

Quando um microsserviço recebe um access token, ele deve validar:

### 1. Validação Básica do JWT

```typescript
// Pseudocódigo
const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);

// Verificar expiração
if (payload.exp < Date.now() / 1000) {
  throw new Error('Token expired');
}
```

### 2. Validação do Audience (`aud`)

**⚠️ CRÍTICO:** Sempre valide que o `aud` corresponde ao `clientId` da sua Application:

```typescript
// Pseudocódigo
const myClientId = process.env.MY_CLIENT_ID;

if (payload.aud !== myClientId) {
  throw new UnauthorizedException(
    'Token audience does not match this application'
  );
}
```

### 3. Validação do Issuer (`iss`) - Opcional

Se você configurar um issuer no Identity Service, valide também:

```typescript
if (payload.iss !== 'identity-service') {
  throw new UnauthorizedException('Invalid token issuer');
}
```

### 4. Validação do Header `x-client-id`

Além de validar o token, sempre verifique que o header `x-client-id` corresponde ao `aud`:

```typescript
const clientIdFromHeader = request.headers['x-client-id'];

if (payload.aud !== clientIdFromHeader) {
  throw new UnauthorizedException(
    'Token audience does not match x-client-id header'
  );
}
```

**Por que isso é importante?**
- Impede reutilização de tokens entre serviços
- Garante isolamento de permissões
- Previne vazamento de contexto entre aplicações

---

## 📝 Exemplos de Integração

### Exemplo: Frontend React/Next.js

```typescript
// services/auth.ts
const API_BASE_URL = 'http://localhost:3000';
const CLIENT_ID = 'seu-client-id';

export async function signup(name: string, email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CLIENT_ID,
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
    },
    credentials: 'include', // Importante para receber cookies
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  
  // Salvar access token
  localStorage.setItem('accessToken', data.accessToken);
  
  return data;
}

export async function refreshToken(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'x-client-id': CLIENT_ID,
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include', // Envia cookies automaticamente
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
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  localStorage.removeItem('accessToken');
}
```

### Exemplo: Backend NestJS (Microsserviço)

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

      // Validar audience
      const myClientId = this.configService.get('MY_CLIENT_ID');
      if (payload.aud !== myClientId) {
        throw new UnauthorizedException('Invalid token audience');
      }

      // Validar header x-client-id
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

## 🔄 Fluxo Completo de Autenticação

### 1. Primeiro Acesso (Novo Usuário)

```
1. Cliente → POST /auth/signup
   ↓
2. Identity Service cria usuário e associa à Application
   ↓
3. Cliente recebe dados do usuário
   ↓
4. Cliente → POST /auth/login
   ↓
5. Identity Service retorna accessToken (JSON) + refreshToken (Cookie)
   ↓
6. Cliente salva accessToken e usa em requisições autenticadas
```

### 2. Login (Usuário Existente)

```
1. Cliente → POST /auth/login
   ↓
2. Identity Service valida credenciais
   ↓
3. Identity Service retorna accessToken (JSON) + refreshToken (Cookie)
   ↓
4. Cliente salva accessToken
```

### 3. Renovação de Token

```
1. Access token está próximo de expirar (ex: 5 min restantes)
   ↓
2. Cliente → POST /auth/refresh
   (com accessToken atual + refreshToken no cookie)
   ↓
3. Identity Service valida refreshToken e gera novo accessToken
   ↓
4. Cliente recebe novo accessToken e atualiza armazenamento
```

### 4. Logout

```
1. Cliente → POST /auth/logout
   (com accessToken no header Authorization)
   ↓
2. Identity Service remove refreshToken do banco
   ↓
3. Cliente remove accessToken do armazenamento local
   ↓
4. Próxima tentativa de refresh falhará
```

---

## ⚠️ Boas Práticas e Considerações

### Segurança

1. **Nunca exponha o `clientSecret`** no frontend ou em código cliente
2. **Sempre use HTTPS** em produção para proteger tokens e cookies
3. **Valide sempre o `aud`** em microsserviços
4. **Não armazene tokens em localStorage** se possível (prefira httpOnly cookies)
5. **Implemente refresh automático** antes do access token expirar

### Performance

1. **Cache do access token** no cliente (evita requisições desnecessárias)
2. **Refresh proativo** (renove antes de expirar, ex: 5 minutos antes)
3. **Tratamento de erros** de refresh (redirecionar para login se necessário)

### Tratamento de Erros

Sempre trate os seguintes cenários:

- **401 Unauthorized:** Token inválido/expirado → Tentar refresh ou redirecionar para login
- **403 Forbidden:** Usuário bloqueado ou Application inativa → Redirecionar para login
- **409 Conflict:** Usuário já existe → Mostrar mensagem apropriada ou fazer login

---

## 🧪 Testando a API

### Swagger UI (Desenvolvimento)

Quando `NODE_ENV=development`, o Swagger UI está disponível em:

```
http://localhost:3000/api
```

Use esta interface para testar os endpoints interativamente.

### Exemplos com cURL

Veja a seção de cada endpoint acima para exemplos completos de requisições cURL.

---

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento (watch mode)
pnpm run start:dev

# Produção
pnpm run start:prod

# Build
pnpm run build

# Testes
pnpm run test
pnpm run test:e2e
pnpm run test:cov

# Linting
pnpm run lint
```

---

## 🏗️ Arquitetura

O projeto segue uma arquitetura limpa com separação de responsabilidades:

```
src/
├── application/          # Casos de uso e controllers
│   └── usecases/
│       └── auth/
│           ├── signup/
│           ├── login/
│           ├── refresh/
│           └── logout/
├── domain/              # Entidades e interfaces
│   ├── entities/
│   ├── repositories/
│   └── services/
└── infrastructure/      # Implementações concretas
    ├── auth/
    ├── database/
    ├── guards/
    └── repositories/
```

---

## 📄 Licença

Este projeto é privado e não possui licença pública.

---

## 🤝 Suporte

Para dúvidas ou problemas de integração, entre em contato com a equipe de desenvolvimento.
