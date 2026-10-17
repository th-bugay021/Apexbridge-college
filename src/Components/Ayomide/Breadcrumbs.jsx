// import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiHome, FiChevronRight } from "react-icons/fi";
import "../../Styles/Ayomide/Breadcrumbs.css";

const Breadcrumbs = () => {
  const location = useLocation();

  // Helper function to format segment strings into readable labels
  // e.g. "student-management" -> "Student Management"
  const formatLabel = (segment) => {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Split path into clean non-empty segments
  const pathnames = location.pathname.split("/").filter((x) => x);

  // If the current path is strictly '/' or '/dashboard', display Home as the active breadcrumb
  const isHomeOrDashboard =
    pathnames.length === 0 ||
    (pathnames.length === 1 && pathnames[0] === "dashboard");

  return (
    <nav className="breadcrumbs-nav" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        {/* Home Item */}
        <li className="breadcrumbs-item">
          {isHomeOrDashboard ? (
            <span className="breadcrumbs-current" aria-current="page">
              <FiHome className="breadcrumbs-icon" />
              <span>Home</span>
            </span>
          ) : (
            <Link to="/dashboard" className="breadcrumbs-link">
              <FiHome className="breadcrumbs-icon" />
              <span>Home</span>
            </Link>
          )}
        </li>

        {/* Dynamic URL Segment Items */}
        {!isHomeOrDashboard &&
          pathnames.map((value, index) => {
            // Reconstruct the nested route URL path
            const to = `/${pathnames.slice(0, index + 1).join("/")}`;
            const isLast = index === pathnames.length - 1;
            const label = formatLabel(value);

            // Skip rendering "Dashboard" again if path is e.g. /dashboard/something
            if (value.toLowerCase() === "dashboard" && index === 0) {
              return null;
            }

            return (
              <li key={to} className="breadcrumbs-item">
                <FiChevronRight className="breadcrumbs-separator" />
                {isLast ? (
                  <span className="breadcrumbs-current" aria-current="page">
                    {label}
                  </span>
                ) : (
                  <Link to={to} className="breadcrumbs-link">
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
