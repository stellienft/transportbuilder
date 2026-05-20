"use client"

import * as React from "react"
import { Image, Search, X, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface UnsplashPickerProps {
  onSelect: (url: string) => void
  currentUrl?: string
  label?: string
}

interface CategoryImages {
  [key: string]: string[]
}

const CATEGORIES: CategoryImages = {
  Trucks: [
    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80",
    "https://images.unsplash.com/photo-1519003722824-194d44558860?w=1200&q=80",
    "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1200&q=80",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80",
    "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1200&q=80",
  ],
  Logistics: [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80",
    "https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=1200&q=80",
    "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&q=80",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80",
    "https://images.unsplash.com/photo-1589497342095-3e2a201f9a7e?w=1200&q=80",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80",
  ],
  Highways: [
    "https://images.unsplash.com/photo-1449965408869-ebd13bc9e5a8?w=1200&q=80",
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80",
    "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=80",
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80",
    "https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?w=1200&q=80",
    "https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=1200&q=80",
  ],
  Warehouse: [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80",
    "https://images.unsplash.com/photo-1589497342095-3e2a201f9a7e?w=1200&q=80",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80",
    "https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=1200&q=80",
    "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&q=80",
  ],
  Shipping: [
    "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&q=80",
    "https://images.unsplash.com/photo-1559827291-bac2de6b48b6?w=1200&q=80",
    "https://images.unsplash.com/photo-1559827291-bac2de6b48b6?w=1200&q=80",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80",
    "https://images.unsplash.com/photo-1589497342095-3e2a201f9a7e?w=1200&q=80",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80",
  ],
}

const CATEGORY_KEYS = Object.keys(CATEGORIES)

function thumbnailUrl(url: string): string {
  return url.replace("w=1200", "w=400")
}

export function UnsplashPicker({
  onSelect,
  currentUrl,
  label = "Background Image",
}: UnsplashPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [activeCategory, setActiveCategory] = React.useState<string>(CATEGORY_KEYS[0])
  const [customUrl, setCustomUrl] = React.useState("")
  const [selectedUrl, setSelectedUrl] = React.useState<string | null>(null)

  const images = CATEGORIES[activeCategory] ?? []

  function handleSelect(url: string) {
    setSelectedUrl(url)
  }

  function handleConfirm() {
    if (selectedUrl) {
      onSelect(selectedUrl)
      setOpen(false)
      setSelectedUrl(null)
    }
  }

  function handleCustomUrl() {
    if (customUrl.trim()) {
      onSelect(customUrl.trim())
      setOpen(false)
      setCustomUrl("")
      setSelectedUrl(null)
    }
  }

  function handleClear() {
    onSelect("")
    setOpen(false)
    setSelectedUrl(null)
  }

  React.useEffect(() => {
    if (!open) {
      setSelectedUrl(null)
      setCustomUrl("")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded-md bg-gray-100 border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 transition-colors"
            )}
          />
        }
      >
        {currentUrl ? "📷 Change Image" : label ?? "📷 Stock Library"}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-lg bg-white border-gray-200 text-gray-900 p-0 gap-0 overflow-hidden"
        showCloseButton={true}
      >
        <div className="p-4 pb-0">
          <DialogTitle className="text-base font-heading font-semibold text-gray-900">
            Stock Image Library
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mt-1">
            Choose a transport & logistics image from our curated library
          </DialogDescription>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide">
          {CATEGORY_KEYS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat)
                setSelectedUrl(null)
              }}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                activeCategory === cat
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="px-4 pb-2">
          <div className="grid grid-cols-3 gap-2">
            {images.map((url, idx) => {
              const isSelected = selectedUrl === url
              const isCurrent = currentUrl === url
              return (
                <button
                  key={`${activeCategory}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(url)}
                  className={cn(
                    "group relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400",
                    isSelected
                      ? "border-gray-900 ring-1 ring-gray-900"
                      : isCurrent
                        ? "border-green-500"
                        : "border-gray-200 hover:border-gray-400"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailUrl(url)}
                    alt={`${activeCategory} ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Selection Overlay */}
                  {(isSelected || isCurrent) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full",
                          isSelected ? "bg-gray-900" : "bg-green-500"
                        )}
                      >
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-4 py-3 space-y-3">
          {/* Confirm / Clear row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedUrl}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                selectedUrl
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              Use Selected
            </button>
            {currentUrl && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>

          {/* Custom URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">
              Use Custom URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCustomUrl()
                }}
              />
              <button
                type="button"
                onClick={handleCustomUrl}
                disabled={!customUrl.trim()}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  customUrl.trim()
                    ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
