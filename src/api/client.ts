import { Poll } from '../types/poll';

const API_BASE = '/api';

export const apiClient = {
  async getPolls(): Promise<Poll[] | null> {
    try {
      const res = await fetch(`${API_BASE}/polls`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createPoll(data: {
    id?: string;
    question: string;
    options: string[];
    closesLabel?: string;
    startedBy?: string;
  }): Promise<{ success: boolean; pollId?: string } | null> {
    try {
      const res = await fetch(`${API_BASE}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async castVote(
    pollId: string,
    optionId: string
  ): Promise<{ success: boolean } | null> {
    try {
      const res = await fetch(`${API_BASE}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async suggestOption(
    pollId: string,
    idea: string,
    by: string
  ): Promise<{ success: boolean; optionId?: string } | null> {
    try {
      const res = await fetch(`${API_BASE}/polls/${pollId}/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, by })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async closePoll(
    pollId: string
  ): Promise<{ success: boolean; isTied?: boolean; winner?: string } | null> {
    try {
      const res = await fetch(`${API_BASE}/polls/${pollId}/close`, {
        method: 'POST'
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async reopenPoll(pollId: string): Promise<{ success: boolean } | null> {
    try {
      const res = await fetch(`${API_BASE}/polls/${pollId}/reopen`, {
        method: 'POST'
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async resolveTie(
    pollId: string,
    winner: string
  ): Promise<{ success: boolean } | null> {
    try {
      const res = await fetch(`${API_BASE}/polls/${pollId}/resolve-tie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
};
