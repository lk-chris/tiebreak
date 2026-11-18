import React from 'react';
import { usePoll } from '../context/PollContext';

export const Header: React.FC = () => {
  const { route, setRoute, profile } = usePoll();

  const isPollsActive = route === 'polls' || route === 'live';
  const isClosedActive = route === 'closed';

  const userInitial = profile.name ? profile.name.charAt(0).toUpperCase() : 'Y';

  return (
    <header>
      <a
        className="logo"
        href="#polls"
        onClick={(e) => {
          e.preventDefault();
          setRoute('polls');
        }}
      >
        <i>✓</i>tiebreak
      </a>
      <nav id="nav">
        <a
          href="#polls"
          className={isPollsActive ? 'on' : ''}
          onClick={(e) => {
            e.preventDefault();
            setRoute('polls');
          }}
        >
          My polls
        </a>
        <a
          href="#closed"
          className={isClosedActive ? 'on' : ''}
          onClick={(e) => {
            e.preventDefault();
            setRoute('closed');
          }}
        >
          Closed
        </a>
      </nav>
      <span className="sp"></span>
      <a
        className="btn"
        href="#new"
        onClick={(e) => {
          e.preventDefault();
          setRoute('new');
        }}
      >
        ＋ New poll
      </a>
      <a
        className="av"
        href="#profile"
        style={{ background: profile.avatarColor }}
        title="You"
        onClick={(e) => {
          e.preventDefault();
          setRoute('profile');
        }}
      >
        {userInitial}
      </a>
    </header>
  );
};
