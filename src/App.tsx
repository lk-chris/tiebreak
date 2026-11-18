import React from 'react';
import { usePoll } from './context/PollContext';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { PollsView } from './views/PollsView';
import { LiveView } from './views/LiveView';
import { VoteView } from './views/VoteView';
import { SuggestView } from './views/SuggestView';
import { VotedView } from './views/VotedView';
import { NewPollView } from './views/NewPollView';
import { CreatedView } from './views/CreatedView';
import { ResultsView } from './views/ResultsView';
import { ClosedView } from './views/ClosedView';
import { ProfileView } from './views/ProfileView';

export const AppContent: React.FC = () => {
  const { route } = usePoll();

  const renderView = () => {
    switch (route) {
      case 'polls':
        return <PollsView />;
      case 'live':
        return <LiveView />;
      case 'vote':
        return <VoteView />;
      case 'suggest':
        return <SuggestView />;
      case 'voted':
        return <VotedView />;
      case 'new':
        return <NewPollView />;
      case 'created':
        return <CreatedView />;
      case 'results':
        return <ResultsView />;
      case 'closed':
        return <ClosedView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <PollsView />;
    }
  };

  return (
    <>
      <Header />
      <main id="app">{renderView()}</main>
      <Toast />
    </>
  );
};

export default AppContent;
