# Lahtokohta (The Point of Departure)

**Lahtokohta**는 사용자의 목표 달성과 성장을 게임처럼 즐길 수 있게 돕는 **게이미피케이션 플랫폼**입니다.  
핀란드어로 '출발점'을 의미하며, 사용자가 새로운 성장의 여정을 시작하는 곳이라는 뜻을 담고 있습니다.

---

## 🛠 Tech Stack (기술 스택)

### Core
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Runtime**: Node.js

### Database & Backend
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/) (v5.18.0)
  - *Note: 안정성을 위해 v5 버전을 채택하여 사용 중입니다.*
- **Authentication**: Custom JWT (Stateless)

### Frontend & UI
- **Styling**: Vanilla CSS + CSS Modules
  - *Design System*: Deep Dark Theme, Glassmorphism
- **Icons**: React Icons (Feather Icons, FontAwesome)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Date Picker**: React Datepicker

---

## ✨ Key Features (주요 기능)

### 1. User Growth System (성장 시스템)
- **XP 기반 레벨업**: 활동(출석, 태스크 완료)을 통해 경험치(XP)를 획득합니다.
- **기하급수적 스케일링**: 레벨이 오를수록 필요 XP가 증가하여 도전 욕구를 자극합니다.
- **칭호(Title) 시스템**:
  - `🌱 Explorer` (Lv. 1-9)
  - `🚀 Pioneer` (Lv. 10-24)
  - `⭐ Navigator` (Lv. 25-49)
  - `👑 Conqueror` (Lv. 50-74)
  - `🌌 Transcendent` (Lv. 75-99)
  - `🏆 Endgame` (Lv. 100)

### 2. Workspaces (워크스페이스)
- **카테고리별 관리**: 공부, 운동, 프로젝트, 취미 등 목표별로 공간을 생성합니다.
- **난이도 설정**: Easy(x1.0), Normal(x1.5), Hard(x2.0) 난이도에 따라 보상이 달라집니다.
- **비주얼 피드백**: 각 카테고리에 맞는 이모지와 UI 테마를 제공합니다.

### 3. Authentication (인증)
- **보안**: BCrypt를 이용한 비밀번호 해싱 및 HTTP-only Cookie 기반의 JWT 인증.
- **UX**: 로그인/회원가입 모달 내에서의 부드러운 전환 및 애니메이션 피드백.

---

## 📂 Project Structure (폴더 구조)

```bash
├── prisma/               # Database Schema & Migrations
│   ├── schema.prisma     # DB 모델 정의
│   └── migrations/       # SQL 마이그레이션 히스토리
├── src/
│   ├── app/              # Next.js App Router Pages & API Routes
│   │   ├── api/          # Backend Endpoints (login, signup, me, workspaces)
│   │   ├── dashboard/    # Main User Interface
│   │   └── page.tsx      # Landing Page
│   ├── components/       # Reusable UI Components
│   │   ├── AuthModal.tsx # Login/Signup Modal
│   │   └── CreateWorkspaceModal.tsx
│   └── lib/              # Utilities
│       ├── prisma.ts     # Prisma Client Singleton
│       └── utils.ts      # Helper Functions
├── public/               # Static Assets
└── README.md             # Project Documentation
```

---

## 🚀 Getting Started (실행 방법)

### 1. 환경 변수 설정 (.env)
루트 디렉토리에 `.env` 파일을 생성하고 다음 정보를 입력하세요.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lahtokohta?schema=public"
JWT_SECRET="your-secure-secret-key"
```

### 2. 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 데이터베이스 스키마 동기화 (Schema -> DB)
npx prisma migrate dev

# 3. 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하세요.

---

## 🧹 Maintenance Notes
- **Prisma Version**: 최신 버전(v7)의 불안정성으로 인해 v5.18.0으로 고정하여 사용 중입니다. 업데이트 시 주의가 필요합니다.
- **Clean Architecture**: `src/lib/db.ts` (Raw SQL)는 제거되었으며, 모든 DB 접근은 Prisma Client를 통해 이루어집니다.
