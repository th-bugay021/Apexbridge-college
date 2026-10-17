/* eslint-disable no-unused-vars */
// import React from "react";
import navigationConfig from "./navigationConfig";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

import React, { useState, useEffect } from "react";
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
import "../../Styles/Ayomide/Sidebar.css";

const Sidebar = () => {
  const { hasPermission, user, logout } = useAuth();
  const location = useLocation();

  // Desktop Collapsed state
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Mobile Drawer Open state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Track expanded groups by item label or path
  const [expandedGroups, setExpandedGroups] = useState({});

  // Filter items based on user permissions
  const filterNavItems = (items) => {
    if (!items) return [];

    return items
      .map((item) => {
        // If item has children, filter children first
        if (item.children && item.children.length > 0) {
          const allowedChildren = filterNavItems(item.children);
          if (allowedChildren.length === 0) return null; // Hide parent if no visible children
          return { ...item, children: allowedChildren };
        }

        // Single item check
        if (item.permission && typeof hasPermission === "function") {
          return hasPermission(item.permission) ? item : null;
        }

        return item; // No permission specified, accessible by default
      })
      .filter(Boolean);
  };

  const navItems = filterNavItems(navigationConfig);

  // Automatically expand group if active route matches any child path
  useEffect(() => {
    const currentPath = location.pathname;
    const newExpanded = { ...expandedGroups };

    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) => child.path && currentPath.startsWith(child.path),
        );
        if (isChildActive) {
          newExpanded[item.label] = true;
        }
      }
    });

    setExpandedGroups(newExpanded);
  }, [location.pathname]);

  // Toggle dropdown group state
  const toggleGroup = (label) => {
    if (isCollapsed) {
      // Un-collapse sidebar when expanding a group for better UX
      setIsCollapsed(false);
    }
    setExpandedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
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
        >
          {isMobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <img
          src="/logo/apexbridge-icon.png"
          alt="Apexbridge College"
          className="mobile-logo"
        />
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
            <img
              src={
                isCollapsed
                  ? "/logo/apexbridge-icon.png"
                  : "/logo/apexbridge-primary-logo.png"
              }
              alt="Apexbridge College"
              className={`brand-logo ${isCollapsed ? "brand-logo--icon" : "brand-logo--full"}`}
            />
          </NavLink>

          {/* Desktop Collapse Toggle */}
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
              const isGroupExpanded = !!expandedGroups[item.label];

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

                    {/* SubFimenu Children */}
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
