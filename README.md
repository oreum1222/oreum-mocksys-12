# 오름 국어 · 고1·고2 모의고사 진단 시스템

고3용 `oreum-mocksys`의 자매 저장소. 고1·고2 학력평가/모의고사 응시 결과를
4단계(기본 정보 → 오답 마킹 → 시간 진단 → 진단 리포트)로 진단하는 SPA.

## 운영 구조

```
oreum-mocksys-12/
├── index.html          ← 메인 라우터 페이지
├── dashboard.html      ← 강사용 대시보드 (oreum-mocksys에서 복사)
├── config.js           ← Apps Script URL, 비번
├── AppsScript.gs       ← Google Apps Script 코드 (oreum-mocksys에서 복사)
└── data/
    └── mock-YYYY-MM.json  ← 회차별 데이터 파일
```

## 고3용과의 차이점

- 선택과목(화작·언매) 분기 없음 — **국어 1~45번 단일 구조**
- 학년 옵션: 고1 / 고2
- 등급컷: 단일 배열 (객체 아님)

## 새 회차 추가 방법

1. `data/` 폴더에 `mock-YYYY-MM.json` 파일 업로드
2. `index.html`의 `EXAM_LIST` 배열 맨 위에 객체 한 줄 추가:

```javascript
{
  id: '2026-03-go1', file: 'data/mock-2026-03-go1.json',
  no: '제 1 회', tagDate: '2026년 3월 학력평가',
  status: 'active', statusLabel: '정식 운영'
},
```

## JSON 스키마

```json
{
  "examMeta": {
    "id": "2026-03-go1",
    "label": "2026년 3월 고1 전국연합학력평가",
    "gradeLabel": "고1",
    ...
  },
  "answers": { "1": 1, "2": 4, ... },
  "gradeCuts": [
    { "grade": 1, "raw": 86, "std": 130, "pct": 96 },
    ...
  ],
  "questions": {
    "common": [
      { "no": 1, "area": "독서", "source": "...", "coreElement": "...", ... },
      ...
    ]
  },
  "discriminationFlags": [
    { "key": "23", "note": "...", "level": "1" },
    ...
  ],
  "patternRules": [],
  "timeSurvey": [...],
  "timeDiagnosticCodes": {...}
}
```

## 초기 설정

1. GitHub 저장소 `oreum-mocksys-12` 생성
2. 4개 파일 + `data/` 폴더 업로드
3. Settings → Pages에서 GitHub Pages 활성화 (main 브랜치)
4. 새 Google Sheets 시트 생성 (고3과 분리)
5. 시트의 도구 → Apps Script에서 `AppsScript.gs` 코드 붙여넣기
6. 배포 → 새 배포 → 웹 앱 (액세스: 모든 사람) → URL 받기
7. `config.js`의 `SCRIPT_URL`에 URL 입력 후 commit
8. 시트 메뉴에서 "📊 성적표 → 헤더 다시 세팅" 클릭하여 헤더 초기화

배포 URL: `https://oreum1222.github.io/oreum-mocksys-12/`
