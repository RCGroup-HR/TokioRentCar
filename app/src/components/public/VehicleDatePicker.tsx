"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useSettingsStore } from "@/stores/settingsStore"

export interface OccupiedRange {
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
}

interface VehicleDatePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  occupiedRanges?: OccupiedRange[]
}

const WEEK_DAYS = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"]
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

/** Convierte Date → "YYYY-MM-DD" */
function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Convierte "YYYY-MM-DD" → Date (medianoche local) */
function fromYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function VehicleDatePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  occupiedRanges = [],
}: VehicleDatePickerProps) {
  const { settings } = useSettingsStore()
  const primaryColor = settings.primaryColor || "#F59E0B"

  // Hoy sin hora
  const todayDate = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const todayYMD = useMemo(() => toYMD(todayDate), [todayDate])

  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>(() => ({
    year: todayDate.getFullYear(),
    month: todayDate.getMonth(),
  }))

  const [hoverDate, setHoverDate] = useState<string | null>(null)

  // Parsear rangos ocupados una sola vez
  const parsedOccupied = useMemo(
    () => occupiedRanges.map(r => ({ start: fromYMD(r.start), end: fromYMD(r.end) })),
    [occupiedRanges]
  )

  const isOccupied = (date: Date): boolean =>
    parsedOccupied.some(r => date >= r.start && date <= r.end)

  const isDisabled = (date: Date): boolean =>
    date < todayDate || isOccupied(date)

  /** Verifica si el rango [s..e] cruza alguna fecha ocupada */
  const rangeHasConflict = (s: string, e: string): boolean => {
    const sd = fromYMD(s)
    const ed = fromYMD(e)
    return parsedOccupied.some(r => r.start <= ed && r.end >= sd)
  }

  /** Genera la cuadrícula del mes (null = celda vacía) */
  const getDays = (year: number, month: number): (Date | null)[] => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }

  const handleDayClick = (date: Date) => {
    if (isDisabled(date)) return
    const ds = toYMD(date)

    if (!startDate || (startDate && endDate)) {
      // Empezar de nuevo: este día es la fecha de inicio
      onStartDateChange(ds)
      onEndDateChange("")
    } else if (ds <= startDate) {
      // Clic antes o en la fecha de inicio → reiniciar desde aquí
      onStartDateChange(ds)
      onEndDateChange("")
    } else {
      // Tenemos startDate, elegimos endDate
      if (rangeHasConflict(startDate, ds)) {
        // El rango cruza fechas ocupadas → reiniciar desde aquí
        onStartDateChange(ds)
        onEndDateChange("")
      } else {
        onEndDateChange(ds)
      }
    }
  }

  const prevMonth = () =>
    setCurrentMonth(p =>
      p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 }
    )
  const nextMonth = () =>
    setCurrentMonth(p =>
      p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 }
    )

  const days = getDays(currentMonth.year, currentMonth.month)

  return (
    <div className="select-none">
      {/* Navegación de mes */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Cabecera días de semana */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map(d => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Cuadrícula de días */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />

          const ds = toYMD(day)
          const occupied = isOccupied(day)
          const disabled = isDisabled(day)
          const isStart = ds === startDate
          const isEnd = ds === endDate
          const isToday = ds === todayYMD

          // Rango resaltado (incluyendo preview con hover)
          const effectiveEnd = endDate || hoverDate
          let inRange = false
          if (startDate && effectiveEnd) {
            if (effectiveEnd >= startDate) {
              inRange = ds > startDate && ds < effectiveEnd
            } else {
              inRange = ds > effectiveEnd && ds < startDate
            }
          }

          // Estilos dinámicos
          let cls =
            "h-8 w-full text-xs font-medium rounded-md transition flex items-center justify-center "
          let style: React.CSSProperties = {}

          if (occupied) {
            cls += "bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400 cursor-not-allowed "
          } else if (isStart || isEnd) {
            cls += "text-white cursor-pointer font-bold "
            style = { backgroundColor: primaryColor }
          } else if (inRange) {
            cls += "text-gray-800 dark:text-gray-200 cursor-pointer "
            style = { backgroundColor: `${primaryColor}30` }
          } else if (disabled) {
            cls += "text-gray-300 dark:text-gray-600 cursor-not-allowed "
          } else {
            cls +=
              "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer "
          }

          if (isToday && !isStart && !isEnd) cls += "underline font-bold "

          return (
            <button
              key={ds}
              type="button"
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => !disabled && setHoverDate(ds)}
              onMouseLeave={() => setHoverDate(null)}
              disabled={disabled}
              className={cls}
              style={style}
              title={occupied ? "Fecha no disponible" : undefined}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 flex-shrink-0" />
          Ocupado
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded flex-shrink-0"
            style={{ backgroundColor: primaryColor }}
          />
          Seleccionado
        </div>
        {startDate && !endDate && (
          <span className="ml-auto font-medium" style={{ color: primaryColor }}>
            Elige fecha de devolución
          </span>
        )}
      </div>
    </div>
  )
}
