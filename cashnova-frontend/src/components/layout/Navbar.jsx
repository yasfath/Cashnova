import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Menu,
  Search,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAppData } from "../../context/AppDataContext";

const titleMap = {
  "/": "Sales Dashboard",
  "/activity-log": "Activity Log",
  "/ai-predictions": "AI Predictions",
  "/ai-insights": "AI Insights",
  "/budget-planner": "Budget Planner",
  "/add-entry": "Add Entry",
  "/reports": "Reports",
  "/settings": "Settings",
  "/ai-assistant": "AI Assistant",
};

const notificationDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const Navbar = ({ setMobileOpen }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const pageTitle = titleMap[location.pathname] || "Cashnova";
  const {
    dashboardSearchQuery,
    markAllNotificationsRead,
    markNotificationRead,
    notifications,
    setDashboardSearchQuery,
    unreadNotificationCount,
  } = useAppData();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <header className="theme-topbar sticky top-0 z-30 mx-3 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-4 py-3 backdrop-blur sm:mx-4 sm:px-5 lg:mx-4 lg:px-5 xl:mx-5 xl:px-6">
      <div className="flex items-center gap-3">
        <button
          className="theme-button-soft rounded-xl p-2 text-[#215975] lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>

        <h1 className="text-[23px] font-extrabold tracking-[-0.03em] text-[#12303f] sm:text-[27px] lg:text-[28px]">
          {pageTitle}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        <form
          className="theme-input hidden items-center rounded-2xl px-4 py-2.5 sm:flex sm:w-[250px] lg:w-[280px] xl:w-[320px]"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            type="text"
            value={dashboardSearchQuery}
            onChange={(event) => setDashboardSearchQuery(event.target.value)}
            placeholder={isHome ? "Search entries..." : "Search..."}
            className="w-full bg-transparent text-sm font-medium text-[#355465] outline-none placeholder:text-[#7790a0]"
            aria-label="Search dashboard entries"
          />
          <button
            type="submit"
            className="rounded-full p-1 text-[#1f5f7a] transition hover:bg-white/70"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        </form>

        {isHome && (
          <>
            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="theme-button-soft relative rounded-full p-2 text-[#1f5f7a] transition"
                aria-expanded={notificationsOpen}
                aria-label="Open notifications"
              >
                <Bell size={22} />
                {unreadNotificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[linear-gradient(90deg,#0f7c82_0%,#1f5f7a_100%)] px-1.5 text-[10px] font-bold text-white shadow-[0_10px_20px_rgba(31,95,122,0.18)]">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                ) : null}
              </button>

              {notificationsOpen && (
                <div className="theme-card absolute right-0 top-[calc(100%+12px)] z-20 w-[320px] rounded-[24px] p-3 sm:w-[360px]">
                  <div className="theme-panel rounded-2xl px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6d8593]">
                          Notifications
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#12303f]">
                          {unreadNotificationCount} unread
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="theme-button-soft rounded-xl px-3 py-2 text-xs font-semibold transition"
                      >
                        Mark all read
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => markNotificationRead(notification.id)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            notification.isRead
                              ? "border-[rgba(191,208,218,0.2)] bg-white/58"
                              : "border-[rgba(112,150,168,0.24)] bg-[linear-gradient(135deg,rgba(249,252,252,0.96),rgba(235,243,246,0.92))] shadow-[0_12px_28px_rgba(19,52,72,0.06)]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#12303f]">
                                {notification.title}
                              </p>
                              <p className="mt-1 text-xs leading-6 text-[#647c8a]">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0f7c82]" />
                            )}
                          </div>
                          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a94a3]">
                            {notificationDateFormatter.format(new Date(notification.createdAt))}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="theme-panel rounded-2xl px-4 py-5 text-center">
                        <p className="text-sm font-semibold text-[#12303f]">
                          No notifications yet
                        </p>
                        <p className="mt-1 text-xs leading-6 text-[#647c8a]">
                          Settings updates and entry activity will show up here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <form
        className="theme-input flex w-full items-center rounded-2xl px-4 py-3 sm:hidden"
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          type="text"
          value={dashboardSearchQuery}
          onChange={(event) => setDashboardSearchQuery(event.target.value)}
          placeholder={isHome ? "Search entries..." : "Search..."}
          className="w-full bg-transparent text-sm text-[#355465] outline-none placeholder:text-[#7790a0]"
          aria-label="Search dashboard entries"
        />
        <button
          type="submit"
          className="rounded-full p-1 text-[#1f5f7a] transition hover:bg-white/70"
          aria-label="Search"
        >
          <Search size={18} />
        </button>
      </form>
    </header>
  );
};

export default Navbar;
