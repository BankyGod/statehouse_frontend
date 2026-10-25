import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RealtimeProvider } from './realtime/RealtimeProvider';
import { AppShell } from './components/AppShell';
import { GuestOnly, RequireAuth } from './components/RequireAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CreateCharacterPage } from './pages/CreateCharacterPage';
import { DashboardPage } from './pages/DashboardPage';
import { JobsPage } from './pages/JobsPage';
import { EducationPage } from './pages/EducationPage';
import { BusinessPage } from './pages/BusinessPage';
import { PermitsPage } from './pages/PermitsPage';
import { CrimePage } from './pages/CrimePage';
import { StatesPage } from './pages/StatesPage';
import { StateDetailPage } from './pages/StateDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { BankPage } from './pages/BankPage';
import { TravelPage } from './pages/TravelPage';
import { HousingPage } from './pages/HousingPage';
import { MedicalPage } from './pages/MedicalPage';
import { PoliticsPage } from './pages/PoliticsPage';
import { LegislationPage } from './pages/LegislationPage';
import { NewsPage } from './pages/NewsPage';
import { CabinetPage } from './pages/CabinetPage';
import { PartiesPage } from './pages/PartiesPage';
import { GovernmentPage } from './pages/GovernmentPage';
import { ChatPage } from './pages/ChatPage';
import { StocksPage } from './pages/StocksPage';
import { GymPage } from './pages/GymPage';
import { InventoryPage } from './pages/InventoryPage';
import { JailPage } from './pages/JailPage';
import { SocialPage } from './pages/SocialPage';
import { ActivityPage } from './pages/ActivityPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RealtimeProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<GuestOnly />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route path="/create-character" element={<CreateCharacterPage />} />

              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/jobs" element={<JobsPage />} />
                  <Route path="/education" element={<EducationPage />} />
                  <Route path="/business" element={<BusinessPage />} />
                  <Route path="/bank" element={<BankPage />} />
                  <Route path="/stocks" element={<StocksPage />} />
                  <Route path="/gym" element={<GymPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/travel" element={<TravelPage />} />
                  <Route path="/housing" element={<HousingPage />} />
                  <Route path="/medical" element={<MedicalPage />} />
                  <Route path="/permits" element={<PermitsPage />} />
                  <Route path="/crime" element={<CrimePage />} />
                  <Route path="/jail" element={<JailPage />} />
                  <Route path="/social" element={<SocialPage />} />
                  <Route path="/activity" element={<ActivityPage />} />
                  <Route path="/states" element={<StatesPage />} />
                  <Route path="/states/:slug" element={<StateDetailPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/politics" element={<PoliticsPage />} />
                  <Route path="/legislation" element={<LegislationPage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/cabinet" element={<CabinetPage />} />
                  <Route path="/parties" element={<PartiesPage />} />
                  <Route path="/government" element={<GovernmentPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          </RealtimeProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
