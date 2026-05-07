import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  ClipboardList,
  Sparkles,
  Lightbulb,
  WalletCards,
  Plus,
  FileText,
  Settings,
  X,
} from "lucide-react";
import cashnovaDashboardLogo from "../../assets/cashnova-dashboard-logo-cutout.png";
import SidebarProfile from "./SidebarProfile";

const SidebarBrand = () => {
  return (
    <div className="sidebar-brand mb-8 flex items-center gap-3 pl-2 pr-2" aria-label="Cashnova">
      <div className="sidebar-brand-logo flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eff4fa] shadow-[inset_8px_8px_16px_#cbd5e1,inset_-8px_-8px_16px_#ffffff,0_10px_30px_rgba(0,0,0,0.5)]">
        <img
          src={cashnovaDashboardLogo}
          alt=""
          aria-hidden="true"
          className="h-[82%] w-[82%] object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]"
        />
      </div>

      <h1 className="sidebar-brand-wordmark min-w-0 text-[30px] font-bold tracking-wide text-gray-200 drop-shadow-[0_8px_8px_rgba(0,0,0,0.7)]">
        Cashnova
      </h1>
    </div>
  );
};

const navLinkClass = ({ isActive }) =>
  `theme-sidebar-link flex items-center justify-between rounded-2xl border border-transparent px-5 py-3 text-[15px] font-medium tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow] ${
    isActive
      ? "theme-sidebar-link-active"
      : ""
  }`;

const SidebarContent = ({ setMobileOpen }) => {
  return (
    <div className="sidebar-content min-h-0">
      <SidebarBrand />

      <div className="sidebar-nav space-y-5">
        <div>
          <p className="theme-sidebar-kicker mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.24em]">
            Main Menu
          </p>

          <div className="space-y-2">
            <NavLink
              to="/"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex items-center gap-3">
                <LayoutGrid size={18} />
                <span>Dashboard</span>
              </div>
            </NavLink>

            <NavLink
              to="/activity-log"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex items-center gap-3">
                <ClipboardList size={18} />
                <span>Activity Log</span>
              </div>
            </NavLink>
          </div>
        </div>

        <div>
          <p className="theme-sidebar-kicker mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.24em]">
            Analysis
          </p>

          <div className="space-y-2">
            <NavLink
              to="/ai-predictions"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Sparkles size={18} />
                <span>AI Predictions</span>
              </div>
            </NavLink>

            <NavLink
              to="/ai-insights"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Lightbulb size={18} />
                <span>AI Insights</span>
              </div>
            </NavLink>

            <NavLink
              to="/budget-planner"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex items-center gap-3">
                <WalletCards size={18} />
                <span>Budget Planner</span>
              </div>
            </NavLink>
          </div>
        </div>

        <div>
          <p className="theme-sidebar-kicker mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.24em]">
            Tools
          </p>

          <div className="space-y-2">
            <NavLink
              to="/add-entry"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Plus size={18} />
                <span>Add Entry</span>
              </div>
            </NavLink>

            <NavLink
              to="/reports"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex items-center gap-3">
                <FileText size={18} />
                <span>Reports</span>
              </div>
            </NavLink>

            <NavLink
              to="/settings"
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Settings size={18} />
                <span>Settings</span>
              </div>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  return (
    <>
      <aside className="theme-sidebar sidebar-desktop sticky top-0 hidden h-screen w-[300px] shrink-0 px-5 py-6 lg:flex lg:flex-col lg:justify-between xl:w-[340px] xl:px-6 2xl:w-[380px]">
        <SidebarContent setMobileOpen={setMobileOpen} />
        <SidebarProfile setMobileOpen={setMobileOpen} />
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#120A1E]/58 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`theme-sidebar fixed left-0 top-0 z-50 h-full w-[92vw] max-w-[420px] px-6 py-7 shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex justify-end">
          <button
            className="rounded-xl border border-white/10 bg-white/8 p-2 text-[#eef8fb]"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-mobile-content flex h-[calc(100%-40px)] flex-col justify-between">
          <SidebarContent setMobileOpen={setMobileOpen} />
          <SidebarProfile setMobileOpen={setMobileOpen} />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
