import { Link, useLocation } from "react-router";
import { BellIcon, HomeIcon, UsersIcon } from "lucide-react";

const MobileBottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="btm-nav btm-nav-sm lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-200 border-t border-base-300 shadow-lg">
      <Link
        to="/"
        className={`flex flex-col items-center justify-center gap-0.5 ${
          currentPath === "/" ? "active text-primary font-semibold" : "text-base-content/70"
        }`}
      >
        <HomeIcon className="size-5" />
        <span className="btm-nav-label text-[11px]">Home</span>
      </Link>

      <Link
        to="/friends"
        className={`flex flex-col items-center justify-center gap-0.5 ${
          currentPath === "/friends" ? "active text-primary font-semibold" : "text-base-content/70"
        }`}
      >
        <UsersIcon className="size-5" />
        <span className="btm-nav-label text-[11px]">Friends</span>
      </Link>

      <Link
        to="/notifications"
        className={`flex flex-col items-center justify-center gap-0.5 ${
          currentPath === "/notifications" ? "active text-primary font-semibold" : "text-base-content/70"
        }`}
      >
        <BellIcon className="size-5" />
        <span className="btm-nav-label text-[11px]">Alerts</span>
      </Link>
    </div>
  );
};

export default MobileBottomNav;

