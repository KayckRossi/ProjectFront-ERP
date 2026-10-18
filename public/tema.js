// Aplica o tema salvo antes do React carregar, para a tela não piscar no tema errado.
// Fica em arquivo (e não inline no index.html) por causa da Content-Security-Policy.
(function() {
  try {
    var theme = localStorage.getItem('nexora_theme') || 'dark';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-theme', theme);
  } catch (_) {}
})();
