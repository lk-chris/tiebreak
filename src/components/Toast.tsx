import React from 'react';
import { usePoll } from '../context/PollContext';

export const Toast: React.FC = () => {
  const { toast } = usePoll();

  if (!toast) return null;

  return <div className="toast">{toast}</div>;
};
