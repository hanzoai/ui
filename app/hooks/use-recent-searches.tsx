"use client"

import * as React from "react"

const RECENT_SEARCHES_KEY = "hanzo-ui-recent-searches"
const MAX_RECENT_SEARCHES = 5

export interface RecentSearch {
  id: string
  title: string
  href: string
  timestamp: number
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = React.useState<RecentSearch[]>([])

  // Load recent searches from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[]
        setRecentSearches(parsed)
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error)
    }
  }, [])

  // Add a new search to recent searches
  const addRecentSearch = React.useCallback(
    (item: Omit<RecentSearch, "timestamp">) => {
      setRecentSearches((prev) => {
        // Remove duplicate if exists
        const filtered = prev.filter((search) => search.id !== item.id)

        // Add new search at the beginning
        const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(
          0,
          MAX_RECENT_SEARCHES
        )

        // Persist to localStorage
        try {
          localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
        } catch (error) {
          console.error("Failed to save recent searches:", error)
        }

        return updated
      })
    },
    []
  )

  // Clear all recent searches
  const clearRecentSearches = React.useCallback(() => {
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch (error) {
      console.error("Failed to clear recent searches:", error)
    }
  }, [])

  // Remove a specific search
  const removeRecentSearch = React.useCallback((id: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((search) => search.id !== id)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error("Failed to update recent searches:", error)
      }
      return updated
    })
  }, [])

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  }
}
