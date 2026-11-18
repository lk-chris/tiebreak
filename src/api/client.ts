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
    optionId: string,
    voterId: string
  ): Promise<{ success: boolean } | null> {
    try {
      const res = await fetch(`${API_BASE}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-voter-id': voterId
        },
        body: JSON.stringify({ optionId, voterId })
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
  ): Promise<{ success: boolean } | null> {
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
  }
};
