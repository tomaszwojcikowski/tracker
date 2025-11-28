/**
 * Lucide React Icons
 * 
 * This file exports all Lucide icons used in the application.
 * Using lucide-react instead of the global lucide library provides:
 * - Tree-shaking (only used icons are bundled)
 * - Better React integration (no need for useEffect/createIcons)
 * - TypeScript support
 * - Smaller bundle size
 */

export {
  // Navigation & UI
  ArrowLeft,
  ArrowDownCircle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  MoreVertical,
  
  // Actions
  Check,
  CheckCircle2,
  CheckCheck,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Send,
  LogIn,
  LogOut,
  Play,
  PlayCircle,
  
  // Content
  Dumbbell,
  BookOpen,
  History,
  Settings,
  Timer,
  Clock,
  Calendar,
  FileText,
  Info,
  Lock,
  MessageCircle,
  BarChart2,
  TrendingUp,
  Award,
  
  // Exercise categories
  Zap,
  Wind,
  Activity,
  
  // Status
  Loader,
  AlertCircle,
  CheckCircle,
  
  // Cloud
  Cloud,
  CloudOff,
  
  // Search
  Search,
  Filter,
  
  // Theme
  Palette,
} from 'lucide-react';

/**
 * Type exports for TypeScript users
 * @typedef {import('lucide-react').LucideIcon} LucideIcon
 */
