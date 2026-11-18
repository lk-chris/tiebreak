import React from 'react';
import { usePoll } from '../context/PollContext';

export const PollsView: React.FC = () => {
  const { setRoute, selectPoll, allPolls } = usePoll();

  const activePolls = allPolls.filter((p) => p.status !== 'closed');

  return (
    <>
      <h1>Your polls</h1>
      <p className="sub">Decisions your crew is still arguing about.</p>

      {activePolls.map((poll) => {
        const isDraft = poll.status === 'draft';
        const isVotingOpen = poll.status === 'open';

        // Calculate leading summary if options exist
        let detailText = poll.subtitle;
        if (!detailText && poll.options.length > 0) {
          const sorted = [...poll.options].sort((a, b) => b.v - a.v);
          const leader = sorted[0];
          const runnerUp = sorted[1];
          const lead = runnerUp ? leader.v - runnerUp.v : leader.v;
          const leadDesc = lead === 0 ? 'neck and neck' : `${leader.t} leads by ${lead}`;
          detailText = `${poll.totalVotes || 0} votes · ${leadDesc}`;
        }

        return (
          <a
            key={poll.id}
            className="card"
            href={`#live/${poll.id}`}
            onClick={(e) => {
              e.preventDefault();
              selectPoll(poll.id, 'live');
            }}
          >
            <div className="top">
              {isVotingOpen && <span className="chip g">● Voting open</span>}
              {isDraft && <span className="chip">📝 Draft</span>}
              {poll.closesLabel && !isDraft && (
                <span className="chip">⏱ {poll.closesLabel}</span>
              )}
            </div>
            <h3>{poll.question}</h3>
            <p>{detailText || 'No options yet. Add a few to get started.'}</p>
          </a>
        );
      })}

      <div className="cta">
        <b>Got one that’s stuck?</b> Throw it in a poll and let the votes decide.{' '}
        <span className="sp"></span>
        <a
          className="btn red"
          href="#new"
          onClick={(e) => {
            e.preventDefault();
            setRoute('new');
          }}
        >
          Start a poll
        </a>
      </div>
    </>
  );
};
