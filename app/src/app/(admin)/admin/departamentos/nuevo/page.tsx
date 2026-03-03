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

const categoryOptions = [
  { value: "STUDIO", label: "Estudio" },
  { value: "ONE_BEDROOM", label: "1 Habitación" },
  { value: "TWO_BEDROOM", label: "2 Habitaciones" },
  { value: "THREE_BEDROOM", label: "3 Habitaciones" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "VILLA", label: "Villa" },
  { value: "OTHER", label: "Otro" },
]

const commonAmenities = [
  "WiFi",
  "Aire acondicionado",
  "Cocina equipada",
  "Estacionamiento",
  "Lavadora",
  "TV por cable",
  "Piscina",
  "Balcón",
  "Seguridad 24h",
  "Ascensor",
  "Gym",
  "Área de BBQ",
]

export default function NewDepartamentoPage() {
  const router = useRouter()
  const { settings } = useSettingsStore()
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    country: "República Dominicana",
    category: "ONE_BEDROOM",
    rooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    floor: "",
    pricePerNight: 0,
    pricePerWeek: 0,
    pricePerMonth: 0,
    depositAmount: 0,
    commissionAmount: 0,
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

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    )
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const uploadData = new FormData()
        uploadData.append("file", file)
        uploadData.append("folder", "apartments")

        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
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
      const response = await fetch("/api/apartments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amenities: selectedAmenities,
        }),
      })

      if (response.ok) {
        const apartment = await response.json()

        for (let i = 0; i < uploadedImages.length; i++) {
          await fetch(`/api/apartments/${apartment.id}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: uploadedImages[i],
              isPrimary: i === 0,
            }),
          })
        }

        router.push("/admin/departamentos")
      } else {
        const error = await response.json()
        alert(error.error || "Error al crear departamento")
      }
    } catch (error) {
      console.error("Error creating apartment:", error)
      alert("Error al crear departamento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/departamentos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nuevo Departamento
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Agrega una nueva propiedad en alquiler
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Nombre de la propiedad"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Apartamento Vista al Mar"
                />
                <Input
                  label="Dirección"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Calle, número, sector"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Ciudad"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="Santo Domingo"
                  />
                  <Input
                    label="País"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="República Dominicana"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Especificaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Especificaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Tipo de propiedad"
                    options={categoryOptions}
                    value={formData.category}
                    onChange={(v) => handleSelectChange("category", v)}
                  />
                  <Input
                    label="Piso (opcional)"
                    name="floor"
                    type="number"
                    value={formData.floor}
                    onChange={handleChange}
                    min={0}
                    placeholder="Ej: 3"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Habitaciones"
                    name="rooms"
                    type="number"
                    value={formData.rooms}
                    onChange={handleChange}
                    min={0}
                    max={20}
                    required
                  />
                  <Input
                    label="Baños"
                    name="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    min={1}
                    max={20}
                    required
                  />
                  <Input
                    label="Máx. huéspedes"
                    name="maxGuests"
                    type="number"
                    value={formData.maxGuests}
                    onChange={handleChange}
                    min={1}
                    max={50}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Precios */}
            <Card>
              <CardHeader>
                <CardTitle>Precios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={`Precio por noche (${settings.currencySymbol})`}
                    name="pricePerNight"
                    type="number"
                    value={formData.pricePerNight}
                    onChange={handleChange}
                    required
                    min={0}
                    step="0.01"
                  />
                  <Input
                    label={`Precio por semana (${settings.currencySymbol})`}
                    name="pricePerWeek"
                    type="number"
                    value={formData.pricePerWeek}
                    onChange={handleChange}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={`Precio por mes (${settings.currencySymbol})`}
                    name="pricePerMonth"
                    type="number"
                    value={formData.pricePerMonth}
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
                <Input
                  label={`Comisión del agente (${settings.currencySymbol})`}
                  name="commissionAmount"
                  type="number"
                  value={formData.commissionAmount}
                  onChange={handleChange}
                  min={0}
                  step="0.01"
                  helperText="Monto fijo de comisión por noche para el agente"
                />
              </CardContent>
            </Card>

            {/* Descripción */}
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
                  placeholder="Describe la propiedad: ubicación, ambiente, características especiales..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </CardContent>
            </Card>

            {/* Amenidades */}
            <Card>
              <CardHeader>
                <CardTitle>Amenidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {commonAmenities.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {amenity}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Imágenes */}
            <Card>
              <CardHeader>
                <CardTitle>Imágenes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="block w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {uploading ? "Subiendo..." : "Click para subir imágenes"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <img
                          src={url}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded">
                            Principal
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Opciones */}
            <Card>
              <CardHeader>
                <CardTitle>Opciones</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Marcar como destacado
                  </span>
                </label>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loading}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Guardar Departamento
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
