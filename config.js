// ═══════════════════════════════════════════════════════════════
// 오름 국어 · 고1·고2 모의고사 진단 시스템 — 설정 파일
// ═══════════════════════════════════════════════════════════════
//
// 사용법:
//   1) 새 Google Sheets 시트를 만들고
//   2) 도구 → Apps Script 메뉴에서 AppsScript.gs 코드 붙여넣기
//   3) "배포 → 새 배포 → 웹 앱"으로 배포한 후 URL을 받기
//   4) 아래 SCRIPT_URL 자리에 그 URL을 그대로 붙여넣기
//   5) DASH_PASSWORD는 대시보드 접근 비밀번호 (자유롭게 설정)
//
// ※ 고3용(oreum-mocksys)과는 별도의 시트·별도의 Apps Script를 사용해야 합니다.
//   고1·고2 응답이 고3 시트에 섞이지 않도록 분리 운영.

window.OREUM_CONFIG = {
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycby7ycoIe7Arorw4BVLtDCJmFe9LHEcBJASJzjueBZpVVeKjTJKB21nOaqeX_G5NiRFhsQ/exec",
  DASH_PASSWORD: "PASTE_YOUR_DASHBOARD_PASSWORD_HERE"
};
