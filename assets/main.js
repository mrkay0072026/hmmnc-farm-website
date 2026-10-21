'use strict';

const WECHAT = 'cjm13014583578';
const header = document.getElementById('siteHeader');
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const overlay = document.getElementById('wechatOverlay');
const copyMessage = document.getElementById('copyMessage');
const toast = document.getElementById('toast');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;
let lastFocused;

function setHeaderState() {
  const menuOpen = menuToggle?.getAttribute('aria-expanded') === 'true';
  header.classList.toggle('is-transparent', window.scrollY < 42 && !menuOpen);
}
setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', '打开导航');
  mobileMenu.hidden = true;
  setHeaderState();
}

menuToggle.addEventListener('click', () => {
  const opening = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(opening));
  menuToggle.setAttribute('aria-label', opening ? '关闭导航' : '打开导航');
  mobileMenu.hidden = !opening;
  setHeaderState();
});
mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (window.innerWidth > 960) closeMenu(); }, { passive: true });

function showToast(message) {
  clearTimeout(toastTimer);
  const label = toast.querySelector('span');
  if (label) label.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
}

function legacyCopy(value) {
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;left:-10000px;top:0;opacity:0;';
  document.body.appendChild(field);
  field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
  field.remove();
  return copied;
}

async function copyWechat() {
  let success = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(WECHAT);
      success = true;
    } else {
      success = legacyCopy(WECHAT);
    }
  } catch (_) {
    success = legacyCopy(WECHAT);
  }
  copyMessage.textContent = success
    ? '微信号已复制，打开微信添加朋友即可。'
    : '浏览器未能自动复制，请长按微信号手动复制。';
  showToast(success ? '微信号已复制' : '请长按复制微信号');
  return success;
}

function openOverlay() {
  lastFocused = document.activeElement;
  overlay.hidden = false;
  document.body.classList.add('modal-open');
  document.getElementById('closeOverlay').focus();
}

function closeOverlay() {
  overlay.hidden = true;
  document.body.classList.remove('modal-open');
  lastFocused?.focus?.();
}

document.querySelectorAll('.js-copy-wechat').forEach((button) => button.addEventListener('click', () => {
  copyMessage.textContent = '正在复制微信号…';
  openOverlay();
  void copyWechat();
}));
document.getElementById('copyAgain').addEventListener('click', () => { void copyWechat(); });
document.getElementById('wechatId').addEventListener('click', () => { void copyWechat(); });
document.getElementById('closeOverlay').addEventListener('click', closeOverlay);
document.getElementById('dismissOverlay').addEventListener('click', closeOverlay);
overlay.addEventListener('click', (event) => { if (event.target === overlay) closeOverlay(); });

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !overlay.hidden) { closeOverlay(); return; }
  if (event.key === 'Escape' && !mobileMenu.hidden) { closeMenu(); return; }
  if (event.key === 'Tab' && !overlay.hidden) {
    const items = [...overlay.querySelectorAll('button:not([disabled])')];
    if (event.shiftKey && document.activeElement === items[0]) {
      event.preventDefault();
      items.at(-1).focus();
    } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
      event.preventDefault();
      items[0].focus();
    }
  }
});

const priceTabs = [...document.querySelectorAll('[data-price-tab]')];
const pricePanels = [...document.querySelectorAll('[data-price-panel]')];
function activatePriceTab(tab) {
  const key = tab.dataset.priceTab;
  priceTabs.forEach((button) => {
    const active = button === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  pricePanels.forEach((panel) => {
    const active = panel.dataset.pricePanel === key;
    panel.hidden = !active;
  });
}
priceTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activatePriceTab(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = priceTabs[(index + direction + priceTabs.length) % priceTabs.length];
    activatePriceTab(next);
    next.focus();
  });
});

function setupCarousel(track) {
  const id = track.dataset.carousel;
  const previous = document.querySelector(`[data-carousel-prev="${id}"]`);
  const next = document.querySelector(`[data-carousel-next="${id}"]`);
  const current = id === 'dining' ? document.getElementById('diningCurrent') : null;
  const getStep = () => {
    const first = track.firstElementChild;
    if (!first) return track.clientWidth * .8;
    return first.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).gap) || 0);
  };
  const updateControls = () => {
    const max = track.scrollWidth - track.clientWidth;
    if (previous) previous.disabled = track.scrollLeft <= 3;
    if (next) next.disabled = track.scrollLeft >= max - 3;
    if (current) {
      const index = Math.min(track.children.length - 1, Math.max(0, Math.round(track.scrollLeft / getStep())));
      current.textContent = String(index + 1).padStart(2, '0');
    }
  };
  previous?.addEventListener('click', () => track.scrollBy({ left: -getStep(), behavior: prefersReducedMotion ? 'auto' : 'smooth' }));
  next?.addEventListener('click', () => track.scrollBy({ left: getStep(), behavior: prefersReducedMotion ? 'auto' : 'smooth' }));
  track.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    track.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * getStep(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
  let startX = 0;
  let startScroll = 0;
  let dragging = false;
  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') return;
    dragging = true;
    startX = event.clientX;
    startScroll = track.scrollLeft;
    track.classList.add('is-dragging');
    track.setPointerCapture(event.pointerId);
  });
  track.addEventListener('pointermove', (event) => {
    if (dragging) track.scrollLeft = startScroll - (event.clientX - startX);
  });
  const stopDragging = (event) => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture?.(event.pointerId)) track.releasePointerCapture(event.pointerId);
  };
  track.addEventListener('pointerup', stopDragging);
  track.addEventListener('pointercancel', stopDragging);
  track.addEventListener('scroll', updateControls, { passive: true });
  window.addEventListener('resize', updateControls, { passive: true });
  updateControls();
}
document.querySelectorAll('[data-carousel]').forEach(setupCarousel);

const navLinks = [...document.querySelectorAll('.desktop-nav a,.mobile-menu a')];
const trackedSections = [...new Set(navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean))];
if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${visible.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, .2, .5] });
  trackedSections.forEach((section) => navObserver.observe(section));
}

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .08, rootMargin: '0px 0px -28px 0px' });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}
