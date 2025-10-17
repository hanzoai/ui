"use client"

import * as React from "react"
import { File, Upload, X } from "lucide-react"
import { useDropzone } from "react-dropzone"

import { cn } from "@/lib/utils"

interface DropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  onFilesAccepted?: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
  accept?: Record<string, string[]>
  disabled?: boolean
}

const Dropzone = React.forwardRef<HTMLDivElement, DropzoneProps>(
  (
    {
      className,
      onFilesAccepted,
      maxFiles = 5,
      maxSize = 5242880, // 5MB
      accept = {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
        "application/pdf": [".pdf"],
      },
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [files, setFiles] = React.useState<File[]>([])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (acceptedFiles) => {
        setFiles((prev) => [...prev, ...acceptedFiles].slice(0, maxFiles))
        onFilesAccepted?.(acceptedFiles)
      },
      maxFiles,
      maxSize,
      accept,
      disabled,
    })

    const removeFile = (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <div
          {...getRootProps()}
          className={cn(
            "cursor-pointer rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse (max {maxFiles} files,{" "}
                {Math.round(maxSize / 1024 / 1024)}MB each)
              </p>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border p-2"
              >
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="rounded p-1 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)
Dropzone.displayName = "Dropzone"

export { Dropzone }
