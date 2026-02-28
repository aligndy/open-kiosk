# Kiosk Initial Implementation Planning Document

> **Summary**: 디지털 약자를 위한 카페 키오스크 웹 앱 초기 구현 (관리/구매/결제Mock/다국어/AI이미지)
>
> **Project**: k (카페 키오스크)
> **Version**: 0.1.0
> **Author**: dgoon
> **Date**: 2026-02-28
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

디지털 약자(고령자, 장애인 등)가 쉽게 사용할 수 있는 카페 키오스크 웹 애플리케이션을 구현한다. 기존 키오스크의 복잡한 UX, 직관적이지 않은 설명, 과도한 선택 단계 문제를 해결하여 누구나 쉽게 주문할 수 있는 인터페이스를 제공한다.

### 1.2 Background

- 많은 매장에서 키오스크를 도입하고 있지만, 복잡한 UI/UX로 인해 디지털 약자들이 사용에 어려움을 겪고 있음
- 기업 이익을 위한 낚시성 UI가 사용자 경험을 악화시킴
- 관리자와 구매자 양쪽 모두를 고려한 접근성 높은 키오스크가 필요

### 1.3 Related Documents

- Requirements: `docs/idea_sketch.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] `/admin` - 관리 페이지 (상품 등록/수정/삭제, 카테고리 관리, 다국어 번역, AI 이미지 생성)
- [ ] `/shop` - 구매 페이지 (메뉴 조회, 장바구니, 주문)
- [ ] 결제 Mock 처리 (서명 팝업 → 확인 → 완료)
- [ ] 다국어 지원 (한국어 기본, Gemini API를 통한 번역)
- [ ] AI 이미지 생성 (Gemini API를 통한 메뉴 이미지 자동 생성)
- [ ] 카메라 기반 연령대 인식 (Gemini Vision API 활용)
- [ ] 50대 이상 인식 시 '자판기 모드' (단순화된 UI) 자동 전환
- [ ] SQLite + Prisma 기반 데이터 관리

### 2.2 Out of Scope

- 실제 토스 프론트 결제 연동 (Mock으로 대체)
- 실제 POS 시스템 연동
- 사용자 인증/회원 시스템
- 주문 내역 분석/통계 대시보드
- 프린터 연동 (영수증 출력)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **관리 페이지 (/admin)** | | | |
| FR-01 | 카테고리 CRUD (예: 커피, 음료, 디저트) | High | Pending |
| FR-02 | 메뉴 아이템 CRUD (이름, 설명, 가격, 이미지, 카테고리) | High | Pending |
| FR-03 | 메뉴 이미지 업로드 (파일 직접 업로드) | High | Pending |
| FR-04 | 메뉴 이미지 AI 생성 (설명 입력 → Gemini API로 이미지 생성) | High | Pending |
| FR-05 | 다국어 번역 관리 (언어 선택 → Gemini API로 일괄 번역) | High | Pending |
| FR-06 | 메뉴 옵션 관리 (관리자가 자유롭게 옵션 그룹/항목 정의) | High | Pending |
| FR-07 | 매장 기본 설정 (매장명, 운영시간 등) | Low | Pending |
| FR-08 | 주문 목록 관리 (대기/완료 상태별 조회) | High | Pending |
| FR-09 | 주문 완료 처리 (관리자가 준비 완료 시 상태 변경) | High | Pending |
| **구매 페이지 (/shop)** | | | |
| FR-10 | 카테고리별 메뉴 조회 (큰 글씨, 큰 이미지, 단순 레이아웃) | High | Pending |
| FR-11 | 메뉴 상세 보기 (이미지, 이름, 설명, 가격) | High | Pending |
| FR-12 | 장바구니 담기/수정/삭제 | High | Pending |
| FR-13 | 주문 확인 및 결제 진행 | High | Pending |
| FR-14 | 다국어 전환 (언어 선택 버튼) | High | Pending |
| FR-15 | 옵션 선택 (메뉴에 등록된 옵션 그룹 동적 표시) | Medium | Pending |
| **카메라 기반 연령 인식 및 자판기 모드** | | | |
| FR-16 | 카메라 권한 요청 및 화면 캡처 | High | Pending |
| FR-17 | 연령대 추정 (Gemini Vision API 등 활용) | High | Pending |
| FR-18 | 50대 이상 판별 시 '자판기 모드' UI 통합 자동 전환 | High | Pending |
| FR-19 | 자판기 모드 전용 단순화 UI (대형 버튼, 옵션 생략, 빠른 결제) | High | Pending |
| **결제 (Mock)** | | | |
| FR-20 | 결제 Mock 팝업 (서명 패드 UI) | High | Pending |
| FR-21 | 서명 후 확인 버튼으로 주문 완료 처리 | High | Pending |
| FR-22 | 주문 완료 화면 (주문번호 표시) | High | Pending |
| **토스 프론트 (/tossfront)** | | | |
| FR-30 | 토스 프론트 폴링 엔드포인트 (Mock 응답) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Accessibility | 큰 글씨(최소 18px), 높은 대비, 큰 터치 영역(최소 48px) | Manual review |
| Performance | 페이지 로드 < 2초 | Lighthouse |
| Usability | 최대 3단계 이내 주문 완료 | User flow analysis |
| Responsiveness | 키오스크 해상도(1080x1920 세로) 최적화 | Device testing |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 관리 페이지에서 카테고리/메뉴 CRUD 가능
- [ ] 관리 페이지에서 이미지 업로드 및 AI 생성 가능
- [ ] 관리 페이지에서 다국어 번역 가능
- [ ] 구매 페이지에서 메뉴 조회 → 장바구니 → 결제(Mock) 플로우 완료
- [ ] 다국어 전환이 구매 페이지에서 동작
- [ ] 카메라가 있는 환경에서 사용자의 연령대를 50대 이상으로 추정하면 자판기 모드로 자동 전환
- [ ] SQLite DB에 모든 데이터 정상 저장/조회

### 4.2 Quality Criteria

- [ ] TypeScript strict mode 사용
- [ ] Zero lint errors
- [ ] Build succeeds
- [ ] 접근성 기본 요건 충족 (큰 글씨, 큰 버튼, 높은 대비)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Gemini API 호출 실패/지연 | Medium | Medium | 타임아웃 설정, 에러 시 수동 입력 fallback |
| Gemini API 비용 증가 | Low | Low | 번역/이미지 생성은 관리자 명시적 액션으로만 실행 |
| AI 생성 이미지 품질 불일치 | Medium | Medium | 미리보기 후 저장, 재생성 옵션 제공 |
| SQLite 동시 접속 제한 | Low | Low | 키오스크 단일 매장용이므로 동시 접속 제한적 |
| 다국어 번역 품질 | Medium | Medium | 관리자가 번역 결과 확인/수정 가능하게 구현 |
| 카메라 접근 권한 거부 / 장치 부재 | High | Medium | 권한 거부 시 기본 UI 폴백(동작 거부 안함) |
| 얼굴 인식 정확도 문제 | Medium | Medium | 보조적 수단으로 사용하고, 수동으로 UI 토글 가능한 버튼(돋보기 등) 제공 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | ☐ |
| **Dynamic** | Feature-based modules, fullstack | Web apps with backend, SaaS MVPs | ☑ |
| **Enterprise** | Strict layer separation, microservices | High-traffic systems | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js / React / Vue | **Next.js (App Router)** | idea_sketch.md 요구사항, SSR + API Routes 통합 |
| Language | TypeScript / JavaScript | **TypeScript** | 타입 안정성, idea_sketch.md 요구사항 |
| Database | SQLite + Prisma / PostgreSQL | **SQLite + Prisma** | idea_sketch.md 요구사항, 매장 단위 경량 DB |
| Styling | Tailwind / CSS Modules | **Tailwind CSS** | 빠른 개발, 접근성 커스텀 용이 |
| State Management | Context / Zustand | **Zustand** | 장바구니 등 클라이언트 상태 관리에 경량 |
| AI API | Gemini / OpenAI | **Gemini API** | 요구사항 명시, 번역 + 이미지 생성 통합 |
| Image Storage | Local filesystem / Cloud | **Local (public/)** | 초기 구현, 단일 서버 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

Folder Structure Preview:
┌─────────────────────────────────────────────────────┐
│ src/                                                │
│   app/                                              │
│     admin/           # 관리 페이지                    │
│       page.tsx       # 관리 메인                      │
│       categories/    # 카테고리 관리                   │
│       menus/         # 메뉴 관리                      │
│       translations/  # 번역 관리                      │
│       settings/      # 매장 설정                      │
│     shop/            # 구매 페이지                     │
│       page.tsx       # 메뉴 조회                      │
│       cart/          # 장바구니                        │
│       order/         # 주문/결제                       │
│     api/             # API Routes                    │
│       categories/    # 카테고리 API                    │
│       menus/         # 메뉴 API                       │
│       orders/        # 주문 API                       │
│       translate/     # 번역 API (Gemini)              │
│       generate-image/# 이미지 생성 API (Gemini)       │
│       tossfront/     # 토스 프론트 Mock API            │
│     layout.tsx                                       │
│   components/        # 공용 컴포넌트                   │
│     ui/              # 기본 UI 컴포넌트                │
│     admin/           # 관리 전용 컴포넌트              │
│     shop/            # 구매 전용 컴포넌트              │
│   lib/               # 유틸리티                       │
│     prisma.ts        # Prisma client                 │
│     gemini.ts        # Gemini API client             │
│   types/             # 타입 정의                      │
│   stores/            # Zustand stores                │
│ prisma/                                              │
│   schema.prisma      # DB 스키마                      │
│ public/                                              │
│   uploads/           # 업로드 이미지                   │
│   generated/         # AI 생성 이미지                  │
└─────────────────────────────────────────────────────┘
```

### 6.4 데이터 모델 개요

```
Category
├── id, name, nameTranslations (JSON), sortOrder, isActive

Menu
├── id, categoryId, name, nameTranslations (JSON)
├── description, descriptionTranslations (JSON)
├── price, imageUrl, isActive, sortOrder

MenuOption (사이즈, 온도 등)
├── id, menuId, groupName, groupNameTranslations (JSON)
├── name, nameTranslations (JSON), priceModifier

Order
├── id, orderNumber, status, totalAmount, createdAt

OrderItem
├── id, orderId, menuId, quantity, unitPrice, options (JSON)

Translation (번역 메타 관리)
├── id, language, isComplete, translatedAt

StoreSettings
├── id, storeName, supportedLanguages (JSON), defaultLanguage
```

### 6.5 주요 페이지 플로우

```
[구매 플로우 - 최대 3단계]
1. 메뉴 선택 (카테고리 탭 + 메뉴 그리드)
   → 메뉴 클릭 시 옵션 선택 모달
   → 장바구니 담기
2. 장바구니 확인 (수량 변경, 삭제)
   → 결제하기 버튼
3. 결제 (Mock 서명 팝업)
   → 서명 → 확인 → 주문 완료 (주문번호)

[관리 플로우]
- 카테고리 관리 (추가/수정/삭제/정렬)
- 메뉴 관리 (추가/수정/삭제, 이미지 업로드 or AI 생성)
- 번역 관리 (언어 선택 → 일괄 번역 → 결과 확인/수정)
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [ ] `CLAUDE.md` has coding conventions section
- [ ] ESLint configuration
- [ ] Prettier configuration
- [ ] TypeScript configuration (`tsconfig.json`)

> 신규 프로젝트이므로 모든 컨벤션을 초기 설정에서 정의해야 함

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | missing | camelCase (변수/함수), PascalCase (컴포넌트/타입) | High |
| **Folder structure** | missing | Dynamic level 구조 (위 6.3 참조) | High |
| **Import order** | missing | react → next → external → internal → types | Medium |
| **Error handling** | missing | try-catch + toast notification | Medium |
| **API Routes** | missing | RESTful, /api/{resource} 패턴 | High |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `DATABASE_URL` | SQLite DB 경로 | Server | ☑ |
| `GEMINI_API_KEY` | Gemini API 인증 키 | Server | ☑ |

### 7.4 Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| next | Framework | latest |
| typescript | Language | latest |
| prisma / @prisma/client | ORM | latest |
| @google/generative-ai | Gemini API SDK | latest |
| zustand | State management | latest |
| tailwindcss | Styling | latest |

---

## 8. Next Steps

1. [ ] Plan 문서 리뷰 및 승인
2. [ ] Design 문서 작성 (`/pdca design kiosk-initial`)
3. [ ] Next.js 프로젝트 초기화 및 Prisma 설정
4. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-28 | Initial draft | dgoon |
