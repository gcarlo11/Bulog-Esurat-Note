"use client";

import { useMemo } from "react";

interface CalendarHeatmapProps {
  heatmap: Record<string, number>;
}

export function CalendarHeatmap({ heatmap }: CalendarHeatmapProps) {
  const { days, monthLabels } = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 364); // 365 days total

    const startDay = startDate.getDay(); // 0 is Sunday
    const alignedStartDate = new Date(startDate);
    alignedStartDate.setDate(alignedStartDate.getDate() - startDay);

    const totalDays = 53 * 7;
    const generatedDays = [];
    const labels: { text: string; colIndex: number }[] = [];
    let lastMonth = -1;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(alignedStartDate);
      currentDate.setDate(currentDate.getDate() + i);

      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const date = String(currentDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${date}`;

      const count = heatmap[dateStr] || 0;

      generatedDays.push({
        dateStr,
        dateObj: currentDate,
        count,
      });

      // Calculate month label position (only for the first row of each week, i.e., index % 7 === 0)
      if (i % 7 === 0) {
        const currentMonth = currentDate.getMonth();
        if (currentMonth !== lastMonth) {
          const monthName = currentDate.toLocaleDateString("id-ID", { month: "short" });
          labels.push({
            text: monthName,
            colIndex: Math.floor(i / 7),
          });
          lastMonth = currentMonth;
        }
      }
    }

    return { days: generatedDays, monthLabels: labels };
  }, [heatmap]);

  // Color logic based on activity level
  const getColorClass = (count: number) => {
    if (count === 0) return "cell-empty";
    if (count === 1) return "cell-low";
    if (count <= 3) return "cell-medium";
    return "cell-high";
  };

  const formatDateLabel = (dateObj: Date, count: number) => {
    const formattedDate = dateObj.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `${count} dokumen terdaftar pada ${formattedDate}`;
  };

  return (
    <div className="heatmap-card">
      <div className="heatmap-header">
        <h4>Aktivitas Pencatatan Surat</h4>
        <span className="heatmap-subtitle">Rangkuman frekuensi registrasi dokumen dalam 1 tahun terakhir</span>
      </div>

      <div className="heatmap-container-outer">
        {/* Day labels (Sen, Rab, Jum) */}
        <div className="day-labels">
          <span></span>
          <span>Sen</span>
          <span></span>
          <span>Rab</span>
          <span></span>
          <span>Jum</span>
          <span></span>
        </div>

        <div className="heatmap-grid-wrapper">
          {/* Month Labels row */}
          <div className="month-labels">
            {monthLabels.map((label, idx) => (
              <span
                key={idx}
                style={{
                  gridColumnStart: label.colIndex + 1,
                }}
              >
                {label.text}
              </span>
            ))}
          </div>

          {/* Heatmap cells */}
          <div className="heatmap-grid">
            {days.map((day, index) => (
              <div
                key={index}
                className={`heatmap-cell ${getColorClass(day.count)}`}
                title={formatDateLabel(day.dateObj, day.count)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Kurang</span>
        <div className="heatmap-cell cell-empty" />
        <div className="heatmap-cell cell-low" />
        <div className="heatmap-cell cell-medium" />
        <div className="heatmap-cell cell-high" />
        <span>Lebih</span>
      </div>
    </div>
  );
}
