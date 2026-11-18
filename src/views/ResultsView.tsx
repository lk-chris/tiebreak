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

  const winner = calculatedOptions[0] || {
    id: '0',
    t: 'Detroit-style from Emmy’s',
    v: 5,
    p: 45
  };
  const remaining = calculatedOptions.slice(1);

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
        <h2>
          {isTied
            ? 'Detroit-style & Pepperoni (4 votes each)'
            : winner.t}
        </h2>
        <span className="pill">
          {isTied
            ? 'Host breaks the tie'
            : `${winner.v} of ${totalVotes} votes · ${winner.p}%`}
        </span>
      </div>

      {isTied ? (
        <div className="panel">
          <div
            className="row opt"
            onClick={() => breakTieWithOption(0)}
          >
            <div className="t">Detroit-style from Emmy’s</div>
            <span className="btn teal">Pick this</span>
          </div>
          <div
            className="row opt"
            onClick={() => breakTieWithOption(1)}
          >
            <div className="t">Pepperoni from Slice House</div>
            <span className="btn teal">Pick this</span>
          </div>
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
          href="#live"
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
