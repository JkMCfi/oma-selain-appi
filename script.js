const urlInput = document.getElementById('url-input');
const goBtn = document.getElementById('go-btn');
const browserView = document.getElementById('browser-view');

function navigate() {
  let url = urlInput.value;
  if (!url.startswith('http://') && !url.startswith('https://')) {
    url = 'https://' + url;
  }
  browserView.src = url;
}

goBtn.addEventListener('click', navigate);
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    navigate();
  }
});