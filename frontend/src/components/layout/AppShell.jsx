import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export const AppShell = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <TopBar />
      <main className="pt-16 md:pl-64 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
};
