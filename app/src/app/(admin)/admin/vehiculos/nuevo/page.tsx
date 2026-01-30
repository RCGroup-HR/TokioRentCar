"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import {
  Button,
  Input,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui"
import { ArrowLeft, Save, Upload, X } from "lucide-react"
import Image from "next/image"

const categoryOptions = [
  { value: "ECONOMY", label: "Económico" },
  { value: "COMPACT", label: "Compacto" },
  { value: "MIDSIZE", label: "Mediano" },
  { value: "FULLSIZE", label: "Tamaño completo" },
  { value: "SUV", label: "SUV" },
  { value: "LUXURY", label: "Lujo" },
  { value: "VAN", label: "Van" },
  { value: "PICKUP", label: "Pickup" },
  { value: "CONVERTIBLE", label: "Convertible" },
  { value: "SPORTS", label: "Deportivo" },
]

const transmissionOptions = [
  { value: "AUTOMATIC", label: "Automático" },
  { value: "MANUAL", label: "Manual" },
]

const fuelTypeOptions = [
  { value: "GASOLINE", label: "Gasolina" },
  { value: "DIESEL", label: "Diésel" },
  { value: "ELECTRIC", label: "Eléctrico" },
  { value: "HYBRID", label: "Híbrido" },
]

export default function NewVehiclePage() {
  const router = useRouter()
  const { settings } = useSettingsStore()
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    licensePlate: "",
    vin: "",
    color: "",
    category: "ECONOMY",
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
    mileage: 0,
    description: "",
    isFeatured: false,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? parseFloat(value) || 0
          : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "vehicles")

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setUploadedImages((prev) => [...prev, data.url])
        }
      }
    } catch (error) {
      console.error("Error uploading images:", error)
      alert("Error al subir imágenes")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create vehicle
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const vehicle = await response.json()

        // Upload images
        for (let i = 0; i < uploadedImages.length; i++) {
          await fetch(`/api/vehicles/${vehicle.id}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: uploadedImages[i],
              isPrimary: i === 0,
            }),
          })
        }

        router.push("/admin/vehiculos")
      } else {
        const error = await response.json()
        alert(error.error || "Error al crear vehículo")
      }
    } catch (error) {
      console.error("Error creating vehicle:", error)
      alert("Error al crear vehículo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/vehiculos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Vehículo</h1>
          <p className="text-gray-500">Agrega un nuevo vehículo a tu flota</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Marca"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                    placeholder="Toyota"
                  />
                  <Input
                    label="Modelo"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    placeholder="Corolla"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Año"
                    name="year"
                    type="number"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    min={1990}
                    max={new Date().getFullYear() + 1}
                  />
                  <Input
                    label="Placa"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    required
                    placeholder="A123456"
                  />
                  <Input
                    label="Color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    required
                    placeholder="Blanco"
                  />
                </div>
                <Input
                  label="VIN (Opcional)"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  placeholder="Número de identificación del vehículo"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Especificaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Select
                    label="Categoría"
                    options={categoryOptions}
                    value={formData.category}
                    onChange={(v) => handleSelectChange("category", v)}
                  />
                  <Select
                    label="Transmisión"
                    options={transmissionOptions}
                    value={formData.transmission}
                    onChange={(v) => handleSelectChange("transmission", v)}
                  />
                  <Select
                    label="Combustible"
                    options={fuelTypeOptions}
                    value={formData.fuelType}
                    onChange={(v) => handleSelectChange("fuelType", v)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Asientos"
                    name="seats"
                    type="number"
                    value={formData.seats}
                    onChange={handleChange}
                    min={1}
                    max={15}
                  />
                  <Input
                    label="Puertas"
                    name="doors"
                    type="number"
                    value={formData.doors}
                    onChange={handleChange}
                    min={2}
                    max={6}
                  />
                  <Input
                    label="Kilometraje"
                    name="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="airConditioning"
                    name="airConditioning"
                    checked={formData.airConditioning}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <label htmlFor="airConditioning" className="text-sm">
                    Aire acondicionado
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Precios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={`Precio por día (${settings.currencySymbol})`}
                    name="dailyRate"
                    type="number"
                    value={formData.dailyRate}
                    onChange={handleChange}
                    required
                    min={0}
                    step="0.01"
                  />
                  <Input
                    label={`Precio por semana (${settings.currencySymbol})`}
                    name="weeklyRate"
                    type="number"
                    value={formData.weeklyRate}
                    onChange={handleChange}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={`Precio por mes (${settings.currencySymbol})`}
                    name="monthlyRate"
                    type="number"
                    value={formData.monthlyRate}
                    onChange={handleChange}
                    min={0}
                    step="0.01"
                  />
                  <Input
                    label={`Depósito (${settings.currencySymbol})`}
                    name="depositAmount"
                    type="number"
                    value={formData.depositAmount}
                    onChange={handleChange}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={`Comisión por día (${settings.currencySymbol})`}
                    name="commissionAmount"
                    type="number"
                    value={formData.commissionAmount}
                    onChange={handleChange}
                    min={0}
                    step="0.01"
                    helperText="Monto que recibe el agente por día de renta"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Descripción del vehículo..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Imágenes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploading ? "Subiendo..." : "Haz clic para subir imágenes"}
                    </span>
                  </label>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative aspect-video">
                        <Image
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 text-xs bg-primary text-white px-2 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Opciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <label htmlFor="isFeatured" className="text-sm">
                    Marcar como destacado
                  </label>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loading}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Guardar Vehículo
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
