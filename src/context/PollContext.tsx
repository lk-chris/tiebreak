import React, { createContext, useContext, useState, useEffect } from 'react';
import { Poll, PollOption, UserProfile, RouteType, AVATAR_COLORS } from '../types/poll';

interface PollContextType {
  route: RouteType;
  setRoute: (r: RouteType) => void;
  activePoll: Poll;
  allPolls: Poll[];
  closedPolls: Poll[];
  selectedOption: number;
  setSelectedOption: (idx: number) => void;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  isTied: boolean;
  setIsTied: (tied: boolean) => void;
  castVote: () => void;
  addSuggestion: (idea: string, reason?: string) => void;
  createPoll: (question: string, options: string[], closes: string, allowSuggestions: boolean, showLiveResults: boolean) => void;
  breakTieWithOption: (optIndex: number) => void;
  endVoting: () => void;
  reopenVoting: () => void;
  newPollOptions: string[];
  setNewPollOptions: React.Dispatch<React.SetStateAction<string[]>>;
}

const DEFAULT_POLL: Poll = {
  id: 'pizza-night',
  question: 'Pizza night: what are we ordering?',
  status: 'open',
  closesLabel: 'Closes today 7:00 PM',
  startedBy: 'Reubenson',
  subtitle: '11 of your crew voted · last one 2 min ago',
  options: [
    { id: '1', t: 'Detroit-style from Emmy’s', by: 'Priya', v: 5 },
    { id: '2', t: 'Pepperoni from Slice House', v: 3 },
    { id: '3', t: 'Veggie supreme from Nino’s', by: 'Jonah', v: 2 },
    { id: '4', t: 'Margherita from Lupa', v: 1 }
  ],
  totalVotes: 11
};

const INITIAL_POLLS_LIST: Poll[] = [
  DEFAULT_POLL,
  {
    id: 'birthday-trip',
    question: 'Where do we go for Dami’s birthday?',
    status: 'open',
    closesLabel: 'Closes Friday 9:00 PM',
    options: [
      { id: 'b1', t: 'Karaoke at Boombox', v: 3 },
      { id: 'b2', t: 'Arcade & bowling at Lane7', v: 3 }
    ],
    totalVotes: 6,
    subtitle: '6 votes · neck and neck'
  },
  {
    id: 'movie-night',
    question: 'Movie night pick',
    status: 'draft',
    closesLabel: 'Draft',
    options: [],
    totalVotes: 0,
    subtitle: 'No options yet. Add a few to get started.'
  }
];

const INITIAL_CLOSED_POLLS: Poll[] = [
  {
    id: 'pizza-night-closed',
    question: 'Pizza night: what are we ordering?',
    status: 'closed',
    closesLabel: 'Closed',
    closedDateLabel: 'Yesterday',
    winner: 'Detroit-style from Emmy’s',
    totalVotes: 11,
    options: [
      { id: '1', t: 'Detroit-style from Emmy’s', by: 'Priya', v: 5 },
      { id: '2', t: 'Pepperoni from Slice House', v: 3 },
      { id: '3', t: 'Veggie supreme from Nino’s', by: 'Jonah', v: 2 },
      { id: '4', t: 'Margherita from Lupa', v: 1 }
    ]
  },
  {
    id: 'road-trip-dj',
    question: 'Road trip playlist: who drives DJ?',
    status: 'closed',
    closesLabel: 'Closed',
    closedDateLabel: 'Nov 9',
    winner: 'Priya',
    totalVotes: 9,
    options: [
      { id: 'r1', t: 'Priya', v: 5 },
      { id: 'r2', t: 'Marcus', v: 4 }
    ]
  },
  {
    id: 'game-night-catan',
    question: 'Game night: Catan or Codenames?',
    status: 'closed',
    closesLabel: 'Closed',
    closedDateLabel: 'Oct 28',
    winner: 'Catan',
    tieBrokenByHost: true,
    totalVotes: 8,
    options: [
      { id: 'g1', t: 'Catan', v: 4 },
      { id: 'g2', t: 'Codenames', v: 4 }
    ]
  }
];

const PollContext = createContext<PollContextType | undefined>(undefined);

export const PollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialRoute = (): RouteType => {
    const hash = window.location.hash.replace('#', '') as RouteType;
    const validRoutes: RouteType[] = [
      'polls',
      'live',
      'vote',
      'suggest',
      'voted',
      'new',
      'created',
      'results',
      'closed',
      'profile'
    ];
    return validRoutes.includes(hash) ? hash : 'polls';
  };

  const [route, setRouteState] = useState<RouteType>(getInitialRoute());
  const [activePoll, setActivePoll] = useState<Poll>(DEFAULT_POLL);
  const [allPolls, setAllPolls] = useState<Poll[]>(INITIAL_POLLS_LIST);
  const [closedPolls] = useState<Poll[]>(INITIAL_CLOSED_POLLS);
  const [selectedOption, setSelectedOption] = useState<number>(-1);
  const [isTied, setIsTied] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '', '']);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Christian',
    avatarColor: AVATAR_COLORS[1], // '#f2c14e'
    notifyOnClose: true,
    notifyOnSuggestion: true
  });

  const setRoute = (newRoute: RouteType) => {
    window.location.hash = newRoute;
    setRouteState(newRoute);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.replace('#', '') as RouteType;
      const validRoutes: RouteType[] = [
        'polls',
        'live',
        'vote',
        'suggest',
        'voted',
        'new',
        'created',
        'results',
        'closed',
        'profile'
      ];
      setRouteState(validRoutes.includes(h) ? h : 'polls');
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 2200);
  };

  const castVote = () => {
    if (selectedOption < 0) return;
    setActivePoll((prev) => {
      const newOpts = prev.options.map((opt, idx) => {
        if (idx === selectedOption) {
          return { ...opt, v: opt.v + 1 };
        }
        return opt;
      });
      const newTotal = (prev.totalVotes || 0) + 1;
      return {
        ...prev,
        options: newOpts,
        totalVotes: newTotal,
        subtitle: `${newTotal} of your crew voted · just now`
      };
    });
    setRoute('voted');
  };

  const addSuggestion = (idea: string, _reason?: string) => {
    if (!idea.trim()) return;
    const newOption: PollOption = {
      id: Date.now().toString(),
      t: idea.trim(),
      by: profile.name,
      v: 0
    };
    setActivePoll((prev) => ({
      ...prev,
      options: [...prev.options, newOption]
    }));
    setRoute('vote');
    showToast('Sent to the host for approval');
  };

  const createPoll = (
    question: string,
    options: string[],
    closes: string,
    _allowSuggestions: boolean,
    _showLiveResults: boolean
  ) => {
    const validOpts = options.filter((o) => o.trim().length > 0);
    const newP: Poll = {
      id: 'poll-' + Date.now(),
      question: question.trim() || 'Untitled poll',
      status: 'open',
      closesLabel: `Closes ${closes}`,
      startedBy: profile.name,
      subtitle: `0 votes · just started`,
      options: validOpts.map((text, idx) => ({
        id: 'opt-' + idx,
        t: text,
        v: 0
      })),
      totalVotes: 0
    };

    setActivePoll(newP);
    setAllPolls((prev) => [newP, ...prev]);
    setNewPollOptions(['', '', '']);
    setRoute('created');
  };

  const breakTieWithOption = (optIndex: number) => {
    setIsTied(false);
    setActivePoll((prev) => {
      const selected = prev.options[optIndex];
      return {
        ...prev,
        winner: selected ? selected.t : prev.options[0]?.t
      };
    });
    showToast('Result shared with the crew');
  };

  const endVoting = () => {
    setRoute('results');
  };

  const reopenVoting = () => {
    setRoute('live');
  };

  return (
    <PollContext.Provider
      value={{
        route,
        setRoute,
        activePoll,
        allPolls,
        closedPolls,
        selectedOption,
        setSelectedOption,
        profile,
        setProfile,
        toast,
        showToast,
        isTied,
        setIsTied,
        castVote,
        addSuggestion,
        createPoll,
        breakTieWithOption,
        endVoting,
        reopenVoting,
        newPollOptions,
        setNewPollOptions
      }}
    >
      {children}
    </PollContext.Provider>
  );
};

export const usePoll = () => {
  const context = useContext(PollContext);
  if (!context) {
    throw new Error('usePoll must be used within a PollProvider');
  }
  return context;
};
