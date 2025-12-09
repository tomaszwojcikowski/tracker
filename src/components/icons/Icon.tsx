/**
 * Solar Bold Duotone Icon System
 *
 * Uses the Solar icon set (https://www.svgrepo.com/collection/solar-bold-duotone-icons/)
 * via the solar-icon-set npm package.
 *
 * All icons use currentColor for fill, making them themeable.
 * Standard size is 24x24.
 */

import React from 'react';

// Import Solar Bold Duotone icons
import {
  // Navigation
  AltArrowLeftBoldDuotone,
  AltArrowRightBoldDuotone,
  AltArrowUpBoldDuotone,
  AltArrowDownBoldDuotone,
  ArrowLeftBoldDuotone,
  ArrowRightBoldDuotone,
  ArrowDownBoldDuotone,
  // Actions
  CloseCircleBoldDuotone,
  AddCircleBoldDuotone,
  MinusCircleBoldDuotone,
  CheckCircleBoldDuotone,
  CheckSquareBoldDuotone,
  MinimalisticMagniferBoldDuotone,
  RefreshBoldDuotone,
  RestartBoldDuotone,
  MaximizeBoldDuotone,
  MinimizeSquareBoldDuotone,
  RepeatBoldDuotone,
  Logout2BoldDuotone,
  TrashBinTrashBoldDuotone,
  Pen2BoldDuotone,
  MenuDotsBoldDuotone,
  HamburgerMenuBoldDuotone,
  FilterBoldDuotone,
  DownloadBoldDuotone,
  UploadBoldDuotone,
  PlainBoldDuotone,
  LockBoldDuotone,
  CopyBoldDuotone,
  ShareBoldDuotone,
  SquareArrowRightUpBoldDuotone,
  ClipboardListBoldDuotone,
  DisketteBoldDuotone,
  DangerCircleBoldDuotone,
  SpedometerMaxBoldDuotone,
  // Media
  PlayBoldDuotone,
  PlayCircleBoldDuotone,
  PauseBoldDuotone,
  VolumeLoudBoldDuotone,
  VolumeCrossBoldDuotone,
  EyeBoldDuotone,
  EyeClosedBoldDuotone,
  // Fitness
  DumbbellBoldDuotone,
  RunningBoldDuotone,
  BoltBoldDuotone,
  CupStarBoldDuotone,
  TargetBoldDuotone,
  GraphUpBoldDuotone,
  ChartBoldDuotone,
  Chart2BoldDuotone,
  FireBoldDuotone,
  MedalRibbonStarBoldDuotone,
  // Time
  StopwatchBoldDuotone,
  ClockCircleBoldDuotone,
  CalendarBoldDuotone,
  CalendarDateBoldDuotone,
  HistoryBoldDuotone,
  // UI
  SettingsBoldDuotone,
  Tuning2BoldDuotone,
  InfoCircleBoldDuotone,
  BookBoldDuotone,
  CloudBoldDuotone,
  CloundCrossBoldDuotone,
  HandStarsBoldDuotone,
  WidgetBoldDuotone,
  LayersBoldDuotone,
  SnowflakeBoldDuotone,
  WindBoldDuotone,
  HomeBoldDuotone,
  UserBoldDuotone,
  StarBoldDuotone,
  HeartBoldDuotone,
  ChatRoundDotsBoldDuotone,
  ChatSquareBoldDuotone,
  DocumentTextBoldDuotone,
  NotesBoldDuotone,
  PaletteBoldDuotone,
  SquareTransferHorizontalBoldDuotone,
  LinkBoldDuotone,
  CheckReadBoldDuotone,
  ListCheckBoldDuotone,
  SortFromTopToBottomBoldDuotone,
  BoxBoldDuotone,
} from 'solar-icon-set';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

// Type alias for compatibility with code that expects LucideIcon type
export type LucideIcon = React.FC<IconProps>;

// Wrapper component to standardize Solar icons with our interface
const wrapSolarIcon = (SolarIcon: React.FC<{ size?: number | string; color?: string; className?: string }>) => {
  const WrappedIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
    <SolarIcon size={size} color="currentColor" className={className} {...props} />
  );
  return WrappedIcon;
};

// ============================================================================
// NAVIGATION ICONS
// ============================================================================

export const ArrowLeft = wrapSolarIcon(ArrowLeftBoldDuotone);
export const ArrowRight = wrapSolarIcon(ArrowRightBoldDuotone);
export const ArrowDownCircle = wrapSolarIcon(ArrowDownBoldDuotone);
export const ArrowRightLeft = wrapSolarIcon(SquareTransferHorizontalBoldDuotone);
export const ChevronLeft = wrapSolarIcon(AltArrowLeftBoldDuotone);
export const ChevronRight = wrapSolarIcon(AltArrowRightBoldDuotone);
export const ChevronUp = wrapSolarIcon(AltArrowUpBoldDuotone);
export const ChevronDown = wrapSolarIcon(AltArrowDownBoldDuotone);

// ============================================================================
// ACTION ICONS
// ============================================================================

export const X = wrapSolarIcon(CloseCircleBoldDuotone);
export const Plus = wrapSolarIcon(AddCircleBoldDuotone);
export const Minus = wrapSolarIcon(MinusCircleBoldDuotone);
export const Check = wrapSolarIcon(CheckCircleBoldDuotone);
export const CheckCheck = wrapSolarIcon(CheckReadBoldDuotone);
export const CheckCircle = wrapSolarIcon(CheckCircleBoldDuotone);
export const CheckCircle2 = wrapSolarIcon(CheckCircleBoldDuotone);
export const CheckSquare = wrapSolarIcon(CheckSquareBoldDuotone);
export const Square = wrapSolarIcon(BoxBoldDuotone);
export const Search = wrapSolarIcon(MinimalisticMagniferBoldDuotone);
export const RefreshCw = wrapSolarIcon(RefreshBoldDuotone);
export const RotateCcw = wrapSolarIcon(RestartBoldDuotone);
export const Maximize2 = wrapSolarIcon(MaximizeBoldDuotone);
export const Minimize2 = wrapSolarIcon(MinimizeSquareBoldDuotone);
export const Repeat = wrapSolarIcon(RepeatBoldDuotone);
export const LogOut = wrapSolarIcon(Logout2BoldDuotone);
export const PlusCircle = wrapSolarIcon(AddCircleBoldDuotone);
export const Trash2 = wrapSolarIcon(TrashBinTrashBoldDuotone);
export const Edit = wrapSolarIcon(Pen2BoldDuotone);
export const MoreVertical = wrapSolarIcon(MenuDotsBoldDuotone);
export const Menu = wrapSolarIcon(HamburgerMenuBoldDuotone);
export const Filter = wrapSolarIcon(FilterBoldDuotone);
export const Download = wrapSolarIcon(DownloadBoldDuotone);
export const Upload = wrapSolarIcon(UploadBoldDuotone);
export const Send = wrapSolarIcon(PlainBoldDuotone);
export const Lock = wrapSolarIcon(LockBoldDuotone);
export const Copy = wrapSolarIcon(CopyBoldDuotone);
export const Share = wrapSolarIcon(ShareBoldDuotone);
export const ExternalLink = wrapSolarIcon(SquareArrowRightUpBoldDuotone);
export const ClipboardList = wrapSolarIcon(ClipboardListBoldDuotone);
export const Edit3 = wrapSolarIcon(Pen2BoldDuotone);
export const Save = wrapSolarIcon(DisketteBoldDuotone);
export const XCircle = wrapSolarIcon(CloseCircleBoldDuotone);
export const Gauge = wrapSolarIcon(SpedometerMaxBoldDuotone);

// ============================================================================
// MEDIA ICONS
// ============================================================================

export const Play = wrapSolarIcon(PlayBoldDuotone);
export const PlayCircle = wrapSolarIcon(PlayCircleBoldDuotone);
export const Pause = wrapSolarIcon(PauseBoldDuotone);
export const Volume2 = wrapSolarIcon(VolumeLoudBoldDuotone);
export const VolumeX = wrapSolarIcon(VolumeCrossBoldDuotone);
export const Eye = wrapSolarIcon(EyeBoldDuotone);
export const EyeOff = wrapSolarIcon(EyeClosedBoldDuotone);

// ============================================================================
// FITNESS ICONS
// ============================================================================

export const Dumbbell = wrapSolarIcon(DumbbellBoldDuotone);
export const Activity = wrapSolarIcon(RunningBoldDuotone);
export const Zap = wrapSolarIcon(BoltBoldDuotone);
export const Trophy = wrapSolarIcon(CupStarBoldDuotone);
export const Target = wrapSolarIcon(TargetBoldDuotone);
export const TrendingUp = wrapSolarIcon(GraphUpBoldDuotone);
export const BarChart2 = wrapSolarIcon(ChartBoldDuotone);
export const BarChart3 = wrapSolarIcon(Chart2BoldDuotone);
export const ChartLine = wrapSolarIcon(GraphUpBoldDuotone);
export const Flame = wrapSolarIcon(FireBoldDuotone);
export const Award = wrapSolarIcon(MedalRibbonStarBoldDuotone);

// ============================================================================
// TIME ICONS
// ============================================================================

export const Timer = wrapSolarIcon(StopwatchBoldDuotone);
export const Clock = wrapSolarIcon(ClockCircleBoldDuotone);
export const Calendar = wrapSolarIcon(CalendarBoldDuotone);
export const CalendarDays = wrapSolarIcon(CalendarDateBoldDuotone);
export const History = wrapSolarIcon(HistoryBoldDuotone);

// ============================================================================
// UI ICONS
// ============================================================================

export const Settings = wrapSolarIcon(SettingsBoldDuotone);
export const Settings2 = wrapSolarIcon(Tuning2BoldDuotone);
export const Info = wrapSolarIcon(InfoCircleBoldDuotone);
export const AlertCircle = wrapSolarIcon(DangerCircleBoldDuotone);
export const BookOpen = wrapSolarIcon(BookBoldDuotone);
export const Cloud = wrapSolarIcon(CloudBoldDuotone);
export const CloudOff = wrapSolarIcon(CloundCrossBoldDuotone);
export const Hand = wrapSolarIcon(HandStarsBoldDuotone);
export const Loader2 = wrapSolarIcon(RefreshBoldDuotone);
export const StickyNote = wrapSolarIcon(NotesBoldDuotone);
export const Palette = wrapSolarIcon(PaletteBoldDuotone);
export const LayoutGrid = wrapSolarIcon(WidgetBoldDuotone);
export const LayoutList = wrapSolarIcon(ListCheckBoldDuotone);
export const Layers = wrapSolarIcon(LayersBoldDuotone);
export const Snowflake = wrapSolarIcon(SnowflakeBoldDuotone);
export const Wind = wrapSolarIcon(WindBoldDuotone);
export const Home = wrapSolarIcon(HomeBoldDuotone);
export const User = wrapSolarIcon(UserBoldDuotone);
export const Star = wrapSolarIcon(StarBoldDuotone);
export const Heart = wrapSolarIcon(HeartBoldDuotone);
export const MessageSquare = wrapSolarIcon(ChatSquareBoldDuotone);
export const MessageCircle = wrapSolarIcon(ChatRoundDotsBoldDuotone);
export const FileText = wrapSolarIcon(DocumentTextBoldDuotone);
export const Link = wrapSolarIcon(LinkBoldDuotone);
export const Sort = wrapSolarIcon(SortFromTopToBottomBoldDuotone);
