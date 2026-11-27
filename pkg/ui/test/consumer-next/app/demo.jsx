'use client'

import { Hanzo, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@hanzo/ui'
import { Cell, Grid } from '@hanzo/ui/grid'

export default function Demo({ summary }) {
  return (
    <Hanzo theme="dark">
      <Grid cols={2}>
        <Cell>
          <Card>
            <CardHeader>
              <CardTitle>@hanzo/ui Next.js Static Export</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge>{summary}</Badge>
              <Input placeholder="Enter value" />
              <Button>Continue</Button>
            </CardContent>
          </Card>
        </Cell>
      </Grid>
    </Hanzo>
  )
}
