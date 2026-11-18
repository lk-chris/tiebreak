import React, { useState } from 'react';
import { usePoll } from '../context/PollContext';

export const SuggestView: React.FC = () => {
  const { setRoute, addSuggestion } = usePoll();
  const [idea, setIdea] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    addSuggestion(idea, reason);
  };

  return (
    <>
      <h1>Suggest an option</h1>
      <p className="sub">
        The host approves it before it joins the poll with 0 votes.
      </p>

      <form onSubmit={handleSubmit}>
        <label className="field">
          <span>Your idea</span>
          <input
            id="sg"
            placeholder="e.g. Just order salads"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            required
            autoFocus
          />
        </label>

        <label className="field">
          <span>Why this one? (optional)</span>
          <textarea
            rows={3}
            placeholder="Sell it to the crew"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button type="submit" className="btn teal">
            Send suggestion
          </button>
          <a
            className="btn ghost"
            href="#vote"
            onClick={(e) => {
              e.preventDefault();
              setRoute('vote');
            }}
          >
            Cancel
          </a>
        </div>
      </form>
    </>
  );
};
