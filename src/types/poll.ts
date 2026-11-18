export interface PollOption {
  id: string;
  t: string; // text title
  by?: string; // suggested by
  v: number; // vote count
  p?: number; // percentage
}

export interface Poll {
  id: string;
  question: string;
  status: 'open' | 'closed' | 'draft';
  closesLabel: string;
  startedBy?: string;
  subtitle?: string;
  options: PollOption[];
  totalVotes?: number;
  winner?: string;
  closedDateLabel?: string;
  tieBrokenByHost?: boolean;
}

export interface UserProfile {
  name: string;
  avatarColor: string;
  notifyOnClose: boolean;
  notifyOnSuggestion: boolean;
}

export type RouteType =
  | 'polls'
  | 'live'
  | 'vote'
  | 'suggest'
  | 'voted'
  | 'new'
  | 'created'
  | 'results'
  | 'closed'
  | 'profile';

export const AVATAR_COLORS = [
  '#f4b6a6',
  '#f2c14e',
  '#cfe6e0',
  '#d9c3f0',
  '#f9d5a7'
];
