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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadRecurringTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecurringTransactions();
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
    } else {
      // 新增模式
      setEditingItem(null);
      setEditAmount("");
      setEditCategory("三餐");
      setEditType("支出");
      setEditDayOfMonth("1");
      setEditNote("");
      setEditIsActive(true);
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
    setEditIsActive(true);
  };

  const handleSave = async () => {
    const parsedAmount = Number(editAmount.replace(/[^\d.-]/g, ""));
    const parsedDay = Number(editDayOfMonth);

    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) return;
    if (!Number.isFinite(parsedDay) || parsedDay < 1 || parsedDay > 31) return;

    setSaving(true);
    try {
      if (editingItem) {
        // 更新
        await updateRecurringTransaction(editingItem.id, {
          amount: parsedAmount,
          category: editCategory,
          type: editType,
          dayOfMonth: parsedDay,
          note: editNote || undefined,
          isActive: editIsActive,
        });
        window.dispatchEvent(new CustomEvent("recurring:updated"));
      } else {
        // 新增
        await addRecurringTransaction({
          amount: parsedAmount,
          category: editCategory,
          type: editType,
          dayOfMonth: parsedDay,
          note: editNote || undefined,
          isActive: editIsActive,
        });
        window.dispatchEvent(new CustomEvent("recurring:created"));
      }
      handleCloseDrawer();
    } catch (err) {
      console.error("儲存固定收支失敗", err);
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
                  <div className="transaction-date">每月 {item.dayOfMonth} 號</div>
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
                  <div className="transaction-date">每月 {item.dayOfMonth} 號</div>
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
