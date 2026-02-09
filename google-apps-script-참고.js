// 구글 Apps Script 코드 (참고용)
// 이 코드를 구글 스프레드시트의 Apps Script 편집기에 붙여넣으세요

// 구글 Apps Script 코드 (최신 버전 - 시트 분리형)
// 이 코드를 구글 스프레드시트의 Apps Script 편집기에 [전체 붙여넣기] 하세요.

function doGet(e) {
  // 파라미터 로그 확인 (스크립트 에디터의 '실행' 메뉴에서 확인 가능)
  console.log("받은 파라미터:", JSON.stringify(e.parameter));

  const action = e.parameter.action;
  const sheetName = e.parameter.sheetName || 'Terms'; // 기본값 'Terms'

  if (action === 'load') {
    return loadData(e.parameter.sort, sheetName);
  } else if (action === 'save') {
    return saveData(e.parameter.term, e.parameter.description, sheetName);
  } else if (action === 'update') {
    return updateData(e.parameter.id, e.parameter.term, e.parameter.description, sheetName);
  } else if (action === 'delete') {
    return deleteData(e.parameter.ids, sheetName);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: '잘못된 요청: ' + action }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  // 시트가 없으면 새로 생성
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['ID', '용어/명령어', '설명']); // 헤더 추가
    console.log("새 시트 생성됨:", sheetName);
  }

  return sheet;
}

function loadData(sortType, sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();

  // 헤더만 있거나 데이터가 없는 경우
  if (data.length <= 1) {
    return createJsonResponse([]);
  }

  const rows = data.slice(1); // 헤더 제외
  let result = rows.map((row) => ({
    id: row[0],
    term: row[1],
    description: row[2]
  })).filter(item => item.term); // 빈 줄 제외

  return createJsonResponse(result);
}

function saveData(term, description, sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const lastRow = sheet.getLastRow();

    // ID 생성: 마지막 줄의 ID + 1
    let newId = 1;
    if (lastRow > 1) {
      const lastId = sheet.getRange(lastRow, 1).getValue();
      newId = (!isNaN(lastId) && lastId !== "") ? Number(lastId) + 1 : lastRow;
    }

    sheet.appendRow([newId, term, description]);
    return createJsonResponse({ status: 'success', message: '저장 완료', sheet: sheetName });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function deleteData(ids, sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const idArray = ids.split(',').map(id => String(id).trim());

    // 역순으로 삭제해야 인덱스가 꼬이지 않음
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      const rowId = String(data[i][0]).trim();
      if (idArray.includes(rowId)) {
        sheet.deleteRow(i + 1);
      }
    }

    return createJsonResponse({ status: 'success', message: '삭제 완료' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function updateData(id, term, description, sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    const idStr = String(id).trim();

    // ID에 해당하는 행 찾기
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === idStr) {
        sheet.getRange(i + 1, 2).setValue(term);        // 용어 수정 (B열)
        sheet.getRange(i + 1, 3).setValue(description); // 설명 수정 (C열)
        return createJsonResponse({ status: 'success', message: '수정 완료' });
      }
    }

    return createJsonResponse({ status: 'error', message: 'ID를 찾을 수 없습니다.' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// JSON 응답 생성을 위한 유틸리티 함수
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
