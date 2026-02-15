// 구글 Apps Script 코드 (개선 버전)
// 이 코드를 구글 스프레드시트의 Apps Script 편집기에 붙여넣으세요

// 🔒 보안 설정: 이 비밀번호를 원하는 대로 변경하세요!
const APP_PASSWORD = "0428";

function doGet(e) {
  // 비밀번호 검증
  if (e.parameter.password !== APP_PASSWORD) {
    return createJsonResponse({ status: 'error', message: '비밀번호가 일치하지 않습니다.' });
  }

  const action = e.parameter.action;

  const sheetName = e.parameter.sheetName || 'Coding';

  if (action === 'loadAll') {
    return loadAllData();
  } else if (action === 'delete') {
    return deleteData(e.parameter.ids, sheetName);
  } else if (action === 'move') {
    return moveData(e.parameter.ids, e.parameter.sheetName, e.parameter.targetSheet);
  } else if (action === 'load') {
    return loadData(e.parameter.sort, sheetName);
  } else if (action === 'reorder') {
    return reorderData(e.parameter.id, e.parameter.direction, sheetName);
  }
}

// POST 요청 처리 (긴 데이터를 저장/수정할 때 사용)
function doPost(e) {
  try {
    let params;

    // 1. JSON 형태의 데이터인 경우 (e.postData 사용)
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (e) {
        // JSON 파싱 실패 시 일반 파라미터로 시도
        params = e.parameter;
      }
    }

    // 2. 만약 params가 비어있다면 e.parameter에서 직접 가져옴
    if (!params || Object.keys(params).length === 0) {
      params = e.parameter;
    }

    // 비밀번호 검증 (POST)
    if (params.password !== APP_PASSWORD) {
      return createJsonResponse({ status: 'error', message: '비밀번호가 일치하지 않습니다.' });
    }

    const action = params.action;
    const sheetName = params.sheetName || 'Coding';

    if (action === 'loadAll') {
      return loadAllData();
    } else if (action === 'save') {
      return saveData(params.term, params.description, sheetName);
    } else if (action === 'update') {
      return updateData(params.id, params.term, params.description, sheetName);
    } else if (action === 'delete') {
      return deleteData(params.ids, sheetName);
    } else if (action === 'move') {
      return moveData(params.ids, params.sheetName, params.targetSheet);
    } else if (action === 'reorder') {
      return reorderData(params.id, params.direction, sheetName);
    } else if (action === 'load') { // POST로도 로드 가능하게 (선택사항)
      return loadData(params.sort, sheetName);
    }
  } catch (err) {
    return createJsonResponse({ status: 'error', message: 'POST 처리 중 오류: ' + err.toString() });
  }
}

// 모든 시트의 데이터를 싹 긁어서 객체로 반환 (성능 최적화용)
function loadAllData() {
  // 유효한 시트 이름 목록
  const VALID_SHEETS = ['Coding', 'Prompt', 'URL', 'Ideas', 'WorkProcess', 'Jungri', 'Customer', 'Visit', 'ItemDetail', 'Private'];
  const result = {};

  VALID_SHEETS.forEach(name => {
    const sheet = getSheet(name);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      result[name] = [];
    } else {
      result[name] = data.slice(1).map(row => ({
        id: row[0],
        term: row[1],
        description: row[2]
      })).filter(item => item.term);
    }
  });

  return createJsonResponse(result);
}

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['ID', '용어/명령어', '설명']);
  }
  return sheet;
}

function loadData(sortType, sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]);
  const rows = data.slice(1);
  let result = rows.map((row) => ({ id: row[0], term: row[1], description: row[2] })).filter(item => item.term);
  return createJsonResponse(result);
}

function saveData(term, description, sheetName) {
  try {
    Logger.log('saveData 호출: term=' + term + ', sheet=' + sheetName);
    
    const sheet = getSheet(sheetName);
    const newId = new Date().getTime();
    
    Logger.log('새 ID 생성: ' + newId);
    sheet.appendRow([newId, term, description]);
    Logger.log('데이터 추가 완료');
    
    return createJsonResponse({ status: 'success', id: newId });
  } catch (error) {
    Logger.log('saveData 오류: ' + error.toString());
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function updateData(id, term, description, sheetName) {
  try {
    Logger.log('updateData 호출: ID=' + id + ', term=' + term + ', sheet=' + sheetName);
    
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    const idStr = String(id).trim();
    
    Logger.log('전체 데이터 행 수: ' + data.length);
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === idStr) {
        Logger.log('ID 일치 발견: 행 ' + (i + 1));
        sheet.getRange(i + 1, 2).setValue(term);
        sheet.getRange(i + 1, 3).setValue(description);
        Logger.log('업데이트 완료');
        return createJsonResponse({ status: 'success' });
      }
    }
    
    Logger.log('ID를 찾을 수 없음: ' + idStr);
    return createJsonResponse({ status: 'error', message: 'ID를 찾을 수 없습니다.' });
  } catch (error) { 
    Logger.log('updateData 오류: ' + error.toString());
    return createJsonResponse({ status: 'error', message: error.toString() }); 
  }
}

function deleteData(ids, sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const idList = ids.split(',').map(id => String(id).trim());
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (idList.includes(String(data[i][0]).trim())) { sheet.deleteRow(i + 1); }
    }
    return createJsonResponse({ status: 'success' });
  } catch (error) { return createJsonResponse({ status: 'error', message: error.toString() }); }
}

// ✅ 개선: 이동 시 ID 유지 (새 ID 생성하지 않음)
function moveData(ids, sourceSheetName, targetSheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = getSheet(sourceSheetName);
    const targetSheet = getSheet(targetSheetName);
    const idList = ids.split(',').map(id => String(id).trim());
    const sourceData = sourceSheet.getDataRange().getValues();

    const rowsToMove = [];
    for (let i = 1; i < sourceData.length; i++) {
      if (idList.includes(String(sourceData[i][0]).trim())) {
        rowsToMove.push(sourceData[i]);
      }
    }

    // ✅ 핵심 변경: 기존 ID를 그대로 유지
    rowsToMove.forEach((row) => {
      targetSheet.appendRow([row[0], row[1], row[2]]);  // ID 그대로 사용
    });

    // 원본 시트에서 삭제
    for (let i = sourceData.length - 1; i >= 1; i--) {
      if (idList.includes(String(sourceData[i][0]).trim())) {
        sourceSheet.deleteRow(i + 1);
      }
    }

    return createJsonResponse({
      status: 'success',
      message: `${rowsToMove.length}개 항목이 이동되었습니다.`,
      movedIds: idList  // 이동된 ID 목록 반환
    });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function reorderData(id, direction, sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) == String(id)) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) return createJsonResponse({ status: 'error', message: 'ID not found' });

    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(rowIndex + ':' + rowIndex);

    let targetIndex;
    if (direction === 'top') {
      if (rowIndex === 2) return createJsonResponse({ status: 'success' });
      targetIndex = 2;
    } else if (direction === 'bottom') {
      if (rowIndex === lastRow) return createJsonResponse({ status: 'success' });
      targetIndex = lastRow + 1;
    } else if (direction === 'up') {
      if (rowIndex === 2) return createJsonResponse({ status: 'success' });
      targetIndex = rowIndex - 1;
    } else if (direction === 'down') {
      if (rowIndex === lastRow) return createJsonResponse({ status: 'success' });
      targetIndex = rowIndex + 2;
    }

    sheet.moveRows(range, targetIndex);
    return createJsonResponse({ status: 'success' });
  } catch (error) { return createJsonResponse({ status: 'error', message: error.toString() }); }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
