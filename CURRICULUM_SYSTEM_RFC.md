# 커리큘럼 시스템 MMP 업그레이드 기획서 (Curriculum System Upgrade RFC)

## 1. 개요 (Overview)
현재 하드코딩된 상태(MVP)인 커리큘럼 및 개인 포럼 기능을 실제 **데이터베이스(DB)와 연동**하고, **레벨업 시스템(XP)**과 유기적으로 결합된 **MMP(Minimum Marketable Product)** 단계로 고도화합니다.

## 2. 데이터베이스 스키마 설계 (Database Schema)
`Prisma` 스키마에 정규 커리큘럼 관리를 위한 모델을 신규 추가합니다.

### A. 정규 커리큘럼 (`Chapter` & `CurriculumContent`)
정규 커리큘럼은 **챕터(Chapter)**와 그 아래의 **하위 컨텐츠(Content)**로 구성됩니다.

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
  isLocked    Boolean  @default(true) // 기본적으로 잠김 상태 (세 번째 챕터까지 제외)
  isForcedUnlocked Boolean @default(false) // 강제 해금 여부 (패널티 적용을 위해)

  workspaceId Int
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  contents    CurriculumContent[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CurriculumContent {
  id          Int      @id @default(autoincrement())
  title       String
  description String?  // 상세 내용 (마크다운 등)
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
- **컨텐츠 완료 시**:
  - `EASY`: **10 ~ 150 XP**
  - `NORMAL`: **150 ~ 450 XP**
  - `HARD`: **450 ~ 1000 XP**
- **강제 해금 패널티**:
  - 만약 상위 챕터가 `isForcedUnlocked` 상태라면, 해당 챕터 내부 **컨텐츠(Content)** 완료 시 획득 XP **30% 감소**.

### B. 자동 레벨업 트리거
- 컨텐츠 완료 API 호출 시, 서버에서 XP를 지급하고 `getUserLevelInfo` 및 `getWorkspaceTier`를 재계산하여 레벨업 발생 시 즉시 응답(Response)에 포함합니다.

## 4. API 엔드포인트 설계 (API Specs)

| 구분 | Method | Endpoint | 설명 |
| :--- | :--- | :--- | :--- |
| **챕터** | `GET` | `/api/workspaces/:id/chapters` | 전체 챕터 및 컨텐츠 목록 조회 |
| | `POST` | `/api/workspaces/:id/chapters` | 새 챕터 생성 |
| **컨텐츠** | `POST` | `/api/workspaces/:id/chapters/:cid/contents` | 챕터 내 새 컨텐츠 추가 |
| | `POST` | `/api/curriculum/contents/:contentId/complete` | **컨텐츠 완료 토글 (XP 지급/회수 핵심 로직)** |
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

## 6. UI/UX 디자인 가이드 (Design Preservation)
> **핵심 원칙**: 현재 하드코딩된 MVP 버전의 **디자인 퍼포먼스와 사용자 경험(UX)을 100% 유지**해야 합니다.

1.  **애니메이션 (Framer Motion)**:
    - 챕터 열기/닫기 시의 부드러운 아코디언 효과 유지.
    - 탭 전환 시 밑줄(Underline) 이동 애니메이션 유지.
2.  **스타일 (CSS/Tailwind)**:
    - 현재의 다크 모드 테마, 카드 배색, 폰트 스타일, 간격을 그대로 계승.
    - `Week` 배지, 상태 아이콘(Lock, Check, Play) 등의 시각적 요소 유지.
3.  **인터랙션**:
    - 호버 효과, 클릭 피드백 등 미세한 인터랙션이 DB 연동 후에도 끊김 없이 동작하도록 구현.

