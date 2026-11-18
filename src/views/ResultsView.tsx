import React from 'react';
import { usePoll } from '../context/PollContext';

export const ResultsView: React.FC = () => {
  const {
    activePoll,
    isTied,
    setIsTied,
    showToast,
    reopenVoting,
    breakTieWithOption
  } = usePoll();

  const totalVotes = activePoll.options.reduce((sum, opt) => sum + opt.v, 0);

  const calculatedOptions = activePoll.options.map((opt) => ({
    ...opt,
    p: totalVotes > 0 ? Math.round((opt.v / totalVotes) * 100) : 0
  }));

  const sorted = [...calculatedOptions].sort((a, b) => b.v - a.v);
  const maxVotes = sorted[0]?.v || 0;
  const topTied = sorted.filter((o) => o.v === maxVotes && maxVotes > 0);

  const winnerTitle = activePoll.winner || sorted[0]?.t || 'Winning Option';
  const winnerOpt = sorted.find((o) => o.t === winnerTitle) || sorted[0] || {
    id: '0',
    t: winnerTitle,
    v: maxVotes,
    p: totalVotes > 0 ? Math.round((maxVotes / totalVotes) * 100) : 0
  };
  const remaining = sorted.filter((o) => o.id !== winnerOpt.id);

  const tieHeadline =
    topTied.length >= 2
      ? `${topTied[0].t} & ${topTied[1].t} (${maxVotes} votes each)`
      : 'Tied between options';

  return (
    <>
      <div className="chips">
        <span className="chip">🔒 Voting closed</span>
        <span className="chip">{totalVotes} votes</span>
      </div>

      <h1>{isTied ? 'We have a tie' : 'We have a winner'}</h1>
      <p className="sub">{activePoll.question}</p>

      <div className="hero">
        <div className="ribbon">{isTied ? 'TIE' : 'WINNER'}</div>
        <div className="trophy" style={{ textAlign: 'left', fontSize: '44px' }}>
          {isTied ? '⚖️' : '🏆'}
        </div>
        <h2>{isTied ? tieHeadline : winnerTitle}</h2>
        <span className="pill">
          {isTied
            ? 'Host breaks the tie'
            : `${winnerOpt.v} of ${totalVotes} votes · ${winnerOpt.p}%`}
        </span>
      </div>

      {isTied ? (
        <div className="panel">
          {(topTied.length >= 2 ? topTied : sorted.slice(0, 2)).map((opt) => {
            const originalIndex = activePoll.options.findIndex((o) => o.id === opt.id);
            return (
              <div
                key={opt.id}
                className="row opt"
                onClick={() => breakTieWithOption(originalIndex)}
              >
                <div className="t">{opt.t}</div>
                <span className="btn teal">Pick this</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel">
          {remaining.map((o) => (
            <div className="row" key={o.id}>
              <div className="t">{o.t}</div>
              <div className="bar">
                <i style={{ width: `${o.p}%` }}></i>
              </div>
              <div className="pct">
                {o.p}% <small>{o.v}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          className="btn dark"
          type="button"
          onClick={() => showToast('Result shared with the crew')}
        >
          Share result
        </button>
        <a
          className="btn"
          href={`#live/${activePoll.id}`}
          onClick={(e) => {
            e.preventDefault();
            reopenVoting();
          }}
        >
          Reopen voting
        </a>
        <button
          className="btn ghost"
          type="button"
          onClick={() => setIsTied(!isTied)}
        >
          {isTied ? 'Show winner view' : 'Preview tie view'}
        </button>
      </div>

      <p className="note">
        Reopening is always possible if the crew changes its mind.
      </p>
    </>
  );
};
