"use client"

import { useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import type { ScheduleWithRelations, ScheduleTimeSlot } from "@/lib/types"
import { encodeScheduleId } from "@/lib/hashid"

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const HOUR_HEIGHT = 64
const DEFAULT_DURATION = 120
const BLOCK_GAP = 1

interface ScheduleRow {
  schedule: ScheduleWithRelations
  timeSlot: ScheduleTimeSlot
}

function formatTimeShort(time: string) {
  if (!time) return ""
  const [h, m] = time.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return m === "00" ? `${display} ${ampm}` : `${display}:${m} ${ampm}`
}

function timeToMinutes(time: string): number {
  if (!time) return 0
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function getNext5Days(): Date[] {
  const today = new Date()
  const days: Date[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

function isToday(date: Date) {
  return date.toDateString() === new Date().toDateString()
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function ScheduleCalendarView({ rows }: { rows: ScheduleRow[] }) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const next5 = useMemo(getNext5Days, [])
  const next5Strings = useMemo(() => next5.map(toDateString), [next5])

  const activeRows = useMemo(() => rows.filter((r) => r.schedule.is_active !== false), [rows])

  const dayData = useMemo(() => {
    return next5.map((date, i) => {
      const dayOfWeek = date.getDay()
      const dateStr = next5Strings[i]

      const dayRows = activeRows.filter((r) => {
        if (!r.timeSlot.start_time) return false

        if (r.schedule.schedule_type !== "one_off") {
          return r.timeSlot.day_of_week === dayOfWeek
        }

        const instanceDate = r.timeSlot.instance_date || r.schedule.one_off_date
        return instanceDate === dateStr
      })

      return { date, dayOfWeek, dateStr, today: isToday(date), rows: dayRows }
    })
  }, [next5, next5Strings, activeRows])

  const { startHour, totalHours } = useMemo(() => {
    let minHour = 8
    let maxHour = 22

    for (const row of activeRows) {
      if (!row.timeSlot.start_time) continue
      const startMins = timeToMinutes(row.timeSlot.start_time)
      const endMins = row.timeSlot.end_time ? timeToMinutes(row.timeSlot.end_time) : startMins + DEFAULT_DURATION

      const evtStartHour = Math.floor(startMins / 60)
      const evtEndHour = Math.ceil(endMins / 60)

      if (evtStartHour < minHour) minHour = Math.max(0, evtStartHour)
      if (evtEndHour > maxHour) maxHour = Math.min(24, evtEndHour)
    }

    return { startHour: minHour, totalHours: Math.max(1, maxHour - minHour) }
  }, [activeRows])

  useEffect(() => {
    if (!scrollRef.current) return

    const container = scrollRef.current
    const currentHour = new Date().getHours()

    if (currentHour >= startHour && currentHour <= startHour + totalHours) {
      const gridHeight = Math.max(container.clientHeight, totalHours * HOUR_HEIGHT)
      const topPx = ((currentHour - startHour) / totalHours) * gridHeight
      const visibleHeight = container.clientHeight
      container.scrollTop = Math.max(0, topPx - visibleHeight / 2 + HOUR_HEIGHT / 2)
    }
  }, [startHour, totalHours])

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const showNowLine = (currentMinutes / 60) >= startHour && (currentMinutes / 60) <= (startHour + totalHours)
  const nowPct = showNowLine ? (((currentMinutes / 60) - startHour) / totalHours) * 100 : 0

  return (
    <div className="border rounded-xl overflow-hidden bg-background flex flex-col h-[calc(100vh-9.75rem)]">
      <div className="grid border-b shrink-0" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
        <div className="border-r" />
        {dayData.map(({ date, today }, i) => (
          <div
            key={i}
            className={`text-center py-2.5 border-r last:border-r-0 ${today ? "bg-primary/5" : ""}`}
          >
            <div className="flex flex-row flex-1 items-center justify-center gap-2">
              <p className={`text-lg font-semibold leading-tight ${today ? "text-primary" : ""}`}>
                {date.getDate()}
              </p>
              <p className={`text-md font-medium uppercase ${today ? "text-primary" : "text-muted-foreground"}`}>
                {DAYS_SHORT[date.getDay()]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 relative overflow-y-auto">
        <div
          className="relative grid h-full"
          style={{ gridTemplateColumns: "56px repeat(5, 1fr)", minHeight: totalHours * HOUR_HEIGHT }}
        >
          <div className="relative border-r">
            {Array.from({ length: totalHours + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute w-full pr-2 flex items-start justify-end"
                style={{ top: `${(i / totalHours) * 100}%` }}
              >
                <span className="text-[10px] text-muted-foreground font-medium tabular-nums -translate-y-1/2">
                  {formatTimeShort(`${startHour + i}:00`)}
                </span>
              </div>
            ))}
          </div>

          {dayData.map(({ today, rows: dayRows }, colIndex) => (
            <div
              key={colIndex}
              className={`relative border-r last:border-r-0 ${today ? "bg-primary/[0.02]" : ""}`}
            >
              {Array.from({ length: totalHours + 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-t border-border/40"
                  style={{ top: `${(i / totalHours) * 100}%` }}
                />
              ))}

              {Array.from({ length: totalHours }, (_, i) => (
                <div
                  key={`half-${i}`}
                  className="absolute w-full border-t border-dashed border-border/20"
                  style={{ top: `${((i + 0.5) / totalHours) * 100}%` }}
                />
              ))}

              {today && showNowLine && (
                <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: `${nowPct}%` }}>
                  <div className="size-2 rounded-full bg-destructive -ml-1 shrink-0" />
                  <div className="flex-1 h-[1.5px] bg-destructive/60" />
                </div>
              )}

              {dayRows.map((row) => {
                const startMins = timeToMinutes(row.timeSlot.start_time)
                const endMins = row.timeSlot.end_time ? timeToMinutes(row.timeSlot.end_time) : startMins + DEFAULT_DURATION
                const duration = endMins - startMins

                const topPct = (((startMins / 60) - startHour) / totalHours) * 100
                const heightPct = ((duration / 60) / totalHours) * 100

                const isPast = today && endMins <= currentMinutes
                const isOneOff = row.schedule.schedule_type === "one_off"
                const hashId = encodeScheduleId(row.schedule.id)

                return (
                  <button
                    key={`${row.schedule.id}-${row.timeSlot.id}`}
                    className={`absolute left-1 right-1 rounded-md border-l-3 px-2 py-1.5 text-left overflow-hidden bg-card border-white/15 border-1
                      cursor-pointer transition-all hover:shadow-md z-10 flex flex-col items-start justify-between
                      hover:scale-101 hover:shadow-lg
                      ${isOneOff ? "border-l-white/20" : "border-l-chart-2/60"}
                      ${today ? "border-l-primary/60" : ""}
                      ${isPast ? "opacity-50 saturate-60" : ""}`}
                    style={{
                      top: `calc(${topPct}% + ${BLOCK_GAP}px)`,
                      height: `calc(${heightPct}% - ${BLOCK_GAP * 2}px)`,
                      minHeight: "24px",
                    }}
                    onClick={() => router.push(`/schedules/${hashId}`)}
                  >
                    <div>
                      <p className="text-[13px] font-bold leading-tight mt-1">{row.schedule.name}</p>
                      {duration >= 45 && (
                        <p className="text-[12px] opacity-70 leading-tight mt-0.5">
                          {formatTimeShort(row.timeSlot.start_time)}
                          {row.timeSlot.end_time && ` – ${formatTimeShort(row.timeSlot.end_time)}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col">
                      {duration >= 60 && row.schedule.level && (
                        <p className="text-[10px] opacity-60 truncate mt-0.5">
                          {row.schedule.level.name}
                          {row.schedule.group ? ` · ${row.schedule.group.name}` : ""}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

