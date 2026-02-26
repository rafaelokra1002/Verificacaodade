# 🔐 Sistema de Verificação de Identidade

Sistema web completo para verificação de identidade de clientes de empréstimos. Permite que um administrador envie links únicos para clientes capturarem selfie e localização para validação de identidade.

## 📋 Funcionalidades

### Página do Cliente
- Acesso via link único com token
- Captura de selfie (câmera frontal) usando `getUserMedia`
- Captura de localização via `Geolocation API`
- Consentimento LGPD antes do processo
- Interface mobile-first responsiva
- Feedback visual em todas as etapas

### Painel Administrativo
- Login seguro com JWT
- Dashboard com estatísticas
- CRUD completo de clientes
- Geração de links únicos de verificação
- Visualização de fotos e localização (Google Maps)
- Logs de acesso ao sistema

### Segurança
- Tokens únicos com expiração (1 hora padrão)
- Proteção contra múltiplos envios
- Autenticação JWT com cookies httpOnly
- Middleware de proteção de rotas
- Hash de senha com bcrypt (12 rounds)
- Registro de logs de acesso

---

## 🛠️ Tecnologias

- **Frontend:** Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend:** API Routes do Next.js
- **Banco de Dados:** PostgreSQL + Prisma ORM
- **Autenticação:** JWT + bcryptjs
- **Upload:** Armazenamento local (public/uploads)

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- **Node.js** 18+ instalado
- **PostgreSQL** rodando (local ou Docker)
- **npm** ou **yarn**

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/verificacao_identidade?schema=public"
JWT_SECRET="sua-chave-secreta-super-segura"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
TOKEN_EXPIRATION_HOURS=1
```

### 3. Criar o banco de dados

```bash
# Usando Docker (opcional):
docker run --name postgres-verificacao -e POSTGRES_PASSWORD=senha -e POSTGRES_DB=verificacao_identidade -p 5432:5432 -d postgres:16

# Executar migrations do Prisma:
npx prisma migrate dev --name init

# Popular banco com dados iniciais:
npx tsx prisma/seed.ts
```

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🔑 Credenciais Padrão

| Campo | Valor |
|-------|-------|
| Email | `admin@sistema.com` |
| Senha | `admin123` |

> ⚠️ **Altere estas credenciais em produção!**

---

## 📁 Estrutura de Pastas

```
src/
├── app/
│   ├── layout.tsx              # Layout raiz
│   ├── page.tsx                # Página inicial (redirect)
│   ├── globals.css             # Estilos globais + TailwindCSS
│   ├── verificar/
│   │   └── page.tsx            # Página de verificação do cliente
│   ├── admin/
│   │   ├── layout.tsx          # Layout admin com sidebar
│   │   ├── page.tsx            # Dashboard
│   │   ├── login/
│   │   │   └── page.tsx        # Login do admin
│   │   ├── clientes/
│   │   │   ├── page.tsx        # Lista de clientes
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Detalhes do cliente
│   │   └── logs/
│   │       └── page.tsx        # Logs de acesso
│   └── api/
│       ├── auth/
│       │   └── route.ts        # Autenticação (login/logout/me)
│       ├── verificacao/
│       │   └── route.ts        # Receber verificação
│       ├── clientes/
│       │   ├── route.ts        # CRUD clientes (lista/criar)
│       │   └── [id]/
│       │       └── route.ts    # CRUD cliente individual
│       ├── tokens/
│       │   └── route.ts        # Gerar tokens
│       └── logs/
│           └── route.ts        # Listar logs
├── lib/
│   ├── prisma.ts               # Singleton Prisma Client
│   ├── auth.ts                 # Utilitários JWT
│   └── utils.ts                # Funções auxiliares
└── middleware.ts               # Proteção de rotas

prisma/
├── schema.prisma               # Modelos do banco
└── seed.ts                     # Dados iniciais

public/
└── uploads/                    # Fotos de verificação
```

---

## 📡 Endpoints da API

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth` | Login do admin |
| POST | `/api/auth?action=logout` | Logout |
| GET | `/api/auth` | Verificar sessão |

### Clientes
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/clientes` | Listar clientes |
| POST | `/api/clientes` | Criar cliente |
| GET | `/api/clientes/:id` | Detalhes do cliente |
| PUT | `/api/clientes/:id` | Atualizar cliente |
| DELETE | `/api/clientes/:id` | Remover cliente |

### Verificação
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/verificacao?token=xxx` | Validar token |
| POST | `/api/verificacao` | Enviar verificação |

### Tokens
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/tokens` | Gerar token para cliente |

### Logs
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/logs` | Listar logs de acesso |

---

## 🔄 Fluxo de Uso

1. **Admin faz login** no painel
2. **Admin cadastra um cliente** (nome + telefone)
3. **Admin gera um link de verificação** para o cliente
4. **Admin envia o link** para o cliente (WhatsApp, SMS, etc.)
5. **Cliente acessa o link** no celular
6. **Cliente aceita os termos** (LGPD)
7. **Cliente tira selfie** e **compartilha localização**
8. **Sistema registra a verificação** e atualiza o status
9. **Admin visualiza** a foto, localização e dados no painel

---

## 🗃️ Modelos do Banco

### User (Administrador)
- `id`, `email`, `password`, `nome`, `createdAt`, `updatedAt`

### Cliente
- `id`, `nome`, `telefone`, `status` (PENDENTE/VERIFICADO), `createdAt`, `updatedAt`

### Verificacao
- `id`, `clienteId`, `foto`, `latitude`, `longitude`, `ip`, `userAgent`, `createdAt`

### TokenVerificacao
- `id`, `clienteId`, `token`, `expiracao`, `usado`, `createdAt`

### LogAcesso
- `id`, `acao`, `detalhes`, `ip`, `userAgent`, `userId`, `createdAt`

---

## ⚙️ Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Iniciar produção
npm run db:generate  # Gerar Prisma Client
npm run db:push      # Sincronizar schema com banco
npm run db:migrate   # Executar migrations
npm run db:seed      # Popular banco com dados iniciais
npm run db:studio    # Abrir Prisma Studio (GUI)
```

---

## 📱 Compatibilidade

- ✅ Chrome (Desktop e Mobile)
- ✅ Safari (iOS)
- ✅ Firefox
- ✅ Edge
- ✅ Samsung Internet

> A câmera requer HTTPS em produção (localhost funciona em HTTP).

---

## 🏗️ Deploy em Produção

1. Configure variáveis de ambiente no servidor
2. Use HTTPS (obrigatório para câmera e geolocalização)
3. Configure o PostgreSQL de produção
4. Execute `npm run build && npm run start`
5. Considere usar serviço de armazenamento (S3, Cloudinary) para imagens

---

## 📝 Licença

Este projeto é para uso interno. Todos os direitos reservados.
