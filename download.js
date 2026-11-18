/**
 * download.js - Crisp Suite Universal Download Utility
 * Pwedeng gamitin sa Pixel Studio, Moonlit Beads, at iba pang Studio Apps.
 */
const DownloadUtils = {
  // Para sa text o JSON files (proojects, saves, configs)
  text(filename, text, mimeType = 'text/plain') {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    this._trigger(url, filename);
  },

  // Para diretso sa JSON object export
  json(filename, data) {
    this.text(filename, JSON.stringify(data, null, 2), 'application/json');
  },

  // Para sa mga images, canvas exports, o binary files (PNG, WebM, etc.)
  image(filename, dataUrlOrBlob) {
    if (typeof dataUrlOrBlob === 'string') {
      this._trigger(dataUrlOrBlob, filename);
    } else {
      const url = URL.createObjectURL(dataUrlOrBlob);
      this._trigger(url, filename);
    }
  },

  // Internal helper para i-trigger ang automatic download click
  _trigger(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};
