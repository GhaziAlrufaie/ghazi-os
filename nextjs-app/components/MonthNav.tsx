'use client';
/*
 * Ghazi OS — MonthNav
 * مطابق للأصل: .month-bar, .mb-btn, .mb-cur, .month-picker, .past-mode-badge
 * يدير: الشهر الحالي + التنقل + past mode
 */
import { useState, useRef, useEffect, createContext, useContext } from 'react';

export interface MonthContextType {
  year: number;
  month: number; // 0-indexed
  isPast: boolean;
  setYearMonth: (year: number, month: number) => void;
  goToToday: () => void;
}

export const MonthContext = createContext<MonthContextType>({
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  isPast: false,
  setYearMonth: () => {},
  goToToday: () => {},
});

export function useMonth() {
  return useContext(MonthContext);
}

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export function MonthNavProvider({ children }: { children: React.ReactNode }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const isPast = year < todayYear || (year === todayYear && month < todayMonth);

  function setYearMonth(y: number, m: number) {
    setYear(y);
    setMonth(m);
  }

  function goToToday() {
    setYear(todayYear);
    setMonth(todayMonth);
  }

  return (
    <MonthContext.Provider value={{ year, month, isPast, setYearMonth, goToToday }}>
      {children}
    </MonthContext.Provider>
  );
}

export default function MonthNav() {
  const { year, month, isPast, setYearMonth, goToToday } = useMonth();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const pickerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();

  // إغلاق الـ picker عند النقر خارجه
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function prevMonth() {
    if (month === 0) {
      setYearMonth(year - 1, 11);
    } else {
      setYearMonth(year, month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYearMonth(year + 1, 0);
    } else {
      setYearMonth(year, month + 1);
    }
  }

  function selectMonth(m: number) {
    setYearMonth(pickerYear, m);
    setShowPicker(false);
  }

  return (
    <>
      <div className="month-bar">
        <div className="month-bar-inner" style={{ position: 'relative' }}>
          <button className="mb-btn" onClick={prevMonth} title="الشهر السابق">‹</button>
          <button
            className={`mb-cur${isPast ? ' past' : ''}`}
            onClick={() => {
              setPickerYear(year);
              setShowPicker(!showPicker);
            }}
          >
            {MONTHS_AR[month]} {year}
            {isPast && ' 🕐'}
          </button>
          <button className="mb-btn" onClick={nextMonth} title="الشهر التالي">›</button>

          {/* Month Picker */}
          {showPicker && (
            <div className="month-picker on" ref={pickerRef}>
              <div className="mp-year">
                <button
                  onClick={() => setPickerYear(pickerYear - 1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--txt2)', padding: '2px 6px' }}
                >‹</button>
                <span>{pickerYear}</span>
                <button
                  onClick={() => setPickerYear(pickerYear + 1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--txt2)', padding: '2px 6px' }}
                >›</button>
              </div>
              <div className="mp-grid">
                {MONTHS_AR.map((m, i) => (
                  <div
                    key={i}
                    className={`mp-m${pickerYear === year && i === month ? ' cur' : ''}`}
                    onClick={() => selectMonth(i)}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Past Mode Badge */}
      {isPast && (
        <div className="past-mode-badge on">
          <span>🕐</span>
          <span>وضع الماضي — {MONTHS_AR[month]} {year}</span>
          <button
            onClick={goToToday}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 10,
              padding: '2px 8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
              marginRight: 4,
            }}
          >
            العودة للحاضر
          </button>
        </div>
      )}
    </>
  );
}
