"use client";

import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HomeIcon, GridIcon, CalendarIcon } from '@/components/icons';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  addTransaction,
  TransactionCategory,
} from "@/services/api";

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
  "其他雜項",
];

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<TransactionCategory>("三餐");
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount) return;

    const parsedAmount = Number(amount.replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) return;

    setSubmitting(true);
    try {
      await addTransaction({
        amount: parsedAmount,
        category: activeCategory,
        date,
        note: note || undefined,
        type: "支出",
      });

      window.dispatchEvent(new CustomEvent("transaction:created"));
    } catch (err) {
      console.error("新增交易失敗", err);
    } finally {
      setSubmitting(false);
    }

    setAmount("");
    setNote("");
    setActiveCategory("三餐");
    setDate(new Date().toISOString().slice(0, 10));
    setAddOpen(false);
  };

  return (
    <div className="flex min-h-svh flex-col" style={{ background: '#FFFFFF' }}>
      <main className="flex-1 page-content" style={{ background: '#FFFFFF' }}>{children}</main>

      <Drawer open={addOpen} onOpenChange={setAddOpen}>
        <DrawerContent className="modal">
          <DrawerTitle className="sr-only">新增支出</DrawerTitle>
          <div className="modal-header">
            <div className="modal-title">新增支出</div>
            <button className="close-btn" onClick={() => setAddOpen(false)}>✕</button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">金額</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">類別</label>
              <div className="category-grid">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">日期</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">備註</label>
              <input
                type="text"
                className="form-input"
                placeholder="例如：午餐、捷運、超市..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "儲存中..." : "儲存這筆支出"}
            </button>
          </form>
        </DrawerContent>
      </Drawer>

      {/* 底部導航 - 3個按鈕，沒有中間的 FAB */}
      <nav className="bottom-nav">
        <button
          type="button"
          onClick={() => router.push("/")}
          className={cn("nav-item", isActive("/") && "active")}
        >
          <div className="nav-icon">
            <HomeIcon color="currentColor" />
          </div>
          <div className="nav-label">首頁</div>
        </button>

        <button
          type="button"
          onClick={() => router.push("/transactions")}
          className={cn("nav-item", isActive("/transactions") && "active")}
        >
          <div className="nav-icon">
            <GridIcon color="currentColor" />
          </div>
          <div className="nav-label">明細</div>
        </button>

        <button
          type="button"
          onClick={() => router.push("/recurring")}
          className={cn("nav-item", isActive("/recurring") && "active")}
        >
          <div className="nav-icon">
            <CalendarIcon color="currentColor" />
          </div>
          <div className="nav-label">固定</div>
        </button>
      </nav>

      {/* 右下角 FAB 按鈕 */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="fab-btn"
        aria-label="新增支出"
      >
        +
      </button>
    </div>
  );
}

