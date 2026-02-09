// 구글 Apps Script 코드 (참고용)
// 이 코드를 구글 스프레드시트의 Apps Script 편집기에 붙여넣으세요

function doGet(e) {
  // 기본 시트 이름은 'Terms'로 설정 (기존 데이터 호환)
  // 클라이언트에서 'sheetName' 파라미터를 보내면 해당 시트를 사용
  const sheetName = e.parameter.sheetName || 'Terms';
  const action = e.parameter.action;

  if (action === 'load') {
    return loadData(e.parameter.sort, sheetName);
  } else if (action === 'save') {
    return saveData(e.parameter.term, e.parameter.description, sheetName);
  } else if (action === 'delete') {
    return deleteData(e.parameter.ids, sheetName);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: '잘못된 요청' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  // 시트가 없으면 생성 (에러 방지)
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // 새 시트인 경우 헤더 추가
    sheet.appendRow(['ID', 'Term/Command', 'Description']);
  }

  return sheet;
}

function loadData(sortType, sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();

  // 데이터가 헤더밖에 없거나 비어있는 경우
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 헤더 제외
  const rows = data.slice(1);

  let result = rows.map((row, index) => ({
    id: row[0] || (index + 1),
    term: row[1] || '',
    description: row[2] || ''
  })).filter(item => item.term); // 빈 행 제외

  // 정렬
  if (sortType === 'newest') {
    result.reverse();
  } else if (sortType === 'alphabet') {
    result.sort((a, b) => a.term.localeCompare(b.term, 'ko'));
  }
  // 'oldest'는 기본 순서 유지

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveData(term, description, sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const lastRow = sheet.getLastRow();

    // ID 생성 로직: 기존 데이터가 있으면 마지막 ID + 1, 없으면 1
    let newId = 1;
    if (lastRow > 1) {
      const lastId = sheet.getRange(lastRow, 1).getValue();
      newId = (typeof lastId === 'number') ? lastId + 1 : lastRow;
    }

    sheet.appendRow([newId, term, description]);

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: '저장 완료' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteData(ids, sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const idArray = ids.split(',').map(id => parseInt(id));

    // 역순으로 삭제 (인덱스 변경 방지)
    idArray.sort((a, b) => b - a);

    const data = sheet.getDataRange().getValues();

    for (let id of idArray) {
      // ID에 해당하는 행 찾기 (헤더 제외하고 +1)
      // 데이터를 다시 읽지 않고 기존 data 배열을 순회하므로, 삭제 시 행 번호 계산에 주의해야 함
      // 행 삭제는 sheet에서 직접 수행

      // 더 안전한 방법: TextFinder 사용 또는 역순 순회
      // 여기서는 간단히 전체 스캔을 유지하되, 삭제 후 인덱스 밀림 현상은 
      // idArray가 이미 역순 정렬되어 있고, 한 번의 요청에 대해 처리하므로
      // SpreadsheetApp의 deleteRow는 즉시 반영됨을 고려해야 함.

      // 개선된 삭제 로직:
      // 행을 찾아서 지울 때마다 데이터 구조가 바뀌므로, 
      // 여기서는 가장 간단하게: TextFinder로 ID 컬럼(A열)에서 찾기
      const textFinder = sheet.getRange("A:A").createTextFinder(String(id)).matchEntireCell(true);
      const result = textFinder.findNext();

      if (result) {
        sheet.deleteRow(result.getRow());
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: '삭제 완료' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
