// eslint-disable-next-line no-unused-vars
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Breadcrumbs from "./Breadcrumbs";
import "../../Styles/Ayomide/appLayout.css"; // Create this file for layout styles

function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`app-layout ${isCollapsed ? "layout--collapsed" : ""}`}>
      {/* Pass the collapse state handler down to the sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="app-main">
        <Topbar />

        <main className="app-content">
          <Breadcrumbs />
          <Outlet /> {/* Your individual pages render here safely */}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
