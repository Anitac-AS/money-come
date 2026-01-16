"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  getRecurringTransactions,
  addRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  RecurringTransaction,
  TransactionCategory,
  TransactionType,
} from "@/services/api";
import { CATEGORY_COLORS } from "@/lib/constants";

const DEFAULT_COLOR = "#cbd5e1";

const CATEGORIES: TransactionCategory[] = [
  "三餐",
  "食品飲料",
  "交通",
  "居家生活",
  "娛樂休閒",
  "美妝服飾",
  "教育學習",
  "小孩",
  "醫療藥品",
  "水電居住",
  "禮金禮物",
  "社交",
  "薪水",
  "投資",
  "其他雜項",
];

function formatCurrency(amount: number) {
  return amount.toLocaleString("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  });
}

// 格式化日期顯示（YYYY-MM-DD -> YYYY年MM月DD日）
function formatDateDisplay(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const [year, month, day] = dateStr.split('-');
  return `${year}年${parseInt(month)}月${parseInt(day)}日`;
}

// 計算分期付款資訊
function calculateInstallmentInfo(item: RecurringTransaction) {
  if (!item.totalPeriods || !item.startDate) {
    return null;
  }

  const startDate = new Date(item.startDate);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // 計算已付期數：從起始日期到當前日期經過的月份數
  let paidPeriods = 0;
  if (startDate <= today) {
    const yearDiff = currentYear - startDate.getFullYear();
    const monthDiff = currentMonth - startDate.getMonth();
    paidPeriods = yearDiff * 12 + monthDiff + 1; // +1 因為起始月份也算一期
    
    // 如果當前日期還沒到該月的付款日，則不算當月
    if (today.getDate() < item.dayOfMonth) {
      paidPeriods = Math.max(0, paidPeriods - 1);
    }
  }

  const remainingPeriods = Math.max(0, item.totalPeriods - paidPeriods);
  const paidAmount = paidPeriods * item.amount;
  const remainingAmount = item.totalAmount 
    ? item.totalAmount - paidAmount 
    : remainingPeriods * item.amount;

  // 計算結束日期：起始日期 + (總期數 - 1) 個月
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + item.totalPeriods - 1);
  const endDateStr = endDate.toISOString().slice(0, 10);

  return {
    paidPeriods,
    remainingPeriods,
    totalPeriods: item.totalPeriods,
    paidAmount,
    remainingAmount,
    totalAmount: item.totalAmount || item.totalPeriods * item.amount,
    startDate: item.startDate,
    endDate: endDateStr,
  };
}

export default function RecurringPage() {
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(
    null
  );
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] =
    useState<TransactionCategory>("三餐");
  const [editType, setEditType] = useState<TransactionType>("支出");
  const [editDayOfMonth, setEditDayOfMonth] = useState("1");
  const [editNote, setEditNote] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editTotalPeriods, setEditTotalPeriods] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editTotalAmount, setEditTotalAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadRecurringTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecurringTransactions();
      console.log("載入的固定收支資料:", data);
      // 檢查是否有分期付款資料
      data.forEach((item) => {
        if (item.totalPeriods || item.startDate || item.totalAmount) {
          console.log("分期付款項目:", {
            id: item.id,
            note: item.note || item.category,
            totalPeriods: item.totalPeriods,
            startDate: item.startDate,
            totalAmount: item.totalAmount,
            amount: item.amount,
          });
        }
      });
      setRecurringTransactions(data);
    } catch (err) {
      console.error(err);
      setError("讀取固定收支失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecurringTransactions();

    const handler = () => {
      loadRecurringTransactions();
    };
    window.addEventListener("recurring:created", handler);
    window.addEventListener("recurring:updated", handler);
    window.addEventListener("recurring:deleted", handler);
    return () => {
      window.removeEventListener("recurring:created", handler);
      window.removeEventListener("recurring:updated", handler);
      window.removeEventListener("recurring:deleted", handler);
    };
  }, []);

  const handleOpenEdit = (item: RecurringTransaction | null) => {
    if (item) {
      setEditingItem(item);
      setEditAmount(String(item.amount));
      setEditCategory(item.category);
      setEditType(item.type);
      setEditDayOfMonth(String(item.dayOfMonth));
      setEditNote(item.note || "");
      setEditIsActive(item.isActive);
      setEditTotalPeriods(item.totalPeriods ? String(item.totalPeriods) : "");
      setEditStartDate(item.startDate || "");
      setEditTotalAmount(item.totalAmount ? String(item.totalAmount) : "");
    } else {
      // 新增模式
      setEditingItem(null);
      setEditAmount("");
      setEditCategory("三餐");
      setEditType("支出");
      setEditDayOfMonth("1");
      setEditNote("");
      setEditIsActive(true);
      setEditTotalPeriods("");
      setEditStartDate("");
      setEditTotalAmount("");
    }
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingItem(null);
    setEditAmount("");
    setEditNote("");
    setEditCategory("三餐");
    setEditType("支出");
    setEditDayOfMonth("1");
    setEditTotalPeriods("");
    setEditStartDate("");
    setEditTotalAmount("");
    setEditIsActive(true);
  };

  const handleSave = async () => {
    const parsedAmount = Number(editAmount.replace(/[^\d.-]/g, ""));
    const parsedDay = Number(editDayOfMonth);
    
    // 處理分期付款欄位：空字串轉為 undefined，否則轉為數字
    const parsedTotalPeriods = editTotalPeriods.trim() 
      ? Number(editTotalPeriods.trim()) 
      : undefined;
    const parsedTotalAmount = editTotalAmount.trim() 
      ? Number(editTotalAmount.trim().replace(/[^\d.-]/g, "")) 
      : undefined;
    const parsedStartDate = editStartDate.trim() || undefined;

    console.log("表單原始值:", {
      editTotalPeriods,
      editStartDate,
      editTotalAmount,
    });

    console.log("解析後的值:", {
      parsedTotalPeriods,
      parsedStartDate,
      parsedTotalAmount,
    });

    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      alert("請輸入有效的金額");
      return;
    }
    if (!Number.isFinite(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      alert("請輸入有效的日期（1-31）");
      return;
    }
    if (parsedTotalPeriods !== undefined && (!Number.isFinite(parsedTotalPeriods) || parsedTotalPeriods < 1)) {
      alert("請輸入有效的總期數（至少 1 期）");
      return;
    }
    if (parsedTotalAmount !== undefined && (!Number.isFinite(parsedTotalAmount) || parsedTotalAmount <= 0)) {
      alert("請輸入有效的總金額");
      return;
    }

    // 驗證：如果有設定總期數，必須有起始日期
    if (parsedTotalPeriods && !parsedStartDate) {
      alert("設定分期付款時，必須填寫起始日期");
      return;
    }

    setSaving(true);
    try {
      // 明確構建 payload，確保所有欄位都包含
      const payload: any = {
        amount: parsedAmount,
        category: editCategory,
        type: editType,
        dayOfMonth: parsedDay,
        note: editNote || undefined,
        isActive: editIsActive,
      };

      // 只有當值存在時才添加分期付款欄位
      if (parsedTotalPeriods !== undefined) {
        payload.totalPeriods = parsedTotalPeriods;
      }
      if (parsedStartDate) {
        payload.startDate = parsedStartDate;
      }
      if (parsedTotalAmount !== undefined) {
        payload.totalAmount = parsedTotalAmount;
      }

      console.log("準備儲存的資料（完整）:", JSON.stringify(payload, null, 2));

      if (editingItem) {
        // 更新
        console.log("更新固定收支，ID:", editingItem.id);
        await updateRecurringTransaction(editingItem.id, payload);
        console.log("更新成功");
        window.dispatchEvent(new CustomEvent("recurring:updated"));
      } else {
        // 新增
        console.log("新增固定收支");
        await addRecurringTransaction(payload);
        console.log("新增成功");
        window.dispatchEvent(new CustomEvent("recurring:created"));
      }
      handleCloseDrawer();
    } catch (err) {
      console.error("儲存固定收支失敗", err);
      alert("儲存失敗：" + (err instanceof Error ? err.message : "未知錯誤"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    setDeleting(true);
    try {
      await deleteRecurringTransaction(editingItem.id);
      window.dispatchEvent(new CustomEvent("recurring:deleted"));
      handleCloseDrawer();
    } catch (err) {
      console.error("刪除固定收支失敗", err);
    } finally {
      setDeleting(false);
    }
  };

  const recurringExpenses = recurringTransactions.filter(
    (item) => item.isActive && item.type === "支出"
  );
  const recurringIncome = recurringTransactions.filter(
    (item) => item.isActive && item.type === "收入"
  );

  return (
    <div className="recurring-view">
      <div className="header">
        <Link href="/" className="header-title">← 返回</Link>
        <div className="header-main">固定收支</div>
        <div className="header-subtitle">定期自動記錄的項目</div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* 固定支出區塊 */}
        <div className="section-header">
          <div className="section-title">每月固定支出</div>
          <button
            className="add-recurring-btn"
            onClick={() => handleOpenEdit(null)}
          >
            + 新增固定
          </button>
        </div>

        <div className="transactions">
          {loading && (
            <p style={{ color: 'var(--text-medium)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>載入中...</p>
          )}
          {error && (
            <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>{error}</p>
          )}
          {!loading && !error && recurringExpenses.length === 0 && (
            <p style={{ color: 'var(--text-medium)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
              還沒有固定支出，點擊「+ 新增固定」開始。
            </p>
          )}
          {!loading && !error && recurringExpenses.map((item) => {
            const color = CATEGORY_COLORS[item.category] || DEFAULT_COLOR;
            const installmentInfo = calculateInstallmentInfo(item);
            return (
              <div
                key={item.id}
                className="transaction-item"
                onClick={() => handleOpenEdit(item)}
              >
                <div className="transaction-icon" style={{ backgroundColor: color, color: 'white', fontWeight: 600 }}>
                  {item.category.charAt(0)}
                </div>
                <div className="transaction-info">
                  <div className="transaction-name">{item.note || item.category}</div>
                  <div className="transaction-date">
                    每月 {item.dayOfMonth} 號
                    {installmentInfo && (
                      <span style={{ marginLeft: '8px', color: 'var(--text-medium)', fontSize: '12px' }}>
                        ({installmentInfo.paidPeriods}/{installmentInfo.totalPeriods} 期)
                      </span>
                    )}
                  </div>
                  {installmentInfo && (
                    <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                      已付：{formatCurrency(installmentInfo.paidAmount)} / 剩餘：{formatCurrency(installmentInfo.remainingAmount)}
                      <br />
                      開始：{formatDateDisplay(installmentInfo.startDate)} / 結束：{formatDateDisplay(installmentInfo.endDate)}
                    </div>
                  )}
                </div>
                <div className="transaction-amount">-{formatCurrency(item.amount)}</div>
              </div>
            );
          })}
        </div>

        {/* 預期收入區塊 */}
        <div className="section-header" style={{ marginTop: '40px' }}>
          <div className="section-title">預期收入</div>
        </div>

        <div className="transactions">
          {!loading && !error && recurringIncome.length === 0 && (
            <p style={{ color: 'var(--text-medium)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
              還沒有預期收入。
            </p>
          )}
          {!loading && !error && recurringIncome.map((item) => {
            const color = CATEGORY_COLORS[item.category] || DEFAULT_COLOR;
            const installmentInfo = calculateInstallmentInfo(item);
            return (
              <div
                key={item.id}
                className="transaction-item"
                onClick={() => handleOpenEdit(item)}
              >
                <div className="transaction-icon" style={{ backgroundColor: color, color: 'white', fontWeight: 600 }}>
                  {item.category.charAt(0)}
                </div>
                <div className="transaction-info">
                  <div className="transaction-name">{item.note || item.category}</div>
                  <div className="transaction-date">
                    每月 {item.dayOfMonth} 號
                    {installmentInfo && (
                      <span style={{ marginLeft: '8px', color: 'var(--text-medium)', fontSize: '12px' }}>
                        ({installmentInfo.paidPeriods}/{installmentInfo.totalPeriods} 期)
                      </span>
                    )}
                  </div>
                  {installmentInfo && (
                    <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                      已付：{formatCurrency(installmentInfo.paidAmount)} / 剩餘：{formatCurrency(installmentInfo.remainingAmount)}
                      <br />
                      開始：{formatDateDisplay(installmentInfo.startDate)} / 結束：{formatDateDisplay(installmentInfo.endDate)}
                    </div>
                  )}
                </div>
                <div className="transaction-amount" style={{ color: 'var(--accent-green)' }}>
                  +{formatCurrency(item.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDrawer();
          }
        }}
      >
        <DrawerContent className="modal">
          <DrawerTitle className="sr-only">
            {editingItem ? "編輯固定收支" : "新增固定收支"}
          </DrawerTitle>
          <div className="modal-header">
            <div className="modal-title">
              {editingItem ? "編輯固定收支" : "新增固定收支"}
            </div>
            <button className="close-btn" onClick={handleCloseDrawer}>✕</button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* 金額 */}
            <div className="form-group">
              <label className="form-label">金額</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                autoFocus
                inputMode="decimal"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>

            {/* 類型切換 */}
            <div className="form-group">
              <label className="form-label">類型</label>
              <div className="type-toggle">
                <button
                  type="button"
                  className={`type-btn ${editType === "支出" ? "expense" : ""}`}
                  onClick={() => setEditType("支出")}
                >
                  支出
                </button>
                <button
                  type="button"
                  className={`type-btn ${editType === "收入" ? "income" : ""}`}
                  onClick={() => setEditType("收入")}
                >
                  收入
                </button>
              </div>
            </div>

            {/* 類別 */}
            <div className="form-group">
              <label className="form-label">類別</label>
              <div className="category-grid">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-btn ${editCategory === cat ? 'active' : ''}`}
                    onClick={() => setEditCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 每月幾號 */}
            <div className="form-group">
              <label className="form-label">每月幾號</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="31"
                value={editDayOfMonth}
                onChange={(e) => setEditDayOfMonth(e.target.value)}
              />
            </div>

            {/* 備註 */}
            <div className="form-group">
              <label className="form-label">備註</label>
              <input
                type="text"
                className="form-input"
                placeholder="例如：房租、薪水..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>

            {/* 分期付款設定（可選） */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '14px', color: 'var(--text-medium)' }}>
                分期付款設定（選填，留空表示持續性收支）
              </label>
              
              {/* 總期數 */}
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>
                  總期數 {editTotalPeriods && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>(目前: {editTotalPeriods} 期)</span>}
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="例如：12（留空表示持續性）"
                  min="1"
                  value={editTotalPeriods}
                  onChange={(e) => {
                    console.log("總期數變更:", e.target.value);
                    setEditTotalPeriods(e.target.value);
                  }}
                />
              </div>

              {/* 起始日期 */}
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>
                  起始日期 {editStartDate && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>(目前: {formatDateDisplay(editStartDate)})</span>}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={editStartDate}
                  onChange={(e) => {
                    console.log("起始日期變更:", e.target.value);
                    setEditStartDate(e.target.value);
                  }}
                />
              </div>

              {/* 總金額 */}
              <div>
                <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>
                  總金額（選填） {editTotalAmount && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>(目前: {formatCurrency(Number(editTotalAmount))})</span>}
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="例如：24000（留空則自動計算）"
                  min="0"
                  value={editTotalAmount}
                  onChange={(e) => {
                    console.log("總金額變更:", e.target.value);
                    setEditTotalAmount(e.target.value);
                  }}
                />
              </div>
              
              {/* 顯示當前設定狀態和預覽 */}
              {(editTotalPeriods || editStartDate || editTotalAmount) && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  background: 'var(--secondary)', 
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text-dark)'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--primary)' }}>📋 當前設定預覽：</div>
                  {editTotalPeriods && <div style={{ marginBottom: '4px' }}>✓ 總期數：<strong>{editTotalPeriods}</strong> 期</div>}
                  {editStartDate && <div style={{ marginBottom: '4px' }}>✓ 起始日期：<strong>{formatDateDisplay(editStartDate)}</strong></div>}
                  {editTotalAmount && <div style={{ marginBottom: '4px' }}>✓ 總金額：<strong>{formatCurrency(Number(editTotalAmount))}</strong></div>}
                  {editTotalPeriods && editStartDate && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px', 
                      background: 'rgba(255, 139, 123, 0.1)', 
                      borderRadius: '6px',
                      color: 'var(--primary)', 
                      fontWeight: 600 
                    }}>
                      📅 預計結束日期：{(() => {
                        const start = new Date(editStartDate);
                        const periods = Number(editTotalPeriods);
                        const end = new Date(start);
                        end.setMonth(end.getMonth() + periods - 1);
                        return formatDateDisplay(end.toISOString().slice(0, 10));
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 啟用狀態 */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="isActive" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                  啟用此固定收支
                </label>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={saving || deleting}>
              {saving ? "儲存中..." : "儲存"}
            </button>
            {editingItem && (
              <button type="button" className="delete-btn" onClick={handleDelete} disabled={saving || deleting}>
                {deleting ? "刪除中..." : "刪除此固定收支"}
              </button>
            )}
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
