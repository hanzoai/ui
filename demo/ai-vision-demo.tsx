"use client"

import { useState } from "react"
import { AIVision, VisionResults } from "@/registry/default/ui/ai-vision"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/default/ui/card"

export function AIVisionDemo() {
  const [results, setResults] = useState<VisionResults | null>(null)

  const handleAnalysis = (analysisResults: VisionResults) => {
    setResults(analysisResults)
    console.log("Analysis completed:", analysisResults)
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* AI Vision Component */}
      <Card>
        <CardHeader>
          <CardTitle>AI Vision Demo</CardTitle>
          <CardDescription>
            Upload an image to see AI-powered analysis with object detection, OCR, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <AIVision
              onAnalysis={handleAnalysis}
              capabilities={[
                "object-detection",
                "scene-description",
                "ocr",
                "color-analysis",
                "tagging",
                "face-detection",
                "sentiment-analysis"
              ]}
              enableCamera={true}
              enableUrl={true}
              enableGeneration={false}
              showConfidence={true}
              minConfidence={0.5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Summary</CardTitle>
            <CardDescription>
              Quick overview of the image analysis results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {results.objects?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Objects Detected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.text?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Text Regions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {results.faces?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Faces Found</div>
              </div>
            </div>

            {results.description && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Scene Description</h4>
                <p className="text-sm">{results.description}</p>
              </div>
            )}

            {results.tags && results.tags.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {results.tags.slice(0, 6).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary/10 text-primary"
                    >
                      {tag.label} ({Math.round(tag.confidence * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AIVisionDemo