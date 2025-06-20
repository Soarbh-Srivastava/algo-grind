
import {
  ListOrdered,
  Type,
  MoveHorizontal,
  Sigma,
  BrainCircuit,
  Network,
  Repeat,
  Undo2,
  Target,
  BarChart3,
  Bot, 
  Github,
  Link as LinkIcon,
  CalendarDays,
  Tag,
  Archive,
  Puzzle,
  Lightbulb,
  BookOpen,
  LayoutGrid,
  Settings,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Bookmark,
  User,
  LogOut,
  Mail,
  KeyRound,
  Sun,
  Moon,
  Trophy,
  Menu,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ProblemType } from '@/types';

export const Icons = {
  Array: (props: LucideProps) => <ListOrdered {...props} />,
  String: (props: LucideProps) => <Type {...props} />,
  SlidingWindow: (props: LucideProps) => <MoveHorizontal {...props} />,
  PrefixSum: (props: LucideProps) => <Sigma {...props} />,
  DP: (props: LucideProps) => <BrainCircuit {...props} />,
  Tree: (props: LucideProps) => <Network {...props} />,
  Recursion: (props: LucideProps) => <Repeat {...props} />,
  Backtracking: (props: LucideProps) => <Undo2 {...props} />,
  Goal: (props: LucideProps) => <Target {...props} />,
  Analytics: (props: LucideProps) => <BarChart3 {...props} />,
  AIMentor: (props: LucideProps) => <Bot {...props} />,
  GitHub: (props: LucideProps) => <Github {...props} />,
  Link: (props: LucideProps) => <LinkIcon {...props} />,
  Calendar: (props: LucideProps) => <CalendarDays {...props} />,
  Tag: (props: LucideProps) => <Tag {...props} />,
  Archive: (props: LucideProps) => <Archive {...props} />,
  Puzzle: (props: LucideProps) => <Puzzle {...props} />,
  Lightbulb: (props: LucideProps) => <Lightbulb {...props} />,
  BookOpen: (props: LucideProps) => <BookOpen {...props} />,
  Dashboard: (props: LucideProps) => <LayoutGrid {...props} />,
  Settings: (props: LucideProps) => <Settings {...props} />,
  Trash: (props: LucideProps) => <Trash2 {...props} />,
  Edit: (props: LucideProps) => <Edit3 {...props} />,
  ChevronDown: (props: LucideProps) => <ChevronDown {...props} />,
  ChevronUp: (props: LucideProps) => <ChevronUp {...props} />,
  Bookmark: (props: LucideProps) => <Bookmark {...props} />,
  User: (props: LucideProps) => <User {...props} />,
  LogOut: (props: LucideProps) => <LogOut {...props} />,
  Mail: (props: LucideProps) => <Mail {...props} />,
  Password: (props: LucideProps) => <KeyRound {...props} />,
  Sun: (props: LucideProps) => <Sun {...props} />,
  Moon: (props: LucideProps) => <Moon {...props} />,
  Trophy: (props: LucideProps) => <Trophy {...props} />,
  Menu: (props: LucideProps) => <Menu {...props} />,
  Logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  Google: (props: LucideProps) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.84-4.33 1.84A6.957 6.957 0 0 1 12.01 12a6.957 6.957 0 0 1-6.22-6.95c0-1.84.63-3.34 1.88-4.47A6.957 6.957 0 0 1 12.01 0c1.93 0 3.56.7 4.73 1.84l-2.02 1.93c-.42-.39-1.03-.78-2.1-.78-1.6 0-3.05 1.15-3.05 3.05s1.45 3.05 3.05 3.05c1.02 0 1.7-.31 2.02-.72.5-.55.85-1.42.85-2.52h-2.87z" fill="currentColor"/>
    </svg>
  ),
};

export function getIconForProblemType(type: ProblemType, props?: LucideProps) {
  switch (type) {
    case 'array': return <Icons.Array {...props} />;
    case 'string': return <Icons.String {...props} />;
    case 'sliding window': return <Icons.SlidingWindow {...props} />;
    case 'prefix sum': return <Icons.PrefixSum {...props} />;
    case 'dp': return <Icons.DP {...props} />;
    case 'tree': return <Icons.Tree {...props} />;
    case 'recursion': return <Icons.Recursion {...props} />;
    case 'backtracking': return <Icons.Backtracking {...props} />;
    default: return <Icons.Puzzle {...props} />;
  }
}
