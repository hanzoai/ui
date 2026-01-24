"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Command, ArrowRight, FileText, Folder, Settings, X } from "lucide-react"
import { cn } from "../utils"

export interface SpotlightItem {
  id: string
  title: string
  subtitle?: string
  icon?: React.ReactNode
  category?: string
  action?: () => void
  keywords?: string[]
}

export interface SpotlightProps {
  isOpen: boolean
  onClose: () => void
  items?: SpotlightItem[]
  onSelect?: (item: SpotlightItem) => void
  placeholder?: string
  className?: string
  maxResults?: number
  categories?: string[]
  renderItem?: (item: SpotlightItem, isSelected: boolean) => React.ReactNode
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Applications': <Folder className="w-4 h-4" />,
  'Files': <FileText className="w-4 h-4" />,
  'Settings': <Settings className="w-4 h-4" />,
  'Actions': <Command className="w-4 h-4" />,
}

export const Spotlight: React.FC<SpotlightProps> = ({
  isOpen,
  onClose,
  items = [],
  onSelect,
  placeholder = "Search...",
  className,
  maxResults = 8,
  categories,
  renderItem,
}) => {
  const [query, setQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Filter items based on query
  const filteredItems = React.useMemo(() => {
    if (!query.trim()) {
      return items.slice(0, maxResults)
    }

    const lowerQuery = query.toLowerCase()
    return items
      .filter((item) => {
        const matchesTitle = item.title.toLowerCase().includes(lowerQuery)
        const matchesSubtitle = item.subtitle?.toLowerCase().includes(lowerQuery)
        const matchesKeywords = item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery))
        const matchesCategory = item.category?.toLowerCase().includes(lowerQuery)
        return matchesTitle || matchesSubtitle || matchesKeywords || matchesCategory
      })
      .slice(0, maxResults)
  }, [items, query, maxResults])

  // Group items by category
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, SpotlightItem[]> = {}
    const orderedCategories = categories || []

    filteredItems.forEach((item) => {
      const category = item.category || "Results"
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(item)
    })

    // Sort by category order if provided
    if (orderedCategories.length > 0) {
      const sortedGroups: Record<string, SpotlightItem[]> = {}
      orderedCategories.forEach((cat) => {
        if (groups[cat]) {
          sortedGroups[cat] = groups[cat]
        }
      })
      Object.keys(groups).forEach((cat) => {
        if (!sortedGroups[cat]) {
          sortedGroups[cat] = groups[cat]
        }
      })
      return sortedGroups
    }

    return groups
  }, [filteredItems, categories])

  // Flatten for keyboard navigation
  const flatItems = Object.values(groupedItems).flat()

  // Reset selection when query changes
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      setQuery("")
      setSelectedIndex(0)
      requestAnimationFrame(() => {
      inputRef.current?.focus();
    })
    }
  }, [isOpen])

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case "Enter":
          e.preventDefault()
          const selectedItem = flatItems[selectedIndex]
          if (selectedItem) {
            selectedItem.action?.()
            onSelect?.(selectedItem)
            onClose()
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, flatItems, selectedIndex, onSelect, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
          />

          {/* Spotlight Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-xl z-[10000]",
              "bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden",
              className
            )}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Search className="w-5 h-5 text-white/50" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-white/40"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
              )}
              <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/50">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {flatItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-white/50">
                  No results found for "{query}"
                </div>
              ) : (
                Object.entries(groupedItems).map(([category, categoryItems]) => (
                  <div key={category}>
                    <div className="px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wider bg-white/5">
                      {category}
                    </div>
                    {categoryItems.map((item) => {
                      const itemIndex = flatItems.indexOf(item)
                      const isSelected = itemIndex === selectedIndex

                      if (renderItem) {
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              item.action?.()
                              onSelect?.(item)
                              onClose()
                            }}
                          >
                            {renderItem(item, isSelected)}
                          </div>
                        )
                      }

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            item.action?.()
                            onSelect?.(item)
                            onClose()
                          }}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                            isSelected ? "bg-blue-500/20" : "hover:bg-white/5"
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            {item.icon || categoryIcons[category] || <FileText className="w-4 h-4 text-white/70" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div className="text-xs text-white/50 truncate">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight className="w-4 h-4 text-white/50" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-white/40">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">⏎</kbd>
                  to select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Command className="w-3 h-3" />
                <span>+ Space to open</span>
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Spotlight
