import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Breadcrumbs from "./Breadcrumbs";
import "../../Styles/Ayomide/appLayout.css"; // Create this file for layout styles
import { useTheme } from "../../Context/useTheme";
import PageErrorBoundary from "./PageErrorBoundary";

function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, refreshTheme } = useTheme();

  React.useEffect(() => {
    refreshTheme();
  }, [refreshTheme]);

  return (
    <div className={`app-layout ${isCollapsed ? "layout--collapsed" : ""}`} data-theme={theme}>
      {/* Pass the collapse state handler down to the sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="app-main">
        <Topbar />

        <main className="app-content">
          <Breadcrumbs />
          <PageErrorBoundary><Outlet /></PageErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
