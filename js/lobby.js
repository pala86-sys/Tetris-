import { getWsUrl } from './net.js';

export class LobbyUI {
  constructor(root) {
    this.root = root;
    this.roomPanel = document.getElementById('lobby-room');
    this.createPanel = document.getElementById('lobby-create');
    this.joinPanel = document.getElementById('lobby-join');
    this.roomCodeEl = document.getElementById('room-code');
    this.statusEl = document.getElementById('lobby-status');
    this.errorEl = document.getElementById('lobby-error');
    this.serverInput = document.getElementById('server-url');
  }

  show() {
    this.root.classList.remove('hidden');
    this.root.classList.add('active');
  }

  hide() {
    this.root.classList.remove('active');
    this.root.classList.add('hidden');
  }

  showCreate() {
    this.createPanel.classList.remove('hidden');
    this.joinPanel.classList.add('hidden');
    this.roomPanel.classList.add('hidden');
    this.clearError();
  }

  showJoin() {
    this.joinPanel.classList.remove('hidden');
    this.createPanel.classList.add('hidden');
    this.roomPanel.classList.add('hidden');
    this.clearError();
  }

  showRoom(code, role) {
    this.roomPanel.classList.remove('hidden');
    this.createPanel.classList.add('hidden');
    this.joinPanel.classList.add('hidden');
    this.roomCodeEl.textContent = code;
    this.roomCodeEl.dataset.role = role;
  }

  getServerUrl() {
    return getWsUrl(this.serverInput?.value);
  }

  getJoinCode() {
    return document.getElementById('join-code')?.value?.trim().toUpperCase() || '';
  }

  setStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  setError(text) {
    if (this.errorEl) {
      this.errorEl.textContent = text || '';
      this.errorEl.classList.toggle('hidden', !text);
    }
  }

  clearError() {
    this.setError('');
  }

  reset() {
    this.showCreate();
    this.setStatus('');
    this.clearError();
    const joinInput = document.getElementById('join-code');
    if (joinInput) joinInput.value = '';
  }
}
