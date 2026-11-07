let tabs = [];
let activeTabId = null;

const tabBar = document.getElementById('tab-bar');
const contentArea = document.getElementById('content-area');
const urlBar = document.getElementById('url-bar');
const newTabBtn = document.getElementById('new-tab-btn');

function createTab(initialUrl = 'https://html5test.opensuse.org/') {
  const tabId = 'tab-' + Date.now();
  
  // Luodaan välilehtinappi
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.dataset.id = tabId;
  tabElement.innerHTML = `
    <span class="tab-title">Uusi välilehti</span>
    <span class="close-tab">&times;</span>
  `;

  // Luodaan iframe-näkymä
  const iframe = document.createElement('iframe');
  iframe.className = 'view-pane';
  iframe.dataset.id = tabId;
  iframe.src = initialUrl;

  contentArea.appendChild(iframe);
  tabBar.insertBefore(tabElement, newTabBtn);

  const tabData = { id: tabId, tabElement, iframe, url: initialUrl };
  tabs.push(tabData);

  // Tapahtumat
  tabElement.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-tab')) {
      closeTab(tabId);
    } else {
      switchTab(tabId);
    }
  });

  switchTab(tabId);
}

function switchTab(tabId) {
  tabs.forEach(tab => {
    if (tab.id === tabId) {
      tab.tabElement.classList.add('active');
      tab.iframe.classList.add('active');
      activeTabId = tabId;
      urlBar.value = tab.url;
    } else {
      tab.tabElement.classList.remove('active');
      tab.iframe.classList.remove('active');
    }
  });
}

function closeTab(tabId) {
  if (tabs.length === 1) return; // Älä sulje viimeistä välilehteä

  const index = tabs.findIndex(t => t.id === tabId);
  if (index !== -1) {
    tabs[index].tabElement.remove();
    tabs[index].iframe.remove();
    tabs.splice(index, 1);

    if (activeTabId === tabId) {
      const nextTab = tabs[Math.max(0, index - 1)];
      switchTab(nextTab.id);
    }
  }
}

function navigate() {
  if (!activeTabId) return;
  let input = urlBar.value.trim();
  let finalUrl = input;

  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    if (input.includes('.') && !input.includes(' ')) {
      finalUrl = 'https://' + input;
    } else {
      // Hakukoneupotus (DuckDuckGo HTML-versio iframe-yhteensopivuudelle)
      finalUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(input);
    }
  }

  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab) {
    currentTab.url = finalUrl;
    currentTab.iframe.src = finalUrl;
    currentTab.tabElement.querySelector('.tab-title').textContent = input.substring(0, 15);
  }
}

// Navigointipainikkeet
document.getElementById('go-btn').addEventListener('click', navigate);
urlBar.addEventListener('keypress', (e) => { if (e.key === 'Enter') navigate(); });
newTabBtn.addEventListener('click', () => createTab());
document.getElementById('home-btn').addEventListener('click', () => {
  urlBar.value = 'https://wikipedia.org';
  navigate();
});

// Avaa ensimmäinen välilehti käynnistyksessä
createTab('https://wikipedia.org');