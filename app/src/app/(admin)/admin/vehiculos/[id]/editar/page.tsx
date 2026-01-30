"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui"
import { useLanguageStore } from "@/stores/languageStore"
import { useCurrency } from "@/hooks/useCurrency"
import { ArrowLeft, Save, Upload, X, Star, Trash2, ImageIcon } from "lucide-react"

interface VehicleImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  order: number
}

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  licensePlate: string
  vin: string | null
  color: string | null
  category: string
  transmission: string
  fuelType: string
  seats: number
  doors: number
  airConditioning: boolean
  dailyRate: number
  weeklyRate: number | null
  monthlyRate: number | null
  depositAmount: number
  commissionAmount: number | null
  status: string
  mileage: number
  description: string | null
  features: string[]
  isFeatured: boolean
  isActive: boolean
  images?: VehicleImage[]
}

export default function EditVehiclePage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { language } = useLanguageStore()
  const { primarySymbol } = useCurrency()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState<VehicleImage[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    licensePlate: "",
    vin: "",
    color: "",
    category: "COMPACT",
    transmission: "AUTOMATIC",
    fuelType: "GASOLINE",
    seats: 5,
    doors: 4,
    airConditioning: true,
    dailyRate: 0,
    weeklyRate: 0,
    monthlyRate: 0,
    depositAmount: 0,
    commissionAmount: 0,
    status: "AVAILABLE",
    mileage: 0,
    description: "",
    features: [] as string[],
    isFeatured: false,
    isActive: true,
  })
  const [newFeature, setNewFeature] = useState("")

  useEffect(() => {
    fetchVehicle()
    fetchImages()
  }, [id])

  const fetchVehicle = async () => {
    try {
      const res = await fetch(`/api/vehicles/${id}`)
      if (res.ok) {
        const data: Vehicle = await res.json()
        setFormData({
          brand: data.brand,
          model: data.model,
          year: data.year,
          licensePlate: data.licensePlate,
          vin: data.vin || "",
          color: data.color || "",
          category: data.category,
          transmission: data.transmission,
          fuelType: data.fuelType,
          seats: data.seats,
          doors: data.doors,
          airConditioning: data.airConditioning,
          dailyRate: data.dailyRate,
          weeklyRate: data.weeklyRate || 0,
          monthlyRate: data.monthlyRate || 0,
          depositAmount: data.depositAmount,
          commissionAmount: data.commissionAmount || 0,
          status: data.status,
          mileage: data.mileage,
          description: data.description || "",
          features: data.features || [],
          isFeatured: data.isFeatured,
          isActive: data.isActive,
        })
        if (data.images) {
          setImages(data.images)
        }
      } else {
        router.push("/admin/vehiculos")
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchImages = async () => {
    try {
      const res = await fetch(`/api/vehicles/${id}/images`)
      if (res.ok) {
        const data = await res.json()
        setImages(data)
      }
    } catch (error) {
      console.error("Error fetching images:", error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      for (const file of Array.from(files)) {
        // First, upload the file
        const formDataUpload = new FormData()
        formDataUpload.append("file", file)
        formDataUpload.append("folder", "vehicles")

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        })

        if (!uploadRes.ok) {
          const error = await uploadRes.json()
          alert(error.error || "Error al subir imagen")
          continue
        }

        const { url } = await uploadRes.json()

        // Then, add the image to the vehicle
        const imageRes = await fetch(`/api/vehicles/${id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        })

        if (imageRes.ok) {
          const newImage = await imageRes.json()
          setImages((prev) => [...prev, newImage])
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Error al subir imagen")
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm(language === "en" ? "Delete this image?" : "¿Eliminar esta imagen?")) return

    try {
      const res = await fetch(`/api/vehicles/${id}/images?imageId=${imageId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId))
      } else {
        const error = await res.json()
        alert(error.error || "Error al eliminar imagen")
      }
    } catch (error) {
      console.error("Error deleting image:", error)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    try {
      const res = await fetch(`/api/vehicles/${id}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, isPrimary: true }),
      })

      if (res.ok) {
        setImages((prev) =>
          prev.map((img) => ({
            ...img,
            isPrimary: img.id === imageId,
          }))
        )
      }
    } catch (error) {
      console.error("Error setting primary image:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          weeklyRate: formData.weeklyRate || null,
          monthlyRate: formData.monthlyRate || null,
          commissionAmount: formData.commissionAmount || null,
          vin: formData.vin || null,
          color: formData.color || null,
          description: formData.description || null,
        }),
      })

      if (res.ok) {
        router.push(`/admin/vehiculos/${id}`)
      } else {
        const error = await res.json()
        alert(error.error || "Error al guardar vehículo")
      }
    } catch (error) {
      console.error("Error saving vehicle:", error)
      alert("Error al guardar vehículo")
    } finally {
      setSaving(false)
    }
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      })
      setNewFeature("")
    }
  }

  const removeFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter((f) => f !== feature),
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loader" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/vehiculos/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === "en" ? "Edit Vehicle" : "Editar Vehículo"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {formData.brand} {formData.model} - {formData.licensePlate}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {language === "en" ? "Images" : "Imágenes"}
            </h2>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingImage}
                  leftIcon={uploadingImage ? <div className="loader-sm" /> : <Upload className="h-4 w-4" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImage
                    ? language === "en" ? "Uploading..." : "Subiendo..."
                    : language === "en" ? "Upload Images" : "Subir Imágenes"}
                </Button>
              </label>
            </div>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`relative group rounded-lg overflow-hidden border-2 ${
                    image.isPrimary
                      ? "border-amber-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="aspect-[4/3] relative">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {language === "en" ? "Primary" : "Principal"}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        className="p-2 bg-white rounded-full text-amber-500 hover:bg-amber-50"
                        title={language === "en" ? "Set as primary" : "Establecer como principal"}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image.id)}
                      className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50"
                      title={language === "en" ? "Delete" : "Eliminar"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {language === "en"
                  ? "No images uploaded yet. Upload images to showcase the vehicle."
                  : "No hay imágenes. Sube imágenes para mostrar el vehículo."}
              </p>
              <label htmlFor="image-upload" className="mt-4 inline-block">
                <Button
                  type="button"
                  variant="outline"
                  leftIcon={<Upload className="h-4 w-4" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {language === "en" ? "Upload Images" : "Subir Imágenes"}
                </Button>
              </label>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            {language === "en" ? "Basic Information" : "Información Básica"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? "Brand" : "Marca"} *
              </label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? "Model" : "Modelo"} *
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? "Year" : "Año"} *
              </label>
              <input
                type="number"
                required
                min="1990"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? "License Plate" : "Placa"} *
              </label>
              <input
                type="text"
                required
                value={formData.licensePlate}
                onChange={(e) =>
                  setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                VIN
              </label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) =>
                  setFormData({ ...formData, vin: e.target.value })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            {language === "en" ? "Specifications" : "Especificaciones"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? "Category" : "Categoría"} *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="ECONOMY">{language === "en" ? "Economy" : "Económico"}</option>
                <option value="COMPACT">{language === "en" ? "Compact" : "Compacto"}</option>
                <option value="MIDSIZE">{language === "en" ? "Midsize" : "Mediano"}</option>
                <option value="SUV">SUV</option>
                <option value="LUXURY">{language === "en" ? "Luxury" : "Lujo"}</option>
                <option value="VAN">Van</option>
                <option value="PICKUP">Pickup</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? "Transmission" : "Transmisión"} *
              </label>
              <select
                value={formData.transmission}
                onChange={(e) =>
                  setFormData({ ...formData, transmission: e.target.value })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="AUTOMATIC">{language === "en" ? "Automatic" : "Automática"}</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? "Fuel" : "Combustible"} *
              </label>
              <select
                value={formData.fuelType}
                onChange={(e) =>
                  setFormData({ ...formData, fuelType: e.target.value })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="GASOLINE">{language === "en" ? "Gasoline" : "Gasolina"}</option>
                <option value="DIESEL">Diésel</option>
                <option value="ELECTRIC">{language === "en" ? "Electric" : "Eléctrico"}</option>
                <option value="HYBRID">{language === "en" ? "Hybrid" : "Híbrido"}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? "Seats" : "Asientos"}
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={formData.seats}
                onChange={(e) =>
                  setFormData({ ...formData, seats: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? "Doors" : "Puertas"}
              </label>
              <input
                type="number"
                min="2"
                max="5"
                value={formData.doors}
                onChange={(e) =>
                  setFormData({ ...formData, doors: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? "Mileage" : "Kilometraje"}
              </label>
              <input
                type="number"
                min="0"
                value={formData.mileage}
                onChange={(e) =>
                  setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="airConditioning"
                checked={formData.airConditioning}
                onChange={(e) =>
                  setFormData({ ...formData, airConditioning: e.target.checked })
                }
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="airConditioning" className="text-sm text-gray-700 dark:text-gray-300">
                {language === "en" ? "Air Conditioning" : "Aire Acondicionado"}
              </label>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            {language === "en" ? "Pricing" : "Precios"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? `Daily Rate (${primarySymbol})` : `Precio por Día (${primarySymbol})`} *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.dailyRate}
                onChange={(e) =>
                  setFormData({ ...formData, dailyRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? `Weekly Rate (${primarySymbol})` : `Precio por Semana (${primarySymbol})`}
              </label>
              <input
                type="number"
                min="0"
                value={formData.weeklyRate}
                onChange={(e) =>
                  setFormData({ ...formData, weeklyRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? `Monthly Rate (${primarySymbol})` : `Precio por Mes (${primarySymbol})`}
              </label>
              <input
                type="number"
                min="0"
                value={formData.monthlyRate}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? `Deposit (${primarySymbol})` : `Depósito (${primarySymbol})`}
              </label>
              <input
                type="number"
                min="0"
                value={formData.depositAmount}
                onChange={(e) =>
                  setFormData({ ...formData, depositAmount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === "en" ? `Commission per Day (${primarySymbol})` : `Comisión por Día (${primarySymbol})`}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.commissionAmount}
                onChange={(e) =>
                  setFormData({ ...formData, commissionAmount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {language === "en" ? "Amount agent receives per rental day" : "Monto que recibe el agente por día de renta"}
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            {language === "en" ? "Features" : "Características"}
          </h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
              placeholder={language === "en" ? "Add feature..." : "Agregar característica..."}
              className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
            <Button type="button" onClick={addFeature}>
              {language === "en" ? "Add" : "Agregar"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.features.map((feature, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm flex items-center gap-2 dark:text-gray-200"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(feature)}
                  className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            {language === "en" ? "Description" : "Descripción"}
          </h2>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder={language === "en" ? "Vehicle description..." : "Descripción del vehículo..."}
            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {/* Options */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            {language === "en" ? "Options" : "Opciones"}
          </h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) =>
                  setFormData({ ...formData, isFeatured: e.target.checked })
                }
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm dark:text-gray-300">
                {language === "en" ? "Featured Vehicle" : "Vehículo Destacado"}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm dark:text-gray-300">
                {language === "en" ? "Active" : "Activo"}
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href={`/admin/vehiculos/${id}`}>
            <Button variant="outline">
              {language === "en" ? "Cancel" : "Cancelar"}
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            leftIcon={saving ? <div className="loader-sm" /> : <Save className="h-4 w-4" />}
          >
            {saving
              ? (language === "en" ? "Saving..." : "Guardando...")
              : (language === "en" ? "Save Changes" : "Guardar Cambios")}
          </Button>
        </div>
      </form>
    </div>
  )
}
