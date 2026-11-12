import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";

const Layout = ({ children, showSidebar = false }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col min-w-0">
          <Navbar showSidebar={showSidebar} />

          <main className={`flex-1 overflow-y-auto ${showSidebar ? "pb-16 lg:pb-0" : ""}`}>
            {children}
          </main>
        </div>
      </div>

      {showSidebar && <MobileBottomNav />}
    </div>
  );
};

export default Layout;
