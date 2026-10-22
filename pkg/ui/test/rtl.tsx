// The primitives a surface is built from, laid out once, read in either
// direction. `scripts/rtl.mjs` mounts this page with `?dir=ltr` and `?dir=rtl`
// and asks whether every probed box in the RTL page sits where the mirror image
// of its LTR box sits. Same words both ways (`?lang=en`), so a box's width does
// not move with the language and the mirror is exact; `?lang=ar` sets the page
// in Arabic for the eye, which no geometry check reads.
//
// One scene per overlay, because a modal's scrim covers everything under it:
// `?scene=main|menu|select|dialog|sheet|float`.
import { Text, XStack, YStack } from '@hanzo/gui'
import { ChevronLeft, ChevronRight, Mail, Search } from '@hanzogui/lucide-icons-2'
import { useEffect, type ReactNode } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Input,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Slider,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from '../src/backends/gui'
import { mirror } from '../src/backends/gui/dir'
import {
  Sidebar,
  SidebarItem,
  SidebarNewChat,
  SidebarScroll,
  SidebarSection,
  SidebarUser,
} from '../src/chat/Sidebar'

const params = new URLSearchParams(location.search)
const scene = params.get('scene') ?? 'main'
const ar = params.get('lang') === 'ar'

const EN = {
  back: 'Back', next: 'Next', save: 'Save', search: 'Search models', email: 'you@hanzo.ai',
  pick: 'Pick a model', one: 'Overview', two: 'Usage', three: 'Keys', panel: 'Usage this month',
  model: 'Model', tokens: 'Tokens', cost: 'Cost', home: 'Home', projects: 'Projects', here: 'Hanzo',
  title: 'Deployments', desc: 'Three running, one paused', open: 'Open', menu: 'Actions',
  copy: 'Copy', move: 'Move to', archive: 'Archive', label: 'Project', dialog: 'Delete project',
  sure: 'This removes every key and deployment.', cancel: 'Cancel', del: 'Delete', sheet: 'Settings',
  sheetDesc: 'Workspace preferences', tip: 'Tooltip', tipBody: 'Copies the key', pop: 'Popover',
  popBody: 'Popover body', toast: 'Saved', toastBody: 'Your changes are live', chats: 'Today',
  thread: 'Pricing questions', thread2: 'Deploy logs', room: 'Conversation',
}
const AR: typeof EN = {
  back: 'رجوع', next: 'التالي', save: 'حفظ', search: 'ابحث في النماذج', email: 'you@hanzo.ai',
  pick: 'اختر نموذجًا', one: 'نظرة عامة', two: 'الاستخدام', three: 'المفاتيح', panel: 'الاستخدام هذا الشهر',
  model: 'النموذج', tokens: 'الرموز', cost: 'التكلفة', home: 'الرئيسية', projects: 'المشاريع', here: 'هانزو',
  title: 'عمليات النشر', desc: 'ثلاث قيد التشغيل وواحدة متوقفة', open: 'فتح', menu: 'إجراءات',
  copy: 'نسخ', move: 'نقل إلى', archive: 'أرشفة', label: 'المشروع', dialog: 'حذف المشروع',
  sure: 'يزيل هذا كل مفتاح وكل عملية نشر.', cancel: 'إلغاء', del: 'حذف', sheet: 'الإعدادات',
  sheetDesc: 'تفضيلات مساحة العمل', tip: 'تلميح', tipBody: 'ينسخ المفتاح', pop: 'نافذة',
  popBody: 'محتوى النافذة', toast: 'تم الحفظ', toastBody: 'تغييراتك منشورة الآن', chats: 'اليوم',
  thread: 'أسئلة التسعير', thread2: 'سجلات النشر', room: 'المحادثة',
}
const t = ar ? AR : EN

const NOOP = () => {}

/** A box the gate measures: `p` names it, the same name in both directions. */
const probe = (p: string) => ({ 'data-probe': p }) as object

function Block({ name, children }: { name: string; children: ReactNode }) {
  return (
    <YStack {...probe(`block-${name}`)} gap="$2" p="$3" borderWidth={1} borderColor="$borderColor" rounded="$4">
      {children}
    </YStack>
  )
}

function Main() {
  return (
    <YStack gap="$3" width={960}>
      <XStack gap="$3" flexWrap="wrap">
        <Block name="buttons">
          <ButtonGroup aria-label="Pager" {...probe('group')}>
            <Button variant="outline" {...probe('group-first')}>
              <ChevronLeft size={14} {...mirror} /> {t.back}
            </Button>
            <Button variant="outline">{t.save}</Button>
            <Button variant="outline" {...probe('group-last')}>
              {t.next} <ChevronRight size={14} {...mirror} />
            </Button>
          </ButtonGroup>
        </Block>
        <Block name="inputs">
          <YStack width={280} gap="$2">
            <Input {...probe('input-search')} placeholder={t.search} startAdornment={<Search size={14} />} />
            <Input {...probe('input-email')} type="email" defaultValue={t.email} endAdornment={<Mail size={14} />} />
          </YStack>
        </Block>
        <Block name="select">
          <YStack width={220}>
            <Select>
              <SelectTrigger {...probe('select-trigger')}>
                <SelectValue placeholder={t.pick} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zen" index={0}>Zen</SelectItem>
              </SelectContent>
            </Select>
          </YStack>
        </Block>
      </XStack>

      <XStack gap="$3" flexWrap="wrap">
        <Block name="tabs">
          <Tabs defaultValue="two">
            <TabsList {...probe('tabs-list')}>
              <TabsTrigger value="one" {...probe('tab-one')}>{t.one}</TabsTrigger>
              <TabsTrigger value="two">{t.two}</TabsTrigger>
              <TabsTrigger value="three">{t.three}</TabsTrigger>
            </TabsList>
            <TabsContent value="two">{t.panel}</TabsContent>
          </Tabs>
        </Block>
        <Block name="nav">
          <Breadcrumb {...probe('breadcrumb')}>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="#">{t.home}</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="#">{t.projects}</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{t.here}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Pagination {...probe('pagination')}>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" {...probe('page-prev')} /></PaginationItem>
              <PaginationItem><PaginationLink href="#1">1</PaginationLink></PaginationItem>
              <PaginationItem><PaginationLink href="#2" isActive>2</PaginationLink></PaginationItem>
              <PaginationItem><PaginationLink href="#3">3</PaginationLink></PaginationItem>
              <PaginationItem><PaginationNext href="#" {...probe('page-next')} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </Block>
        <Block name="controls">
          <XStack gap="$3" items="center">
            <Switch checked {...probe('switch')} />
            <YStack width={160}><Progress value={30} {...probe('progress')} /></YStack>
          </XStack>
          <YStack width={240}><Slider defaultValue={[25]} {...probe('slider')} /></YStack>
        </Block>
      </XStack>

      <XStack gap="$3" flexWrap="wrap" items="flex-start">
        <Block name="card">
          <Card width={320} {...probe('card')}>
            <CardHeader>
              <XStack gap="$2" items="center" {...probe('card-head')}>
                <Search size={16} />
                <CardTitle>{t.title}</CardTitle>
              </XStack>
              <CardDescription>{t.desc}</CardDescription>
              <CardAction>
                <Button size="sm" variant="ghost" {...probe('card-action')}>{t.open}</Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Table {...probe('table')}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.model}</TableHead>
                    <TableHead>{t.tokens}</TableHead>
                    <TableHead>{t.cost}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell>zen6</TableCell><TableCell>1,204</TableCell><TableCell>$0.42</TableCell></TableRow>
                  <TableRow><TableCell>enso</TableCell><TableCell>88</TableCell><TableCell>$0.05</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Block>
        <Block name="layout">
          <XStack width={560} height={300} borderWidth={1} borderColor="$borderColor" rounded="$3" overflow="hidden">
            <Sidebar width={200} {...probe('sidebar')}>
              <SidebarNewChat onPress={NOOP} />
              <SidebarScroll>
                <SidebarSection label={t.chats}>
                  <SidebarItem active onPress={NOOP}>{t.thread}</SidebarItem>
                  <SidebarItem onPress={NOOP}>{t.thread2}</SidebarItem>
                </SidebarSection>
              </SidebarScroll>
              <SidebarUser name="z" secondary="z@hanzo.ai" onPress={NOOP} onHelp={NOOP} />
            </Sidebar>
            <YStack flex={1} p="$4" gap="$2" {...probe('content')}>
              <CardTitle>{t.room}</CardTitle>
              <CardDescription>{t.desc}</CardDescription>
            </YStack>
          </XStack>
        </Block>
      </XStack>
    </YStack>
  )
}

function Menu() {
  return (
    <XStack gap="$12" p="$4" width={960} justify="space-between">
      {/* Opened by the gate with a real click and hover, the way a person
          opens it, so the submenu's side is chosen by the menu itself. */}
      <DropdownMenu>
        <DropdownMenuTrigger {...probe('menu-trigger')}>{t.menu}</DropdownMenuTrigger>
        <DropdownMenuContent {...probe('menu-content')}>
          <DropdownMenuLabel>{t.label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            {t.copy}
            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger {...probe('menu-sub-trigger')}>
              <Text>{t.move}</Text>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent {...probe('menu-sub')}>
              <DropdownMenuItem>{t.projects}</DropdownMenuItem>
              <DropdownMenuItem>{t.home}</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>{t.archive}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </XStack>
  )
}

function Choose() {
  return (
    <XStack p="$4" width={960}>
      <YStack width={220}>
        <Select open>
          <SelectTrigger {...probe('select-open')}>
            <SelectValue placeholder={t.pick} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zen" index={0}>Zen</SelectItem>
            <SelectItem value="enso" index={1}>Enso</SelectItem>
          </SelectContent>
        </Select>
      </YStack>
    </XStack>
  )
}

function Float() {
  useEffect(() => {
    toast(t.toast, { description: t.toastBody })
  }, [])
  return (
    <XStack gap="$12" p="$4" width={960}>
      <TooltipProvider delay={0}>
        <Tooltip open>
          <TooltipTrigger asChild>
            <Button variant="outline" {...probe('tip-trigger')}>{t.tip}</Button>
          </TooltipTrigger>
          <TooltipContent {...probe('tip')}>{t.tipBody}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Popover open>
        <PopoverTrigger asChild>
          <Button variant="outline" {...probe('pop-trigger')}>{t.pop}</Button>
        </PopoverTrigger>
        <PopoverContent {...probe('pop')}>{t.popBody}</PopoverContent>
      </Popover>
      <Toaster />
    </XStack>
  )
}

export function Page() {
  if (scene === 'menu') return <Menu />
  if (scene === 'select') return <Choose />
  if (scene === 'float') return <Float />
  if (scene === 'dialog')
    return (
      <Dialog open>
        <DialogContent {...probe('dialog')}>
          <DialogHeader>
            <DialogTitle>{t.dialog}</DialogTitle>
            <DialogDescription>{t.sure}</DialogDescription>
          </DialogHeader>
          <DialogFooter {...probe('dialog-footer')}>
            <Button variant="outline">{t.cancel}</Button>
            <Button>{t.del}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  if (scene === 'sheet')
    return (
      <Sheet open>
        <SheetContent {...probe('sheet')}>
          <SheetHeader>
            <SheetTitle>{t.sheet}</SheetTitle>
            <SheetDescription>{t.sheetDesc}</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )
  return <Main />
}
