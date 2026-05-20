function Footer() {
  // Общий footer вынесен отдельно, чтобы dashboard не держал повторяющуюся разметку.
  return (
    <footer className="site-footer">
      <p className="text-helper">© 2026 Сервис опросов. Все права защищены.</p>
      <p className="text-helper">MVP для создания и прохождения онлайн-опросов</p>
    </footer>
  );
}

export default Footer;
