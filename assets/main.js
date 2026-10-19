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
