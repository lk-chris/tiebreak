import React from 'react';
import { usePoll } from '../context/PollContext';

export const VoteView: React.FC = () => {
  const {
    activePoll,
    selectedOption,
    setSelectedOption,
    castVote,
    setRoute
  } = usePoll();

  const isSelected = selectedOption >= 0;

  return (
    <>
      <div className="chips">
        <span className="chip g">● Voting open</span>
        <span className="chip">⏱ Closes today 7:00 PM</span>
        {activePoll.startedBy && (
          <span className="chip">Started by {activePoll.startedBy}</span>
        )}
      </div>

      <h1>{activePoll.question}</h1>
      <p className="sub">Pick one. You can change your vote until it closes.</p>

      <div className="panel">
        {activePoll.options.map((opt, i) => (
          <div
            key={opt.id || i}
            className={`row opt ${selectedOption === i ? 'sel' : ''}`}
            onClick={() => setSelectedOption(i)}
            role="radio"
            aria-checked={selectedOption === i}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                setSelectedOption(i);
              }
            }}
          >
            <span className="radio">{selectedOption === i ? '✓' : ''}</span>
            <div className="t">
              {opt.t}
              {opt.by && <small>Suggested by {opt.by}</small>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          className="btn teal"
          disabled={!isSelected}
          style={{ opacity: isSelected ? 1 : 0.45 }}
          onClick={() => {
            if (isSelected) {
              castVote();
            }
          }}
        >
          Cast my vote
        </button>
        <a
          className="btn"
          href={`#suggest/${activePoll.id}`}
          onClick={(e) => {
            e.preventDefault();
            setRoute('suggest', activePoll.id);
          }}
        >
          ＋ Suggest an option
        </a>
      </div>

      <p className="note">
        Votes are visible to the crew once you’ve voted. No account needed, just
        your name.
      </p>
    </>
  );
};
