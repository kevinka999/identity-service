# Como Integrar com o Identity Service

Guia rápido para sistemas terceiros que desejam utilizar o serviço de autenticação.

---

## 📋 O que você precisa saber

### Conceito Principal

O Identity Service fornece **autenticação centralizada** para múltiplas aplicações. Cada aplicação tem seu próprio contexto, mas compartilha a mesma base de usuários.

**Regra de ouro:** Identidade é global, acesso é contextual por aplicação.

### O que você PRECISA ter

✅ **Um `clientId` válido** - Fornecido pela equipe do Identity Service  
✅ **Suporte a cookies HTTP** - Para receber o refresh token automaticamente  
✅ **Capacidade de enviar headers HTTP** - Especialmente `x-client-id`  

### O que você NÃO precisa

❌ **Não precisa** de `clientSecret` no frontend (apenas no backend se necessário)  
❌ **Não precisa** gerenciar refresh tokens manualmente (vem como cookie)   
❌ **Não precisa** implementar lógica de hash de senha  

---

## 🚀 Início Rápido

### 1. Obter seu `clientId`

Entre em contato com a equipe do Identity Service para obter:
- Seu `clientId` único
- A URL base da API (ex: `https://auth.example.com`)

### 2. Configurar o Header Obrigatório

**Todas as requisições** devem incluir:

```http
x-client-id: seu-client-id-aqui
```

Sem este header, todas as requisições retornarão `401 Unauthorized`.

### 3. Endpoints Disponíveis

```
POST /auth/signup      - Criar novo usuário
POST /auth/login       - Login com email/senha
POST /auth/login/google - Login com Google OAuth
POST /auth/refresh     - Renovar access token
POST /auth/logout      - Fazer logout
```

---

## 📝 Integração Passo a Passo

### Passo 1: Criar Usuário (Signup)

**Quando usar:** Primeira vez que um usuário se registra na sua aplicação.

**Requisição:**
```http
POST /auth/signup
Headers:
  Content-Type: application/json
  x-client-id: seu-client-id

Body:
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senhaSegura123"
}
```

**Resposta:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "joao@example.com",
  "emailVerified": false,
  "applications": [...],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**O que acontece:**
- Se o email já existe mas não está na sua aplicação → usuário é associado automaticamente
- Se o email já existe na sua aplicação → erro `409 Conflict`
- Se é um email novo → usuário é criado e associado à sua aplicação

**Você precisa fazer:**
- Armazenar o `id` do usuário (opcional, para referência)
- Redirecionar para login após signup bem-sucedido

---

### Passo 2: Login

**Quando usar:** Usuário já tem conta e quer fazer login.

**Requisição:**
```http
POST /auth/login
Headers:
  Content-Type: application/json
  x-client-id: seu-client-id

Body:
{
  "email": "joao@example.com",
  "password": "senhaSegura123"
}
```

**Resposta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Importante:**
- O `refreshToken` vem automaticamente como **cookie HTTP-only**
- Você **não precisa** fazer nada com o cookie, o navegador gerencia automaticamente
- Salve apenas o `accessToken` para usar nas requisições autenticadas

**Você precisa fazer:**
- Salvar o `accessToken` (localStorage, sessionStorage, ou memória)
- Usar o `accessToken` no header `Authorization: Bearer <token>` em requisições autenticadas
- Configurar `credentials: 'include'` nas requisições fetch para enviar/receber cookies

---

### Passo 3: Usar o Access Token

**Quando usar:** Em todas as requisições que precisam de autenticação.

**Como enviar:**
```http
GET /sua-api/protected-endpoint
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  x-client-id: seu-client-id
```

**Validade do token:**
- Access token expira em **30 minutos**
- Você precisa renová-lo antes de expirar usando o refresh token

**Você precisa fazer:**
- Interceptar requisições HTTP para adicionar o token automaticamente
- Detectar quando o token expira (erro 401)
- Chamar o endpoint de refresh quando necessário

---

### Passo 4: Renovar Token (Refresh)

**Quando usar:** Quando o access token expira ou está próximo de expirar.

**Requisição:**
```http
POST /auth/refresh
Headers:
  Authorization: Bearer <access-token-atual>
  x-client-id: seu-client-id
  Cookie: refreshToken=... (enviado automaticamente pelo navegador)
```

**Resposta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Importante:**
- O refresh token está no cookie (gerenciado automaticamente pelo navegador)
- Você só precisa enviar o access token atual no header `Authorization`
- O refresh token **não é renovado**, ele continua válido por 3 dias

**Você precisa fazer:**
- Implementar refresh automático quando receber erro 401
- Atualizar o access token salvo com o novo token recebido
- Se o refresh falhar → redirecionar para tela de login

**Exemplo de lógica:**
```typescript
// Pseudocódigo
try {
  const response = await fetch('/sua-api/protected', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  if (response.status === 401) {
    // Token expirado, tentar refresh
    const newToken = await refreshToken(accessToken);
    // Tentar novamente com novo token
    return fetch('/sua-api/protected', {
      headers: { 'Authorization': `Bearer ${newToken}` }
    });
  }
} catch (error) {
  // Refresh falhou, redirecionar para login
  redirectToLogin();
}
```

---

### Passo 5: Logout

**Quando usar:** Quando o usuário quer sair da aplicação.

**Requisição:**
```http
POST /auth/logout
Headers:
  Authorization: Bearer <access-token>
  x-client-id: seu-client-id
```

**Resposta:**
```json
{
  "message": "Logout realizado com sucesso"
}
```

**O que acontece:**
- O refresh token é removido do banco de dados
- O access token atual continua válido até expirar (mas não pode ser renovado)
- Próxima tentativa de refresh falhará

**Você precisa fazer:**
- Remover o access token do armazenamento local
- Limpar qualquer estado de autenticação na sua aplicação
- Redirecionar para tela de login

---

## 🔑 Entendendo os Tokens

### Access Token

**O que é:** JWT que prova que o usuário está autenticado

**Onde usar:** Em todas as requisições autenticadas

**Como enviar:**
```http
Authorization: Bearer <access-token>
```

**Validade:** 30 minutos

**Estrutura (decodificado):**
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "aud": "seu-client-id",
  "iat": 1234567890,
  "exp": 1234570000
}
```

**⚠️ Importante:** O campo `aud` contém seu `clientId`. Microsserviços devem validar que `aud === seu-client-id`.

### Refresh Token

**O que é:** Token usado para renovar o access token

**Onde está:** Cookie HTTP-only (gerenciado automaticamente)

**Você precisa fazer:** Nada! O navegador gerencia automaticamente.

**Validade:** 3 dias

**Quando usar:** Automaticamente quando o access token expira

---

## 🎯 Casos de Uso Comuns

### Caso 1: Aplicação Web Frontend

**O que você precisa:**
- JavaScript/TypeScript
- Capacidade de fazer requisições HTTP (fetch/axios)
- Suporte a cookies (navegador moderno)

**Fluxo:**
1. Usuário preenche formulário de signup → `POST /auth/signup`
2. Usuário faz login → `POST /auth/login` → salvar `accessToken`
3. Em cada requisição autenticada → adicionar `Authorization: Bearer <token>`
4. Quando token expira → `POST /auth/refresh` → atualizar token
5. Usuário faz logout → `POST /auth/logout` → limpar token local

**Exemplo mínimo:**
```typescript
// Login
const login = async (email: string, password: string) => {
  const res = await fetch('https://auth.example.com/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': 'seu-client-id'
    },
    credentials: 'include', // Importante para cookies
    body: JSON.stringify({ email, password })
  });
  
  const { accessToken } = await res.json();
  localStorage.setItem('accessToken', accessToken);
};

// Requisição autenticada
const fetchProtected = async () => {
  const token = localStorage.getItem('accessToken');
  
  const res = await fetch('https://api.example.com/protected', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-client-id': 'seu-client-id'
    },
    credentials: 'include'
  });
  
  if (res.status === 401) {
    // Token expirado, fazer refresh
    await refreshToken();
    // Tentar novamente...
  }
  
  return res.json();
};
```

### Caso 2: Microsserviço Backend

**O que você precisa:**
- Biblioteca JWT (ex: `jsonwebtoken` para Node.js)
- O `ACCESS_TOKEN_SECRET` (fornecido pela equipe)
- Seu `clientId` para validação

**Fluxo:**
1. Receber requisição com `Authorization: Bearer <token>`
2. Validar assinatura do JWT usando `ACCESS_TOKEN_SECRET`
3. Verificar expiração (`exp`)
4. **Validar `aud` === seu `clientId`** (CRÍTICO!)
5. Extrair `sub` (user ID) e usar na lógica

**Exemplo mínimo (Node.js/NestJS):**
```typescript
import { JwtService } from '@nestjs/jwt';

// Validar token
const payload = await jwtService.verifyAsync(token, {
  secret: process.env.ACCESS_TOKEN_SECRET
});

// Validar audience (CRÍTICO!)
if (payload.aud !== process.env.MY_CLIENT_ID) {
  throw new UnauthorizedException('Invalid token audience');
}

// Usar user ID
const userId = payload.sub;
```

### Caso 3: Aplicação Mobile

**O que você precisa:**
- Cliente HTTP (ex: axios, fetch)
- Gerenciador de cookies ou armazenamento local

**Diferenças:**
- Cookies podem não funcionar automaticamente
- Você pode precisar gerenciar o refresh token manualmente
- Considere usar Secure Storage para tokens

**Fluxo similar ao frontend web, mas:**
- Salvar refresh token manualmente (se não houver suporte a cookies)
- Enviar refresh token no body ou header customizado (se necessário)

---

## ⚠️ O que você NÃO precisa fazer

### ❌ Não precisa:

1. **Gerenciar refresh tokens manualmente** - Vem como cookie HTTP-only
2. **Validar senhas no seu lado** - O Identity Service faz isso
3. **Hash de senhas** - O Identity Service gerencia
4. **Criar tabelas de usuários** - Tudo é gerenciado pelo Identity Service
5. **Gerenciar sessões** - Tokens são stateless
6. **Implementar OAuth do zero** - O Identity Service já faz login com Google
7. **Preocupar-se com múltiplos usuários** - O Identity Service gerencia isolamento

### ✅ Você só precisa:

1. **Enviar requisições HTTP** com os headers corretos
2. **Salvar o access token** e usá-lo nas requisições
3. **Fazer refresh** quando o token expirar
4. **Validar o `aud`** se você for um microsserviço backend

---

## 🔒 Segurança - O que você DEVE fazer

### ✅ Obrigatório:

1. **Sempre validar `aud` em microsserviços**
   ```typescript
   if (payload.aud !== myClientId) {
     throw new UnauthorizedException();
   }
   ```

2. **Usar HTTPS em produção**
   - Tokens e cookies devem trafegar apenas por HTTPS

3. **Não expor `clientSecret` no frontend**
   - `clientSecret` é apenas para validação server-side (se necessário)

4. **Implementar refresh automático**
   - Não deixe o usuário ver erros de token expirado

### ⚠️ Recomendado:

1. **Não armazenar tokens em localStorage** (se possível)
   - Prefira httpOnly cookies (mas isso requer backend proxy)

2. **Implementar timeout de sessão**
   - Após X minutos de inatividade, fazer logout

3. **Validar `x-client-id` header**
   - Em microsserviços, sempre verificar que o header corresponde ao `aud`

---

## 📊 Resumo de Requisições

### Tabela de Endpoints

| Endpoint | Método | Auth Necessária? | Cookie Necessário? |
|----------|--------|------------------|-------------------|
| `/auth/signup` | POST | ❌ Não | ❌ Não |
| `/auth/login` | POST | ❌ Não | ❌ Não (recebe) |
| `/auth/login/google` | POST | ❌ Não | ❌ Não (recebe) |
| `/auth/refresh` | POST | ✅ Sim (access token) | ✅ Sim (refresh token) |
| `/auth/logout` | POST | ✅ Sim (access token) | ❌ Não |

### Headers Obrigatórios

| Header | Quando Usar | Obrigatório? |
|--------|-------------|--------------|
| `x-client-id` | Todas as requisições | ✅ Sim |
| `Content-Type: application/json` | POST com body | ✅ Sim |
| `Authorization: Bearer <token>` | Endpoints protegidos | ✅ Sim |

---

## 🐛 Tratamento de Erros Comuns

### 401 Unauthorized

**Possíveis causas:**
- Token expirado → Fazer refresh
- Token inválido → Redirecionar para login
- `x-client-id` ausente ou inválido → Verificar header
- Credenciais inválidas (login) → Mostrar erro ao usuário

**Ação:**
```typescript
if (error.status === 401) {
  // Tentar refresh se tiver refresh token
  try {
    const newToken = await refreshToken();
    // Retry request
  } catch {
    // Refresh falhou, fazer logout
    redirectToLogin();
  }
}
```

### 403 Forbidden

**Possíveis causas:**
- Usuário bloqueado na aplicação
- Application inativa

**Ação:** Redirecionar para login e mostrar mensagem apropriada

### 409 Conflict

**Possíveis causas:**
- Tentativa de signup com email já existente na aplicação

**Ação:** Sugerir fazer login ao invés de signup

---

## 📞 Próximos Passos

1. **Obter seu `clientId`** - Entre em contato com a equipe
2. **Configurar variáveis de ambiente** - URL da API e `clientId`
3. **Implementar fluxo de autenticação** - Signup → Login → Refresh → Logout
4. **Testar integração** - Use o Swagger UI em desenvolvimento (`/api`)
5. **Implementar tratamento de erros** - 401, 403, 409

---

## 💡 Dicas Finais

- **Desenvolvimento:** Use o Swagger UI (`/api`) para testar endpoints
- **Produção:** Sempre use HTTPS
- **Tokens:** Access tokens são curtos (30min) por segurança
- **Refresh:** Implemente refresh proativo (5min antes de expirar)
- **Logs:** Não logue tokens completos em produção

---

## 📚 Recursos Adicionais

- **Documentação completa:** Veja `README.md` para detalhes técnicos
- **Swagger UI:** Disponível em `/api` quando `NODE_ENV=development`
- **Suporte:** Entre em contato com a equipe para dúvidas

---

**Última atualização:** Janeiro 2024

