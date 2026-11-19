import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Poll, UserProfile, RouteType, AVATAR_COLORS, UserVoteRecord } from '../types/poll';
import { apiClient } from '../api/client';

interface PollContextType {
  route: RouteType;
  setRoute: (r: RouteType, pollId?: string) => void;
  activePoll: Poll;
  activePollId: string;
  selectPoll: (id: string, targetRoute?: RouteType) => void;
  allPolls: Poll[];
  closedPolls: Poll[];
  selectedOption: number;
  setSelectedOption: (idx: number) => void;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  userVotes: Record<string, UserVoteRecord>;
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  isTied: boolean;
  setIsTied: (tied: boolean) => void;
  castVote: () => Promise<void>;
  addSuggestion: (idea: string, reason?: string) => Promise<void>;
  createPoll: (question: string, options: string[], closes: string, allowSuggestions: boolean, showLiveResults: boolean) => Promise<void>;
  breakTieWithOption: (optIndex: number) => Promise<void>;
  endVoting: () => Promise<void>;
  reopenVoting: () => Promise<void>;
  newPollOptions: string[];
  setNewPollOptions: React.Dispatch<React.SetStateAction<string[]>>;
  refreshPolls: () => Promise<void>;
}

const DEFAULT_POLL: Poll = {
  id: 'pizza-night',
  question: 'Pizza night: what are we ordering?',
  status: 'open',
  closesLabel: 'Closes today 7:00 PM',
  startedBy: 'Reubenson',
  subtitle: '11 of your crew voted · last one 2 min ago',
  options: [
    { id: 'p1', t: 'Detroit-style from Emmy’s', by: 'Priya', v: 5 },
    { id: 'p2', t: 'Pepperoni from Slice House', v: 3 },
    { id: 'p3', t: 'Veggie supreme from Nino’s', by: 'Jonah', v: 2 },
    { id: 'p4', t: 'Margherita from Lupa', v: 1 }
  ],
  totalVotes: 11
};

const PollContext = createContext<PollContextType | undefined>(undefined);

const STORAGE_KEY = 'tb_user_profile';
const POLLS_STORAGE_KEY = 'tb_local_polls';
const VOTES_STORAGE_KEY = 'tb_user_votes';

const getInitialUserVotes = (): Record<string, UserVoteRecord> => {
  try {
    const saved = localStorage.getItem(VOTES_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return {};
};

const getInitialPolls = (): Poll[] => {
  try {
    const saved = localStorage.getItem(POLLS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return [DEFAULT_POLL];
};

const getInitialProfile = (): { profile: UserProfile; isNewUser: boolean } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.name === 'string' && parsed.name.trim().length > 0) {
        return {
          profile: {
            name: parsed.name.trim(),
            avatarColor: parsed.avatarColor || AVATAR_COLORS[1],
            notifyOnClose: parsed.notifyOnClose ?? true,
            notifyOnSuggestion: parsed.notifyOnSuggestion ?? true
          },
          isNewUser: false
        };
      }
    }
  } catch (e) {
    // ignore localStorage errors
  }
  return {
    profile: {
      name: '',
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      notifyOnClose: true,
      notifyOnSuggestion: true
    },
    isNewUser: true
  };
};

export const PollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const parseHash = (): { route: RouteType; pollId: string | null } => {
    const raw = window.location.hash.replace('#', '');
    const parts = raw.split('/');
    const r = parts[0] as RouteType;
    const pollId = parts[1] || null;

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
    return {
      route: validRoutes.includes(r) ? r : 'polls',
      pollId
    };
  };

  const initial = parseHash();
  const [route, setRouteState] = useState<RouteType>(initial.route);
  const [activePollId, setActivePollId] = useState<string>(initial.pollId || 'pizza-night');
  const [allPolls, setAllPolls] = useState<Poll[]>(getInitialPolls);
  const [selectedOption, setSelectedOption] = useState<number>(-1);
  const [isTied, setIsTied] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '', '']);
  const [userVotes, setUserVotes] = useState<Record<string, UserVoteRecord>>(getInitialUserVotes);
  const initialUser = getInitialProfile();
  const [profile, setProfileState] = useState<UserProfile>(initialUser.profile);
  const [showWelcome, setShowWelcome] = useState<boolean>(initialUser.isNewUser);

  const updatePolls = (updater: (prev: Poll[]) => Poll[]) => {
    setAllPolls((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const setProfile = (newProfile: UserProfile) => {
    setProfileState(newProfile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    } catch (e) {
      // ignore
    }
  };

  const activePoll =
    allPolls.find((p) => p.id === activePollId) ||
    allPolls.find((p) => p.status === 'open') ||
    allPolls[0] ||
    DEFAULT_POLL;

  const closedPolls = allPolls.filter((p) => p.status === 'closed');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const setRoute = (newRoute: RouteType, pollId?: string) => {
    const targetPollId = pollId || activePollId;
    if (newRoute === 'polls' || newRoute === 'closed' || newRoute === 'new' || newRoute === 'profile') {
      window.location.hash = newRoute;
    } else {
      window.location.hash = `${newRoute}/${targetPollId}`;
    }
    setRouteState(newRoute);
    if (pollId) setActivePollId(pollId);
    window.scrollTo(0, 0);
  };

  const selectPoll = (id: string, targetRoute: RouteType = 'live') => {
    setActivePollId(id);
    const existingVote = userVotes[id];
    if (existingVote) {
      const targetPoll = allPolls.find((p) => p.id === id);
      const optIdx = targetPoll?.options.findIndex((o) => o.id === existingVote.optionId);
      setSelectedOption(optIdx !== undefined && optIdx >= 0 ? optIdx : -1);
    } else {
      setSelectedOption(-1);
    }
    setRoute(targetRoute, id);
  };

  const refreshPolls = useCallback(async () => {
    const polls = await apiClient.getPolls();
    if (polls && Array.isArray(polls) && polls.length > 0) {
      updatePolls((prev) => {
        const serverIds = new Set(polls.map((p) => p.id));
        const localOnly = prev.filter((p) => !serverIds.has(p.id));
        return [...polls, ...localOnly];
      });
    }
  }, []);

  useEffect(() => {
    refreshPolls();

    const handleHash = () => {
      const parsed = parseHash();
      setRouteState(parsed.route);
      if (parsed.pollId) {
        setActivePollId(parsed.pollId);
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [refreshPolls]);

  // Update isTied state from active poll whenever activePoll changes
  useEffect(() => {
    if (activePoll) {
      if (activePoll.isTied !== undefined) {
        setIsTied(activePoll.isTied);
      } else {
        const sorted = [...activePoll.options].sort((a, b) => b.v - a.v);
        setIsTied(sorted.length >= 2 && sorted[0].v === sorted[1].v && sorted[0].v > 0);
      }
    }
  }, [activePoll]);

  const castVote = async () => {
    if (selectedOption < 0 || !activePoll) return;
    const opt = activePoll.options[selectedOption];
    if (!opt) return;

    // Save vote record to user's account / device storage
    const voteRecord: UserVoteRecord = {
      pollId: activePoll.id,
      optionId: opt.id,
      optionTitle: opt.t,
      votedAt: new Date().toISOString()
    };
    setUserVotes((prev) => {
      const next = { ...prev, [activePoll.id]: voteRecord };
      try {
        localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });

    // 1. Optimistic update so UI updates immediately
    updatePolls((prev) =>
      prev.map((p) => {
        if (p.id !== activePoll.id) return p;
        const newOpts = p.options.map((o) => (o.id === opt.id ? { ...o, v: o.v + 1 } : o));
        const newTotal = (p.totalVotes || 0) + 1;
        return {
          ...p,
          options: newOpts,
          totalVotes: newTotal,
          subtitle: `${newTotal} of your crew voted · just now`
        };
      })
    );

    setRoute('voted', activePoll.id);

    // 2. Persist to server
    await apiClient.castVote(activePoll.id, opt.id);
  };

  const addSuggestion = async (idea: string, _reason?: string) => {
    if (!idea.trim() || !activePoll) return;
    const optId = `opt-${activePoll.id}-${Date.now()}`;
    const newOpt = { id: optId, t: idea.trim(), by: profile.name || 'Crew member', v: 0 };

    updatePolls((prev) =>
      prev.map((p) => {
        if (p.id !== activePoll.id) return p;
        return {
          ...p,
          options: [...p.options, newOpt]
        };
      })
    );

    setRoute('vote', activePoll.id);
    showToast('Sent to the host for approval');

    await apiClient.suggestOption(activePoll.id, idea.trim(), profile.name || 'Crew member');
  };

  const createPoll = async (
    question: string,
    options: string[],
    closes: string,
    _allowSuggestions: boolean,
    _showLiveResults: boolean
  ) => {
    const validOpts = options.filter((o) => o.trim().length > 0);
    const newId = 'poll-' + Date.now();

    const newPoll: Poll = {
      id: newId,
      question: question.trim() || 'Untitled poll',
      status: 'open',
      closesLabel: `Closes ${closes || 'today 7:00 PM'}`,
      startedBy: profile.name || 'You',
      subtitle: '0 votes · just started',
      options: validOpts.map((t, i) => ({ id: `opt-${newId}-${i}`, t: t.trim(), v: 0 })),
      totalVotes: 0
    };

    // 1. Instantly update local state so poll is immediately visible in "My polls"
    updatePolls((prev) => [newPoll, ...prev.filter((p) => p.id !== newId)]);
    setActivePollId(newId);
    setSelectedOption(-1);
    setNewPollOptions(['', '', '']);
    setRoute('created', newId);

    // 2. Sync to Supabase
    await apiClient.createPoll({
      id: newId,
      question: question.trim() || 'Untitled poll',
      options: validOpts,
      closesLabel: `Closes ${closes || 'today 7:00 PM'}`,
      startedBy: profile.name || 'You'
    });
  };

  const endVoting = async () => {
    if (!activePoll) return;
    const sorted = [...activePoll.options].sort((a, b) => b.v - a.v);
    const tied = sorted.length >= 2 && sorted[0].v === sorted[1].v && sorted[0].v > 0;
    const winnerName = tied ? undefined : sorted[0]?.t;

    setIsTied(tied);
    updatePolls((prev) =>
      prev.map((p) =>
        p.id === activePoll.id
          ? { ...p, status: 'closed', isTied: tied, winner: winnerName }
          : p
      )
    );

    setRoute('results', activePoll.id);
    await apiClient.closePoll(activePoll.id);
  };

  const reopenVoting = async () => {
    if (!activePoll) return;
    setIsTied(false);
    updatePolls((prev) =>
      prev.map((p) =>
        p.id === activePoll.id
          ? { ...p, status: 'open', isTied: false, winner: undefined }
          : p
      )
    );

    setRoute('live', activePoll.id);
    await apiClient.reopenPoll(activePoll.id);
  };

  const breakTieWithOption = async (optIndex: number) => {
    if (!activePoll) return;
    const chosen = activePoll.options[optIndex];
    if (!chosen) return;

    setIsTied(false);
    updatePolls((prev) =>
      prev.map((p) =>
        p.id === activePoll.id
          ? { ...p, status: 'closed', isTied: false, winner: chosen.t, tieBrokenByHost: true }
          : p
      )
    );

    showToast('Result shared with the crew');
    await apiClient.resolveTie(activePoll.id, chosen.t);
  };

  return (
    <PollContext.Provider
      value={{
        route,
        setRoute,
        activePoll,
        activePollId,
        selectPoll,
        allPolls,
        closedPolls,
        selectedOption,
        setSelectedOption,
        profile,
        setProfile,
        userVotes,
        showWelcome,
        setShowWelcome,
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
        setNewPollOptions,
        refreshPolls
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
