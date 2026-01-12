// src/services/api.ts

export const GAS_BASE_URL =
  "https://script.google.com/macros/s/AKfycby699STWvVz8cKCEVphT8xZgJPNy9wGSuvIz-3sVLDqUMyhNH9XI4D-1sbRbj8aDa8q/exec";

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
}

// GAS 回傳的原始資料介面（支援兩種格式）
type GasTransactionItem = {
  id: string | number; // 修正：相容舊資料(number)與新資料(string)
  date: string;
  category: string;
  amount: number;
  note: string;
  type: "支出" | "收入";
};

interface GasListResponse {
  status?: "success" | "error";
  data?: GasTransactionItem[];
  message?: string;
  // GAS 的 getTransactions() 可能直接返回數組，也可能是 { status, data } 格式
}

// 統一處理回應的 Helper
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  
  // 因為 GAS 回傳的可能是純文字 JSON，需小心解析
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error("JSON Parse Error:", text);
    throw new Error("無法解析伺服器回應");
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
    const processed: Transaction[] = items.map((item) => {
      const parsedDate = parseDate(item.date);
      return {
        id: String(item.id), // 強制轉字串，確保統一
        date: parsedDate, // 處理日期格式問題
        category: String(item.category || ""),
        amount: Number(item.amount) || 0, // 確保是數字
        note: String(item.note || ""),
        type: (item.type === "收入" ? "收入" : "支出") as TransactionType,
      };
    }).filter((item): item is Transaction => {
      // 過濾掉無效日期的項目
      if (!item.date || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
        return false;
      }
      // 驗證年份合理性（2000-2100）
      const year = parseInt(item.date.substring(0, 4));
      return year >= 2000 && year <= 2100;
    });
    
    // 調試：顯示處理後的資料統計
    if (processed.length > 0) {
      const sorted = [...processed].sort((a, b) => b.date.localeCompare(a.date));
      console.log("載入的交易資料:", {
        total: processed.length,
        dateRange: {
          earliest: sorted[sorted.length - 1]?.date,
          latest: sorted[0]?.date
        },
        sample: sorted.slice(0, 3).map(t => ({ date: t.date, category: t.category, amount: t.amount }))
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
  const res = await fetch(GAS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "updateTransaction",
      data: { id, ...payload } // ID 放進 data 裡面
    }),
  });

  await handleResponse(res);
}

// 4. 刪除資料 (修正 Payload 結構)
export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(GAS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "deleteTransaction",
      data: { id }
    }),
  });

  await handleResponse(res);
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

    return raw.data.map((item) => {
      // GAS 返回的欄位順序：id, category, amount, note, type, dayOfMonth, isActive
      // isActive 邏輯：GAS 已處理，直接使用其返回值
      // GAS 端會將 false 或 "FALSE" 轉為 false，其他為 true
      const isActiveValue = item.isActive !== false;

      return {
        id: String(item.id),
        category: String(item.category || ""),
        amount: Number(item.amount) || 0,
        note: String(item.note || ""),
        type: item.type === "收入" ? "收入" : "支出",
        dayOfMonth: Number(item.dayOfMonth) || 1,
        isActive: isActiveValue,
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
}): Promise<any> {
  const res = await fetch(GAS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "addRecurringTransaction",
      data: {
        category: payload.category,
        amount: payload.amount,
        note: payload.note || "",
        type: payload.type ?? "支出",
        dayOfMonth: payload.dayOfMonth,
        isActive: payload.isActive !== false, // 預設為啟用
      },
    }),
  });

  return handleResponse(res);
}

// 更新固定收支
export async function updateRecurringTransaction(
  id: string,
  payload: Partial<Omit<RecurringTransaction, "id">>
): Promise<void> {
  // 確保所有欄位都有值，按照 GAS 期望的順序
  const updateData: any = {
    id: id,
    category: payload.category ?? "",
    amount: payload.amount ?? 0,
    note: payload.note ?? "",
    type: payload.type ?? "支出",
    dayOfMonth: payload.dayOfMonth ?? 1,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
  };

  const res = await fetch(GAS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "updateRecurringTransaction",
      data: updateData,
    }),
  });

  await handleResponse(res);
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

