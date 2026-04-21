import { HashRouter, Routes, Route } from 'react-router-dom';
import { DebtProvider, useDebtContext } from './store/DebtContext';
import { LanguageProvider } from './store/LanguageContext';
import { ThemeProvider } from './store/ThemeContext';
import { HomeScreen } from './screens/HomeScreen';
import { DetailScreen } from './screens/DetailScreen';
import { IdentityScreen } from './screens/IdentityScreen';

const MainRouter = () => {
  const { currentUser } = useDebtContext();

  if (!currentUser) {
    return <IdentityScreen />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/person/:id" element={<DetailScreen />} />
      </Routes>
    </HashRouter>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DebtProvider>
          <MainRouter />
        </DebtProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
