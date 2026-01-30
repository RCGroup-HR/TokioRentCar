"use client"

import { useState, useEffect, useRef } from "react"
import { useSettingsStore } from "@/stores/settingsStore"
import { useLanguageStore } from "@/stores/languageStore"
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui"
import { Save, Upload, X, DollarSign, RefreshCw } from "lucide-react"
import Image from "next/image"

export default function ConfigurationPage() {
  const { settings, updateSettings, fetchSettings } = useSettingsStore()
  const { language, t } = useLanguageStore()
  const [loading, setLoading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [contractHeaderUploading, setContractHeaderUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const contractHeaderInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    companyName: "",
    slogan: "",
    logo: "",
    contractHeaderImage: "",
    primaryColor: "#F59E0B",
    secondaryColor: "#1F2937",
    accentColor: "#000000",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    country: "",
    googleMapsUrl: "",
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    currency: "USD",
    currencySymbol: "$",
    secondaryCurrency: "DOP",
    secondaryCurrencySymbol: "RD$",
    exchangeRate: 60,
    showDualCurrency: true,
    applyTax: true,
    taxRate: 18,
    timezone: "America/Santo_Domingo",
    termsAndConditions: "",
    privacyPolicy: "",
    cancellationPolicy: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  })

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || "",
        slogan: settings.slogan || "",
        logo: settings.logo || "",
        contractHeaderImage: settings.contractHeaderImage || "",
        primaryColor: settings.primaryColor || "#F59E0B",
        secondaryColor: settings.secondaryColor || "#1F2937",
        accentColor: settings.accentColor || "#000000",
        phone: settings.phone || "",
        whatsapp: settings.whatsapp || "",
        email: settings.email || "",
        address: settings.address || "",
        city: settings.city || "",
        country: settings.country || "",
        googleMapsUrl: settings.googleMapsUrl || "",
        facebook: settings.facebook || "",
        instagram: settings.instagram || "",
        twitter: settings.twitter || "",
        youtube: settings.youtube || "",
        tiktok: settings.tiktok || "",
        currency: settings.currency || "USD",
        currencySymbol: settings.currencySymbol || "$",
        secondaryCurrency: settings.secondaryCurrency || "DOP",
        secondaryCurrencySymbol: settings.secondaryCurrencySymbol || "RD$",
        exchangeRate: settings.exchangeRate || 60,
        showDualCurrency: settings.showDualCurrency ?? true,
        applyTax: settings.applyTax ?? true,
        taxRate: settings.taxRate || 18,
        timezone: settings.timezone || "America/Santo_Domingo",
        termsAndConditions: settings.termsAndConditions || "",
        privacyPolicy: settings.privacyPolicy || "",
        cancellationPolicy: settings.cancellationPolicy || "",
        metaTitle: settings.metaTitle || "",
        metaDescription: settings.metaDescription || "",
        metaKeywords: settings.metaKeywords || "",
      })
    }
  }, [settings])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) || 0 : value,
    }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      formDataUpload.append("folder", "logos")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        const newLogo = data.url
        setFormData((prev) => ({ ...prev, logo: newLogo }))
        // Auto-save to database
        await updateSettings({ logo: newLogo })
        // Refresh settings from server to ensure sync
        await fetchSettings()
      } else {
        const error = await response.json()
        alert(error.error || "Error al subir logo")
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
      alert("Error al subir logo")
    } finally {
      setLogoUploading(false)
      // Reset input to allow selecting the same file again
      e.target.value = ""
    }
  }

  const handleContractHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setContractHeaderUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      formDataUpload.append("folder", "contracts")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        const newHeaderImage = data.url
        setFormData((prev) => ({ ...prev, contractHeaderImage: newHeaderImage }))
        // Auto-save to database
        await updateSettings({ contractHeaderImage: newHeaderImage })
        // Refresh settings from server to ensure sync
        await fetchSettings()
      } else {
        const error = await response.json()
        alert(error.error || "Error al subir imagen de encabezado")
      }
    } catch (error) {
      console.error("Error uploading contract header:", error)
      alert("Error al subir imagen de encabezado")
    } finally {
      setContractHeaderUploading(false)
      // Reset input to allow selecting the same file again
      e.target.value = ""
    }
  }

  const handleRemoveLogo = async () => {
    setFormData((prev) => ({ ...prev, logo: "" }))
    await updateSettings({ logo: "" })
    await fetchSettings()
  }

  const handleRemoveContractHeader = async () => {
    setFormData((prev) => ({ ...prev, contractHeaderImage: "" }))
    await updateSettings({ contractHeaderImage: "" })
    await fetchSettings()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateSettings(formData)
      alert("Configuración guardada exitosamente")
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Error al guardar configuración")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === "en" ? "Settings" : "Configuración"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {language === "en" ? "Customize your rental system" : "Personaliza tu sistema de renta"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Company Information" : "Información de la Empresa"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label={language === "en" ? "Company Name" : "Nombre de la Empresa"}
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
              <Input
                label="Slogan"
                name="slogan"
                value={formData.slogan}
                onChange={handleChange}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <div className="flex items-center gap-4">
                  {formData.logo ? (
                    <div className="relative w-32 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                      <img
                        src={formData.logo}
                        alt="Logo"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer flex flex-col items-center text-gray-400 dark:text-gray-500"
                      >
                        {logoUploading ? (
                          <span className="text-xs">{language === "en" ? "Uploading..." : "Subiendo..."}</span>
                        ) : (
                          <>
                            <Upload className="h-5 w-5" />
                            <span className="text-xs">{language === "en" ? "Upload logo" : "Subir logo"}</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="cursor-pointer text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1"
                    >
                      <Upload className="h-4 w-4" />
                      {logoUploading
                        ? (language === "en" ? "Uploading..." : "Subiendo...")
                        : (language === "en" ? "Change logo" : "Cambiar logo")}
                    </button>
                  )}
                </div>
              </div>

              {/* Contract Header Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === "en" ? "Contract Header Image" : "Imagen de Encabezado del Contrato"}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {language === "en"
                    ? "This logo will appear in the top-left corner of rental contracts (recommended: 120x60px)"
                    : "Este logo aparecerá en la esquina superior izquierda de los contratos de renta (recomendado: 120x60px)"}
                </p>
                <input
                  ref={contractHeaderInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleContractHeaderUpload}
                  className="hidden"
                  id="contract-header-upload"
                />
                <div className="flex flex-col gap-3">
                  {formData.contractHeaderImage ? (
                    <div className="relative w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                      <img
                        src={formData.contractHeaderImage}
                        alt="Contract Header"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveContractHeader}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                      <label
                        htmlFor="contract-header-upload"
                        className="cursor-pointer flex flex-col items-center text-gray-400 dark:text-gray-500"
                      >
                        {contractHeaderUploading ? (
                          <span className="text-xs">{language === "en" ? "Uploading..." : "Subiendo..."}</span>
                        ) : (
                          <>
                            <Upload className="h-5 w-5" />
                            <span className="text-xs">{language === "en" ? "Upload header image" : "Subir imagen de encabezado"}</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                  {formData.contractHeaderImage && (
                    <button
                      type="button"
                      onClick={() => contractHeaderInputRef.current?.click()}
                      className="cursor-pointer text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1"
                    >
                      <Upload className="h-4 w-4" />
                      {contractHeaderUploading
                        ? (language === "en" ? "Uploading..." : "Subiendo...")
                        : (language === "en" ? "Change header image" : "Cambiar imagen de encabezado")}
                    </button>
                  )}
                </div>

                {/* Contract Header Preview */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {language === "en" ? "Contract Header Preview:" : "Vista previa del encabezado del contrato:"}
                  </p>
                  <div className="bg-white border border-gray-300 rounded p-3">
                    <div className="flex justify-between items-start border-b-2 border-gray-800 pb-3">
                      <div className="flex items-center gap-3">
                        {/* Logo en esquina superior izquierda */}
                        {formData.contractHeaderImage ? (
                          <img
                            src={formData.contractHeaderImage}
                            alt="Logo contrato"
                            className="object-contain w-20 max-h-[40px]"
                          />
                        ) : formData.logo ? (
                          <img
                            src={formData.logo}
                            alt="Logo"
                            className="object-contain w-20 max-h-[40px]"
                          />
                        ) : (
                          <div className="text-sm font-bold text-red-600">
                            {formData.companyName || "EMPRESA"}
                            <div className="text-[10px] font-normal text-gray-600">Rent Car</div>
                          </div>
                        )}
                        <div className="text-[10px] text-gray-600">
                          <p className="font-semibold">{formData.companyName || "Nombre de la Empresa"}</p>
                          <p>{formData.address || "Dirección"}</p>
                          <p>{formData.phone || "Teléfono"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-800">CONTRATO DE ALQUILER</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">
                    {!formData.contractHeaderImage && (language === "en"
                      ? "Using application logo as fallback. Upload a custom contract logo for a personalized look."
                      : "Usando el logo de la aplicación. Sube un logo personalizado para el contrato.")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Brand Colors" : "Colores de Marca"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === "en" ? "Primary Color" : "Color Primario"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === "en" ? "Secondary Color" : "Color Secundario"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === "en" ? "Accent Color" : "Color Acento"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: formData.secondaryColor }}>
                <div className="flex items-center gap-4">
                  <div
                    className="px-4 py-2 rounded-lg font-medium text-white"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Botón Primario
                  </div>
                  <div
                    className="px-4 py-2 rounded-lg font-medium border-2"
                    style={{
                      borderColor: formData.primaryColor,
                      color: formData.primaryColor,
                    }}
                  >
                    Botón Outline
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Contact Information" : "Información de Contacto"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={language === "en" ? "Phone" : "Teléfono"}
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 809 786 8457"
                />
                <Input
                  label="WhatsApp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="+1 809 786 8457"
                />
              </div>
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="info@tokiorentcar.com"
              />
              <Input
                label={language === "en" ? "Address" : "Dirección"}
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Av. Principal #123"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={language === "en" ? "City" : "Ciudad"}
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="La Vega"
                />
                <Input
                  label={language === "en" ? "Country" : "País"}
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="República Dominicana"
                />
              </div>
              <Input
                label={language === "en" ? "Google Maps URL" : "URL de Google Maps"}
                name="googleMapsUrl"
                value={formData.googleMapsUrl}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
              />
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Social Media" : "Redes Sociales"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Facebook"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/..."
              />
              <Input
                label="Instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/..."
              />
              <Input
                label="Twitter/X"
                name="twitter"
                value={formData.twitter}
                onChange={handleChange}
                placeholder="https://twitter.com/..."
              />
              <Input
                label="YouTube"
                name="youtube"
                value={formData.youtube}
                onChange={handleChange}
                placeholder="https://youtube.com/..."
              />
              <Input
                label="TikTok"
                name="tiktok"
                value={formData.tiktok}
                onChange={handleChange}
                placeholder="https://tiktok.com/..."
              />
            </CardContent>
          </Card>

          {/* Currency Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {language === "en" ? "Currency Settings" : "Configuración de Moneda"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Currency */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  {language === "en" ? "Primary Currency" : "Moneda Principal"}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {language === "en" ? "Currency Code" : "Código de Moneda"}
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="DOP">DOP - Peso Dominicano</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <Input
                    label={language === "en" ? "Symbol" : "Símbolo"}
                    name="currencySymbol"
                    value={formData.currencySymbol}
                    onChange={handleChange}
                    placeholder="$"
                  />
                </div>
              </div>

              {/* Secondary Currency */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  {language === "en" ? "Secondary Currency" : "Moneda Secundaria"}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {language === "en" ? "Currency Code" : "Código de Moneda"}
                    </label>
                    <select
                      name="secondaryCurrency"
                      value={formData.secondaryCurrency}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="DOP">DOP - Peso Dominicano</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <Input
                    label={language === "en" ? "Symbol" : "Símbolo"}
                    name="secondaryCurrencySymbol"
                    value={formData.secondaryCurrencySymbol}
                    onChange={handleChange}
                    placeholder="RD$"
                  />
                </div>
              </div>

              {/* Exchange Rate */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    {language === "en" ? "Exchange Rate" : "Tasa de Cambio"}
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 dark:text-gray-400">1 {formData.currency} =</span>
                  <Input
                    type="number"
                    name="exchangeRate"
                    value={formData.exchangeRate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-32"
                  />
                  <span className="text-gray-600 dark:text-gray-400">{formData.secondaryCurrency}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {language === "en"
                    ? "Example: $100 USD = RD$" + (100 * formData.exchangeRate).toLocaleString()
                    : "Ejemplo: $100 USD = RD$" + (100 * formData.exchangeRate).toLocaleString()}
                </p>
              </div>

              {/* Show Dual Currency Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {language === "en" ? "Show Dual Currency" : "Mostrar Doble Moneda"}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === "en"
                      ? "Display prices in both currencies throughout the system"
                      : "Mostrar precios en ambas monedas en todo el sistema"}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="showDualCurrency"
                    checked={formData.showDualCurrency}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* ITBIS/Tax Configuration */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="applyTax"
                        checked={formData.applyTax}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                    </label>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {language === "en" ? "Apply Tax (ITBIS)" : "Aplicar ITBIS"}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === "en"
                          ? "Include tax in rental calculations"
                          : "Incluir impuesto en los cálculos de renta"}
                      </p>
                    </div>
                  </div>
                </div>
                {formData.applyTax && (
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-gray-600 dark:text-gray-400">
                      {language === "en" ? "Tax Rate:" : "Porcentaje:"}
                    </span>
                    <Input
                      type="number"
                      name="taxRate"
                      value={formData.taxRate}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-24"
                    />
                    <span className="text-gray-600 dark:text-gray-400">%</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formData.applyTax
                    ? (language === "en"
                        ? `Example: A $100 rental will show $${(100 * formData.taxRate / 100).toFixed(2)} in taxes`
                        : `Ejemplo: Una renta de $100 mostrará $${(100 * formData.taxRate / 100).toFixed(2)} de ITBIS`)
                    : (language === "en"
                        ? "Taxes will not be added to rental prices"
                        : "No se agregará ITBIS a los precios de renta")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Business Settings" : "Configuración de Negocio"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label={language === "en" ? "Timezone" : "Zona Horaria"}
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                placeholder="America/Santo_Domingo"
              />
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "SEO & Metadata" : "SEO y Metadatos"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label={language === "en" ? "Meta Title" : "Título Meta"}
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                placeholder="Tokio Rent Car - Alquiler de Vehículos"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {language === "en" ? "Meta Description" : "Descripción Meta"}
                </label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={language === "en" ? "Description for search engines..." : "Descripción para motores de búsqueda..."}
                />
              </div>
              <Input
                label={language === "en" ? "Keywords" : "Palabras Clave"}
                name="metaKeywords"
                value={formData.metaKeywords}
                onChange={handleChange}
                placeholder="rent car, alquiler vehículos, la vega"
              />
            </CardContent>
          </Card>
        </div>

        {/* Policies */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "en" ? "Policies" : "Políticas"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {language === "en" ? "Terms and Conditions" : "Términos y Condiciones"}
              </label>
              <textarea
                name="termsAndConditions"
                value={formData.termsAndConditions}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {language === "en" ? "Privacy Policy" : "Política de Privacidad"}
              </label>
              <textarea
                name="privacyPolicy"
                value={formData.privacyPolicy}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {language === "en" ? "Cancellation Policy" : "Política de Cancelación"}
              </label>
              <textarea
                name="cancellationPolicy"
                value={formData.cancellationPolicy}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            isLoading={loading}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {language === "en" ? "Save Settings" : "Guardar Configuración"}
          </Button>
        </div>
      </form>
    </div>
  )
}
