import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiUser,
  FiSettings,
  FiLogOut,
  FiChevronDown,
} from "react-icons/fi";
import { useAuth } from "../../Context/AuthContext";
import "../../Styles/Ayomide/topbar.css";

function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();


  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Helper to extract initials from the user's name
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    navigate("/login");
  };

  const handleNavigate = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  return (
    <header className="topbar">
      {/* Left section: Optional placeholder for dynamic header titles or search */}
      <div className="topbar-left">
        <span className="topbar-welcome">
          Welcome back,{" "}
          <strong className="topbar-user-name">{user?.name || "User"}</strong>
        </span>
      </div>

      {/* Right section: Action items & Profile */}
      <div className="topbar-right">
        {/* Notification Button */}
        <button
          type="button"
          className="topbar-action-btn"
          aria-label="View notifications"
          title="Notifications"
        >
          <FiBell className="topbar-icon" />
          <span className="topbar-notification-badge" aria-hidden="true" />
        </button>

        <div className="topbar-divider" />

        {/* User Profile Dropdown */}
        <div className="topbar-profile-container" ref={dropdownRef}>
          <button
            type="button"
            className={`topbar-profile-btn ${isDropdownOpen ? "active" : ""}`}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <div className="topbar-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || "User Avatar"} />
              ) : (
                <span>{getInitials(user?.name)}</span>
              )}
            </div>

            <div className="topbar-user-info">
              <span className="topbar-user-display-name">
                {user?.name || "Guest User"}
              </span>
              <span className="topbar-user-role">{user?.role || "Member"}</span>
            </div>

            <FiChevronDown
              className={`topbar-chevron ${isDropdownOpen ? "open" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="topbar-dropdown-menu" role="menu">
              <div className="topbar-dropdown-header">
                <p className="topbar-dropdown-email">{user?.email}</p>
              </div>

              <div className="topbar-dropdown-divider" />

              <button
                type="button"
                className="topbar-dropdown-item"
                role="menuitem"
                onClick={() => handleNavigate("/profile")}
              >
                <FiUser className="topbar-dropdown-icon" />
                <span>Profile</span>
              </button>

              <button
                type="button"
                className="topbar-dropdown-item"
                role="menuitem"
                onClick={() => handleNavigate("/settings")}
              >
                <FiSettings className="topbar-dropdown-icon" />
                <span>Settings</span>
              </button>

              <div className="topbar-dropdown-divider" />

              <button
                type="button"
                className="topbar-dropdown-item topbar-dropdown-item-danger"
                role="menuitem"
                onClick={handleLogout}
              >
                <FiLogOut className="topbar-dropdown-icon" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
