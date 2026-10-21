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

function setHeaderState(){
  const pastHero = window.scrollY > 45;
  header.classList.toggle('scrolled', pastHero);
  header.classList.toggle('is-transparent', !pastHero && window.scrollY < 50 && !menuToggle?.getAttribute('aria-expanded')?.includes('true'));
}
setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive:true });

function closeMenu(){
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label','打开导航');
  mobileMenu.hidden=true;
  setHeaderState();
}
menuToggle.addEventListener('click',()=>{
  const opening=menuToggle.getAttribute('aria-expanded')!=='true';
  menuToggle.setAttribute('aria-expanded',String(opening));
  menuToggle.setAttribute('aria-label',opening?'关闭导航':'打开导航');
  mobileMenu.hidden=!opening;
  setHeaderState();
  if(opening)requestAnimationFrame(()=>mobileMenu.querySelector('a')?.focus());
});
mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
window.addEventListener('resize',()=>{if(window.innerWidth>960)closeMenu();},{passive:true});

function showToast(message){
  clearTimeout(toastTimer);
  toast.textContent=message;
  toast.hidden=false;
  toastTimer=setTimeout(()=>{toast.hidden=true},3200);
}
function legacyCopy(value){
  const field=document.createElement('textarea');
  field.value=value;
  field.setAttribute('readonly','');
  field.style.cssText='position:fixed;left:-10000px;top:0;opacity:0;';
  document.body.appendChild(field);
  field.focus();
  field.select();
  let copied=false;
  try{copied=document.execCommand('copy');}catch(_){copied=false;}
  field.remove();
  return copied;
}
async function copyWechat(){
  let success=false;
  // Clipboard API is supported on HTTPS. Fall back to legacyCopy for older embedded browsers.
  try{
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(WECHAT);
      success=true;
    }else{
      success=legacyCopy(WECHAT);
    }
  }catch(_){success=legacyCopy(WECHAT);}
  copyMessage.textContent=success?'微信号已复制！现在打开微信，添加朋友并粘贴即可。':'浏览器未能自动复制，请长按下方微信号手动复制。';
  document.getElementById('wechatId').textContent=WECHAT;
  if(success)showToast('微信号已复制：'+WECHAT);
  else showToast('请长按复制微信号：'+WECHAT);
  return success;
}
function openOverlay(){
  lastFocused=document.activeElement;
  overlay.hidden=false;
  document.body.classList.add('modal-open');
  document.getElementById('closeOverlay').focus();
}
function closeOverlay(){
  overlay.hidden=true;
  document.body.classList.remove('modal-open');
  lastFocused?.focus?.();
}
// The click first initiates clipboard access; only then displays the booking instructions.
document.querySelectorAll('.js-copy-wechat').forEach(button=>button.addEventListener('click',()=>{
  copyMessage.textContent='正在尝试复制微信号，请稍候……';
  const promise=copyWechat();
  openOverlay();
  void promise;
}));
document.getElementById('copyAgain').addEventListener('click',()=>{void copyWechat();});
document.getElementById('closeOverlay').addEventListener('click',closeOverlay);
document.getElementById('dismissOverlay').addEventListener('click',closeOverlay);
overlay.addEventListener('click',event=>{if(event.target===overlay)closeOverlay();});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!overlay.hidden){closeOverlay();return;}
  if(event.key==='Escape'&&!mobileMenu.hidden){closeMenu();return;}
  if(event.key==='Tab'&&!overlay.hidden){
    const items=[...overlay.querySelectorAll('button:not([disabled])')];
    if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items[items.length-1].focus();}
    else if(!event.shiftKey&&document.activeElement===items[items.length-1]){event.preventDefault();items[0].focus();}
  }
});

document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.filter;
  document.querySelectorAll('.filter').forEach(b=>{
    const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  });
  document.querySelectorAll('.price-group').forEach(group=>group.classList.toggle('is-hidden',key!=='all'&&group.dataset.group!==key));
}));

const priceTabs=[...document.querySelectorAll('[data-price-tab]')];
const pricePanels=[...document.querySelectorAll('[data-price-panel]')];
function activatePriceTab(tab){
  const key=tab.dataset.priceTab;
  priceTabs.forEach(button=>{
    const active=button===tab;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
    button.tabIndex=active?0:-1;
  });
  pricePanels.forEach(panel=>{
    const active=panel.dataset.pricePanel===key;
    panel.classList.toggle('active',active);
    panel.hidden=!active;
  });
}
priceTabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>activatePriceTab(tab));
  tab.addEventListener('keydown',event=>{
    if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
    event.preventDefault();
    const direction=event.key==='ArrowRight'?1:-1;
    const next=priceTabs[(index+direction+priceTabs.length)%priceTabs.length];
    activatePriceTab(next);
    next.focus();
  });
});

function setupCarousel(track){
  const id=track.dataset.carousel;
  const previous=document.querySelector(`[data-carousel-prev="${id}"]`);
  const next=document.querySelector(`[data-carousel-next="${id}"]`);
  const getStep=()=>{
    const first=track.firstElementChild;
    if(!first)return track.clientWidth*.8;
    const gap=parseFloat(getComputedStyle(track).gap)||0;
    return first.getBoundingClientRect().width+gap;
  };
  const updateControls=()=>{
    const max=track.scrollWidth-track.clientWidth;
    if(previous)previous.disabled=track.scrollLeft<=3;
    if(next)next.disabled=track.scrollLeft>=max-3;
  };
  previous?.addEventListener('click',()=>track.scrollBy({left:-getStep(),behavior:prefersReducedMotion?'auto':'smooth'}));
  next?.addEventListener('click',()=>track.scrollBy({left:getStep(),behavior:prefersReducedMotion?'auto':'smooth'}));
  track.addEventListener('keydown',event=>{
    if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
    event.preventDefault();
    track.scrollBy({left:(event.key==='ArrowRight'?1:-1)*getStep(),behavior:prefersReducedMotion?'auto':'smooth'});
  });
  let startX=0;
  let startScroll=0;
  let dragging=false;
  track.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch')return;
    dragging=true;
    startX=event.clientX;
    startScroll=track.scrollLeft;
    track.classList.add('is-dragging');
    track.setPointerCapture(event.pointerId);
  });
  track.addEventListener('pointermove',event=>{
    if(!dragging)return;
    track.scrollLeft=startScroll-(event.clientX-startX);
  });
  const stopDragging=event=>{
    if(!dragging)return;
    dragging=false;
    track.classList.remove('is-dragging');
    if(track.hasPointerCapture?.(event.pointerId))track.releasePointerCapture(event.pointerId);
  };
  track.addEventListener('pointerup',stopDragging);
  track.addEventListener('pointercancel',stopDragging);
  track.addEventListener('scroll',updateControls,{passive:true});
  window.addEventListener('resize',updateControls,{passive:true});
  updateControls();
}
document.querySelectorAll('[data-carousel]').forEach(setupCarousel);

document.querySelectorAll('.faq-list details').forEach(item=>item.addEventListener('toggle',()=>{
  if(!item.open)return;
  document.querySelectorAll('.faq-list details[open]').forEach(other=>{if(other!==item)other.open=false;});
}));

const navLinks=[...document.querySelectorAll('.desktop-nav a,.mobile-menu a')];
const trackedSections=[...new Set(navLinks.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean))];
if('IntersectionObserver' in window){
  const navObserver=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!visible)return;
    navLinks.forEach(link=>{
      const active=link.getAttribute('href')==='#'+visible.target.id;
      if(active)link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  },{rootMargin:'-20% 0px -65% 0px',threshold:[0,.2,.5]});
  trackedSections.forEach(section=>navObserver.observe(section));
}

document.querySelectorAll('.visit-plan-grid,.price-groups,.honor-highlights').forEach(group=>{
  [...group.children].forEach((item,index)=>item.style.setProperty('--reveal-delay',`${Math.min(index,3)*90}ms`));
});

if(prefersReducedMotion||!('IntersectionObserver' in window)){
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));
}else{
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
    });
  },{threshold:.09,rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
}
