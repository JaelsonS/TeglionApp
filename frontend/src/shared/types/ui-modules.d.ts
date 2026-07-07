/**
 * ui-modules.d.ts
 * 
 * Este projeto usa componentes shadcn/ui fornecidos como arquivos .jsx.
 * Como o frontend está em TypeScript, criamos declarações de módulo para:
 * - Evitar erros TS7016 ("Could not find a declaration file")
 * 
 * Evolução recomendada:
 * - Migrar gradualmente os componentes UI para .tsx com tipos completos.
 */

declare module '@/shared/components/ui/input' {
  export const Input: any
}

declare module '@/shared/components/ui/label' {
  export const Label: any
}

declare module '@/shared/components/ui/textarea' {
  export const Textarea: any
}

declare module '@/shared/components/ui/select' {
  export const Select: any
  export const SelectContent: any
  export const SelectItem: any
  export const SelectTrigger: any
  export const SelectValue: any
}

declare module '@/shared/components/ui/checkbox' {
  export const Checkbox: any
}

declare module '@/shared/components/ui/card' {
  export const Card: any
  export const CardContent: any
  export const CardDescription: any
  export const CardFooter: any
  export const CardHeader: any
  export const CardTitle: any
}

declare module '@/shared/components/ui/dropdown-menu' {
  export const DropdownMenu: any
  export const DropdownMenuCheckboxItem: any
  export const DropdownMenuContent: any
  export const DropdownMenuGroup: any
  export const DropdownMenuItem: any
  export const DropdownMenuLabel: any
  export const DropdownMenuPortal: any
  export const DropdownMenuRadioGroup: any
  export const DropdownMenuRadioItem: any
  export const DropdownMenuSeparator: any
  export const DropdownMenuShortcut: any
  export const DropdownMenuSub: any
  export const DropdownMenuSubContent: any
  export const DropdownMenuSubTrigger: any
  export const DropdownMenuTrigger: any
}

declare module '@/shared/components/ui/dialog' {
  export const Dialog: any
  export const DialogPortal: any
  export const DialogOverlay: any
  export const DialogTrigger: any
  export const DialogClose: any
  export const DialogContent: any
  export const DialogHeader: any
  export const DialogFooter: any
  export const DialogTitle: any
  export const DialogDescription: any
}

declare module '@/shared/components/ui/alert-dialog' {
  export const AlertDialog: any
  export const AlertDialogAction: any
  export const AlertDialogCancel: any
  export const AlertDialogContent: any
  export const AlertDialogDescription: any
  export const AlertDialogFooter: any
  export const AlertDialogHeader: any
  export const AlertDialogTitle: any
}

declare module '@/shared/components/ui/sheet' {
  export const Sheet: any
  export const SheetTrigger: any
  export const SheetContent: any
  export const SheetHeader: any
  export const SheetTitle: any
}
