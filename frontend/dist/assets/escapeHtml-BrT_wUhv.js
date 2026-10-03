const a={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},c=t=>String(t??"").replace(/[&<>"']/g,e=>a[e]);export{c as e};
