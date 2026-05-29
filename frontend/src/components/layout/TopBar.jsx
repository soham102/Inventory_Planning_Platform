import { Bell, Search, ChevronDown, Sun, Moon, Monitor, Check } from "lucide-react";
import { NAV } from "@/constants/testIds";
import { useInventory } from "@/store/inventoryStore";
import { useTheme } from "@/lib/theme";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export const TopBar = () => {
  const { job } = useInventory();
  const { mode, theme, setMode } = useTheme();
  const filename = job?.filename ?? "No file uploaded";
  const rows = job?.row_count ?? 0;

  return (
    <header
      data-testid={NAV.topbar}
      className="fixed top-0 right-0 left-0 md:left-64 h-16 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800"
    >
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="font-display font-black text-lg tracking-tight text-slate-900 dark:text-slate-50 truncate">
            Inventory Command Center
          </h1>
          <span className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse-dot" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-300">Live</span>
          </span>
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 truncate">
            <span className="font-mono-num">{filename}</span>
            {rows > 0 && (
              <>
                <span>·</span>
                <span className="font-mono-num">{rows} rows</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500 dark:text-slate-500" />
            <input
              data-testid="topbar-search"
              className="bg-transparent outline-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-500 w-full"
              placeholder="Search SKUs, warehouses..."
            />
            <kbd className="hidden xl:inline px-1.5 py-0.5 rounded text-[10px] font-mono-num text-slate-500 dark:text-slate-500 dark:text-slate-500 border border-slate-300 dark:border-slate-700">⌘K</kbd>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="theme-toggle"
                aria-label="Change theme"
                className="relative w-9 h-9 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-500 dark:text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                )}
                {mode === "system" && (
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-500 border-2 border-white dark:border-slate-900"
                  />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={value}
                  data-testid={`theme-option-${value}`}
                  onClick={() => setMode(value)}
                  className="cursor-pointer flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100"
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1">{label}</span>
                  {mode === value && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            data-testid={NAV.notification}
            className="relative w-9 h-9 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-dot" />
          </button>

          <button
            data-testid={NAV.profile}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center font-display font-black text-slate-950 text-xs">
              OP
            </div>
            <div className="hidden sm:block text-left leading-tight pr-1">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Ops Lead</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-500 dark:text-slate-500">Blinkit · IN</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500 dark:text-slate-500" />
          </button>
        </div>
      </div>
    </header>
  );
};
