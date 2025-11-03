
// Hydrate UI
(function(){
  const C = window.DHOFARCARE_CONFIG || {};
  document.querySelectorAll('.phone').forEach(n=>n.textContent=C.WHATSAPP||C.PHONE_E164||'');
  document.querySelectorAll('.email').forEach(n=>n.textContent=C.EMAIL||'');
  document.querySelectorAll('.area').forEach(n=>n.textContent=C.SERVICE_AREA||'');
  document.querySelectorAll('.hours').forEach(n=>n.textContent=C.HOURS||'');
  document.querySelectorAll('.address').forEach(n=>n.textContent=C.ADDRESS||'');
  document.querySelectorAll('.phoneLink').forEach(a=>{ a.href=`https://wa.me/${(C.WHATSAPP||'').replace(/\D/g,'')}`; });
  document.querySelectorAll('.emailLink').forEach(a=>{ a.href=`mailto:${C.EMAIL}`; });
  document.getElementById('year').textContent = new Date().getFullYear();
  document.documentElement.style.setProperty('--primary', C.PRIMARY_COLOR||'#0A66C2');
  document.documentElement.style.setProperty('--accent', C.ACCENT_COLOR||'#4DA3FF');
})();

// DateTime picker: min = next 15-min slot; default = +1h; open native picker; prevent typing
const dt = document.getElementById('datetime');
if (dt){
  const now = new Date();
  const roundTo = 15;
  const ms = 1000*60*roundTo;
  const roundedNow = new Date(Math.ceil(now.getTime()/ms)*ms);
  const defaultVal = new Date(roundedNow.getTime() + 60*60*1000);
  const pad = n => String(n).padStart(2,'0');
  const toLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  dt.min = toLocal(roundedNow);
  dt.value = toLocal(defaultVal);
  dt.addEventListener('focus', ()=>{ if (dt.showPicker) try{ dt.showPicker(); }catch(e){} });
  dt.addEventListener('click', ()=>{ if (dt.showPicker) try{ dt.showPicker(); }catch(e){} });
}

// Elements
const bookingForm = document.getElementById('bookingForm');
const paymentPanel = document.getElementById('paymentPanel');
const paymentForm = document.getElementById('paymentForm');
const successPanel = document.getElementById('successPanel');
const backToBooking = document.getElementById('backToBooking');
const newBooking = document.getElementById('newBooking');
const toast = document.getElementById('toast');

function luhnValid(num){
  const s = num.replace(/\D/g,'');
  let sum = 0, dbl=false;
  for(let i=s.length-1;i>=0;i--){
    let d = parseInt(s[i],10);
    if(dbl){ d*=2; if(d>9) d-=9; }
    sum+=d; dbl=!dbl;
  }
  return (sum % 10)===0 && s.length>=13;
}

// Submit booking => show green toast, then move to payment
bookingForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(bookingForm).entries());
  localStorage.setItem('dhofarcare_booking', JSON.stringify(data));
  toast.classList.remove('hidden');
  toast.textContent = '✔ Booking registered successfully';
  setTimeout(()=>{
    toast.classList.add('hidden');
    bookingForm.classList.add('hidden');
    paymentPanel.classList.remove('hidden');
    window.scrollTo({top: paymentPanel.offsetTop - 60, behavior: 'smooth'});
  }, 1200);
});

backToBooking?.addEventListener('click', ()=>{
  paymentPanel.classList.add('hidden');
  bookingForm.classList.remove('hidden');
});

paymentForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const card = paymentForm.cardnumber.value.trim();
  const exp = paymentForm.exp.value.trim();
  const cvc = paymentForm.cvc.value.trim();
  if(!luhnValid(card)){ alert('Please enter a valid demo card number (e.g., 4242 4242 4242 4242).'); return; }
  if(!/^\d{2}\/(\d{2})$/.test(exp)){ alert('Use MM/YY for expiry.'); return; }
  if(!/^\d{3,4}$/.test(cvc)){ alert('Enter a 3–4 digit CVC.'); return; }

  const booking = JSON.parse(localStorage.getItem('dhofarcare_booking')||'{}');
  localStorage.setItem('dhofarcare_lastSuccess', JSON.stringify({when: Date.now(), booking}));
  paymentPanel.classList.add('hidden');
  successPanel.classList.remove('hidden');
  window.scrollTo({top: successPanel.offsetTop - 60, behavior: 'smooth'});
  bookingForm.reset();
  paymentForm.reset();
});

paymentForm?.cardnumber?.addEventListener('input', (e)=>{
  let v = e.target.value.replace(/\D/g,'').slice(0,16);
  e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
});

// === AI Assistant (rule-based) ===
const aiLog = document.getElementById('aiLog');
const aiInput = document.getElementById('aiInput');
const aiSend = document.getElementById('aiSend');
document.querySelectorAll('.qbtn').forEach(b=>b.addEventListener('click',()=>{
  aiInput.value = b.dataset.q; aiSend.click();
}));

function addMsg(text, who){
  const div = document.createElement('div');
  div.className = 'msg ' + (who||'ai');
  div.innerHTML = text;
  aiLog.appendChild(div);
  aiLog.scrollTop = aiLog.scrollHeight;
}

function reply(text){
  const C = window.DHOFARCARE_CONFIG || {};
  const price = C.PRICE_HINT || 'Prices vary by service.';

  const t = text.trim();
  const lower = t.toLowerCase();

  if(/hello|hi|welcome/.test(lower)){
    return `Welcome to <b>DhofarCare</b> auto-reply! Yes — what service do you need?`;
  }
  if(/service|available|offer|list/.test(lower)){
    return `Our services: <b>Home Cleaning, Maintenance, Beauty at Home, Specialty</b>. You can start from <a href="#book">Book</a>.`;
  }
  if(/price|cost|how much|fees/.test(lower)){
    return `${price} For special cases, we’ll confirm after checking your details.`;
  }
  if(/contact|whatsapp|email|phone|number/.test(lower)){
    return `WhatsApp: <a class="phoneLink"><span class="phone"></span></a> — Email: <a class="emailLink"><span class="email"></span></a>. Thank you!`;
  }
  if(/thanks|thank you|thx/.test(lower)){
    return `Thank you! We’re happy to help anytime.`;
  }
  return `Great question! I can help pick a service and book instantly. Ask “How much does it cost?” for pricing or “How can I contact you?” for support.`;
}

aiSend?.addEventListener('click', ()=>{
  const v = (aiInput.value||'').trim();
  if(!v) return;
  addMsg(v, 'user');
  aiInput.value = '';
  const typing = document.createElement('div');
  typing.className = 'msg ai'; typing.textContent = 'typing…';
  aiLog.appendChild(typing); aiLog.scrollTop = aiLog.scrollHeight;
  setTimeout(()=>{
    typing.remove();
    addMsg(reply(v),'ai');
  }, 500);
});
