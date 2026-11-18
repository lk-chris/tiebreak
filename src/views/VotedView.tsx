import React from 'react';
import { usePoll } from '../context/PollContext';

export const VotedView: React.FC = () => {
  const { activePoll, selectedOption, setRoute } = usePoll();

  const chosenOption =
    activePoll.options[selectedOption >= 0 ? selectedOption : 0];
  const chosenText = chosenOption ? chosenOption.t : 'Detroit-style from Emmy’s';

  return (
    <div className="empty">
      <div className="trophy">🗳️</div>
      <h1 style={{ textShadow: '3px 3px 0 var(--yel)' }}>Vote’s in!</h1>
      <p className="sub">
        You picked <b style={{ color: 'var(--ink)' }}>{chosenText}</b>. We’ll
        tell you when the results are final.
      </p>
      <div style={{ display: 'inline-flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a
          className="btn dark"
          href="#live"
          onClick={(e) => {
            e.preventDefault();
            setRoute('live');
          }}
        >
          See live results
        </a>
        <a
          className="btn"
          href="#vote"
          onClick={(e) => {
            e.preventDefault();
            setRoute('vote');
          }}
        >
          Change my vote
        </a>
      </div>
    </div>
  );
};
