"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Eraser, Check, RotateCcw } from "lucide-react"
import { Button } from "./Button"

interface SignaturePadProps {
  onSave: (signature: string) => void
  onClear?: () => void
  width?: number
  height?: number
  penColor?: string
  backgroundColor?: string
  label?: string
  existingSignature?: string | null
  disabled?: boolean
}

export function SignaturePad({
  onSave,
  onClear,
  width = 400,
  height = 200,
  penColor = "#000000",
  backgroundColor = "#ffffff",
  label = "Firma",
  existingSignature = null,
  disabled = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Load existing signature if provided
    if (existingSignature) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        setHasSignature(true)
      }
      img.src = existingSignature
    }
  }, [width, height, backgroundColor, existingSignature])

  // Get coordinates from event (works for both mouse and touch)
  const getCoordinates = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return null

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      if ("touches" in e) {
        // Touch event
        const touch = e.touches[0]
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        }
      } else {
        // Mouse event
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        }
      }
    },
    []
  )

  // Draw line between two points
  const drawLine = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.beginPath()
      ctx.strokeStyle = penColor
      ctx.lineWidth = 2.5
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
    },
    [penColor]
  )

  // Start drawing
  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (disabled) return
      e.preventDefault()

      const coords = getCoordinates(e)
      if (coords) {
        setIsDrawing(true)
        setLastPoint(coords)
        setHasSignature(true)
      }
    },
    [disabled, getCoordinates]
  )

  // Draw
  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || disabled) return
      e.preventDefault()

      const coords = getCoordinates(e)
      if (coords && lastPoint) {
        drawLine(lastPoint, coords)
        setLastPoint(coords)
      }
    },
    [isDrawing, disabled, getCoordinates, lastPoint, drawLine]
  )

  // Stop drawing
  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
    setLastPoint(null)
  }, [])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onClear?.()
  }, [backgroundColor, onClear])

  // Save signature
  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    const signature = canvas.toDataURL("image/png")
    onSave(signature)
  }, [hasSignature, onSave])

  // Prevent scrolling while drawing on touch devices
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const preventScroll = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault()
      }
    }

    canvas.addEventListener("touchmove", preventScroll, { passive: false })
    return () => {
      canvas.removeEventListener("touchmove", preventScroll)
    }
  }, [isDrawing])

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`border-2 border-dashed rounded-lg touch-none ${
            disabled
              ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
              : hasSignature
              ? "border-amber-400 dark:border-amber-600"
              : "border-gray-300 dark:border-gray-600 hover:border-amber-400 dark:hover:border-amber-600"
          }`}
          style={{
            width: "100%",
            maxWidth: `${width}px`,
            height: `${height}px`,
            cursor: disabled ? "not-allowed" : "crosshair",
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Firme aquí con el dedo o mouse
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={disabled || !hasSignature}
          leftIcon={<Eraser className="h-4 w-4" />}
        >
          Limpiar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={disabled}
          leftIcon={<RotateCcw className="h-4 w-4" />}
        >
          Reiniciar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={saveSignature}
          disabled={disabled || !hasSignature}
          leftIcon={<Check className="h-4 w-4" />}
          className="ml-auto"
        >
          Confirmar Firma
        </Button>
      </div>
    </div>
  )
}
