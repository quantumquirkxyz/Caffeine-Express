import { useState } from 'react';
import App from './App';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { ThemeProvider } from './ui/ThemeProvider';

export default function Root() {
  const [entered, setEntered] = useState(false);

  if (entered) return <App />;

  return (
    <ThemeProvider initialMode="system">
      <OnboardingScreen onFinish={() => setEntered(true)} />
    </ThemeProvider>
  );
}
