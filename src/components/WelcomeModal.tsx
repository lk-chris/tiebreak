import React, { useState } from 'react';
import { usePoll } from '../context/PollContext';
import { AVATAR_COLORS } from '../types/poll';

export const WelcomeModal: React.FC = () => {
  const { showWelcome, setShowWelcome, profile, setProfile, showToast } = usePoll();

  const [name, setName] = useState(profile.name);
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor);

  if (!showWelcome) return null;

  const initialLetter = name.trim() ? name.trim().charAt(0).toUpperCase() : '👋';

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = name.trim() || 'Crew member';
    setProfile({
      ...profile,
      name: finalName,
      avatarColor
    });
    setShowWelcome(false);
    showToast(`Welcome, ${finalName}!`);
  };

  const handleSkip = () => {
    setProfile({
      ...profile,
      name: 'Crew member',
      avatarColor
    });
    setShowWelcome(false);
  };

  return (
    <div className="modal-overlay" onClick={handleSkip}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-logo">
          <i>✓</i> tiebreak
        </div>
        <h2 className="modal-title">Join the crew</h2>
        <p className="modal-sub">
          What should everyone call you when you vote or start a poll?
        </p>

        <div
          className="modal-avatar-preview"
          style={{ background: avatarColor }}
        >
          {initialLetter}
        </div>

        <form onSubmit={handleSave}>
          <input
            className="modal-input"
            type="text"
            placeholder="Your name (e.g. Maya, Jordan, Alex)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={30}
          />

          <div className="modal-colors">
            {AVATAR_COLORS.map((c) => (
              <span
                key={c}
                className={`modal-color-dot ${avatarColor === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setAvatarColor(c)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') setAvatarColor(c);
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="submit"
              className="btn dark"
              style={{ width: '100%', fontSize: '16px', padding: '14px 20px' }}
            >
              Let's Go →
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={handleSkip}
              style={{ fontSize: '13px' }}
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
