import { useNavigate } from "react-router-dom";

import { IconClipboard, IconDoorOpen } from "../icons";

function Header({ title = "Сервис опросов", onLogout }) {
  const navigate = useNavigate();

  return (
    <header className="site-header">
      <button className="header-logo" type="button" onClick={() => navigate("/dashboard")} aria-label="Открыть dashboard">
        <IconClipboard className="icon-primary" />
      </button>
      <h1 className="text-h1 dashboard-title-label">{title}</h1>
      <button type="button" className="header-button-logout" onClick={onLogout} aria-label="Выйти">
        <IconDoorOpen className="icon-primary" />
      </button>
    </header>
  );
}

export default Header;
