// 구글 Apps Script 코드 (참고용)
// 이 코드를 구글 스프레드시트의 Apps Script 편집기에 붙여넣으세요

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const action = e.parameter.action;
  
  if (action === 'load') {
    return loadData(e.parameter.sort);
  } else if (action === 'save') {
    return saveData(e.parameter.term, e.parameter.description);
  } else if (action === 'delete') {
    return deleteData(e.parameter.ids);
  }
  
  return ContentService.createTextOutput(JSON.stringify({status: 'error', message: '잘못된 요청'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function loadData(sortType) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
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

function saveData(term, description) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();
    const newId = lastRow; // 헤더가 1행이므로 lastRow가 새 ID
    
    sheet.appendRow([newId, term, description]);
    
    return ContentService.createTextOutput(JSON.stringify({status: 'success', message: '저장 완료'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteData(ids) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const idArray = ids.split(',').map(id => parseInt(id));
    
    // 역순으로 삭제 (인덱스 변경 방지)
    idArray.sort((a, b) => b - a);
    
    const data = sheet.getDataRange().getValues();
    
    for (let id of idArray) {
      // ID에 해당하는 행 찾기 (헤더 제외하고 +1)
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == id) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: 'success', message: '삭제 완료'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
