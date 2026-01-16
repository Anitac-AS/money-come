# GAS 後端更新指南

## 問題說明

目前 GAS 後端缺少 `updateTransaction` 和 `deleteTransaction` 函數，導致前端無法更新和刪除交易。

## 需要實作的函數

### 1. updateTransaction 函數

在 GAS 的 `doPost` 函數中，需要處理 `action: "updateTransaction"` 的情況。

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  const payload = data.data;

  try {
    if (action === "updateTransaction") {
      return updateTransaction(payload);
    }
    // ... 其他 action
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Server Error: " + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateTransaction(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("交易記錄"); // 或你的 Sheet 名稱
  
  if (!sheet) {
    throw new Error("找不到交易記錄 Sheet");
  }

  const id = data.id;
  const category = data.category;
  const amount = data.amount;
  const date = data.date;
  const note = data.note || "";
  const type = data.type || "支出";

  // 找到對應的列（假設 ID 在第一欄）
  const lastRow = sheet.getLastRow();
  let foundRow = null;
  
  for (let i = 2; i <= lastRow; i++) { // 從第 2 列開始（跳過標題）
    const rowId = sheet.getRange(i, 1).getValue(); // 假設 ID 在第一欄
    if (String(rowId) === String(id)) {
      foundRow = i;
      break;
    }
  }

  if (!foundRow) {
    throw new Error("找不到對應的交易記錄");
  }

  // 更新資料（根據你的欄位順序調整）
  // 假設欄位順序：ID, 日期, 類別, 金額, 備註, 類型
  sheet.getRange(foundRow, 2).setValue(date);        // 日期
  sheet.getRange(foundRow, 3).setValue(category);   // 類別
  sheet.getRange(foundRow, 4).setValue(amount);     // 金額
  sheet.getRange(foundRow, 5).setValue(note);       // 備註
  sheet.getRange(foundRow, 6).setValue(type);        // 類型

  return ContentService.createTextOutput(
    JSON.stringify({
      status: "success",
      message: "更新成功"
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

### 2. deleteTransaction 函數

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  const payload = data.data;

  try {
    if (action === "deleteTransaction") {
      return deleteTransaction(payload);
    }
    // ... 其他 action
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Server Error: " + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteTransaction(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("交易記錄"); // 或你的 Sheet 名稱
  
  if (!sheet) {
    throw new Error("找不到交易記錄 Sheet");
  }

  const id = data.id;

  // 找到對應的列
  const lastRow = sheet.getLastRow();
  let foundRow = null;
  
  for (let i = 2; i <= lastRow; i++) { // 從第 2 列開始（跳過標題）
    const rowId = sheet.getRange(i, 1).getValue(); // 假設 ID 在第一欄
    if (String(rowId) === String(id)) {
      foundRow = i;
      break;
    }
  }

  if (!foundRow) {
    throw new Error("找不到對應的交易記錄");
  }

  // 刪除該列
  sheet.deleteRow(foundRow);

  return ContentService.createTextOutput(
    JSON.stringify({
      status: "success",
      message: "刪除成功"
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

## 注意事項

1. **欄位順序**：請根據你的 Google Sheets 實際欄位順序調整 `getRange` 和 `setValue` 的欄位編號
2. **ID 欄位**：確認 ID 儲存在哪一欄（範例中假設是第一欄）
3. **Sheet 名稱**：確認你的 Sheet 名稱是否為 "交易記錄"，如果不是請修改
4. **測試**：實作後請先測試，確認功能正常

## 完整的 doPost 範例

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  const payload = data.data;

  try {
    if (action === "getTransactions") {
      return getTransactions();
    } else if (action === "addTransaction") {
      return addTransaction(payload);
    } else if (action === "updateTransaction") {
      return updateTransaction(payload);
    } else if (action === "deleteTransaction") {
      return deleteTransaction(payload);
    } else if (action === "getRecurringTransactions") {
      return getRecurringTransactions();
    } else if (action === "addRecurringTransaction") {
      return addRecurringTransaction(payload);
    } else if (action === "updateRecurringTransaction") {
      return updateRecurringTransaction(payload);
    } else if (action === "deleteRecurringTransaction") {
      return deleteRecurringTransaction(payload);
    } else {
      throw new Error("未知的 action: " + action);
    }
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Server Error: " + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```
