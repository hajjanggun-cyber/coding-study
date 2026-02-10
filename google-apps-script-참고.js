// 구글 Apps Script 코드 (참고용)
// 이 코드를 구글 스프레드시트의 Apps Script 편집기에 붙여넣으세요

function doGet(e) {
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

    const action = params.action;
    const sheetName = params.sheetName || 'Coding';

    if (action === 'save') {
      return saveData(params.term, params.description, sheetName);
    } else if (action === 'update') {
      return updateData(params.id, params.term, params.description, sheetName);
    }
  } catch (err) {
    return createJsonResponse({ status: 'error', message: 'POST 처리 중 오류: ' + err.toString() });
  }
}

// 모든 시트의 데이터를 싹 긁어서 객체로 반환 (성능 최적화용)
function loadAllData() {
  // 유효한 시트 이름 목록
  const VALID_SHEETS = ['Coding', 'Prompt', 'URL', 'Ideas', 'Lectures', 'WorkProcess', 'LecStudy'];
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
    const sheet = getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    let newId = 1;
    if (lastRow > 1) {
      const lastId = sheet.getRange(lastRow, 1).getValue();
      newId = (!isNaN(lastId) && lastId !== "") ? Number(lastId) + 1 : lastRow;
    }
    sheet.appendRow([newId, term, description]);
    return createJsonResponse({ status: 'success' });
  } catch (error) { return createJsonResponse({ status: 'error', message: error.toString() }); }
}

function updateData(id, term, description, sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    const idStr = String(id).trim();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === idStr) {
        sheet.getRange(i + 1, 2).setValue(term);
        sheet.getRange(i + 1, 3).setValue(description);
        return createJsonResponse({ status: 'success' });
      }
    }
    return createJsonResponse({ status: 'error', message: 'ID를 찾을 수 없습니다.' });
  } catch (error) { return createJsonResponse({ status: 'error', message: error.toString() }); }
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

function moveData(ids, sourceSheetName, targetSheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = getSheet(sourceSheetName);
    const targetSheet = getSheet(targetSheetName);
    const idList = ids.split(',').map(id => String(id).trim());
    const sourceData = sourceSheet.getDataRange().getValues();

    const rowsToMove = [];
    for (let i = 1; i < sourceData.length; i++) {
      if (idList.includes(String(sourceData[i][0]).trim())) { rowsToMove.push(sourceData[i]); }
    }

    let lastId = 0;
    const targetLastRow = targetSheet.getLastRow();
    if (targetLastRow > 1) { lastId = Number(targetSheet.getRange(targetLastRow, 1).getValue()); }

    rowsToMove.forEach((row, index) => {
      const newId = (isNaN(lastId) ? 0 : lastId) + index + 1;
      targetSheet.appendRow([newId, row[1], row[2]]);
    });

    for (let i = sourceData.length - 1; i >= 1; i--) {
      if (idList.includes(String(sourceData[i][0]).trim())) { sourceSheet.deleteRow(i + 1); }
    }
    return createJsonResponse({ status: 'success', message: `${rowsToMove.length}개 항목이 이동되었습니다.` });
  } catch (error) { return createJsonResponse({ status: 'error', message: error.toString() }); }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
