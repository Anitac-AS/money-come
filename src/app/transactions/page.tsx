"use client";

import { useEffect, useState, useMemo } from "react";
import { getTransactions, updateTransaction, deleteTransaction, Transaction, TransactionCategory, TransactionType } from "@/services/api";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { categoryIconMap, CategoryType } from "@/components/icons";
import { CATEGORY_COLORS, CATEGORY_BG_COLORS } from "@/lib/constants";

// 格式化金額
function formatCurrency(amount: number) {
  return amount.toLocaleString("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  });
}

// 根據資料自動產生月份列表
function getUniqueMonths(transactions: Transaction[]) {
  const months = new Set<string>();
  transactions.forEach(t => {
    // t.date 格式為 "YYYY-MM-DD" -> 取前 7 碼 "YYYY-MM"
    if (t.date && t.date.length >= 7) {
      const monthStr = t.date.substring(0, 7);
      // 驗證年份合理性（2000-2100）
      const year = parseInt(monthStr.substring(0, 4));
      if (year >= 2000 && year <= 2100) {
        months.add(monthStr);
      }
    }
  });
  // 排序：新的月份在前面（降序）
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

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

const DEFAULT_COLOR = "#cbd5e1";

export default function ListPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  
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

  // 1. 載入所有資料
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getTransactions();
        setTransactions(data);
        
        // 預設選取最新的月份
        if (data.length > 0) {
          // 找出最新的交易日期（降序排列）
          const sorted = [...data]
            .filter(t => t.date && t.date.length >= 7)
            .sort((a, b) => b.date.localeCompare(a.date));
          
          if (sorted.length > 0) {
            const latestMonth = sorted[0].date.substring(0, 7);
            setSelectedMonth(latestMonth);
          } else {
            // 如果沒有有效日期，預設本月
            const now = new Date();
            const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            setSelectedMonth(current);
          }
        } else {
          // 如果沒資料，預設本月
          const now = new Date();
          const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          setSelectedMonth(current);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 2. 根據選到的月份進行「前端篩選」
  const filteredTransactions = useMemo(() => {
    if (!selectedMonth) return transactions;
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // 3. 取得所有可用的月份選項
  const monthOptions = useMemo(() => getUniqueMonths(transactions), [transactions]);

  // 4. 按日期分組顯示 (Grouping)
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => {
      if (t.date && t.date.length >= 10) {
        if (!groups[t.date]) groups[t.date] = [];
        groups[t.date].push(t);
      }
    });
    // 日期排序 (新到舊)，使用 localeCompare 確保正確排序
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        date,
        items: groups[date].sort((a, b) => b.date.localeCompare(a.date)) // 同一天內也按時間排序
      }));
  }, [filteredTransactions]);

  // 計算當月總支出
  const monthTotal = useMemo(() => {
    return filteredTransactions
      .filter(tx => tx.type === "支出")
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);

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
      const data = await getTransactions();
      setTransactions(data);
      
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
      const data = await getTransactions();
      setTransactions(data);
      
      handleCloseDrawer();
    } catch (err) {
      console.error("刪除交易失敗", err);
      alert("刪除交易失敗，請稍後再試");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="detail-view">
      <div className="header">
        <Link href="/" className="header-title">← 返回</Link>
        <div className="header-main">交易明細</div>
      </div>

      {/* 月份切換 Tab */}
      <div className="tab-container">
        {monthOptions.map(month => (
          <button
            key={month}
            className={`tab ${selectedMonth === month ? 'active' : ''}`}
            onClick={() => setSelectedMonth(month)}
          >
            {month}
          </button>
        ))}
      </div>

      {/* 統計資訊 */}
      {selectedMonth && (
        <div style={{ padding: '0 24px 16px', fontSize: '14px', color: 'var(--text-medium)', fontWeight: 600 }}>
          {selectedMonth} 共 {filteredTransactions.length} 筆交易 總金額 {formatCurrency(monthTotal)} 元
        </div>
      )}

      {/* 交易列表 */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-medium)', fontSize: '14px', padding: '40px 0' }}>載入中...</p>
      ) : groupedTransactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--text-medium)', fontSize: '14px' }}>這個月份沒有交易紀錄</p>
        </div>
      ) : (
        groupedTransactions.map(group => (
          <div key={group.date}>
            <div className="month-label">{group.date}</div>
            {group.items.map(tx => {
              const isIncome = tx.type === "收入";
              const IconComponent = categoryIconMap[tx.category as CategoryType];
              return (
                <div
                  key={tx.id}
                  className="detail-item"
                  onClick={() => handleOpenEdit(tx)}
                >
                  <div 
                    className="detail-icon" 
                    style={{ backgroundColor: CATEGORY_BG_COLORS[tx.category] || DEFAULT_COLOR }}
                  >
                    {IconComponent ? (
                      <IconComponent 
                        size={48}
                        color={CATEGORY_COLORS[tx.category] || DEFAULT_COLOR}
                      />
                    ) : (
                      tx.category.charAt(0)
                    )}
                  </div>
                  <div className="detail-info">
                    <div className="detail-name">
                      {tx.category}
                      {tx.note && <span style={{ color: 'var(--text-light)', fontSize: '13px', marginLeft: '8px' }}>· {tx.note}</span>}
                    </div>
                    <div className="detail-category">{tx.type}</div>
                  </div>
                  <div className="detail-amount" style={{ color: isIncome ? 'var(--accent-green)' : 'var(--primary)' }}>
                    {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}

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