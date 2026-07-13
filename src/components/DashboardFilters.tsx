"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [date, setDate] = useState(searchParams.get("date") || "");
  const [month, setMonth] = useState(searchParams.get("month") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");

  // Sync state with URL params
  useEffect(() => {
    setDate(searchParams.get("date") || "");
    setMonth(searchParams.get("month") || "");
    setYear(searchParams.get("year") || "");
  }, [searchParams]);

  function updateFilters(newDate: string, newMonth: string, newYear: string) {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newDate) {
      params.set("date", newDate);
      params.delete("month");
      params.delete("year");
    } else {
      params.delete("date");
      if (newMonth) params.set("month", newMonth);
      else params.delete("month");
      
      if (newYear) params.set("year", newYear);
      else params.delete("year");
    }

    router.push(`/dashboard?${params.toString()}`);
  }

  function handleReset() {
    setDate("");
    setMonth("");
    setYear("");
    router.push("/dashboard");
  }

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
      <input
        type="date"
        className="filter-select"
        value={date}
        onChange={(e) => {
          const val = e.target.value;
          setDate(val);
          setMonth("");
          setYear("");
          updateFilters(val, "", "");
        }}
        title="Filter Tanggal Spesifik"
      />
      
      <select
        className="filter-select"
        value={month}
        onChange={(e) => {
          const val = e.target.value;
          setMonth(val);
          setDate("");
          updateFilters("", val, year);
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
          setDate("");
          updateFilters("", month, val);
        }}
        min="2000"
        max="2100"
        title="Filter Tahun"
      />

      {(date || month || year) && (
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
