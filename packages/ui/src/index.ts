// ─── UI package exports ──────────────────────────────────────────────────────

// Layout
export { Sidebar } from './layout/sidebar';
export { Header } from './layout/header';
export { PageShell } from './layout/pageshell';
export { Container } from './layout/container';

// Buttons
export { Button } from './primitives/button';
export { ButtonVariants, buttonVariants } from './primitives/buttonvariants';

// Cards
export { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './primitives/card';
export { StatCard, StatLabel, StatValue, StatChange } from './primitives/statcard';
export { JobCard } from './primitives/jobcard';
export { ProfileReadinessCard } from './primitives/profilereadinesscard';
export { MetricCard } from './primitives/metriccard';

// Forms
export { Input } from './primitives/input';
export { Textarea } from './primitives/textarea';
export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './primitives/select';
export { Checkbox } from './primitives/checkbox';
export { RadioGroup, RadioItem } from './primitives/radiogroup';
export { Slider } from './primitives/slider';
export { FileUpload } from './primitives/fileupload';
export { FormField, FormItem, FormLabel, FormControl, FormMessage } from './primitives/formfield';

// Feedback
export { Toast, ToastProvider, ToastViewport } from './feedback/toast';
export type { ToastType, ToastProps } from './feedback/toast';
export { Skeleton } from './primitives/skeleton';
export { Spinner } from './primitives/spinner';
export { Alert, AlertDescription, AlertTitle } from './primitives/alert';
export type { AlertVariant, AlertProps } from './primitives/alert';
export { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from './primitives/emptystate';
export { ErrorState } from './primitives/errorstate';
export { LoadingState } from './primitives/loadingstate';

// Overlays
export { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalClose } from './primitives/modal';
export { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogClose } from './primitives/dialog';
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuBadge } from './primitives/dropdownmenu';

// Navigation
export { NavLink } from './primitives/navlink';
export { Badge } from './primitives/badge';
export { ProgressBar } from './primitives/progressbar';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './primitives/tabs';
export { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './primitives/table';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './primitives/accordion';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipArrow } from './primitives/tooltip';

// Icons
export { Icon } from './primitives/icons';
export type { IconNames, IconName } from './primitives/icons';
