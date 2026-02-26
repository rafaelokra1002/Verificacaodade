# �‍👩‍👧‍👦 Sistema de Controle Parental

Sistema web completo de controle parental para monitoramento de localização dos filhos. Permite que responsáveis cadastrem seus filhos, definam cercas virtuais (geofencing), programem horários de check-in e recebam alertas em tempo real.

## 📋 Funcionalidades

### Página de Check-in (Filho)
- Acesso via link único com token
- Captura de selfie (câmera frontal) usando `getUserMedia`
- Captura de localização via `Geolocation API`
- Consentimento antes do processo
- Interface mobile-first responsiva
- Verificação automática de cercas virtuais
- Feedback visual em todas as etapas

### Painel do Responsável
- Login seguro com JWT
- Dashboard com estatísticas (filhos, check-ins, alertas)
- CRUD completo de filhos
- Geração de links únicos de check-in
- Visualização de fotos e localização no mapa
- Cercas virtuais (geofencing) por filho
- Horários programados de check-in
- Sistema de alertas (fora da cerca, check-in atrasado, novo dispositivo)
- Logs de atividades

### Segurança
- Tokens únicos com expiração (1 hora padrão)
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
- **Geofencing:** Fórmula de Haversine para cálculo de distância
- **Geocoding:** Nominatim (OpenStreetMap) para endereço reverso
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

Crie um arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/controle_parental?schema=public"
JWT_SECRET="sua-chave-secreta-super-segura"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
TOKEN_EXPIRATION_HOURS=1
```

### 3. Criar o banco de dados

```bash
# Usando Docker (opcional):
docker run --name postgres-parental -e POSTGRES_PASSWORD=senha -e POSTGRES_DB=controle_parental -p 5432:5432 -d postgres:16

# Executar migrations do Prisma:
npx prisma migrate dev

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
| Email | `pai@familia.com` |
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
│   ├── checkin/
│   │   ├── layout.tsx          # Layout da página de check-in
│   │   └── page.tsx            # Página de check-in do filho
│   ├── admin/
│   │   ├── layout.tsx          # Layout admin com sidebar
│   │   ├── page.tsx            # Dashboard
│   │   ├── login/
│   │   │   └── page.tsx        # Login do responsável
│   │   ├── filhos/
│   │   │   ├── page.tsx        # Lista de filhos
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Detalhes do filho (check-ins, cercas, horários, alertas)
│   │   ├── alertas/
│   │   │   └── page.tsx        # Central de alertas
│   │   └── logs/
│   │       └── page.tsx        # Logs de atividades
│   └── api/
│       ├── auth/
│       │   └── route.ts        # Autenticação (login/logout/me)
│       ├── checkin/
│       │   └── route.ts        # Receber check-in + verificar geofence
│       ├── filhos/
│       │   ├── route.ts        # CRUD filhos (lista/criar)
│       │   └── [id]/
│       │       └── route.ts    # CRUD filho individual
│       ├── cercas/
│       │   └── route.ts        # CRUD cercas virtuais
│       ├── horarios/
│       │   └── route.ts        # CRUD horários programados
│       ├── alertas/
│       │   └── route.ts        # Listar/marcar alertas
│       ├── tokens/
│       │   └── route.ts        # Gerar tokens de check-in
│       └── logs/
│           └── route.ts        # Listar logs
├── lib/
│   ├── prisma.ts               # Singleton Prisma Client
│   ├── auth.ts                 # Utilitários JWT
│   └── utils.ts                # Funções auxiliares (geofencing, etc.)
└── middleware.ts               # Proteção de rotas

prisma/
├── schema.prisma               # Modelos do banco
└── seed.ts                     # Dados iniciais

public/
└── uploads/                    # Fotos de check-in
```

---

## 📡 Endpoints da API

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth` | Login do responsável |
| POST | `/api/auth?action=logout` | Logout |
| GET | `/api/auth` | Verificar sessão |

### Filhos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/filhos` | Listar filhos |
| POST | `/api/filhos` | Cadastrar filho |
| GET | `/api/filhos/:id` | Detalhes do filho |
| PUT | `/api/filhos/:id` | Atualizar filho |
| DELETE | `/api/filhos/:id` | Remover filho |

### Check-in
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/checkin?token=xxx` | Validar token de check-in |
| POST | `/api/checkin` | Enviar check-in (foto + localização) |

### Cercas Virtuais
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/cercas?filhoId=xxx` | Listar cercas do filho |
| POST | `/api/cercas` | Criar cerca virtual |
| PUT | `/api/cercas` | Atualizar cerca |
| DELETE | `/api/cercas?id=xxx` | Remover cerca |

### Horários Programados
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/horarios?filhoId=xxx` | Listar horários |
| POST | `/api/horarios` | Criar horário programado |
| DELETE | `/api/horarios?id=xxx` | Remover horário |

### Alertas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/alertas` | Listar alertas (com filtros) |
| PUT | `/api/alertas` | Marcar alerta(s) como lido |

### Tokens
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/tokens` | Gerar link de check-in para filho |

### Logs
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/logs` | Listar logs de atividades |

---

## 🔄 Fluxo de Uso

1. **Responsável faz login** no painel
2. **Responsável cadastra um filho** (nome, idade, dispositivo)
3. **Responsável define cercas virtuais** (escola, casa, etc.)
4. **Responsável programa horários** de check-in
5. **Responsável gera um link de check-in** para o filho
6. **Responsável envia o link** para o filho (WhatsApp, SMS, etc.)
7. **Filho acessa o link** no celular
8. **Filho aceita os termos** e **tira selfie** + **compartilha localização**
9. **Sistema verifica geofencing** e gera alertas se necessário
10. **Responsável visualiza** check-ins, localização e alertas no painel

---

## 🗃️ Modelos do Banco

### User (Responsável)
- `id`, `email`, `password`, `nome`, `createdAt`, `updatedAt`

### Filho
- `id`, `nome`, `idade`, `dispositivo`, `ativo`, `userId`, `createdAt`, `updatedAt`

### Checkin
- `id`, `filhoId`, `foto`, `latitude`, `longitude`, `endereco`, `ip`, `userAgent`, `dentroPerimetro`, `createdAt`

### TokenCheckin
- `id`, `filhoId`, `token`, `expiracao`, `usado`, `createdAt`

### CercaVirtual
- `id`, `filhoId`, `nome`, `latitude`, `longitude`, `raio` (metros), `ativo`, `createdAt`

### HorarioProgramado
- `id`, `filhoId`, `diaSemana` (enum), `hora`, `ativo`, `createdAt`

### Alerta
- `id`, `filhoId`, `tipo` (enum: CHECKIN_REALIZADO, FORA_CERCA, CHECKIN_ATRASADO, NOVO_DISPOSITIVO), `mensagem`, `lido`, `createdAt`

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
npm run db:setup     # Migrations + seed juntos
```

---

## 📱 Compatibilidade

- ✅ Chrome (Desktop e Mobile)
- ✅ Safari (iOS)
- ✅ Firefox
- ✅ Edge
- ✅ Samsung Internet

> A câmera e geolocalização requerem HTTPS em produção (localhost funciona em HTTP).

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
