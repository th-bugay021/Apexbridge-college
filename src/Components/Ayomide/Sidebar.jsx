/* eslint-disable no-unused-vars */
import navigationConfig, { SHOW_SETTINGS } from "./navigationConfig";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { useTheme } from "../../Context/useTheme";

import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FiChevronDown,
  FiChevronRight,
  FiMenu,
  FiX,
  FiSidebar,
  FiChevronsLeft,
  FiChevronsRight
} from "react-icons/fi";
import "../../Styles/Ayomide/sidebar.css";

function groupForPath(pathname) {
  return navigationConfig.find((item) => item.children?.some((child) => (
    child.path && (pathname === child.path || pathname.startsWith(`${child.path}/`))
  )))?.label ?? null;
}

function AppLogo({ icon = false, className = "" }) {
  const { theme } = useTheme();
  const src = icon
    ? theme === "dark" ? "/logo/apexbridge-icon-dark.png" : "/logo/apexbridge-icon.png"
    : theme === "dark" ? "/logo/apexbridge-primary-logo-dark.png" : "/logo/apexbridge-primary-logo.png";
  return <img src={src} alt="Apexbridge College" className={className} />;
}

// 1. Accept isCollapsed and setIsCollapsed as props from AppLayout
const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { hasPermission, user, logout } = useAuth();
  const location = useLocation();

  // Mobile Drawer Open state (kept local since it's only for mobile screens)
  const [drawerState, setDrawerState] = useState({ key: location.key, open: false });
  const isMobileOpen = drawerState.key === location.key && drawerState.open;
  const setIsMobileOpen = useCallback((open) => setDrawerState({ key: location.key, open }), [location.key]);

  useEffect(() => {
    if (!isMobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileOpen, setIsMobileOpen]);

  // The open group and its route key let manual clicks override route defaults until navigation.
  const [groupState, setGroupState] = useState(() => ({
    pathname: location.pathname,
    openGroup: groupForPath(location.pathname),
  }));

  const openGroup = groupState.pathname === location.pathname
    ? groupState.openGroup
    : groupForPath(location.pathname);

  // Filter items based on user permissions
  const filterNavItems = (items) => {
    if (!items) return [];

    return items
      .map((item) => {
        if (item.children && item.children.length > 0) {
          const allowedChildren = filterNavItems(item.children);
          if (allowedChildren.length === 0) return null;
          return { ...item, children: allowedChildren };
        }

        if (item.path === "/settings" && !SHOW_SETTINGS) return null;

        if (item.roles && !item.roles.includes(user?.role)) return null;
        if (item.excludeRoles?.includes(user?.role)) return null;

        if (item.permission && typeof hasPermission === "function") {
          return hasPermission(item.permission) ? item : null;
        }

        return item;
      })
      .filter(Boolean);
  };

  const navItems = filterNavItems(navigationConfig);

  // Toggle dropdown group state
  const toggleGroup = (label) => {
    if (isCollapsed) {
      // Un-collapse sidebar when expanding a group for better UX
      setIsCollapsed(false);
    }
    setGroupState({
      pathname: location.pathname,
      openGroup: openGroup === label ? null : label,
    });
  };

  // Close mobile sidebar on navigation
  const handleNavLinkClick = () => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Top Bar / Hamburger Button */}
      <div className="mobile-header">
        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label={
            isMobileOpen
              ? "Close navigation sidebar"
              : "Open navigation sidebar"
          }
          aria-expanded={isMobileOpen}
          aria-controls="primary-navigation-drawer"
        >
          {isMobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <AppLogo icon className="mobile-logo" />
      </div>

      {/* Backdrop for Mobile Drawer */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="primary-navigation-drawer"
        className={`sidebar ${isCollapsed ? "sidebar--collapsed" : ""} ${
          isMobileOpen ? "sidebar--mobile-open" : ""
        }`}
        aria-label="Main Navigation"
      >
        {/* Header / Brand Logo */}
        <div className="sidebar-brand">
          <NavLink
            to="/dashboard"
            onClick={handleNavLinkClick}
            className="brand-link"
          >
            <AppLogo
              icon={isCollapsed}
              className={`brand-logo ${isCollapsed ? "brand-logo--icon" : "brand-logo--full"}`}
            />
          </NavLink>

          {/* Desktop Collapse Toggle - Updates parent state */}
          <button
            type="button"
            className="collapse-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <FiChevronsRight size={18} />
            ) : (
              <FiChevronsLeft size={18} />
            )}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isGroupExpanded = openGroup === item.label;

              if (hasChildren) {
                const isAnyChildActive = item.children.some(
                  (child) =>
                    child.path && location.pathname.startsWith(child.path),
                );

                return (
                  <li key={item.label} className="nav-group-item">
                    <button
                      type="button"
                      className={`nav-group-btn ${isAnyChildActive ? "active-parent" : ""}`}
                      onClick={() => toggleGroup(item.label)}
                      aria-expanded={isGroupExpanded}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className="nav-item-content">
                        {item.icon && (
                          <span className="nav-icon"><item.icon /></span>
                        )}
                        <span className="nav-label">{item.label}</span>
                      </span>
                      <span className="chevron-icon">
                        {isGroupExpanded ? (
                          <FiChevronDown size={16} />
                        ) : (
                          <FiChevronRight size={16} />
                        )}
                      </span>
                    </button>

                    {/* Submenu Children */}
                    {isGroupExpanded && (
                      <ul className="nav-submenu">
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              onClick={handleNavLinkClick}
                              className={({ isActive }) =>
                                `nav-link sub-link ${isActive ? "active" : ""}`
                              }
                            >
                              {child.icon && (
                                <span className="nav-icon"><child.icon /></span>
                              )}
                              <span className="nav-label">{child.label}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              // Standard Top-Level Navigation Item
              return (
                <li key={item.path || item.label}>
                  <NavLink
                    to={item.path}
                    onClick={handleNavLinkClick}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    {item.icon && <span className="nav-icon"><item.icon/></span>}
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User / Profile Footer Section */}
        {user && (
          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="user-avatar" aria-hidden="true">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name || "User"}</span>
                <span className="user-role">
                  {user.role || "Administrator"}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
