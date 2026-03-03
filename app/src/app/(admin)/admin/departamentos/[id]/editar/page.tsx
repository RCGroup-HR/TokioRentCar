"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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

const statusOptions = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "RENTED", label: "Rentado" },
  { value: "MAINTENANCE", label: "Mantenimiento" },
  { value: "OUT_OF_SERVICE", label: "Fuera de servicio" },
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

export default function EditDepartamentoPage() {
  const params = useParams()
  const router = useRouter()
  const { settings } = useSettingsStore()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
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
    status: "AVAILABLE",
    isFeatured: false,
  })

  useEffect(() => {
    if (params.id) {
      fetchApartment()
    }
  }, [params.id])

  const fetchApartment = async () => {
    try {
      const response = await fetch(`/api/apartments/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          country: data.country || "República Dominicana",
          category: data.category || "ONE_BEDROOM",
          rooms: data.rooms || 1,
          bathrooms: data.bathrooms || 1,
          maxGuests: data.maxGuests || 2,
          floor: data.floor?.toString() || "",
          pricePerNight: data.pricePerNight || 0,
          pricePerWeek: data.pricePerWeek || 0,
          pricePerMonth: data.pricePerMonth || 0,
          depositAmount: data.depositAmount || 0,
          commissionAmount: data.commissionAmount || 0,
          description: data.description || "",
          status: data.status || "AVAILABLE",
          isFeatured: data.isFeatured || false,
        })
        setSelectedAmenities(data.amenities || [])
        setUploadedImages(data.images?.map((img: { url: string }) => img.url) || [])
      }
    } catch (error) {
      console.error("Error fetching apartment:", error)
    } finally {
      setFetching(false)
    }
  }

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
      const response = await fetch(`/api/apartments/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amenities: selectedAmenities,
        }),
      })

      if (response.ok) {
        // Delete existing images and re-upload
        // (For simplicity: delete all and add new ones)
        for (const url of uploadedImages) {
          await fetch(`/api/apartments/${params.id}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, isPrimary: false }),
          })
        }

        router.push(`/admin/departamentos/${params.id}`)
      } else {
        const error = await response.json()
        alert(error.error || "Error al actualizar departamento")
      }
    } catch (error) {
      console.error("Error updating apartment:", error)
      alert("Error al actualizar departamento")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center py-16">
        <div className="loader" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/departamentos/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Editar Departamento
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{formData.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                />
                <Input
                  label="Dirección"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Ciudad"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="País"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>

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
                    required
                  />
                  <Input
                    label="Baños"
                    name="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    min={1}
                    required
                  />
                  <Input
                    label="Máx. huéspedes"
                    name="maxGuests"
                    type="number"
                    value={formData.maxGuests}
                    onChange={handleChange}
                    min={1}
                    required
                  />
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
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </CardContent>
            </Card>

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

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  label="Estado actual"
                  options={statusOptions}
                  value={formData.status}
                  onChange={(v) => handleSelectChange("status", v)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Imágenes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="block w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {uploading ? "Subiendo..." : "Agregar más imágenes"}
                  </p>
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
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden"
                      >
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
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loading}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
