import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider, useTheme } from "@/lib/theme";
import Dashboard from "@/pages/Dashboard";
import InventoryHealth from "@/pages/InventoryHealth";
import StockoutRisks from "@/pages/StockoutRisks";
import Recommendations from "@/pages/Recommendations";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";

function AppInner() {
  const { theme } = useTheme();
  return (
    <div className="App">
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory-health" element={<InventoryHealth />} />
            <Route path="/stockout-risks" element={<StockoutRisks />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppShell>
        <Toaster richColors theme={theme} position="bottom-right" />
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultMode="system">
      <AppInner />
    </ThemeProvider>
  );
}

export default App;
