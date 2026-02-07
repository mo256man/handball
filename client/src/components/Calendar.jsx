import React, { useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ja } from "date-fns/locale";

// 汎用カレンダーコンポーネント
// props:
// - value: string (YYYY-MM-DD)
// - onChange: (newValue: string) => void
// - showTodayButtonInHeader: boolean
export default function Calendar({ value, onChange, showTodayButtonInHeader = true, highlightedDates = [], onlyHighlightSelectable = false, calendarClassName }) {
  const datePickerRef = useRef(null);

  const parseDate = (str) => {
    if (!str) return null;
    const d = new Date(str);
    if (isNaN(d)) return null;
    return d;
  };

  const formatDateSv = (d) => {
    return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
  };

  const handleToday = () => {
    const today = new Date();
    const formatted = formatDateSv(today);
    onChange(formatted);
    if (datePickerRef.current && typeof datePickerRef.current.setOpen === "function") {
      datePickerRef.current.setOpen(false);
    }
  };

  const ReadOnlyInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
    <input
      ref={ref}
      value={value}
      onClick={onClick}
      placeholder={placeholder}
      readOnly
      style={{ cursor: "pointer" }}
    />
  ));

  const highlightedSet = new Set(highlightedDates.map(d => {
    try { return new Date(d).toLocaleDateString("sv-SE"); } catch (_) { return d; }
  }));

  const dayClassName = (date) => {
    return highlightedSet.has(date.toLocaleDateString("sv-SE")) ? "highlighted-date" : undefined;
  };

  const filterDate = onlyHighlightSelectable
    ? (date) => highlightedSet.has(date.toLocaleDateString("sv-SE"))
    : undefined;

  return (
    <DatePicker
      ref={datePickerRef}
      selected={parseDate(value)}
      onChange={(selectedDate) => {
        if (!selectedDate) return;
        onChange(formatDateSv(selectedDate));
      }}
      dateFormat="yyyy-MM-dd"
      locale={ja}
      customInput={<ReadOnlyInput />}
      renderCustomHeader={
        showTodayButtonInHeader
          ? ({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px" }}>
                <div>
                  <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} style={{ marginRight: 6 }}>
                    &lsaquo;
                  </button>
                  <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
                    &rsaquo;
                  </button>
                </div>
                <div style={{ fontWeight: "bold" }}>{date.toLocaleDateString("ja-JP", { year: "numeric", month: "long" })}</div>
                <div>
                  <button type="button" onClick={handleToday} style={{ marginLeft: 8 }}>
                    今日
                  </button>
                </div>
              </div>
            )
          : undefined
      }
      calendarClassName={calendarClassName}
      dayClassName={dayClassName}
      filterDate={filterDate}
    />
  );
}
