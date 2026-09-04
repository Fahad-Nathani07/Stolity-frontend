import React, { useState } from 'react';

const ToggleNav = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isOffcanvas, setIsOffcanvas] = useState(false);

  const toggleMinimize = () => {
    if (isMinimized) {
      document.body.classList.remove('sidebar-icon-only');
    } else {
      document.body.classList.add('sidebar-icon-only');
    }
    setIsMinimized(!isMinimized);
  };

  const toggleOffcanvas = () => {
    const sidebar = document.querySelector('.sidebar.sidebar-offcanvas.open');
    if (sidebar) {
      if (isOffcanvas) {
        sidebar.classList.remove('active');
      } else {
        sidebar.classList.add('active');
      }
      setIsOffcanvas(!isOffcanvas);
    }
  };

  return (
    <>
      <button className="navbar-toggler navbar-toggler align-self-center" type="button" data-toggle="minimize" onClick={toggleMinimize} style={{ display: 'none' }}>
        <span className="icon-arrow-dropdown" />
      </button>
      <button className="navbar-toggler navbar-toggler-right d-lg-none align-self-center" type="button" data-toggle="offcanvas" onClick={toggleOffcanvas} style={{}}>
        <span className="icon-arrow-dropdown" />
      </button>
    </>
  );
};

export default ToggleNav;