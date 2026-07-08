import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { AppShell } from './components/shell/AppShell';
import { ToastContainer } from './components/ui/Toast';
import './styles/global.css';

function AppContent() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginScreen />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <ToastContainer />
    </AppProvider>
  );
}
