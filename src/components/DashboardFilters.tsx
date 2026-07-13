"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [month, setMonth] = useState(searchParams.get("month") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");

  // Sync state with URL params
  useEffect(() => {
    setStartDate(searchParams.get("startDate") || "");
    setEndDate(searchParams.get("endDate") || "");
    setMonth(searchParams.get("month") || "");
    setYear(searchParams.get("year") || "");
  }, [searchParams]);

  function updateFilters(newStart: string, newEnd: string, newMonth: string, newYear: string) {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newStart || newEnd) {
      if (newStart) params.set("startDate", newStart);
      else params.delete("startDate");
      
      if (newEnd) params.set("endDate", newEnd);
      else params.delete("endDate");
      
      params.delete("month");
      params.delete("year");
    } else {
      params.delete("startDate");
      params.delete("endDate");
      
      if (newMonth) params.set("month", newMonth);
      else params.delete("month");
      
      if (newYear) params.set("year", newYear);
      else params.delete("year");
    }

    router.push(`/dashboard?${params.toString()}`);
  }

  function handleReset() {
    setStartDate("");
    setEndDate("");
    setMonth("");
    setYear("");
    router.push("/dashboard");
  }

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Dari:</span>
        <input
          type="date"
          className="filter-select"
          value={startDate}
          onChange={(e) => {
            const val = e.target.value;
            setStartDate(val);
            setMonth("");
            setYear("");
            updateFilters(val, endDate, "", "");
          }}
          title="Filter Tanggal Mulai"
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Sampai:</span>
        <input
          type="date"
          className="filter-select"
          value={endDate}
          onChange={(e) => {
            const val = e.target.value;
            setEndDate(val);
            setMonth("");
            setYear("");
            updateFilters(startDate, val, "", "");
          }}
          title="Filter Tanggal Akhir"
        />
      </div>
      
      <select
        className="filter-select"
        value={month}
        onChange={(e) => {
          const val = e.target.value;
          setMonth(val);
          setStartDate("");
          setEndDate("");
          updateFilters("", "", val, year);
        }}
        title="Filter Bulan"
      >
        <option value="">Semua Bulan</option>
        <option value="1">Januari</option>
        <option value="2">Februari</option>
        <option value="3">Maret</option>
        <option value="4">April</option>
        <option value="5">Mei</option>
        <option value="6">Juni</option>
        <option value="7">Juli</option>
        <option value="8">Agustus</option>
        <option value="9">September</option>
        <option value="10">Oktober</option>
        <option value="11">November</option>
        <option value="12">Desember</option>
      </select>

      <input
        type="number"
        className="filter-select"
        style={{ width: "90px" }}
        placeholder="Tahun"
        value={year}
        onChange={(e) => {
          const val = e.target.value;
          setYear(val);
          setStartDate("");
          setEndDate("");
          updateFilters("", "", month, val);
        }}
        min="2000"
        max="2100"
        title="Filter Tahun"
      />

      {(startDate || endDate || month || year) && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleReset}
          style={{ height: "32px", padding: "0 10px" }}
        >
          Reset
        </button>
      )}
    </div>
  );
}
