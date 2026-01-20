# GAS 後端更新指南

## 問題說明

目前 GAS 後端缺少 `updateTransaction` 和 `deleteTransaction` 函數，導致前端無法更新和刪除交易。

另外，為了正確排序交易記錄（越後面建立的排越前面），需要在交易記錄中添加 `createdAt`（建立時間）欄位。

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

## 添加 createdAt 欄位（用於排序）

為了讓交易記錄能夠按照建立時間正確排序（越後面建立的排越前面），需要在 Google Sheets 的「交易記錄」分頁中添加 `createdAt` 欄位。

### 1. 在 Google Sheets 中添加欄位

在「交易記錄」分頁的標題列添加 `createdAt` 欄位（建議放在最後一欄）。

### 2. 更新 `addTransaction` 函數

在新增交易時，自動記錄建立時間：

```javascript
function addTransaction(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("交易記錄");
  
  if (!sheet) {
    throw new Error("找不到交易記錄 Sheet");
  }

  // 生成 UUID
  const id = Utilities.getUuid();
  
  // 獲取當前時間（ISO 格式：YYYY-MM-DDTHH:mm:ss.sssZ）
  const createdAt = new Date().toISOString();
  
  // 根據你的欄位順序調整
  // 假設欄位順序：id, 日期, 類別, 金額, 備註, 類型, createdAt
  const newRow = [
    id,
    data.date || new Date().toISOString().split('T')[0], // 日期
    data.category || "",
    data.amount || 0,
    data.note || "",
    data.type || "支出",
    createdAt // 建立時間
  ];
  
  sheet.appendRow(newRow);
  
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "success",
      message: "新增成功",
      id: id
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

### 3. 更新 `getTransactions` 函數

確保返回 `createdAt` 欄位（如果已經存在，應該會自動返回）。

### 4. 處理舊資料

對於舊的資料（沒有 `createdAt` 欄位），前端會使用 `id` 作為備用排序方案。如果需要為舊資料補上 `createdAt`，可以在 Google Sheets 中使用公式或手動填入。

**注意**：如果 GAS 後端沒有返回 `createdAt` 欄位，前端會使用 `id` 作為備用排序方案，但這可能不如使用實際的建立時間準確。
