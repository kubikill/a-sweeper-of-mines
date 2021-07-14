!function(){"use strict";function e(e,n){const t=e.value,r=e.min?e.min:0,c=e.max?e.max:100,u=Number(100*(t-r)/(c-r));n.innerHTML=t,n.style.left=`calc(${u}% + (${8-.15*u}px))`}document.querySelectorAll(".range-wrap").forEach((n=>{const t=n.querySelector('[type="range"]'),r=n.querySelector(".bubble");t.addEventListener("input",(()=>{e(t,r)})),e(t,r)}))}();
//# sourceMappingURL=index.e7cf2e5e.js.map
