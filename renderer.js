
window.addEventListener('DOMContentLoaded', () => {
  const setVersion = (id, version) => {
    const element = document.getElementById(id);
    if (element) {
      element.innerText = version;
    }
  };

  if (typeof window.electronVersions !== 'undefined') {
    setVersion('node-version', window.electronVersions.node);
    setVersion('chrome-version', window.electronVersions.chrome);
    setVersion('electron-version', window.electronVersions.electron);
  } else if (typeof process !== 'undefined' && typeof process.versions !== 'undefined') {
    console.warn("Renderer.js: Accessing process.versions directly. Consider using contextBridge in preload.js for better security.");
    setVersion('node-version', process.versions.node);
    setVersion('chrome-version', process.versions.chrome);
    setVersion('electron-version', process.versions.electron);
  } else {
    console.warn('Renderer.js: Version information not found. Ensure preload.js exposes it via contextBridge.');
  }

  // Check for error parameters in URL and display message
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  const targetUrl = params.get('targetUrl');
  const errorMessage = params.get('message');

  const errorContainer = document.getElementById('error-message-container');
  const normalInfoContainer = document.getElementById('normal-info-container');

  if (error && errorContainer && normalInfoContainer) {
    normalInfoContainer.style.display = 'none'; // Hide normal info if error is shown
    let displayError = error;
    if (error === 'ERR_CONNECTION_REFUSED') {
        displayError = 'ERR_CONNECTION_REFUSED (Connessione Rifiutata)';
    }

    errorContainer.innerHTML = `
      <div class="error-box">
        <h2>Errore di Caricamento Applicazione</h2>
        <p>Impossibile caricare l'applicazione principale da: <strong><a href="${targetUrl}" target="_blank">${targetUrl}</a></strong></p>
        <p>Dettaglio Errore: <strong>${displayError}</strong></p>
        ${errorMessage ? `<p>Messaggio: ${errorMessage}</p>` : ''}
        <p><strong>Possibili cause e soluzioni:</strong></p>
        <ul>
          <li>L'applicazione Next.js ("Analisi S.W.A.T.") potrebbe non essere in esecuzione. Avviala con <code>npm run dev</code> (o il comando appropriato per il tuo progetto Next.js) in un terminale separato.</li>
          <li>Verifica che l'applicazione Next.js sia accessibile all'URL <strong>${targetUrl}</strong> nel tuo browser.</li>
          <li>L'URL o la porta (${targetUrl}) configurati in <code>main.js</code> potrebbero essere errati.</li>
          <li>Un firewall sul tuo computer o sulla rete potrebbe bloccare la connessione a <code>localhost</code> sulla porta specificata.</li>
        </ul>
        <p>Stai visualizzando la pagina di fallback <code>index.html</code>. Per favore, risolvi il problema di connessione e riavvia questa applicazione Electron.</p>
      </div>
    `;
  } else if (normalInfoContainer) {
      // Ensure normal info is visible if no error
      normalInfoContainer.style.display = 'block';
  }
});
