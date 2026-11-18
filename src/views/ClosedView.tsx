import React from 'react';
import { usePoll } from '../context/PollContext';

export const ClosedView: React.FC = () => {
  const { setRoute, closedPolls } = usePoll();

  return (
    <>
      <h1>Closed polls</h1>
      <p className="sub">Settled. Mostly.</p>

      {closedPolls.map((poll) => {
        let resultLabel = '';
        if (poll.tieBrokenByHost) {
          resultLabel = `⚖️ Tie broken by host · ${poll.totalVotes} votes`;
        } else if (poll.winner) {
          resultLabel = `🏆 ${poll.winner} · ${poll.totalVotes} votes`;
        } else {
          resultLabel = `${poll.totalVotes} votes`;
        }

        return (
          <a
            key={poll.id}
            className="card"
            href="#results"
            onClick={(e) => {
              e.preventDefault();
              setRoute('results');
            }}
          >
            <div className="top">
              <span className="chip">🔒 Closed</span>
              {poll.closedDateLabel && (
                <span className="chip">{poll.closedDateLabel}</span>
              )}
            </div>
            <h3>{poll.question}</h3>
            <p>{resultLabel}</p>
          </a>
        );
      })}
    </>
  );
};
