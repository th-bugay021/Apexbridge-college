// import React from "react";
import navigationConfig from "./navigationConfig";
import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside>
      {navigationConfig.map((item) => (
        item.path ? (
          <NavLink key={item.label} to={item.path}>
            {item.label}
          </NavLink>
        ) : (
          <div key={item.label}>
            {item.label}

            {item.children?.map((child) => (
              <NavLink key={child.label} to={child.path}>
                {child.label}
              </NavLink>
            ))}
          </div>
        )
      ))}
    </aside>
  );
}

export default Sidebar;