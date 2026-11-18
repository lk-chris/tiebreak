import React from 'react';
import { usePoll } from '../context/PollContext';

export const LiveView: React.FC = () => {
  const { activePoll, setRoute, showToast, endVoting } = usePoll();

  const totalVotes = activePoll.options.reduce((sum, opt) => sum + opt.v, 0);

  const calculatedOptions = activePoll.options.map((opt) => ({
    ...opt,
    p: totalVotes > 0 ? Math.round((opt.v / totalVotes) * 100) : 0
  }));

  const leader = calculatedOptions[0] || {
    id: '0',
    t: 'No options',
    v: 0,
    p: 0,
    by: undefined
  };
  const runnerUp = calculatedOptions[1];
  const aheadCount = runnerUp ? leader.v - runnerUp.v : leader.v;
  const remainingOptions = calculatedOptions.slice(1);

  // Generate segment ticks matching total votes count (or min 11)
  const segmentCount = Math.max(totalVotes, 11);
  const activeTicks = leader.v;

  return (
    <>
      <div className="chips">
        <span className="chip g">● Voting open</span>
        <span className="chip">
          ⏱ Closes today <b>7:00 PM</b>
        </span>
      </div>

      <h1>{activePoll.question}</h1>
      <p className="sub">{activePoll.subtitle || `${totalVotes} of your crew voted · last one 2 min ago`}</p>

      <div className="hero">
        <div className="ribbon">IN THE LEAD</div>
        <h2>{leader.t}</h2>
        {leader.by && <span className="pill">Suggested by {leader.by}</span>}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: '18px'
          }}
        >
          <div className="big">{leader.p}%</div>
          <span className="pill">
            {leader.v} of {totalVotes} votes · ahead by {aheadCount}
          </span>
        </div>

        <div className="seg">
          {[...Array(segmentCount)].map((_, i) => (
            <b key={i} className={i < activeTicks ? 'f' : ''}></b>
          ))}
        </div>
      </div>

      <div className="panel">
        {remainingOptions.map((o) => (
          <div className="row" key={o.id}>
            <div className="t">
              {o.t}
              {o.by && <small>Suggested by {o.by}</small>}
            </div>
            <div className="bar">
              <i style={{ width: `${o.p}%` }}></i>
            </div>
            <div className="pct">
              {o.p}% <small>{o.v} vote{o.v === 1 ? '' : 's'}</small>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <a
          className="btn teal"
          href="#vote"
          onClick={(e) => {
            e.preventDefault();
            setRoute('vote');
          }}
        >
          Vote now
        </a>
      </div>

      <div className="cta">
        <b>Share to get votes</b> tiebreak.test/p/{activePoll.id || 'pizza-night'}{' '}
        <span className="sp"></span>
        <button
          className="btn"
          type="button"
          onClick={() => {
            endVoting();
          }}
        >
          End voting
        </button>
        <button
          className="btn dark"
          type="button"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
            }
            showToast('Link copied');
          }}
        >
          ⧉ Copy link
        </button>
      </div>
    </>
  );
};
