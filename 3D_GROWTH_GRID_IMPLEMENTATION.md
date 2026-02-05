# 3D 성장 그리드 (Growth Grid) 기술 구현 기획서

## 1. 기술 스택 및 라이브러리 선정 (Tech Stack)

### Core Libraries
-   **React Three Fiber (R3F)**: React 생태계와 자연스럽게 통합되는 3D 렌더링을 위해 선정.
-   **Three.js**: R3F의 기반.
-   **@react-three/drei**: 이미 구현된 유용한 3D 헬퍼들 (OrbitControls, Text, Html, Stars 등) 사용.
-   **@react-three/postprocessing**: Bloom(네온 발광) 효과 및 Depth of Field 구현.
-   **React Spring / Framer Motion**: 부드러운 카메라 전환 및 큐브 인터랙션 물리 애니메이션.
-   **Zustand**: 3D 씬 내부의 복잡한 상태(현재 드래그 중인 객체, 카메라 모드 등) 관리.

### 기술적 제약 사항 (Constraints)
-   **Performance**: 웹 브라우저 환경이므로, 큐브 개수가 늘어나도 60fps를 유지해야 함 (Instancing 기법 고려).
-   **Accessibility**: 3D 조작이 어려운 사용자를 위해 2D 리스트 뷰로 전환하는 기능 유지.

---

## 2. 아키텍처 및 데이터 모델 (Architecture & Data Model)

### 2.1 데이터베이스 스키마 수정 (Prisma)
각 워크스페이스의 "위치 정보"를 저장해야 합니다.

```prisma
model Workspace {
  id          String   @id @default(cuid())
  // ... 기존 필드들

  // 3D 위치 정보
  gridX       Int      @default(0) // 그리드 X 좌표
  gridZ       Int      @default(0) // 그리드 Z 좌표 (깊이)
  stackIndex  Int      @default(0) // 같은 좌표에 쌓인 순서 (0층, 1층, ...)
  
  // 회전값이 필요한 경우 (선택 사항)
  rotation    Int      @default(0) // 0, 90, 180, 270 도
}
```

### 2.2 클라이언트 상태 관리 (Zustand Store)
```typescript
interface GridState {
  isEditMode: boolean; // 편집 모드 여부
  cameraView: 'ISOMETRIC' | 'TOP_DOWN'; // 시점 모드
  selectedWorkspaceId: string | null;
  draggingWorkspaceId: string | null;
  
  // Actions
  setCameraView: (view: 'ISOMETRIC' | 'TOP_DOWN') => void;
  updatePosition: (id: string, x: number, z: number) => void;
}
```

---

## 3. 핵심 기능 구현 전략 (Core Implementation Strategy)

### 3.1 씬(Scene) & 카메라 (Camera)
*   **Camera**: `OrthographicCamera` (직교 투영)를 사용하여 왜곡 없는 아이소메트릭 뷰 구현.
    *   각도: `position={[20, 20, 20]}`, `lookAt={[0, 0, 0]}`
*   **Controls**: `MapControls` 또는 `OrbitControls`를 커스텀하여 팬(Pan), 줌(Zoom), 회전 제한 설정.
    *   *제약*: 땅 밑으로 카메라가 내려가지 않도록 `maxPolarAngle` 설정.

### 3.2 그리드 시스템 & 시각화 (Grid System)
*   **Grid Helper**: `GridHelper`를 커스텀 셰이더로 감싸서, 중심부에서 멀어질수록 페이드 아웃(Fade-out)되는 "무한 그리드" 효과 구현.
*   **Interactive Plane**: 마우스 레이캐스팅(Raycasting)을 감지할 투명한 바닥 평면(`Mesh`) 배치.

### 3.3 큐브 렌더링 (Cube Visuals)
*   **Geometry**: `BoxGeometry`에 `RoundedBoxGeometry`를 적용하여 모서리를 부드럽게 처리.
*   **Material**: `MeshPhysicalMaterial` 사용.
    *   `transmission`: 0.6 (유리처럼 투과)
    *   `roughness`: 0.1 (매끄러운 표면)
    *   `thickness`: 큐브 내부 깊이감 표현.
*   **Border**: `EdgesGeometry`를 사용하여 큐브 테두리에 네온 셰이더(`emissive`) 적용. 카테고리별 색상 매핑.
*   **Internal Content**: 큐브 내부에 `Image` 텍스처를 띄우거나, `<Html transform>`을 사용하여 고해상도 UI 렌더링 (성능 주의).

### 3.4 인터랙션 & 물리 (Drag & Stack Logic)
가장 복잡한 부분으로, `use-gesture`와 `raycaster` 조합 사용.

1.  **Drag Start**: 마우스가 큐브를 잡으면 `draggingWorkspaceId` 상태 업데이트.
2.  **Dragging**:
    *   Raycaster가 바닥 평면(Grid Plane)과 교차하는 지점 계산.
    *   좌표를 정수화(Snap)하여 그리드 칸에 딱 맞게 이동. 
    *   `Math.round(intersectPoint.x / UNIT_SIZE) * UNIT_SIZE`
3.  **Stacking Logic (충돌 감지)**:
    *   드롭하려는 `(x, z)` 좌표에 이미 다른 큐브가 있는지 `Workspaces` 배열 검사.
    *   존재한다면, 해당 좌표의 `Max(stackIndex) + 1` 높이로 큐브를 이동 (자석처럼 위에 붙음).
4.  **Drop (Save)**:
    *   최종 위치 확정 시, 서버 API 호출 (`PATCH /api/workspaces/position`)하여 DB 업데이트.

---

## 4. 단계별 개발 로드맵 (Milestones)

### Phase 1: 환경 구성 및 기본 렌더링 (Foundation)
- [ ] R3F, Drei 등 라이브러리 설치.
- [ ] Next.js 페이지에 `<Canvas>` 마운트 및 기본 `OrbitControls`, `Lights` 설정.
- [ ] '무한 그리드' 바닥 구현 (ShaderMaterial).
- [ ] 더미 데이터로 큐브 1개 렌더링 및 Glassmorphism 재질 테스트.

### Phase 2: 데이터 연동 및 배치 (Data Integ.)
- [ ] Prisma Schema 업데이트 (`gridX`, `gridZ`, `stackIndex`).
- [ ] `/api/workspaces` 응답에 좌표 데이터 포함.
- [ ] DB 데이터를 기반으로 3D 씬에 복수의 큐브 배치.

### Phase 3: 인터랙션 구현 (Interaction)
- [ ] 드래그 앤 드롭 시스템 구현 (x, z 축 이동).
- [ ] 그리드 스냅(Snap) 로직 적용.
- [ ] 스태킹(Stacking) 로직 구현 (같은 좌표 감지 및 y축 오프셋).
- [ ] 위치 변경 시 낙관적 업데이트(Optimistic Update) 및 DB 저장.

### Phase 4: 폴리싱 및 효과 (Polish)
- [ ] Post-processing (Bloom) 효과 추가로 네온 느낌 강화.
- [ ] 큐브 호버(Hover) 시 확대/강조 인터랙션.
- [ ] '항공뷰(Top-down)' 전환 버튼 기능 구현.
- [ ] 큐브 클릭 시 워크스페이스 상세 페이지로 라우팅.

---

## 5. 예상되는 기술적 난관 및 해결책

*   **HTML Overlay 싱크 문제**: 큐브가 움직일 때 내부 텍스트/이미지(`Html` 컴포넌트)가 밀리는 현상.
    *   *해결*: `<Html transform occlude>` 옵션을 사용하여 3D 좌표계에 돔 요소를 완벽하게 동기화하고, 가려짐(Occlusion) 처리.
*   **스태킹 계산 오류**: 빠르게 드래그할 때 중간 층에 끼어들어가는 버그.
    *   *해결*: 드롭 시점에만 좌표를 계산하지 않고, 드래그 중 `onMove` 시점에 타겟 좌표의 '가장 높은 높이'를 미리 계산하여 가이드(Ghost Cube)를 보여줌.
