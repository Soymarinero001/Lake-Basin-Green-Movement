/* Settings */
const SUPABASE_URL="https://nrthmawyufracjvxsaia.supabase.co";
const SUPABASE_KEY="sb_publishable_DpSYby4HrI9UOBhRq0nrfg_kQKtUG7F";
const EMAIL_URL="https://script.google.com/macros/s/AKfycbwdn5IJsTi7RauZMdzG05jpvCj4OeJhACz33WD7vhOwB0GA0qQsHRjXQGdgLz0UIPm8/exec";
const CONTACT_EMAIL="lakebasingreenmovement@gmail.com";

/* Menu: add or rename pages here and every page updates */
const PAGES=[["home","index.html","Home"],["events","events.html","Events"],["join","join.html","Get involved"],["about","about.html","About"]];

const LOGO='<svg viewBox="0 0 120 120" width="48" height="48" aria-hidden="true">'
+'<path d="M60 8 C60 8 100 52 100 78 A40 40 0 0 1 20 78 C20 52 60 8 60 8 Z" fill="#1f7a80"/>'
+'<rect x="57" y="68" width="6" height="26" rx="2" fill="#c8b560"/>'
+'<circle cx="60" cy="52" r="15" fill="#e8f0ef"/><circle cx="47" cy="64" r="11" fill="#e8f0ef"/><circle cx="73" cy="64" r="11" fill="#e8f0ef"/>'
+'<path d="M38 98 q5.5 -6 11 0 t11 0 t11 0 t11 0" fill="none" stroke="#c8b560" stroke-width="3.5" stroke-linecap="round"/></svg>';

const current=document.body.dataset.page;
const header=document.getElementById("site-header");
if(header){
  header.innerHTML='<nav class="nav" aria-label="Main"><a class="brand" href="index.html">'+LOGO+'<span>Lake-Basin<br>Green Movement</span></a><ul>'
  +PAGES.map(p=>'<li><a href="'+p[1]+'"'+(p[0]===current?' aria-current="page"':'')+'>'+p[2]+'</a></li>').join("")
  +'</ul></nav>';
}
const footer=document.getElementById("site-footer");
if(footer){
  footer.innerHTML='<div class="wrap">Lake-Basin Green Movement, Kisumu, Kenya<br>Contact us: <a href="mailto:'+CONTACT_EMAIL+'">'+CONTACT_EMAIL+'</a></div>';
}

/* Helpers */
function add(parent,tag,cls,text){
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  el.textContent=text;
  parent.appendChild(el);
  return el;
}
function todayString(){
  const n=new Date();
  return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0");
}
let eventsPromise;
function getEvents(){
  if(!eventsPromise){
    eventsPromise=fetch(SUPABASE_URL+"/rest/v1/events?select=*&order=event_date.asc",{headers:{"apikey":SUPABASE_KEY}})
      .then(r=>{if(!r.ok)throw new Error("Request failed");return r.json();});
  }
  return eventsPromise;
}

/* Live counters */
async function loadImpact(){
  try{
    const res=await fetch(SUPABASE_URL+"/rest/v1/rpc/impact_totals",{
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
      body:"{}"
    });
    if(!res.ok)throw new Error("Request failed");
    const t=await res.json();
    for(const k of ["trees","waste","people"])
      document.getElementById(k).textContent=Number(t[k]||0).toLocaleString();
  }catch(err){}
}

/* Events */
function eventItem(ev,isUpcoming){
  const li=document.createElement("li");
  const d=new Date(ev.event_date+"T00:00:00");
  add(li,"div","ev-date",d.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}));
  add(li,"h4","",ev.title);
  if(ev.location)add(li,"div","ev-place",ev.location);
  if(ev.description)add(li,"p","",ev.description);
  if(ev.result)add(li,"p","ev-result",ev.result);
  if(isUpcoming){
    const a=add(li,"a","ev-join","Join this drive");
    a.href="join.html#join";
  }
  return li;
}
function messageItem(text){
  const li=document.createElement("li");
  li.textContent=text;
  return li;
}
async function loadEvents(){
  const up=document.getElementById("upcoming"), past=document.getElementById("past");
  try{
    const events=await getEvents();
    const today=todayString();
    const upcoming=events.filter(e=>e.event_date>=today);
    const done=events.filter(e=>e.event_date<today).reverse();
    up.replaceChildren(...(upcoming.length?upcoming.map(e=>eventItem(e,true)):[messageItem("The next drive will be announced soon. Join us to be the first to know.")]));
    past.replaceChildren(...(done.length?done.map(e=>eventItem(e,false)):[messageItem("Our story starts here.")]));
  }catch(err){
    up.replaceChildren(messageItem("Events could not load right now. Please try again later."));
    past.replaceChildren();
  }
}
async function loadNextDrive(){
  const box=document.getElementById("nextDrive");
  try{
    const events=await getEvents();
    const next=events.find(e=>e.event_date>=todayString());
    box.replaceChildren(next?eventItem(next,true):messageItem("The next drive will be announced soon. Join us to be the first to know."));
  }catch(err){
    box.replaceChildren(messageItem("Events could not load right now."));
  }
}

/* Questions */
async function loadFaqs(){
  const box=document.getElementById("faqList");
  try{
    const res=await fetch(SUPABASE_URL+"/rest/v1/faqs?select=*&order=sort_order.asc",{headers:{"apikey":SUPABASE_KEY}});
    if(!res.ok)throw new Error("Request failed");
    const faqs=await res.json();
    box.replaceChildren(...faqs.map(f=>{
      const d=document.createElement("details");
      const s=document.createElement("summary");
      s.textContent=f.question;
      const p=document.createElement("p");
      p.textContent=f.answer;
      d.append(s,p);
      return d;
    }));
  }catch(err){
    box.textContent="Questions could not load right now. Please try again later.";
  }
}

/* Sign-up form */
function setupForm(){
  document.getElementById("joinForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const form=e.target, msg=document.getElementById("msg"), btn=form.querySelector("button");
    const person={
      name:document.getElementById("name").value.trim(),
      phone:document.getElementById("phone").value.trim(),
      email:document.getElementById("email").value.trim()||null,
      activity:document.getElementById("activity").value
    };
    btn.disabled=true;
    msg.textContent="Sending...";
    try{
      const res=await fetch(SUPABASE_URL+"/rest/v1/signups",{
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Prefer":"return=minimal"},
        body:JSON.stringify(person)
      });
      if(!res.ok)throw new Error("Request failed");
      if(EMAIL_URL&&person.email){
        fetch(EMAIL_URL,{
          method:"POST",
          mode:"no-cors",
          headers:{"Content-Type":"text/plain"},
          body:JSON.stringify({name:person.name,email:person.email,activity:person.activity})
        }).catch(()=>{});
      }
      msg.textContent="Thank you! You're signed up. We'll contact you about the next drive.";
      form.reset();
    }catch(err){
      msg.textContent="Sorry, that did not work. Please check your connection and try again.";
    }
    btn.disabled=false;
  });
}

/* Run only what each page needs */
if(document.getElementById("trees"))loadImpact();
if(document.getElementById("upcoming"))loadEvents();
if(document.getElementById("nextDrive"))loadNextDrive();
if(document.getElementById("faqList"))loadFaqs();
if(document.getElementById("joinForm"))setupForm();
