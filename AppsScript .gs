/**
 * 오름 국어 — 고1·고2 모의고사 진단 Google Sheets 백엔드
 * ────────────────────────────────────────────────────
 *
 * 사용법:
 * 1. Google Sheets 새 문서 생성 (고3용과 분리된 별도 시트)
 * 2. 확장 프로그램 → Apps Script 클릭
 * 3. 이 파일의 코드 전체를 복사하여 Code.gs 에 붙여넣기
 * 4. 저장 후 [배포] → [새 배포] → 유형: 웹 앱
 * 5. 액세스 권한: "모든 사용자" 선택
 * 6. 배포 → 웹 앱 URL 복사 → config.js 의 SCRIPT_URL 에 붙여넣기
 * 7. 시트 새로고침 후 메뉴에 "📊 성적표"가 보이면 정상
 * 8. 메뉴에서 "헤더 다시 세팅"을 한 번 클릭하여 헤더 초기화
 */

const SHEET_NAME = "결과";
const HEADERS = [
  "제출시각", "이름", "응시일", "시험", "선택과목코드", "선택과목",
  "원점수", "등급", "표준점수", "백분위",
  "오답수", "오답번호", "오답상세_JSON",
  "최우선약점패턴", "최우선약점설명",
  "학생코멘트", "학부모코멘트",
  "시간진단_코드", "시간진단_답변_JSON", "시간진단_주관식1", "시간진단_주관식2"
];

/* ════════════════════════════════════════════
   POST: 학생이 결과 제출 시 호출
   index.html submitResult가 form field로 보내는 필드를
   templates HEADERS 구조에 매핑하여 저장
   ════════════════════════════════════════════ */
function doPost(e) {
  try {
    const p = e.parameter || {};
    const sheet = getOrCreateSheet();

    // 파생 필드 계산
    const wrongList = String(p["틀린문항"] || "").split(",").filter(Boolean);
    const wrongCount = wrongList.length;

    // patternsJson에서 첫 패턴의 진단/처방 추출
    let topPattern = "";
    let topPatternDetail = "";
    try {
      const pArr = JSON.parse(p.patternsJson || "[]");
      if (pArr.length > 0) {
        topPattern = (pArr[0].code || "") + ":" + (pArr[0].name || "");
        topPatternDetail = pArr[0].diag || "";
      }
    } catch (_) {}

    // wrongDetailsJson에서 학부모 코멘트 모아 붙이기
    let parentComment = "";
    try {
      const wArr = JSON.parse(p.wrongDetailsJson || "[]");
      const notes = wArr.filter(q => q.parentNote).map(q => `[${q.no}번] ${q.parentNote}`);
      if (notes.length > 0) parentComment = notes.join("\n\n");
    } catch (_) {}

    sheet.appendRow([
      p.timestamp || new Date().toISOString(),
      p.name || "",
      "",                                  // 응시일 — index.html에서 보내지 않음
      p.examLabel || "",
      p.grade || "",                       // 선택과목코드 자리에 학년 (고1/고2)
      "국어",                               // 선택과목 자리에 "국어" 고정
      p.raw || "",
      p["예상등급"] || "",
      p["표준점수"] || "",
      p["백분위"] || "",
      wrongCount,
      p["틀린문항"] || "",
      p.wrongDetailsJson || "",
      topPattern,
      topPatternDetail,
      "",                                  // 학생코멘트 — index.html에서 안 보냄
      parentComment,
      p["시간진단"] || "",
      p.timeDiagJson || "",
      "",                                  // 시간진단_주관식1
      ""                                   // 시간진단_주관식2
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ════════════════════════════════════════════
   GET: 대시보드에서 데이터 조회 (?mode=data)
   ════════════════════════════════════════════ */
function doGet(e) {
  try {
    const mode = e.parameter.mode || "info";

    if (mode === "data") {
      const sheet = getOrCreateSheet();
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return jsonResponse({ ok: true, rows: [] });
      }
      const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();

      const rows = values.map(row => ({
        timestamp: row[0],
        name: row[1],
        date: row[2],
        examLabel: row[3],
        choice: row[4],
        choiceName: row[5],
        raw: row[6],
        grade: row[7],
        std: row[8],
        pct: row[9],
        wrongCount: row[10],
        wrongNumbers: row[11],
        wrongDetail: row[12],
        topPattern: row[13],
        topPatternDetail: row[14],
        studentComment: row[15],
        parentComment: row[16],
        timeCodes: row[17],
        timeAnswers: row[18],
        timeOpen1: row[19],
        timeOpen2: row[20]
      }));

      return jsonResponse({ ok: true, rows: rows });
    }

    return jsonResponse({ ok: true, info: "오름 국어 고1·고2 진단 백엔드가 동작 중입니다." });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ════════════════════════════════════════════
   시트 생성/가져오기 + 헤더 자동 세팅
   ════════════════════════════════════════════ */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#4a5a3a")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }
  return sheet;
}

/* ════════════════════════════════════════════
   메뉴: 시트 열면 자동으로 추가됨
   ════════════════════════════════════════════ */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📊 성적표")
    .addItem("학생별 개별 성적표 시트 생성", "buildIndividualReports")
    .addItem("전체 요약 시트 생성", "buildSummarySheet")
    .addSeparator()
    .addItem("헤더 다시 세팅", "resetHeaders")
    .addToUi();
}

function resetHeaders() {
  const sheet = getOrCreateSheet();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#4a5a3a")
    .setFontColor("#ffffff");
  SpreadsheetApp.getUi().alert("헤더를 다시 세팅했습니다.");
}

/* ════════════════════════════════════════════
   학생별 개별 성적표 시트 생성
   ════════════════════════════════════════════ */
function buildIndividualReports() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const main = ss.getSheetByName(SHEET_NAME);
  if (!main || main.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert("결과가 없습니다.");
    return;
  }

  const data = main.getRange(2, 1, main.getLastRow() - 1, HEADERS.length).getDisplayValues();

  data.forEach(row => {
    const name = row[1];
    if (!name) return;
    const sheetName = `학생_${name}`;
    let sheet = ss.getSheetByName(sheetName);
    if (sheet) ss.deleteSheet(sheet);
    sheet = ss.insertSheet(sheetName);

    sheet.getRange("A1:B1").merge().setValue(`${name} 학생 진단 리포트`)
      .setFontSize(16).setFontWeight("bold").setBackground("#4a5a3a").setFontColor("#ffffff").setHorizontalAlignment("center");

    let r = 3;
    [
      ["응시 시험", row[3]],
      ["학년", row[4]],
      ["제출 시각", row[0]],
      ["", ""],
      ["원점수", row[6]],
      ["등급", row[7] + "등급"],
      ["표준점수", row[8]],
      ["백분위", row[9]],
      ["", ""],
      ["오답 수", row[10]],
      ["오답 번호", row[11]],
      ["", ""],
      ["최우선 약점", row[13]],
      ["약점 상세", row[14]],
      ["", ""],
      ["학부모 상담용", row[16]],
      ["", ""],
      ["시간 진단 코드", row[17]]
    ].forEach(([k, v]) => {
      if (k) {
        sheet.getRange(r, 1).setValue(k).setFontWeight("bold").setBackground("#f0ede0");
        sheet.getRange(r, 2).setValue(v).setWrap(true);
      }
      r++;
    });
    sheet.setColumnWidth(1, 130);
    sheet.setColumnWidth(2, 600);
  });

  SpreadsheetApp.getUi().alert(`${data.length}명의 개별 성적표 시트를 생성했습니다.`);
}

/* ════════════════════════════════════════════
   전체 요약 시트 생성
   ════════════════════════════════════════════ */
function buildSummarySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const main = ss.getSheetByName(SHEET_NAME);
  if (!main || main.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert("결과가 없습니다.");
    return;
  }

  const data = main.getRange(2, 1, main.getLastRow() - 1, HEADERS.length).getDisplayValues();

  let summary = ss.getSheetByName("전체_요약");
  if (summary) ss.deleteSheet(summary);
  summary = ss.insertSheet("전체_요약");

  summary.getRange("A1:F1").merge().setValue("전체 요약 — 고1·고2 모의고사 진단")
    .setFontSize(16).setFontWeight("bold").setBackground("#4a5a3a").setFontColor("#ffffff").setHorizontalAlignment("center");

  // 통계
  const raws = data.map(r => parseInt(r[6], 10)).filter(v => !isNaN(v));
  const avg = raws.length ? Math.round(raws.reduce((a, b) => a + b, 0) / raws.length) : 0;
  const grades = data.map(r => parseInt(r[7], 10));
  const top = grades.filter(g => g === 1 || g === 2).length;

  // 학년별 분포
  const go1Count = data.filter(r => r[4] === "고1").length;
  const go2Count = data.filter(r => r[4] === "고2").length;

  let r = 3;
  [
    ["총 제출 수", data.length + "명"],
    ["고1 / 고2", `${go1Count}명 / ${go2Count}명`],
    ["평균 원점수", avg + "점"],
    ["1~2등급 비율", `${top}명 (${data.length ? Math.round(top / data.length * 100) : 0}%)`]
  ].forEach(([k, v]) => {
    summary.getRange(r, 1).setValue(k).setFontWeight("bold").setBackground("#f0ede0");
    summary.getRange(r, 2).setValue(v);
    r++;
  });

  // 약점 패턴 빈도
  r += 2;
  summary.getRange(r, 1, 1, 2).setValues([["약점 패턴", "발생 인원"]])
    .setFontWeight("bold").setBackground("#c9a84c").setFontColor("#ffffff");
  r++;
  const pCount = {};
  data.forEach(row => {
    if (row[13]) pCount[row[13]] = (pCount[row[13]] || 0) + 1;
  });
  const pEntries = Object.entries(pCount).sort((a, b) => b[1] - a[1]);
  if (pEntries.length === 0) {
    summary.getRange(r, 1).setValue("발동된 패턴 없음").setFontColor("#999999");
    r++;
  } else {
    pEntries.forEach(([p, c]) => {
      summary.getRange(r, 1).setValue(p);
      summary.getRange(r, 2).setValue(c + "명");
      r++;
    });
  }

  // 시간 진단 코드 빈도
  r += 2;
  summary.getRange(r, 1, 1, 2).setValues([["시간 진단", "발생 인원"]])
    .setFontWeight("bold").setBackground("#d97757").setFontColor("#ffffff");
  r++;
  const tCount = {};
  data.forEach(row => {
    const label = String(row[17] || "").trim();
    if (label) tCount[label] = (tCount[label] || 0) + 1;
  });
  const tEntries = Object.entries(tCount).sort((a, b) => b[1] - a[1]);
  if (tEntries.length === 0) {
    summary.getRange(r, 1).setValue("응답 없음").setFontColor("#999999");
    r++;
  } else {
    tEntries.forEach(([label, c]) => {
      summary.getRange(r, 1).setValue(label);
      summary.getRange(r, 2).setValue(c + "명");
      r++;
    });
  }

  // 학생 목록
  r += 2;
  const headers = ["이름", "학년", "원점수", "등급", "백분위", "오답수", "최우선 약점", "시간 진단"];
  summary.getRange(r, 1, 1, headers.length).setValues([headers])
    .setFontWeight("bold").setBackground("#4a5a3a").setFontColor("#ffffff");
  r++;
  data.forEach(row => {
    summary.getRange(r, 1, 1, 8).setValues([[
      row[1], row[4], row[6], row[7] + "등급", row[9], row[10], row[13], row[17] || ""
    ]]);
    r++;
  });

  summary.autoResizeColumns(1, 8);
  ss.setActiveSheet(summary);
  SpreadsheetApp.getUi().alert("전체 요약 시트를 생성했습니다.");
}
