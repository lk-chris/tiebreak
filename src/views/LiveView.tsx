import React from 'react';
import { usePoll } from '../context/PollContext';

export const LiveView: React.FC = () => {
  const { activePoll, setRoute, showToast, endVoting, userVotes } = usePoll();

  const myVote = userVotes[activePoll.id];
  const totalVotes = activePoll.options.reduce((sum, opt) => sum + opt.v, 0);

  // Sort options so highest votes appear first
  const sortedOptions = [...activePoll.options].sort((a, b) => b.v - a.v);

  const calculatedOptions = sortedOptions.map((opt) => ({
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

  // Generate segment ticks matching total votes count (or min 11)
  const segmentCount = Math.max(totalVotes, 11);
  const activeTicks = leader.v;

  const shareUrl = `${window.location.origin}/#live/${activePoll.id || 'pizza-night'}`;
  const displayUrl = `${window.location.host}/#live/${activePoll.id || 'pizza-night'}`;

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
        <div className="ribbon">{totalVotes > 0 ? 'IN THE LEAD' : 'POLL OPEN'}</div>
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
            {totalVotes > 0
              ? `${leader.v} of ${totalVotes} votes · ahead by ${aheadCount}`
              : `0 votes · be the first to vote`}
          </span>
        </div>

        <div className="seg">
          {[...Array(segmentCount)].map((_, i) => (
            <b key={i} className={i < activeTicks ? 'f' : ''}></b>
          ))}
        </div>
      </div>

      {/* Show all options in the breakdown panel */}
      <div className="panel">
        {calculatedOptions.map((o) => (
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

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <a
          className="btn teal"
          href={`#vote/${activePoll.id}`}
          onClick={(e) => {
            e.preventDefault();
            setRoute('vote', activePoll.id);
          }}
        >
          {myVote ? 'Change my vote' : 'Vote now'}
        </a>
        {myVote && (
          <span className="chip g">
            ✓ You voted for {myVote.optionTitle}
          </span>
        )}
      </div>

      <div className="cta" style={{ wordBreak: 'break-all' }}>
        <b>Share to get votes</b> {displayUrl}{' '}
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
              navigator.clipboard.writeText(shareUrl);
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
