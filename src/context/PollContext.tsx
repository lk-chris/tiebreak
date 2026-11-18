import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Poll, UserProfile, RouteType, AVATAR_COLORS } from '../types/poll';
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
  const [allPolls, setAllPolls] = useState<Poll[]>([DEFAULT_POLL]);
  const [selectedOption, setSelectedOption] = useState<number>(-1);
  const [isTied, setIsTied] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '', '']);
  const initialUser = getInitialProfile();
  const [profile, setProfileState] = useState<UserProfile>(initialUser.profile);
  const [showWelcome, setShowWelcome] = useState<boolean>(initialUser.isNewUser);

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
    setSelectedOption(-1);
    setRoute(targetRoute, id);
  };

  const refreshPolls = useCallback(async () => {
    const polls = await apiClient.getPolls();
    if (polls && polls.length > 0) {
      setAllPolls(polls);
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

    // Send vote directly to SQLite database
    await apiClient.castVote(activePoll.id, opt.id);
    await refreshPolls();

    setRoute('voted', activePoll.id);
  };

  const addSuggestion = async (idea: string, _reason?: string) => {
    if (!idea.trim() || !activePoll) return;

    // Save suggestion directly to SQLite database
    await apiClient.suggestOption(activePoll.id, idea.trim(), profile.name);
    await refreshPolls();

    setRoute('vote', activePoll.id);
    showToast('Sent to the host for approval');
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

    // Insert poll directly to SQLite database
    await apiClient.createPoll({
      id: newId,
      question: question.trim() || 'Untitled poll',
      options: validOpts,
      closesLabel: `Closes ${closes}`,
      startedBy: profile.name
    });

    await refreshPolls();
    setActivePollId(newId);
    setNewPollOptions(['', '', '']);
    setRoute('created', newId);
  };

  const endVoting = async () => {
    if (!activePoll) return;
    const res = await apiClient.closePoll(activePoll.id);
    if (res?.isTied !== undefined) {
      setIsTied(res.isTied);
    }
    await refreshPolls();
    setRoute('results', activePoll.id);
  };

  const reopenVoting = async () => {
    if (!activePoll) return;
    await apiClient.reopenPoll(activePoll.id);
    await refreshPolls();
    setRoute('live', activePoll.id);
  };

  const breakTieWithOption = async (optIndex: number) => {
    if (!activePoll) return;
    const chosen = activePoll.options[optIndex];
    if (!chosen) return;

    await apiClient.resolveTie(activePoll.id, chosen.t);
    setIsTied(false);
    await refreshPolls();
    showToast('Result shared with the crew');
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
