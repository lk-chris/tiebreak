import React from 'react';
import { usePoll } from '../context/PollContext';

export const CreatedView: React.FC = () => {
  const { selectPoll, showToast, activePollId } = usePoll();

  const pollSlug = activePollId || 'pizza-night';
  const shareUrl = `${window.location.origin}/#live/${pollSlug}`;
  const displayUrl = `${window.location.host}/#live/${pollSlug}`;

  return (
    <div className="empty">
      <div className="trophy">🎉</div>
      <h1 style={{ textShadow: '3px 3px 0 var(--yel)' }}>Poll’s live!</h1>
      <p className="sub">Send this link to your crew. Anyone with it can vote.</p>

      <div
        className="cta"
        style={{ justifyContent: 'center', marginBottom: '20px', wordBreak: 'break-all' }}
      >
        <b>{displayUrl}</b>
        <button
          className="btn dark"
          type="button"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(shareUrl);
            }
            showToast('Link copied');
          }}
        >
          ⧉ Copy link
        </button>
      </div>

      <a
        className="btn"
        href={`#live/${pollSlug}`}
        onClick={(e) => {
          e.preventDefault();
          selectPoll(pollSlug, 'live');
        }}
      >
        Open poll
      </a>
    </div>
  );
};
