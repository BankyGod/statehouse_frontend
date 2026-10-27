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
import { BusinessHubPage } from './pages/BusinessHubPage';
import { BusinessRegisterPage } from './pages/BusinessRegisterPage';
import { BusinessMinePage } from './pages/BusinessMinePage';
import { BusinessManagePage } from './pages/BusinessManagePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { PermitsPage } from './pages/PermitsPage';
import { CrimeHubPage } from './pages/CrimeHubPage';
import { CrimePage } from './pages/CrimePage';
import { StatesPage } from './pages/StatesPage';
import { StateDetailPage } from './pages/StateDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { BankHubPage } from './pages/BankHubPage';
import { BankPage } from './pages/BankPage';
import { TravelPage } from './pages/TravelPage';
import { HousingHubPage } from './pages/HousingHubPage';
import { HousingPage } from './pages/HousingPage';
import { MedicalPage } from './pages/MedicalPage';
import { NationHubPage } from './pages/NationHubPage';
import { PoliticsPage } from './pages/PoliticsPage';
import { LegislationPage } from './pages/LegislationPage';
import { NewsPage } from './pages/NewsPage';
import { CabinetPage } from './pages/CabinetPage';
import { PartiesPage } from './pages/PartiesPage';
import { GovernmentPage } from './pages/GovernmentPage';
import { EnterprisesPage } from './pages/EnterprisesPage';
import { TreasuryPage } from './pages/TreasuryPage';
import { ChatPage } from './pages/ChatPage';
import { StocksPage } from './pages/StocksPage';
import { GymPage } from './pages/GymPage';
import { InventoryHubPage } from './pages/InventoryHubPage';
import { InventoryPage } from './pages/InventoryPage';
import { JailPage } from './pages/JailPage';
import { SocialHubPage } from './pages/SocialHubPage';
import { SocialPage } from './pages/SocialPage';
import { ActivityPage } from './pages/ActivityPage';
import { InboxPage } from './pages/InboxPage';

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
                    <Route path="/business" element={<BusinessHubPage />} />
                    <Route path="/business/register" element={<BusinessRegisterPage />} />
                    <Route path="/business/mine" element={<BusinessMinePage />} />
                    <Route path="/business/:id" element={<BusinessManagePage />} />
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/bank" element={<BankHubPage />} />
                    <Route path="/bank/:section" element={<BankPage />} />
                    <Route path="/stocks" element={<StocksPage />} />
                    <Route path="/gym" element={<GymPage />} />
                    <Route path="/inventory" element={<InventoryHubPage />} />
                    <Route path="/inventory/:section" element={<InventoryPage />} />
                    <Route path="/travel" element={<TravelPage />} />
                    <Route path="/housing" element={<HousingHubPage />} />
                    <Route path="/housing/:section" element={<HousingPage />} />
                    <Route path="/medical" element={<MedicalPage />} />
                    <Route path="/permits" element={<PermitsPage />} />
                    <Route path="/crime" element={<CrimeHubPage />} />
                    <Route path="/crime/streets" element={<CrimePage />} />
                    <Route path="/jail" element={<JailPage />} />
                    <Route path="/social" element={<SocialHubPage />} />
                    <Route path="/social/:section" element={<SocialPage />} />
                    <Route path="/inbox" element={<InboxPage />} />
                    <Route path="/activity" element={<ActivityPage />} />
                    <Route path="/states" element={<StatesPage />} />
                    <Route path="/states/:slug" element={<StateDetailPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/nation" element={<NationHubPage />} />
                    <Route path="/politics" element={<PoliticsPage />} />
                    <Route path="/legislation" element={<LegislationPage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/cabinet" element={<CabinetPage />} />
                    <Route path="/parties" element={<PartiesPage />} />
                    <Route path="/government" element={<GovernmentPage />} />
                    <Route path="/enterprises" element={<EnterprisesPage />} />
                    <Route path="/treasury" element={<TreasuryPage />} />
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
