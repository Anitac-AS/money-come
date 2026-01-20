"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// 移除不穩定的 Tabs 元件，改用原生 button
import { getTransactions, updateTransaction, deleteTransaction, Transaction, TransactionCategory, TransactionType } from "@/services/api";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import Link from "next/link"; 
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { categoryIconMap, CategoryType } from "@/components/icons";
import { CATEGORY_COLORS, CATEGORY_BG_COLORS } from "@/lib/constants";

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

// 格式化日期顯示（YYYY-MM-DD -> 中文日期）
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  
  try {
    // 解析 YYYY-MM-DD 格式
    const [year, month, day] = dateStr.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
    
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return dateStr;
    
    // 格式化為中文日期：月/日
    const monthNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
    
    const today = new Date();
    const isToday = 
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    
    const isTomorrow = (() => {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return (
        date.getFullYear() === tomorrow.getFullYear() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getDate() === tomorrow.getDate()
      );
    })();
    
    const isYesterday = (() => {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return (
        date.getFullYear() === yesterday.getFullYear() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate()
      );
    })();
    
    if (isToday) return "今天";
    if (isTomorrow) return "明天";
    if (isYesterday) return "昨天";
    
    // 其他日期顯示為：月/日 (星期X)
    const weekday = dayNames[date.getDay()];
    return `${month}/${day} (${weekday})`;
  } catch (e) {
    return dateStr;
  }
}

export default function HomePage() {
  const [activeSummary, setActiveSummary] = useState<"month" | "week">("month");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript_eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // 編輯相關狀態
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState<TransactionCategory>("三餐");
  const [editType, setEditType] = useState<TransactionType>("支出");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const now = new Date();
  const currentMonthDisplay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const refreshTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
      setError("讀取交易資料失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTransactions();
    const handler = () => refreshTransactions();
    window.addEventListener("transaction:created", handler);
    window.addEventListener("transaction:updated", handler);
    window.addEventListener("transaction:deleted", handler);
    return () => {
      window.removeEventListener("transaction:created", handler);
      window.removeEventListener("transaction:updated", handler);
      window.removeEventListener("transaction:deleted", handler);
    };
  }, []);

  // 2. 核心計算邏輯修正：解開巢狀迴圈，獨立計算週與月
  const { monthTotal, weeklyTotal, categorySummary, recentFive } = useMemo(() => {
    const txs = Array.isArray(transactions) ? transactions : [];

    // 過濾掉無效日期的交易
    const validTxs = txs.filter(tx => {
      if (!tx.date || !/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) {
        return false;
      }
      // 驗證年份合理性（2000-2100）
      const year = parseInt(tx.date.substring(0, 4));
      return year >= 2000 && year <= 2100;
    });

    let mTotal = 0;
    let wTotal = 0;
    const categoryMap = new Map<string, number>();

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
    const currentMonthPrefix = `${currentYear}-${currentMonthStr}`; 

    // 過去7天 (含今天)
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    // 排序：最新的在最上面
    // 先按日期排序（降序），如果日期相同，則按建立時間排序（越後面建立的排越前面）
    const sorted = [...validTxs].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      // 先按日期降序排列
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      
      // 如果日期相同，按建立時間排序（越後面建立的排越前面）
      if (a.createdAt && b.createdAt) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      // 如果只有一個有建立時間，有時間的排在前面
      if (a.createdAt && !b.createdAt) return -1;
      if (!a.createdAt && b.createdAt) return 1;
      // 如果都沒有建立時間，按 id 倒序排列（作為備用方案）
      return b.id.localeCompare(a.id);
    });

    for (const tx of sorted) {
      const amt = Number(tx.amount) || 0;
      
      // 只計算支出
      if (tx.type === "支出") {
        
        // 邏輯 A: 計算本月 (不影響本週)
        // 確保日期格式正確且為本月
        if (tx.date && tx.date.startsWith(currentMonthPrefix)) {
          mTotal += amt;
          
          // 只有本月的資料才加入圓餅圖類別統計
          const catName = tx.category || "其他";
          const prev = categoryMap.get(catName) ?? 0;
          categoryMap.set(catName, prev + amt);
        }

        // 邏輯 B: 計算本週 (獨立判斷，解決跨月問題)
        if (tx.date && tx.date >= weekAgoStr) {
          wTotal += amt;
        }
      }
    }

    const catSummary = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const recents = sorted.slice(0, 5);

    // 調試信息
    console.log("計算統計:", {
      totalTransactions: txs.length,
      validTransactions: validTxs.length,
      currentMonth: currentMonthPrefix,
      weekAgo: weekAgoStr,
      monthTotal: mTotal,
      weeklyTotal: wTotal,
      recentCount: recents.length,
      sampleDates: sorted.slice(0, 5).map(t => t.date)
    });

    return { 
      monthTotal: mTotal, 
      weeklyTotal: wTotal, 
      categorySummary: catSummary, 
      recentFive: recents 
    };
  }, [transactions]);

  const displayTotal = activeSummary === "month" ? monthTotal : weeklyTotal;

  // 處理打開編輯抽屜
  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setEditAmount(String(tx.amount));
    setEditCategory(tx.category);
    setEditType(tx.type);
    setEditDate(tx.date);
    setEditNote(tx.note || "");
    setDrawerOpen(true);
  };

  // 處理關閉抽屜
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingTransaction(null);
    setEditAmount("");
    setEditCategory("三餐");
    setEditType("支出");
    setEditDate("");
    setEditNote("");
  };

  // 處理保存
  const handleSave = async () => {
    if (!editingTransaction) return;
    
    const parsedAmount = Number(editAmount.replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      alert("請輸入有效的金額");
      return;
    }
    if (!editDate) {
      alert("請選擇日期");
      return;
    }

    setSaving(true);
    try {
      await updateTransaction(editingTransaction.id, {
        amount: parsedAmount,
        category: editCategory,
        type: editType,
        date: editDate,
        note: editNote || undefined,
      });
      
      // 觸發更新事件，通知其他頁面
      window.dispatchEvent(new CustomEvent("transaction:updated"));
      
      // 重新載入資料
      await refreshTransactions();
      
      handleCloseDrawer();
    } catch (err) {
      console.error("更新交易失敗", err);
      alert("更新交易失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  // 處理刪除
  const handleDelete = async () => {
    if (!editingTransaction) return;
    
    if (!confirm("確定要刪除這筆交易嗎？")) return;
    
    setDeleting(true);
    try {
      await deleteTransaction(editingTransaction.id);
      
      // 觸發刪除事件，通知其他頁面
      window.dispatchEvent(new CustomEvent("transaction:deleted"));
      
      // 重新載入資料
      await refreshTransactions();
      
      handleCloseDrawer();
    } catch (err) {
      console.error("刪除交易失敗", err);
      alert("刪除交易失敗，請稍後再試");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ background: '#FFFFFF' }}>
      <div className="header">
        <div className="header-title">MY MONEY</div>
        <div className="header-main">錢來了 MoneyIn</div>
        <div className="header-subtitle">輕鬆掌握每一筆支出</div>
      </div>

      {/* 總支出卡片 */}
      <div className="total-card">
        <div className="total-label">
          {activeSummary === "month" ? "本月總支出" : "本週總支出"}
          <div className="period-toggle">
            <button 
              className={`period-btn ${activeSummary === "month" ? "active" : ""}`}
              onClick={() => setActiveSummary("month")}
            >
              本月
            </button>
            <button 
              className={`period-btn ${activeSummary === "week" ? "active" : ""}`}
              onClick={() => setActiveSummary("week")}
            >
              本週
            </button>
          </div>
        </div>
        <div className="total-amount">{formatCurrency(Math.max(displayTotal, 0))}</div>
        <div className="total-date">
          {activeSummary === "month" 
            ? `月份：${currentMonthDisplay}` 
            : "範圍：過去 7 天"}
        </div>
      </div>

      {/* 類別分佈圖表 */}
      <div className="category-chart">
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '16px' }}>
          本月類別分佈
        </div>
        <div className="chart-container">
          <div style={{ width: '160px', height: '160px', minWidth: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {categorySummary.length > 0 ? (
                <PieChart>
                  <Pie
                    data={categorySummary.slice(0, 4)}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={0}
                    dataKey="value"
                    nameKey="name"
                    stroke="#FFF8F5"
                    strokeWidth={3}
                    cornerRadius={10}
                  >
                    {categorySummary.slice(0, 4).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLOR}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value !== undefined ? formatCurrency(value) : ""
                    }
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      padding: "8px 10px",
                      background: "rgba(45, 52, 54, 0.94)",
                      color: "white",
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: 'var(--text-medium)', border: '1px solid rgba(178, 190, 195, 0.3)', borderRadius: '50%' }}>
                  無資料
                </div>
              )}
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            {categorySummary.length > 0 ? (
              categorySummary.slice(0, 4).map((item) => (
                <div key={item.name} className="legend-item">
                  <div className="flex items-center gap-3">
                    <div
                      className="legend-color"
                      style={{
                        backgroundColor: CATEGORY_COLORS[item.name] || DEFAULT_COLOR,
                      }}
                    />
                    <span className="legend-name">{item.name}</span>
                  </div>
                  <span className="legend-amount">{formatCurrency(item.value)}</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-medium)', fontSize: '14px', padding: '12px 0' }}>
                本月還沒有支出紀錄。
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 最近交易 */}
      <div style={{ padding: '0 24px', marginTop: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '16px' }}>
          最近交易
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading && (
            <p style={{ color: 'var(--text-medium)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>更新中...</p>
          )}
          
          {!loading && recentFive.length === 0 && (
            <p style={{ color: 'var(--text-medium)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
              還沒有交易，從底部的 + 新增第一筆。
            </p>
          )}
          
          {!loading && recentFive.length > 0 && recentFive.map((tx) => {
            const isIncome = tx.type === "收入";
            const displayAmount = isIncome ? tx.amount : -tx.amount;
            const IconComponent = categoryIconMap[tx.category as CategoryType];
            return (
              <div
                key={tx.id}
                className="transaction-item"
                onClick={() => handleOpenEdit(tx)}
              >
                <div 
                  className="transaction-icon" 
                  style={{ backgroundColor: CATEGORY_BG_COLORS[tx.category] || DEFAULT_COLOR }}
                >
                  {IconComponent ? (
                    <IconComponent 
                      size={40}
                      color={CATEGORY_COLORS[tx.category] || DEFAULT_COLOR}
                    />
                  ) : (
                    tx.category.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <div className="transaction-name">
                    {tx.category}
                    {tx.note && <span style={{ color: 'var(--text-light)', fontSize: '13px', marginLeft: '8px' }}>· {tx.note}</span>}
                  </div>
                  <div className="transaction-date">{formatDateDisplay(tx.date)}</div>
                </div>
                <div className="transaction-amount" style={{ color: isIncome ? 'var(--accent-green)' : 'var(--primary)' }}>
                  {isIncome ? "+" : "-"}{formatCurrency(Math.abs(displayAmount))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 編輯 Modal */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="modal">
          <DrawerTitle className="sr-only">編輯交易</DrawerTitle>
          <div className="modal-header">
            <div className="modal-title">編輯交易</div>
            <button className="close-btn" onClick={handleCloseDrawer}>✕</button>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
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

            {/* 金額 */}
            <div className="form-group">
              <label className="form-label">金額</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
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
            
            {/* 日期 */}
            <div className="form-group">
              <label className="form-label">日期</label>
              <input
                type="date"
                className="form-input"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            
            {/* 備註 */}
            <div className="form-group">
              <label className="form-label">備註</label>
              <input
                type="text"
                className="form-input"
                placeholder="例如：午餐、捷運、超市..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
            
            <button type="submit" className="submit-btn" disabled={saving || deleting}>
              {saving ? "儲存中..." : "儲存變更"}
            </button>
            <button type="button" className="delete-btn" onClick={handleDelete} disabled={saving || deleting}>
              {deleting ? "刪除中..." : "刪除這筆交易"}
            </button>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}