# 커리큘럼 시스템 MMP 업그레이드 기획서 (Curriculum System Upgrade RFC)

## 1. 개요 (Overview)
현재 하드코딩된 상태(MVP)인 커리큘럼 및 개인 포럼 기능을 실제 **데이터베이스(DB)와 연동**하고, **레벨업 시스템(XP)**과 유기적으로 결합된 **MMP(Minimum Marketable Product)** 단계로 고도화합니다.

## 2. 데이터베이스 스키마 설계 (Database Schema)
`Prisma` 스키마에 정규 커리큘럼 관리를 위한 모델을 신규 추가합니다.

### A. 정규 커리큘럼 (`Chapter` & `CurriculumItem`)
정규 커리큘럼은 **챕터(Chapter)**와 그 아래의 **하위 항목(Item)**으로 구성됩니다.

```prisma
// 기존 Workspace 모델에 관계 추가
// model Workspace {
//   ...
//   chapters Chapter[]
// }

model Chapter {
  id          Int      @id @default(autoincrement())
  title       String   // 챕터 제목 (예: "React 기초")
  week        String   // 주차 표기 (예: "Week 1")
  orderIndex  Int      @default(0) // 정렬 순서
  
  // 잠금 시스템
  isLocked    Boolean  @default(true) // 기본적으로 잠김 상태 (첫 챕터 제외)
  isForcedUnlocked Boolean @default(false) // 강제 해금 여부 (패널티 적용을 위해)

  workspaceId Int
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  items       CurriculumItem[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CurriculumItem {
  id          Int      @id @default(autoincrement())
  title       String
  content     String?  // 상세 내용 (마크다운 등)
  type        String   // 컨텐츠 타입: 'VOD', 'CODE', 'TASK', 'CONCEPT' 등
  difficulty  String   @default("NORMAL") // 'EASY', 'NORMAL', 'HARD' (XP 보상 기준)
  
  isDone      Boolean  @default(false) // 완료 여부
  
  chapterId   Int
  chapter     Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
}
```

### B. 개인 포럼 (`Task` 모델 재활용 및 확장)
기존 `Task` 모델을 개인 포럼의 게시글로 활용하되, 태그(Category) 등을 지원하도록 보완합니다.

```prisma
// model Task {
//   ...
//   tags        String[] // 배열 형태로 태그 저장 (PostgreSQL 지원)
//   difficulty  String   @default("NORMAL")
// }
```

## 3. 레벨 시스템 연동 (Level System Integration)
학습 활동이 사용자의 성장(XP)으로 직결되도록 설계합니다.

### A. XP 보상 공식
- **아이템 완료 시**:
  - `EASY`: **10 ~ 15 XP**
  - `NORMAL`: **20 ~ 30 XP**
  - `HARD`: **50 ~ 80 XP**
- **강제 해금 패널티**:
  - 만약 상위 챕터가 `isForcedUnlocked` 상태라면, 해당 챕터 내부 아이템 완료 시 획득 XP **30% 감소**.

### B. 자동 레벨업 트리거
- 아이템 완료 API 호출 시, 서버에서 XP를 지급하고 `getUserLevelInfo` 및 `getWorkspaceTier`를 재계산하여 레벨업 발생 시 즉시 응답(Response)에 포함합니다.

## 4. API 엔드포인트 설계 (API Specs)

| 구분 | Method | Endpoint | 설명 |
| :--- | :--- | :--- | :--- |
| **챕터** | `GET` | `/api/workspaces/:id/chapters` | 전체 챕터 및 아이템 목록 조회 |
| | `POST` | `/api/workspaces/:id/chapters` | 새 챕터 생성 |
| **아이템** | `POST` | `/api/workspaces/:id/chapters/:cid/items` | 챕터 내 새 아이템 추가 |
| | `POST` | `/api/curriculum/items/:itemId/complete` | **아이템 완료 토글 (XP 지급/회수 핵심 로직)** |
| **포럼** | `GET` | `/api/workspaces/:id/tasks` | 개인 목표 리스트 조회 (기존 활용) |
| | `POST` | `/api/workspaces/:id/tasks` | 새 개인 목표 생성 (태그, 난이도 포함) |

## 5. 구현 단계 (Implementation Steps)
1.  **DB 마이그레이션**: `schema.prisma` 수정 및 `npx prisma migrate dev` 실행.
2.  **백엔드 로직 구현**:
    - 챕터/아이템 CRUD API 개발.
    - `toggleComplete` API에서 XP 계산 및 레벨업 로직 결합.
3.  **프론트엔드 연동 (`CurriculumSection.tsx`)**:
    - 하드코딩된 `INITIAL_CURRICULUM` 제거.
    - `fetch` 또는 `SWR`을 사용하여 실시간 데이터 로딩.
    - 완료 체크 시 서버 통신 및 XP 획득 모달(RewardModal) 연동.
