import React from "react";
import NavbarComponent from "@/Components/Navbar/index.jsx";

function UserLayout({ children }) {
  return (
    <div>
      <NavbarComponent />
      {children}
    </div>
  );
}

export default UserLayout;
