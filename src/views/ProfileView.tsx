import React, { useState } from 'react';
import { usePoll } from '../context/PollContext';
import { AVATAR_COLORS } from '../types/poll';

export const ProfileView: React.FC = () => {
  const { profile, setProfile, showToast } = usePoll();

  const [name, setName] = useState(profile.name);
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor);
  const [notifyClose, setNotifyClose] = useState(profile.notifyOnClose);
  const [notifySuggest, setNotifySuggest] = useState(profile.notifyOnSuggestion);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      name,
      avatarColor,
      notifyOnClose: notifyClose,
      notifyOnSuggestion: notifySuggest
    });
    showToast('Saved');
  };

  return (
    <>
      <h1>You</h1>
      <p className="sub">
        Your name shows on polls you start and votes you cast.
      </p>

      <form onSubmit={handleSave}>
        <label className="field">
          <span>Display name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <div className="field">
          <span>Avatar colour</span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {AVATAR_COLORS.map((c) => {
              const isSelected = avatarColor === c;
              return (
                <span
                  key={c}
                  className="av"
                  style={{
                    background: c,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 2px var(--ink)' : 'none'
                  }}
                  onClick={() => setAvatarColor(c)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') setAvatarColor(c);
                  }}
                >
                  {isSelected ? '✓' : ''}
                </span>
              );
            })}
          </div>
        </div>

        <div className="panel" style={{ padding: '6px 0' }}>
          <div className="row">
            <div className="t">Notify me when a poll closes</div>
            <span
              className={`chip clickable ${notifyClose ? 'g' : ''}`}
              onClick={() => setNotifyClose(!notifyClose)}
            >
              {notifyClose ? 'On' : 'Off'}
            </span>
          </div>

          <div className="row">
            <div className="t">Notify me of new suggestions</div>
            <span
              className={`chip clickable ${notifySuggest ? 'g' : ''}`}
              onClick={() => setNotifySuggest(!notifySuggest)}
            >
              {notifySuggest ? 'On' : 'Off'}
            </span>
          </div>
        </div>

        <button type="submit" className="btn teal">
          Save changes
        </button>
      </form>
    </>
  );
};
