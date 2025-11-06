// Test that @hanzo/ui components work properly

import React from 'react';

// Test core components (should work without optional deps)
import { 
  Button, 
  Card,
  Dialog,
  Alert,
  Badge,
  Input,
  Label,
  Checkbox
} from '@hanzo/ui/components';

// Test lazy components
import { LazyComponents } from '@hanzo/ui/components';

export default function TestUI() {
  return (
    <div className="p-8 space-y-4">
      <h1>Testing @hanzo/ui Components</h1>
      
      <section>
        <h2>Core Components (Always Work)</h2>
        <div className="space-y-2">
          <Button>Test Button</Button>
          <Card className="p-4">Test Card</Card>
          <Badge>Test Badge</Badge>
          <Input placeholder="Test Input" />
          <Label>Test Label</Label>
          <Checkbox /> Test Checkbox
          <Alert>Test Alert</Alert>
        </div>
      </section>

      <section>
        <h2>Optional Components (Need Dependencies)</h2>
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponents.Calendar />
          <LazyComponents.Command />
          <LazyComponents.Carousel>
            <LazyComponents.CarouselContent>
              <LazyComponents.CarouselItem>Item 1</LazyComponents.CarouselItem>
            </LazyComponents.CarouselContent>
          </LazyComponents.Carousel>
        </React.Suspense>
      </section>
    </div>
  );
}