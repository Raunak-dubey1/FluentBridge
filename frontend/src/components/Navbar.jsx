import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";

const Navbar = ({ showSidebar = false }) => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");
  const { logoutMutation } = useLogout();

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full">
          {/* LOGO - VISIBLE ON MOBILE, OR ON CHAT PAGE / WHEN NO SIDEBAR */}
          <div className={`items-center ${isChatPage || !showSidebar ? "flex" : "flex lg:hidden"}`}>
            <Link to="/" className="flex items-center gap-2">
              <ShipWheelIcon className="size-7 sm:size-8 text-primary" />
              <span className="text-xl sm:text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                FluentBridge
              </span>
            </Link>
          </div>

          {/* RIGHT SIDE CONTROLS */}
          <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
            <Link to="/notifications" className="hidden sm:inline-flex">
              <button className="btn btn-ghost btn-circle btn-sm sm:btn-md" aria-label="Notifications">
                <BellIcon className="size-5 sm:size-6 text-base-content opacity-70" />
              </button>
            </Link>

            <ThemeSelector />

            <div className="avatar">
              <div className="w-8 sm:w-9 rounded-full ring-1 ring-base-300">
                <img
                  src={authUser?.profilePic}
                  alt={authUser?.fullName || "User Avatar"}
                  className="rounded-full object-cover"
                  rel="noreferrer"
                />
              </div>
            </div>

            {/* Logout button */}
            <button
              className="btn btn-ghost btn-circle btn-sm sm:btn-md"
              onClick={logoutMutation}
              aria-label="Logout"
            >
              <LogOutIcon className="size-5 sm:size-6 text-base-content opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
