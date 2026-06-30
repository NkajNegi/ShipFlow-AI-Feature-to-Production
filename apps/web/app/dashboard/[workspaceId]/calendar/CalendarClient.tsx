"use client";

import { useState } from "react";
import Link from "next/link";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Feature = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date;
};

export default function CalendarClient({
  features,
  workspaceId,
}: {
  features: Feature[];
  workspaceId: string;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SHIPPED":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "REJECTED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "IN_PROGRESS":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "IN_REVIEW":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "APPROVED":
        return "bg-[#c084fc]/20 text-[#c084fc] border-[#c084fc]/30";
      default:
        return "bg-white/10 text-muted-foreground border-white/5";
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">
            {format(currentDate, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-[13px] font-medium rounded-md bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            Today
          </button>
          <div className="flex items-center rounded-md bg-white/5 p-0.5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDate = startOfWeek(currentDate);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          key={i}
          className="text-center text-[12px] font-semibold text-muted-foreground uppercase tracking-wider py-2"
        >
          {format(addDays(startDate, i), dateFormat)}
        </div>,
      );
    }
    return (
      <div className="grid grid-cols-7 border-b border-white/5">{days}</div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;

        // Find features updated on this exact day
        const dayFeatures = features.filter((f) =>
          isSameDay(new Date(f.updatedAt), cloneDay),
        );

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] p-2 border-r border-b border-white/5 transition-colors ${
              !isSameMonth(day, monthStart)
                ? "bg-[#050505] opacity-50"
                : isSameDay(day, new Date())
                  ? "bg-[#c084fc]/5"
                  : "bg-[#0a0a0c] hover:bg-white/5"
            }`}
          >
            <div className="flex justify-end mb-2">
              <span
                className={`text-[13px] font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isSameDay(day, new Date())
                    ? "bg-[#c084fc] text-white"
                    : "text-muted-foreground"
                }`}
              >
                {formattedDate}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {dayFeatures.map((feat) => (
                <Link
                  key={feat.id}
                  href={`/dashboard/${workspaceId}/feature/${feat.id}`}
                  className={`px-2 py-1 text-[11px] font-medium rounded border truncate block ${getStatusColor(
                    feat.status,
                  )} hover:opacity-80 transition-opacity`}
                  title={feat.title}
                >
                  {feat.title}
                </Link>
              ))}
            </div>
          </div>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>,
      );
      days = [];
    }
    return (
      <div className="border-l border-t border-white/5 rounded-bl-2xl rounded-br-2xl overflow-hidden">
        {rows}
      </div>
    );
  };

  return (
    <div className="bg-[#101014] border border-white/5 rounded-2xl p-6 shadow-2xl">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}
