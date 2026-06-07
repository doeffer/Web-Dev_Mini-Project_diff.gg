export function initTooltips() {
  const tip = document.createElement('div');
  tip.className = 'tooltip-popup';
  document.body.appendChild(tip);

  document.addEventListener('mouseover', e => {
    const target = e.target.closest('[data-tooltip]');
    if (!target) { tip.style.opacity = '0'; return; }
    tip.textContent = target.dataset.tooltip;
    const r = target.getBoundingClientRect();
    tip.style.left = (r.left + r.width / 2) + 'px';
    tip.style.top  = r.top + 'px';
    tip.style.opacity = '1';
  });

  window.addEventListener('scroll', () => { tip.style.opacity = '0'; }, { passive: true });
}
