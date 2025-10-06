import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, FormProvider } from 'react-hook-form'
import * as React from 'react'

// Component imports
import { Button } from '../button'
import { Input } from '../input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '../card'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select'
import { Checkbox } from '../checkbox'
import { Label } from '../label'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '../form'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '../table'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../tabs'

// =============================================================================
// Button Tests
// =============================================================================
describe('Button', () => {
  it('renders correctly with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Click</Button>)
    await user.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('supports variant prop - destructive', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('supports variant prop - outline', () => {
    const { container } = render(<Button variant="outline">Outlined</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('border-input')
  })

  it('supports size prop - sm', () => {
    const { container } = render(<Button size="sm">Small</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('h-8')
  })

  it('supports size prop - lg', () => {
    const { container } = render(<Button size="lg">Large</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('h-10')
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('shows loading spinner when isLoading is true', () => {
    const { container } = render(<Button isLoading>Loading</Button>)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('supports custom className', () => {
    const { container } = render(<Button className="custom-btn">Styled</Button>)
    expect(container.querySelector('.custom-btn')).toBeInTheDocument()
  })
})

// =============================================================================
// Input Tests
// =============================================================================
describe('Input', () => {
  it('renders correctly', () => {
    const { container } = render(<Input data-testid="input" />)
    const input = container.querySelector('input')
    expect(input).toBeInTheDocument()
  })

  it('accepts and displays user input', async () => {
    const user = userEvent.setup()
    const { container } = render(<Input />)
    const input = container.querySelector('input') as HTMLInputElement
    await user.type(input, 'test input')
    expect(input).toHaveValue('test input')
  })

  it('can be disabled', () => {
    const { container } = render(<Input disabled />)
    const input = container.querySelector('input')
    expect(input).toBeDisabled()
  })

  it('supports password type with toggle', async () => {
    const user = userEvent.setup()
    const { container } = render(<Input type="password" />)
    const input = container.querySelector('input') as HTMLInputElement
    expect(input).toHaveAttribute('type', 'password')

    const toggleButton = screen.getByLabelText(/show password/i)
    expect(toggleButton).toBeInTheDocument()

    await user.click(toggleButton)
    expect(input).toHaveAttribute('type', 'text')
  })

  it('hides password toggle when hidePasswordToggle is true', () => {
    render(<Input type="password" hidePasswordToggle />)
    expect(screen.queryByLabelText(/show password/i)).not.toBeInTheDocument()
  })

  it('supports custom className', () => {
    const { container } = render(<Input className="custom-input" />)
    expect(container.querySelector('.custom-input')).toBeInTheDocument()
  })

  it('handles onChange events', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<Input onChange={handleChange} />)
    const input = container.querySelector('input') as HTMLInputElement
    await user.type(input, 'a')
    expect(handleChange).toHaveBeenCalled()
  })
})

// =============================================================================
// Card Tests
// =============================================================================
describe('Card', () => {
  it('renders card with all components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card Description')).toBeInTheDocument()
    expect(screen.getByText('Card Content')).toBeInTheDocument()
    expect(screen.getByText('Card Footer')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders as a div element', () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.querySelector('div')).toBeInTheDocument()
  })
})

// =============================================================================
// Dialog Tests
// =============================================================================
describe('Dialog', () => {
  it('renders dialog trigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
      </Dialog>
    )
    expect(screen.getByText('Open Dialog')).toBeInTheDocument()
  })

  it('opens dialog on trigger click', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByText('Dialog Title')).toBeInTheDocument()
    })
    expect(screen.getByText('Dialog Description')).toBeInTheDocument()
  })

  it('shows close button when showCloseButton is true', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showCloseButton>
          <DialogTitle>Test</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })
  })

  it('hides close button by default', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))

    await waitFor(() => {
      const closeButton = screen.queryByRole('button', { name: /close/i })
      if (closeButton) {
        expect(closeButton).toHaveClass('hidden')
      }
    })
  })
})

// =============================================================================
// Select Tests
// =============================================================================
describe('Select', () => {
  it('renders select with trigger', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('applies custom className to trigger', () => {
    const { container } = render(
      <Select>
        <SelectTrigger className="custom-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(container.querySelector('.custom-select')).toBeInTheDocument()
  })

  it('has correct ARIA attributes', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    )

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-autocomplete', 'none')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('data-state', 'closed')
  })

  it('can be disabled', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})

// =============================================================================
// Checkbox Tests
// =============================================================================
describe('Checkbox', () => {
  it('renders correctly', () => {
    render(<Checkbox />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('can be checked and unchecked', async () => {
    const user = userEvent.setup()
    render(<Checkbox />)
    const checkbox = screen.getByRole('checkbox')

    expect(checkbox).not.toBeChecked()
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('handles onCheckedChange callback', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    render(<Checkbox onCheckedChange={handleChange} />)

    await user.click(screen.getByRole('checkbox'))
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('can be disabled', () => {
    render(<Checkbox disabled />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('supports default checked state', () => {
    render(<Checkbox defaultChecked />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('applies custom className', () => {
    const { container } = render(<Checkbox className="custom-checkbox" />)
    expect(container.querySelector('.custom-checkbox')).toBeInTheDocument()
  })
})

// =============================================================================
// Label Tests
// =============================================================================
describe('Label', () => {
  it('renders correctly with text', () => {
    render(<Label>Label Text</Label>)
    expect(screen.getByText('Label Text')).toBeInTheDocument()
  })

  it('associates with input using htmlFor', () => {
    render(
      <>
        <Label htmlFor="test-input">Test Label</Label>
        <input id="test-input" />
      </>
    )
    const label = screen.getByText('Test Label')
    expect(label).toHaveAttribute('for', 'test-input')
  })

  it('applies custom className', () => {
    const { container } = render(<Label className="custom-label">Label</Label>)
    expect(container.querySelector('.custom-label')).toBeInTheDocument()
  })

  it('renders as a label element', () => {
    const { container } = render(<Label>Label</Label>)
    expect(container.querySelector('label')).toBeInTheDocument()
  })
})

// =============================================================================
// Form Tests
// =============================================================================
describe('Form', () => {
  const FormWrapper = () => {
    const form = useForm({
      defaultValues: {
        username: '',
        email: '',
      },
    })

    return (
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(() => {})}>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter your username</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </FormProvider>
    )
  }

  it('renders form field with label', () => {
    render(<FormWrapper />)
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('renders form description', () => {
    render(<FormWrapper />)
    expect(screen.getByText('Enter your username')).toBeInTheDocument()
  })

  it('handles input changes', async () => {
    const user = userEvent.setup()
    render(<FormWrapper />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'testuser')
    expect(input).toHaveValue('testuser')
  })

  it('displays error messages on validation failure', async () => {
    const FormWithValidation = () => {
      const form = useForm({
        defaultValues: { email: '' },
      })

      return (
        <FormProvider {...form}>
          <form>
            <FormField
              control={form.control}
              name="email"
              rules={{ required: 'Email is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button
              type="button"
              onClick={() => form.trigger('email')}
            >
              Validate
            </button>
          </form>
        </FormProvider>
      )
    }

    const user = userEvent.setup()
    render(<FormWithValidation />)

    await user.click(screen.getByText('Validate'))

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// Table Tests
// =============================================================================
describe('Table', () => {
  it('renders table with all components', () => {
    render(
      <Table>
        <TableCaption>Table Caption</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Header 1</TableHead>
            <TableHead>Header 2</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell 1</TableCell>
            <TableCell>Cell 2</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(screen.getByText('Table Caption')).toBeInTheDocument()
    expect(screen.getByText('Header 1')).toBeInTheDocument()
    expect(screen.getByText('Header 2')).toBeInTheDocument()
    expect(screen.getByText('Cell 1')).toBeInTheDocument()
    expect(screen.getByText('Cell 2')).toBeInTheDocument()
  })

  it('applies custom className to table', () => {
    const { container } = render(<Table className="custom-table">Content</Table>)
    expect(container.querySelector('.custom-table')).toBeInTheDocument()
  })

  it('renders semantic HTML structure', () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelector('thead')).toBeInTheDocument()
    expect(container.querySelector('tbody')).toBeInTheDocument()
    expect(container.querySelector('th')).toBeInTheDocument()
    expect(container.querySelector('td')).toBeInTheDocument()
  })

  it('supports data-state attribute on rows', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow data-state="selected">
            <TableCell>Selected</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    const row = container.querySelector('[data-state="selected"]')
    expect(row).toBeInTheDocument()
  })
})

// =============================================================================
// Tabs Tests
// =============================================================================
describe('Tabs', () => {
  it('renders tabs with all components', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
    expect(screen.getByText('Content 1')).toBeInTheDocument()
  })

  it('shows correct content based on active tab', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Content 1')).toBeVisible()
  })

  it('switches content when tab is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    await user.click(screen.getByText('Tab 2'))

    await waitFor(() => {
      expect(screen.getByText('Content 2')).toBeVisible()
    })
  })

  it('handles onValueChange callback', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(
      <Tabs defaultValue="tab1" onValueChange={handleChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    await user.click(screen.getByText('Tab 2'))
    expect(handleChange).toHaveBeenCalledWith('tab2')
  })

  it('disables tab trigger when disabled', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" disabled>Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Tab 2')).toBeDisabled()
  })
})
