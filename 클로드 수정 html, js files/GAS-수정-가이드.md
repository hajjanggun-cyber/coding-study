# 📘 구글 앱스 스크립트 수정 가이드

## ❓ 지금 당장 수정해야 하나요?

### ✅ **아니요, 현재는 안 해도 됩니다**
- index.html만 수정해도 **정상 작동**합니다
- 프론트에서 POST 후 GET으로 재로드하므로 문제 해결됨

### ⚠️ **하지만 장기적으로는 권장**
- 서버 로직 자체가 더 효율적이고 안정적으로 개선됩니다
- 나중에 기능 추가 시 문제 발생 가능성 차단

---

## 🔄 주요 변경 사항

### 1️⃣ **ID 생성 방식 개선**

#### **변경 전 (순차 ID)**
```javascript
function saveData(term, description, sheetName) {
  let newId = 1;
  if (lastRow > 1) {
    const lastId = sheet.getRange(lastRow, 1).getValue();
    newId = Number(lastId) + 1;  // 1, 2, 3, 4...
  }
  sheet.appendRow([newId, term, description]);
}
```

**문제점:**
- 삭제 후 재등록 시 ID 중복 가능
- 여러 탭에서 동시 작업 시 충돌 가능

#### **변경 후 (타임스탬프 ID)**
```javascript
function saveData(term, description, sheetName) {
  const newId = new Date().getTime();  // 1707995123456 (밀리초)
  sheet.appendRow([newId, term, description]);
  return createJsonResponse({ status: 'success', id: newId });
}
```

**장점:**
- ✅ 절대 중복 안 됨
- ✅ 삭제 후 재등록해도 안전
- ✅ 여러 시트 간 이동해도 충돌 없음

---

### 2️⃣ **이동 시 ID 유지 (가장 중요!)**

#### **변경 전**
```javascript
function moveData(ids, sourceSheetName, targetSheetName) {
  rowsToMove.forEach((row, index) => {
    const newId = lastId + index + 1;  // ❌ 새 ID 생성 (5 → 137)
    targetSheet.appendRow([newId, row[1], row[2]]);
  });
}
```

**문제점:**
- 이동할 때마다 ID가 바뀜
- 프론트는 옛 ID로 수정 요청 → 실패

#### **변경 후**
```javascript
function moveData(ids, sourceSheetName, targetSheetName) {
  rowsToMove.forEach((row) => {
    targetSheet.appendRow([row[0], row[1], row[2]]);  // ✅ ID 그대로
  });
  
  return createJsonResponse({ 
    status: 'success',
    movedIds: idList  // 이동된 ID 목록 반환
  });
}
```

**장점:**
- ✅ ID가 절대 안 바뀜
- ✅ 이동 후 바로 수정/삭제 가능
- ✅ 프론트 재로드 필요 없음 (하지만 현재는 재로드하므로 안전)

---

## 🚀 적용 방법 (선택사항)

### **1단계: 백업**
```
현재 Google Sheets 스프레드시트 전체를 복사해서 백업
(파일 > 사본 만들기)
```

### **2단계: 코드 교체**
1. 구글 스프레드시트 열기
2. **확장 프로그램** > **Apps Script**
3. 기존 코드를 `google-apps-script-개선버전.js` 내용으로 교체
4. **저장** (Ctrl + S)

### **3단계: 재배포**
1. 우측 상단 **배포** 버튼 클릭
2. **배포 관리** 클릭
3. 기존 배포 옆의 **✏️ 편집** 아이콘 클릭
4. **버전**: "새 버전" 선택
5. **배포** 클릭

### **4단계: 테스트**
- 항목 추가 → 정상 작동 확인
- 항목 이동 → ID 확인 (F12 개발자도구 Console에서)
- 이동 후 수정 → 정상 작동 확인

---

## 📊 적용 전/후 비교

| 기능 | 현재 (미수정) | 개선 후 |
|---|---|---|
| **항목 등록** | ✅ 작동 | ✅ 작동 (ID 더 안정적) |
| **항목 수정** | ✅ 작동 (재로드 필요) | ✅ 작동 (재로드 불필요*) |
| **항목 이동** | ✅ 작동 (재로드 필요) | ✅ 작동 (ID 유지) |
| **이동 후 수정** | ✅ 작동 (재로드 필요) | ✅ 작동 |
| **ID 충돌** | ⚠️ 가능 (드물게) | ✅ 불가능 |

*프론트에서 재로드를 하고 있어서 현재도 안정적이지만, 서버 자체가 더 효율적으로 작동

---

## ⚡ 결론

### 🟢 **지금 상태 (index.html만 수정)**
- ✅ 모든 기능 정상 작동
- ✅ 이동 후 수정 가능
- ⚠️ 매번 재로드하므로 약간 느림
- ⚠️ 서버 로직에 비효율 남아있음

### 🔵 **GAS까지 수정 (선택사항)**
- ✅ 서버 로직 최적화
- ✅ ID 절대 충돌 안 됨
- ✅ 재로드 없이도 작동 (더 빠름)
- ✅ 미래 기능 추가 시 안정적

---

## 💡 추천
1. **지금 당장**: index.html만 교체하고 사용
2. **여유 있을 때**: GAS도 개선 버전으로 교체
3. **시급하지 않음**: 현재 상태로도 충분히 안정적

---

**작성**: 2026-02-15  
**작성자**: Claude (Anthropic)
