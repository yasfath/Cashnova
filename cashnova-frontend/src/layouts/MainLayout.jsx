import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="theme-shell flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="main-region min-w-0 flex-1">
        <Navbar setMobileOpen={setMobileOpen} />
        <main className="relative px-3 pb-4 pt-3 sm:px-4 lg:px-4 lg:pb-4 xl:px-5 2xl:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
