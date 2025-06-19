import {
  ListOrdered,
  Type,
  MoveHorizontal,
  Sigma,
  Zap,
  Network,
  Repeat,
  Undo2,
  Target,
  BarChart3,
  Sparkles,
  Github,
  Link,
  CalendarDays,
  Tag,
  Archive,
  BrainCircuit,
  Puzzle,
  Lightbulb,
  BookOpen,
  LayoutGrid,
  Settings,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  GoalIcon,
  Bot
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ProblemType } from '@/types';

export const Icons = {
  Array: (props: LucideProps) => <ListOrdered {...props} />,
  String: (props: LucideProps) => <Type {...props} />,
  SlidingWindow: (props: LucideProps) => <MoveHorizontal {...props} />,
  PrefixSum: (props: LucideProps) => <Sigma {...props} />,
  DP: (props: LucideProps) => <BrainCircuit {...props} />, // Changed from Zap to BrainCircuit
  Tree: (props: LucideProps) => <Network {...props} />,
  Recursion: (props: LucideProps) => <Repeat {...props} />,
  Backtracking: (props: LucideProps) => <Undo2 {...props} />,
  Goal: (props: LucideProps) => <Target {...props} />,
  Analytics: (props: LucideProps) => <BarChart3 {...props} />,
  AIMentor: (props: LucideProps) => <Bot {...props} />, // Changed from Sparkles to Bot
  GitHub: (props: LucideProps) => <Github {...props} />,
  Link: (props: LucideProps) => <Link {...props} />,
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
  Logo: (props: LucideProps) => ( // Placeholder Logo
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
