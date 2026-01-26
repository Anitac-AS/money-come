// src/services/api.ts

// 修改這裡：優先讀取環境變數，如果沒有（例如本機開發沒設定），才用後面的字串當預備
export const GAS_BASE_URL = process.env.NEXT_PUBLIC_GAS_API_URL || "https://script.google.com/macros/s/AKfycby699STWvVz8cKCEVphT8xZgJPNy9wGSuvIz-3sVLDqUMyhNH9XI4D-1sbRbj8aDa8q/exec";

// 定義類別與型別
export type TransactionCategory = string;
export type TransactionType = "支出" | "收入";

// 前端使用的資料介面
export interface Transaction {
  id: string; // 修正：配合 UUID，改為 string
  amount: number;
  category: TransactionCategory;
  date: string; // ISO string yyyy-mm-dd
  note: string;
  type: TransactionType;
  createdAt?: string; // 建立時間 (ISO string)，用於排序
}

// GAS 回傳的原始資料介面（支援兩種格式）
type GasTransactionItem = {
  id: string | number; // 修正：相容舊資料(number)與新資料(string)
  date: string;
  category: string;
  amount: number;
  note: string;
  type: "支出" | "收入";
  createdAt?: string; // 建立時間 (YYYY-MM-DD HH:MM:SS 或 ISO 格式)
};

interface GasListResponse {
  status?: "success" | "error";
  data?: GasTransactionItem[];
  message?: string;
  // GAS 的 getTransactions() 可能直接返回數組，也可能是 { status, data } 格式
}

// 統一處理回應的 Helper
async function handleResponse<T>(res: Response): Promise<T> {
  // 因為 GAS 回傳的可能是純文字 JSON，需小心解析
  const text = await res.text();
  
  try {
    const parsed = JSON.parse(text) as T;
    // 檢查 GAS 回傳的 status 欄位
    if (typeof parsed === 'object' && parsed !== null && 'status' in parsed) {
      const response = parsed as { status?: string; message?: string };
      if (response.status === 'error') {
        const errorMessage = response.message || '操作失敗';
        console.error("GAS 後端錯誤:", errorMessage);
        
        // 如果是函數未定義的錯誤，提供更清楚的提示
        if (errorMessage.includes('is not defined')) {
          throw new Error(`後端函數未實作: ${errorMessage}。請檢查 GAS 後端是否已實作對應的函數。`);
        }
        
        throw new Error(errorMessage);
      }
    }
    return parsed;
  } catch (e) {
    // 如果已經是 Error 物件（來自上面的 throw），直接重新拋出
    if (e instanceof Error) {
      throw e;
    }
    // 如果是 JSON 解析錯誤，記錄原始回應
    console.error("JSON Parse Error:", text);
    throw new Error(`無法解析伺服器回應: ${text.substring(0, 100)}`);
  }
}

// 1. 取得資料
export async function getTransactions(): Promise<Transaction[]> {
  try {
    // 注意：目前 GAS 後端不支援 server-side 篩選，所以這裡不傳參數
    // 我們統一抓回來後，在前端 (Page) 做篩選
    
    const res = await fetch(`${GAS_BASE_URL}?action=getTransactions`, {
      method: "GET",
      // 雖然是用 GET，但加上這個 header 有助於某些瀏覽器行為穩定
      headers: { "Content-Type": "text/plain" },
    });

    // 檢查回應狀態
    if (!res.ok) {
      console.error("GAS API 回應失敗:", res.status, res.statusText);
      return [];
    }

    const raw = await handleResponse<GasListResponse | GasTransactionItem[]>(res);

    // GAS 的 getTransactions() 可能直接返回數組，也可能是 { status, data } 格式
    let items: GasTransactionItem[] = [];
    
    if (Array.isArray(raw)) {
      // 直接返回數組格式（GAS 目前的實作）
      items = raw;
    } else if (raw && typeof raw === "object" && "data" in raw && Array.isArray(raw.data)) {
      // { status: "success", data: [...] } 格式
      if (raw.status === "error") {
        console.error("GAS API 返回錯誤:", raw.message);
        return [];
      }
      items = raw.data;
    } else {
      console.warn("GAS API 回傳格式不如預期:", raw);
      return [];
    }

    // 資料清洗與轉換
    const processed = items
      .map((item) => {
        const parsedDate = parseDate(item.date);
        // 處理 createdAt：可能是多種格式，統一轉換為 ISO 格式以便排序
        let createdAt: string | undefined = undefined;
        if (item.createdAt) {
          // 如果已經是 Date 對象，直接轉換為 ISO 字符串
          if (item.createdAt instanceof Date) {
            createdAt = item.createdAt.toISOString();
          } else {
            const createdAtStr = String(item.createdAt).trim();
            
            // 嘗試解析為 Date 對象（適用於各種格式）
            const parsedDate = new Date(createdAtStr);
            if (!isNaN(parsedDate.getTime())) {
              // 成功解析，轉換為 ISO 格式
              createdAt = parsedDate.toISOString();
            } else {
              // 如果無法解析，嘗試匹配特定格式
              // 格式 1: "YYYY-MM-DD HH:MM:SS"
              if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(createdAtStr)) {
                createdAt = createdAtStr.replace(' ', 'T') + '.000Z';
              } 
              // 格式 2: 已經是 ISO 格式
              else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(createdAtStr)) {
                createdAt = createdAtStr;
              } 
              // 其他格式，保留原值（但可能排序不準確）
              else {
                console.warn("無法解析 createdAt 格式:", createdAtStr);
                createdAt = createdAtStr;
              }
            }
          }
        }
        
        return {
          id: String(item.id), // 強制轉字串，確保統一
          date: parsedDate, // 處理日期格式問題
          category: String(item.category || ""),
          amount: Number(item.amount) || 0, // 確保是數字
          note: String(item.note || ""),
          type: (item.type === "收入" ? "收入" : "支出") as TransactionType,
          createdAt: createdAt, // 建立時間
        };
      })
      .filter((item) => {
        // 過濾掉無效日期的項目
        if (!item.date || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
          return false;
        }
        // 驗證年份合理性（2000-2100）
        const year = parseInt(item.date.substring(0, 4));
        return year >= 2000 && year <= 2100;
      }) as Transaction[];
    
    // 調試：顯示處理後的資料統計和排序資訊
    if (processed.length > 0) {
      const sortedByDate = [...processed].sort((a, b) => b.date.localeCompare(a.date));
      const sortedByCreatedAt = [...processed].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.localeCompare(a.createdAt);
        }
        if (a.createdAt && !b.createdAt) return -1;
        if (!a.createdAt && b.createdAt) return 1;
        return b.id.localeCompare(a.id);
      });
      
      // 找出原始資料中對應的 createdAt 原始值
      const itemsMap = new Map(items.map(i => [String(i.id), i]));
      
      console.log("📊 交易資料處理統計:", {
        total: processed.length,
        withCreatedAt: processed.filter(t => t.createdAt).length,
        withoutCreatedAt: processed.filter(t => !t.createdAt).length,
        top5ByDate: sortedByDate.slice(0, 5).map(t => ({ date: t.date, createdAt: t.createdAt, id: t.id })),
        top5ByCreatedAt: sortedByCreatedAt.slice(0, 5).map(t => {
          const original = itemsMap.get(t.id);
          return {
            date: t.date,
            createdAt: t.createdAt,
            createdAtRaw: original?.createdAt,
            id: t.id
          };
        }),
        dateRange: {
          earliest: sortedByDate[sortedByDate.length - 1]?.date,
          latest: sortedByDate[0]?.date
        },
        // 檢查最新的5筆和最早的5筆（按 createdAt 排序）
        newest5WithCreatedAt: sortedByCreatedAt.slice(0, 5).map(t => {
          const original = itemsMap.get(t.id);
          return {
            date: t.date,
            createdAt: t.createdAt,
            createdAtRaw: original?.createdAt
          };
        }),
        oldest5WithCreatedAt: sortedByCreatedAt.slice(-5).map(t => {
          const original = itemsMap.get(t.id);
          return {
            date: t.date,
            createdAt: t.createdAt,
            createdAtRaw: original?.createdAt
          };
        })
      });
    }
    
    return processed;
  } catch (error) {
    console.error("取得交易資料失敗:", error);
    // 如果 GAS 出錯，返回空陣列而不是拋出錯誤，避免整個頁面崩潰
    return [];
  }
}

// 2. 新增資料 (修正 Payload 結構)
export async function addTransaction(payload: {
  amount: number;
  category: TransactionCategory;
  date: string;
  note?: string;
  type?: TransactionType;
}): Promise<any> {
  const res = await fetch(GAS_BASE_URL, {
    method: "POST",
    headers: {
      // 關鍵：用 text/plain 避開 CORS Preflight
      "Content-Type": "text/plain;charset=utf-8",
    },
    // 修正：必須包裝成 { action: ..., data: ... } 格式
    body: JSON.stringify({
      action: "addTransaction", 
      data: {
        ...payload,
        type: payload.type ?? "支出",
      }
    }),
  });

  return handleResponse(res);
}

// 3. 更新資料 (修正 Payload 結構)
export async function updateTransaction(
  id: string,
  payload: Partial<Omit<Transaction, "id">>
): Promise<void> {
  const requestBody = {
    action: "updateTransaction",
    data: { id, ...payload } // ID 放進 data 裡面
  };
  
  console.log("更新交易請求:", requestBody);
  
  const res = await fetch(GAS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(requestBody),
  });

  await handleResponse(res);
  console.log("更新交易完成");
}

// 4. 刪除資料 (修正 Payload 結構)
export async function deleteTransaction(id: string): Promise<void> {
  const requestBody = {
    action: "deleteTransaction",
    data: { id }
  };
  
  console.log("刪除交易請求:", requestBody);
  
  const res = await fetch(GAS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(requestBody),
  });

  await handleResponse(res);
  console.log("刪除交易完成");
}

// --- 固定收支相關 ---

export interface RecurringTransaction {
  id: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  note: string;
  dayOfMonth: number; // 每月幾號 (1-31)
  isActive: boolean;
  // 分期付款相關欄位（可選）
  totalPeriods?: number; // 總期數，如果設定則為分期付款
  startDate?: string; // 起始日期 (YYYY-MM-DD)，用於計算已付期數
  totalAmount?: number; // 總金額，用於計算已付總額和剩餘金額
  createdAt?: string;
  updatedAt?: string;
}

interface GasRecurringListResponse {
  status: "success" | "error";
  data?: Array<{
    id: string | number;
    category: string;
    amount: number;
    note: string;
    type: "支出" | "收入";
    dayOfMonth: number;
    isActive: boolean;
    startDate?: string; // 起始日期
    endDate?: string; // 截止日期（GAS 表格中的欄位）
    totalAmount?: number; // 總金額（可選）
  }>;
  message?: string;
}

// 取得所有固定收支
export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  try {
    // 使用 POST 方法，與其他操作保持一致，避免 CORS 問題
    const res = await fetch(GAS_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "getRecurringTransactions",
      }),
    });

    const raw = await handleResponse<GasRecurringListResponse>(res);

    if (raw.status !== "success" || !raw.data || !Array.isArray(raw.data)) {
      console.warn("GAS API 回傳格式不如預期:", raw);
      return [];
    }

    // 輔助函數：從 startDate 和 endDate 計算總期數
    const calculatePeriods = (startDate: string, endDate: string): number => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
      return Math.max(1, months); // 至少 1 期
    };

    return raw.data.map((item) => {
      // GAS 返回的欄位順序：id, category, amount, note, type, dayOfMonth, isActive, startDate, endDate
      // isActive 邏輯：GAS 已處理，直接使用其返回值
      // GAS 端會將 false 或 "FALSE" 轉為 false，其他為 true
      const isActiveValue = item.isActive !== false;

      // 從 startDate 和 endDate 計算 totalPeriods
      const totalPeriods = (item.startDate && item.endDate) 
        ? calculatePeriods(item.startDate, item.endDate) 
        : undefined;

      return {
        id: String(item.id),
        category: String(item.category || ""),
        amount: Number(item.amount) || 0,
        note: String(item.note || ""),
        type: item.type === "收入" ? "收入" : "支出",
        dayOfMonth: Number(item.dayOfMonth) || 1,
        isActive: isActiveValue,
        totalPeriods: totalPeriods,
        startDate: item.startDate ? String(item.startDate) : undefined,
        totalAmount: item.totalAmount ? Number(item.totalAmount) : undefined,
      };
    });
  } catch (error) {
    console.error("取得固定收支失敗:", error);
    // 如果 GAS 還沒有實作此功能，返回空陣列而不是拋出錯誤
    return [];
  }
}

// 新增固定收支
export async function addRecurringTransaction(payload: {
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  note?: string;
  dayOfMonth: number;
  isActive?: boolean;
  totalPeriods?: number;
  startDate?: string;
  totalAmount?: number;
}): Promise<any> {
  // 計算截止日期：如果有起始日期和總期數，計算結束日期
  let endDate: string | undefined = undefined;
  if (payload.startDate && payload.totalPeriods) {
    const start = new Date(payload.startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + payload.totalPeriods - 1); // 總期數 - 1 個月
    endDate = end.toISOString().slice(0, 10); // YYYY-MM-DD 格式
  }

  // 構建 data 物件，按照 GAS 欄位順序：id, 類別, 金額, 備註, 類型, 每月幾號, 起始日期, 截止日期, 啟用狀態
  const data: any = {
    category: payload.category,
    amount: payload.amount,
    note: payload.note || "",
    type: payload.type ?? "支出",
    dayOfMonth: payload.dayOfMonth,
    isActive: payload.isActive !== false, // 預設為啟用
  };

  // 添加起始日期（如果存在）
  if (payload.startDate !== undefined && payload.startDate !== null && payload.startDate !== "") {
    data.startDate = payload.startDate;
  }

  // 添加截止日期（如果計算出來了）
  if (endDate) {
    data.endDate = endDate;
  }

  // 注意：totalPeriods 和 totalAmount 不直接發送到 GAS，因為 GAS 表格中沒有這些欄位
  // 但我們保留在資料結構中，以便前端使用

  const requestBody = {
    action: "addRecurringTransaction",
    data: data,
  };

  console.log("addRecurringTransaction 請求:", JSON.stringify(requestBody, null, 2));
  console.log("計算的截止日期:", endDate);

  const res = await fetch(GAS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(requestBody),
  });

  const result = await handleResponse(res);
  console.log("addRecurringTransaction 回應:", result);
  return result;
}

// 更新固定收支
export async function updateRecurringTransaction(
  id: string,
  payload: Partial<Omit<RecurringTransaction, "id">>
): Promise<void> {
  // 計算截止日期：如果有起始日期和總期數，計算結束日期
  let endDate: string | undefined = undefined;
  if (payload.startDate && payload.totalPeriods) {
    const start = new Date(payload.startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + payload.totalPeriods - 1); // 總期數 - 1 個月
    endDate = end.toISOString().slice(0, 10); // YYYY-MM-DD 格式
  }

  // 確保所有欄位都有值，按照 GAS 欄位順序：id, 類別, 金額, 備註, 類型, 每月幾號, 起始日期, 截止日期, 啟用狀態
  const updateData: any = {
    id: id,
    category: payload.category ?? "",
    amount: payload.amount ?? 0,
    note: payload.note ?? "",
    type: payload.type ?? "支出",
    dayOfMonth: payload.dayOfMonth ?? 1,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
  };

  // 添加起始日期（如果存在）
  if (payload.startDate !== undefined && payload.startDate !== null && payload.startDate !== "") {
    updateData.startDate = payload.startDate;
  }

  // 添加截止日期（如果計算出來了）
  if (endDate) {
    updateData.endDate = endDate;
  }

  // 注意：totalPeriods 和 totalAmount 不直接發送到 GAS，因為 GAS 表格中沒有這些欄位
  // 但我們保留在資料結構中，以便前端使用

  const requestBody = {
    action: "updateRecurringTransaction",
    data: updateData,
  };

  console.log("updateRecurringTransaction 請求:", JSON.stringify(requestBody, null, 2));
  console.log("計算的截止日期:", endDate);

  const res = await fetch(GAS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(requestBody),
  });

  await handleResponse(res);
  console.log("updateRecurringTransaction 完成");
}

// 刪除固定收支
export async function deleteRecurringTransaction(id: string): Promise<void> {
  const res = await fetch(GAS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "deleteRecurringTransaction",
      data: { id },
    }),
  });

  await handleResponse(res);
}

// --- 輔助函式 ---

// 處理 GAS 有時候回傳奇怪日期格式的問題
function parseDate(dateStr: string | Date | number | null | undefined): string {
  if (!dateStr) return "";
  
  // 如果是 Date 對象，直接格式化
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return "";
    const year = dateStr.getFullYear();
    const month = String(dateStr.getMonth() + 1).padStart(2, '0');
    const day = String(dateStr.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // 轉為字串處理
  const str = String(dateStr).trim();
  if (!str) return "";
  
  // 如果已經是 YYYY-MM-DD 格式，驗證並返回
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split("-").map(Number);
    // 驗證年份是否合理（2000-2100）
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return str;
    } else {
      console.warn("日期格式不合理:", str, { year, month, day });
      return "";
    }
  }
  
  // 如果 GAS 回傳的是 ISO 格式 (e.g. 2026-01-09T16:00:00.000Z)，只取前面
  if (str.includes("T")) {
    const datePart = str.split("T")[0];
    // 確保格式正確
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split("-").map(Number);
      if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return datePart;
      }
    }
  }
  
  // 嘗試解析為 Date 對象再格式化
  try {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      // 驗證年份是否合理
      if (year < 2000 || year > 2100) {
        console.warn("解析後的年份不合理:", str, "->", year);
        return "";
      }
      // 使用本地時區格式化，避免時區偏移
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    console.warn("無法解析日期:", str, e);
  }
  
  // 如果都無法解析，返回空字串
  return "";
}

