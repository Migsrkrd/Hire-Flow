import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { RecruiterDashboard } from './components/RecruiterDashboard';
import { HiringManagerDashboard } from './components/HiringManagerDashboard';
import { ToastContainer } from './components/ui/Toast';
import './styles/global.css';

function AppContent() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (currentUser.role === 'recruiter') {
    return <RecruiterDashboard />;
  }

  return <HiringManagerDashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <ToastContainer />
    </AppProvider>
  );
}
