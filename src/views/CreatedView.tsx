import React from 'react';
import { usePoll } from '../context/PollContext';

export const CreatedView: React.FC = () => {
  const { setRoute, showToast, activePoll } = usePoll();

  const pollSlug = activePoll.id ? activePoll.id : 'new-poll';

  return (
    <div className="empty">
      <div className="trophy">🎉</div>
      <h1 style={{ textShadow: '3px 3px 0 var(--yel)' }}>Poll’s live!</h1>
      <p className="sub">Send this link to your crew. Anyone with it can vote.</p>

      <div
        className="cta"
        style={{ justifyContent: 'center', marginBottom: '20px' }}
      >
        <b>tiebreak.test/p/{pollSlug}</b>
        <button
          className="btn dark"
          type="button"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(
                `${window.location.origin}/#live`
              );
            }
            showToast('Link copied');
          }}
        >
          ⧉ Copy link
        </button>
      </div>

      <a
        className="btn"
        href="#live"
        onClick={(e) => {
          e.preventDefault();
          setRoute('live');
        }}
      >
        Open poll
      </a>
    </div>
  );
};
