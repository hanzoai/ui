"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface Grid3DItem {
  id: string
  content: React.ReactNode
  span?: { x: number; y: number }
  elevation?: number
}

interface Grid3DProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Grid3DItem[]
  columns?: number
  rows?: number
  gap?: number
  perspective?: number
  rotateX?: number
  rotateY?: number
  cellHeight?: number
  cellWidth?: number
  isometric?: boolean
  tiltOnHover?: boolean
  staggerAnimation?: boolean
  animationDelay?: number
  elevationOnHover?: boolean
  maxElevation?: number
  className?: string
}

const Grid3D = React.forwardRef<HTMLDivElement, Grid3DProps>(
  (
    {
      items,
      columns = 4,
      rows = 3,
      gap = 16,
      perspective = 1000,
      rotateX = 25,
      rotateY = 15,
      cellHeight = 200,
      cellWidth = 200,
      isometric = false,
      tiltOnHover = true,
      staggerAnimation = true,
      animationDelay = 100,
      elevationOnHover = true,
      maxElevation = 50,
      className,
      ...props
    },
    ref
  ) => {
    const gridRef = React.useRef<HTMLDivElement>(null)
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })
    const [isGridHovered, setIsGridHovered] = React.useState(false)

    // Calculate grid transforms based on isometric mode
    const gridTransform = React.useMemo(() => {
      if (isometric) {
        return `perspective(${perspective}px) rotateX(45deg) rotateY(45deg)`
      }
      return `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    }, [isometric, perspective, rotateX, rotateY])

    // Handle mouse movement for global tilt effect
    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!tiltOnHover || !gridRef.current) return

        const rect = gridRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const mouseX = (e.clientX - centerX) / (rect.width / 2)
        const mouseY = (e.clientY - centerY) / (rect.height / 2)

        setMousePosition({ x: mouseX * 10, y: mouseY * 10 })
      },
      [tiltOnHover]
    )

    const handleMouseEnter = React.useCallback(() => {
      setIsGridHovered(true)
    }, [])

    const handleMouseLeave = React.useCallback(() => {
      setIsGridHovered(false)
      setMousePosition({ x: 0, y: 0 })
      setHoveredIndex(null)
    }, [])

    React.useImperativeHandle(ref, () => gridRef.current!)

    const containerStyle: React.CSSProperties = {
      perspective: `${perspective}px`,
      transformStyle: "preserve-3d",
    }

    const gridStyle: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, ${cellWidth}px)`,
      gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
      gap: `${gap}px`,
      transform:
        tiltOnHover && isGridHovered
          ? `${gridTransform} rotateX(${-mousePosition.y}deg) rotateY(${mousePosition.x}deg)`
          : gridTransform,
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      transformStyle: "preserve-3d",
    }

    // Calculate grid position for each item
    const getGridPosition = (index: number) => {
      const x = index % columns
      const y = Math.floor(index / columns)
      return { x, y }
    }

    // Calculate stagger delay for animations
    const getStaggerDelay = (index: number) => {
      if (!staggerAnimation) return 0
      const { x, y } = getGridPosition(index)
      return (x + y) * animationDelay
    }

    return (
      <div
        ref={gridRef}
        className={cn("w-fit mx-auto", className)}
        style={containerStyle}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <div style={gridStyle}>
          {items.map((item, index) => {
            const isHovered = hoveredIndex === index
            const { x, y } = getGridPosition(index)
            const staggerDelay = getStaggerDelay(index)

            const itemStyle: React.CSSProperties = {
              gridColumn: item.span ? `span ${item.span.x}` : undefined,
              gridRow: item.span ? `span ${item.span.y}` : undefined,
              transform: `translateZ(${
                (item.elevation || 0) +
                (isHovered && elevationOnHover ? maxElevation : 0)
              }px)`,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transformStyle: "preserve-3d",
              animationDelay: `${staggerDelay}ms`,
            }

            return (
              <div
                key={item.id}
                className={cn(
                  "relative rounded-lg border bg-card text-card-foreground shadow-lg",
                  "transform-gpu will-change-transform cursor-pointer",
                  "transition-all duration-300 hover:shadow-xl",
                  staggerAnimation &&
                    "animate-in fade-in slide-in-from-bottom-4",
                  isHovered && "ring-2 ring-primary ring-offset-2"
                )}
                style={itemStyle}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Content container */}
                <div className="w-full h-full overflow-hidden rounded-lg">
                  {item.content}
                </div>

                {/* Elevation indicator */}
                {(item.elevation || 0) > 0 && (
                  <div
                    className="absolute inset-0 -z-10 rounded-lg bg-black/20 blur-sm"
                    style={{
                      transform: `translateY(${(item.elevation || 0) / 2}px) scale(0.95)`,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Grid guidelines (optional overlay) */}
        {isometric && (
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div
              className="grid border-dashed border-muted-foreground/30"
              style={{
                gridTemplateColumns: `repeat(${columns}, ${cellWidth}px)`,
                gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
                gap: `${gap}px`,
                transform: gridTransform,
                transformStyle: "preserve-3d",
              }}
            >
              {Array.from({ length: columns * rows }).map((_, index) => (
                <div
                  key={index}
                  className="border border-dashed border-muted-foreground/20 rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)
Grid3D.displayName = "Grid3D"

// 3D Grid Card component optimized for the grid
const Grid3DCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title?: string
    description?: string
    image?: string
    badge?: string
    elevation?: number
  }
>(
  (
    {
      className,
      title,
      description,
      image,
      badge,
      elevation = 0,
      children,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "group relative w-full h-full flex flex-col bg-gradient-to-br from-background to-muted/20",
        "border rounded-lg overflow-hidden",
        className
      )}
      style={{
        transform: `translateZ(${elevation}px)`,
        transformStyle: "preserve-3d",
      }}
      {...props}
    >
      {/* Image section */}
      {image && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={image}
            alt={title || ""}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {badge && (
            <div className="absolute top-2 right-2 px-2 py-1 text-xs rounded-full bg-primary text-primary-foreground">
              {badge}
            </div>
          )}
        </div>
      )}

      {/* Content section */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        {title && (
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        )}

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {description}
          </p>
        )}

        {children && <div className="mt-auto">{children}</div>}
      </div>

      {/* 3D depth effect */}
      <div
        className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-br from-muted/50 to-muted"
        style={{
          transform: "translateZ(-2px) scale(0.98)",
          transformStyle: "preserve-3d",
        }}
      />
    </div>
  )
)
Grid3DCard.displayName = "Grid3DCard"

// Preset grid layouts
const Grid3DPreset = {
  Dashboard: React.forwardRef<HTMLDivElement, Omit<Grid3DProps, "items">>(
    ({ children, ...props }, ref) => (
      <Grid3D
        ref={ref}
        columns={4}
        rows={3}
        cellWidth={250}
        cellHeight={200}
        gap={20}
        perspective={1200}
        rotateX={20}
        rotateY={10}
        tiltOnHover
        elevationOnHover
        maxElevation={30}
        items={[]}
        {...props}
      />
    )
  ),

  Isometric: React.forwardRef<HTMLDivElement, Omit<Grid3DProps, "items">>(
    ({ children, ...props }, ref) => (
      <Grid3D
        ref={ref}
        columns={3}
        rows={3}
        cellWidth={180}
        cellHeight={180}
        gap={16}
        isometric
        perspective={1000}
        staggerAnimation
        animationDelay={50}
        items={[]}
        {...props}
      />
    )
  ),

  Gallery: React.forwardRef<HTMLDivElement, Omit<Grid3DProps, "items">>(
    ({ children, ...props }, ref) => (
      <Grid3D
        ref={ref}
        columns={5}
        rows={2}
        cellWidth={200}
        cellHeight={280}
        gap={24}
        perspective={1500}
        rotateX={15}
        rotateY={5}
        tiltOnHover
        elevationOnHover
        maxElevation={40}
        items={[]}
        {...props}
      />
    )
  ),

  Compact: React.forwardRef<HTMLDivElement, Omit<Grid3DProps, "items">>(
    ({ children, ...props }, ref) => (
      <Grid3D
        ref={ref}
        columns={6}
        rows={4}
        cellWidth={120}
        cellHeight={120}
        gap={8}
        perspective={800}
        rotateX={30}
        rotateY={20}
        tiltOnHover
        staggerAnimation
        animationDelay={30}
        items={[]}
        {...props}
      />
    )
  ),
}

// Assign display names
Grid3DPreset.Dashboard.displayName = "Grid3DPreset.Dashboard"
Grid3DPreset.Isometric.displayName = "Grid3DPreset.Isometric"
Grid3DPreset.Gallery.displayName = "Grid3DPreset.Gallery"
Grid3DPreset.Compact.displayName = "Grid3DPreset.Compact"

// Auto-arranging grid that adjusts based on content
const Grid3DAuto = React.forwardRef<
  HTMLDivElement,
  Omit<Grid3DProps, "columns" | "rows"> & {
    minCellWidth?: number
    maxCellWidth?: number
    aspectRatio?: number
  }
>(
  (
    {
      items,
      minCellWidth = 200,
      maxCellWidth = 300,
      aspectRatio = 1,
      ...props
    },
    ref
  ) => {
    const [dimensions, setDimensions] = React.useState({ columns: 3, rows: 2 })

    React.useEffect(() => {
      const itemCount = items.length
      const columns = Math.ceil(Math.sqrt(itemCount))
      const rows = Math.ceil(itemCount / columns)
      setDimensions({ columns, rows })
    }, [items.length])

    const cellWidth = Math.min(maxCellWidth, Math.max(minCellWidth, 200))
    const cellHeight = cellWidth / aspectRatio

    return (
      <Grid3D
        ref={ref}
        items={items}
        columns={dimensions.columns}
        rows={dimensions.rows}
        cellWidth={cellWidth}
        cellHeight={cellHeight}
        {...props}
      />
    )
  }
)
Grid3DAuto.displayName = "Grid3DAuto"

export {
  Grid3D,
  Grid3DCard,
  Grid3DPreset,
  Grid3DAuto,
  type Grid3DItem,
  type Grid3DProps,
}
