export class Hub {
  constructor(screens) {
    this.screens = screens;
  }

  show(name) {
    for (const [key, el] of Object.entries(this.screens)) {
      if (!el) continue;
      if (key === name) {
        el.classList.remove('hidden');
        el.classList.add('active');
      } else {
        el.classList.remove('active');
        el.classList.add('hidden');
      }
    }
  }
}
