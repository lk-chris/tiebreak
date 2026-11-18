import React, { useState } from 'react';
import { usePoll } from '../context/PollContext';

export const NewPollView: React.FC = () => {
  const { setRoute, createPoll, newPollOptions, setNewPollOptions } = usePoll();

  const [question, setQuestion] = useState('');
  const [closes, setCloses] = useState('Today at 7:00 PM');
  const [allowSuggestions, setAllowSuggestions] = useState(true);
  const [showLiveResults, setShowLiveResults] = useState(true);

  const handleOptionChange = (index: number, val: string) => {
    setNewPollOptions((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleAddOption = () => {
    setNewPollOptions((prev) => [...prev, '']);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPoll(question, newPollOptions, closes, allowSuggestions, showLiveResults);
  };

  return (
    <>
      <h1>New poll</h1>
      <p className="sub">What can’t your crew agree on?</p>

      <form onSubmit={handleCreate}>
        <label className="field">
          <span>The question</span>
          <input
            placeholder="Pizza night: what are we ordering?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            autoFocus
          />
        </label>

        <div className="field">
          <span>Options (at least 2)</span>
          {newPollOptions.map((opt, i) => (
            <input
              key={i}
              style={{ marginBottom: '10px' }}
              value={opt}
              placeholder={`Option ${i + 1}`}
              onChange={(e) => handleOptionChange(i, e.target.value)}
            />
          ))}
          <button
            type="button"
            className="btn"
            onClick={handleAddOption}
            style={{ marginTop: '4px' }}
          >
            ＋ Add option
          </button>
        </div>

        <label className="field">
          <span>Voting closes</span>
          <select value={closes} onChange={(e) => setCloses(e.target.value)}>
            <option>Today at 7:00 PM</option>
            <option>Tomorrow at 12:00 PM</option>
            <option>In 3 days</option>
            <option>When I end it</option>
          </select>
        </label>

        <div className="panel" style={{ padding: '6px 0' }}>
          <div className="row">
            <div className="t">
              Let the crew suggest options
              <small>You approve each one first</small>
            </div>
            <span
              className={`chip clickable ${allowSuggestions ? 'g' : ''}`}
              onClick={() => setAllowSuggestions(!allowSuggestions)}
            >
              {allowSuggestions ? 'On' : 'Off'}
            </span>
          </div>

          <div className="row">
            <div className="t">
              Show live results while voting
              <small>Turn off to avoid bandwagon votes</small>
            </div>
            <span
              className={`chip clickable ${showLiveResults ? 'g' : ''}`}
              onClick={() => setShowLiveResults(!showLiveResults)}
            >
              {showLiveResults ? 'On' : 'Off'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button type="submit" className="btn red">
            Create poll
          </button>
          <a
            className="btn ghost"
            href="#polls"
            onClick={(e) => {
              e.preventDefault();
              setRoute('polls');
            }}
          >
            Cancel
          </a>
        </div>
      </form>
    </>
  );
};
