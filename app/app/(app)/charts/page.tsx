"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york/ui/card"

export default function ChartsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Charts</h1>
          <p className="text-muted-foreground">
            Beautiful charts built with Recharts. Copy and paste into your apps.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder cards for charts */}
          <Card>
            <CardHeader>
              <CardTitle>Area Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Area chart example coming soon
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bar Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Bar chart example coming soon
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Line chart example coming soon
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pie Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Pie chart example coming soon
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Radar Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Radar chart example coming soon
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Radial Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Radial chart example coming soon
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}