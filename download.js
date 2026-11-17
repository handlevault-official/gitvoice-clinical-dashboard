/**
 * download.js - Crisp Suite Universal Download Utility
 */
const DownloadUtils = {
  text(filename, text, mimeType = 'text/plain') {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    this._trigger(url, filename);
  },

  json(filename, data) {
    this.text(filename, JSON.stringify(data, null, 2), 'application/json');
  },

  image(filename, dataUrlOrBlob) {
    if (typeof dataUrlOrBlob === 'string') {
      this._trigger(dataUrlOrBlob, filename);
    } else {
      const url = URL.createObjectURL(dataUrlOrBlob);
      this._trigger(url, filename);
    }
  },

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
