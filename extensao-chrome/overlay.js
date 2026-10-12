(() => {
  const ROOT_ID = "coia-multi-picker";
  const STYLE_ID = "coia-multi-picker-style";
  const existing = document.getElementById(ROOT_ID);
  if (existing) { existing.remove(); document.getElementById(STYLE_ID)?.remove(); return; }

  const css = `
  #${ROOT_ID}{position:fixed;z-index:2147483647;top:80px;right:22px;width:min(390px,calc(100vw - 28px));max-height:calc(100vh - 105px);background:#120c1d;color:#f5efff;border:1px solid #493263;border-radius:18px;box-shadow:0 18px 65px #0009;font:14px/1.4 system-ui,sans-serif;overflow:hidden}
  #${ROOT_ID} *{box-sizing:border-box} #${ROOT_ID} .head{display:flex;align-items:center;gap:10px;padding:14px;background:linear-gradient(120deg,#35205c,#1b1230);border-bottom:1px solid #493263}
  #${ROOT_ID} .logo{font-size:24px} #${ROOT_ID} .heading{font-weight:800;font-size:16px;flex:1} #${ROOT_ID} .sub{font-size:11px;color:#c4b4e4}
  #${ROOT_ID} .close{background:#ffffff12;border:1px solid #60477d;color:white;border-radius:8px;padding:5px 9px;cursor:pointer}
  #${ROOT_ID} .toolbar{display:flex;gap:7px;padding:10px 12px;flex-wrap:wrap;border-bottom:1px solid #332344}
  #${ROOT_ID} button{cursor:pointer;border:0;border-radius:9px;padding:9px 11px;font-weight:700;font-size:12px}
  #${ROOT_ID} .secondary{background:#2b203c;color:#e9ddff;border:1px solid #4a365f}
  #${ROOT_ID} .primary{background:#8b5cf6;color:#fff;flex:1}
  #${ROOT_ID} .list{padding:8px 12px;overflow:auto;max-height:calc(100vh - 290px)}
  #${ROOT_ID} .item{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #2d223c}
  #${ROOT_ID} .item input{width:17px;height:17px;margin-top:4px;accent-color:#a78bfa;flex-shrink:0}
  #${ROOT_ID} .thumb{width:54px;height:54px;object-fit:contain;background:#fff;border-radius:8px;flex-shrink:0}
  #${ROOT_ID} .details{min-width:0;flex:1} #${ROOT_ID} .name{font-size:12px;font-weight:700;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  #${ROOT_ID} .price{font-weight:800;color:#6ee7b7;margin-top:4px} #${ROOT_ID} .domain{font-size:10px;color:#b5a8cb;overflow-wrap:anywhere}
  #${ROOT_ID} .foot{padding:12px;border-top:1px solid #332344;background:#181126}
  #${ROOT_ID} .count{font-size:12px;color:#c4b4e4;margin-bottom:8px} #${ROOT_ID} .status{font-size:11px;color:#d9c9f3;margin-top:8px;white-space:pre-wrap}
  #${ROOT_ID} .empty{padding:22px 8px;text-align:center;color:#c4b4e4;font-size:12px}
  `;
  const style = document.createElement("style"); style.id = STYLE_ID; style.textContent = css; document.documentElement.appendChild(style);
  const root = document.createElement("aside"); root.id = ROOT_ID;
  root.innerHTML = `
    <div class="head"><div class="logo">🛒</div><div style="flex:1"><div class="heading">Caça Ofertas IA</div><div class="sub">Seleção múltipla de produtos</div></div><button class="close" data-act="close" title="Fechar">✕</button></div>
    <div class="toolbar"><button class="secondary" data-act="all">Selecionar todos</button><button class="secondary" data-act="none">Desmarcar todos</button><button class="secondary" data-act="refresh">Atualizar lista</button></div>
    <div class="list" id="coia-list"><div class="empty">Procurando produtos nesta página…</div></div>
    <div class="foot"><div class="count" id="coia-count">0 produtos selecionados</div><button class="primary" data-act="add">Adicionar selecionados à fila</button><div class="status" id="coia-status" role="status"></div></div>`;
  document.documentElement.appendChild(root);

  const tidy = v => String(v || "").replace(/\\s+/g," ").trim();
  const parsePrice = value => {
    if (!value) return null;
    const s = String(value).replace(/[^0-9,.]/g,"");
    if (!s) return null;
    let n;
    if (s.includes(",") && s.includes(".")) n = Number(s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\\./g,"").replace(",",".") : s.replace(/,/g,""));
    else n = Number(s.replace(",","."));
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  function extractProducts() {
    const found = new Map();
    const links = [...document.querySelectorAll('a[href*="/up/"],a[href*="/p/"],a[href*="produto.mercadolivre"],a[href*="shopee"]')];
    for (const a of links) {
      const card = a.closest('li, article, .ui-search-result, .poly-card, [class*="item"], [class*="card"]') || a.parentElement;
      if (!card) continue;
      const link = a.href;
      if (!/^https?:/i.test(link) || !card.querySelector("img")) continue;
      const img = card.querySelector("img");
      const titleNode = card.querySelector("h2,h3,[class*='title'],[class*='name']");
      const title = tidy(titleNode?.innerText || a.getAttribute("title") || img.alt);
      if (!title || title.length < 4) continue;
      const priceNode = card.querySelector('[class*="price"] [aria-label],[class*="price"] [class*="fraction"],[class*="price"],[itemprop="price"]');
      const price = parsePrice(priceNode?.getAttribute("content") || priceNode?.getAttribute("aria-label") || priceNode?.innerText);
      const image = img.currentSrc || img.src || "";
      const url = link;
      if (!found.has(url)) found.set(url,{title,price,image,url,site:location.hostname,capturedAt:new Date().toISOString(),source:"extension-overlay",affiliateLinkConfirmed:/[?&](matt_tool|wid|sid)=/.test(url)});
    }
    // On a single product page, allow adding the currently viewed product too.
    if (location.pathname.includes("/up/") || location.pathname.includes("/p/")) {
      const title = tidy(document.querySelector('meta[property="og:title"]')?.content || document.querySelector("h1")?.innerText || document.title);
      const price = parsePrice(document.querySelector('meta[property="product:price:amount"]')?.content || document.querySelector('[itemprop="price"]')?.content || document.querySelector(".andes-money-amount__fraction")?.innerText);
      const image = document.querySelector('meta[property="og:image"]')?.content || "";
      if (title && ![...found.values()].some(p=>p.url===location.href)) found.set(location.href,{title,price,image,url:location.href,site:location.hostname,capturedAt:new Date().toISOString(),source:"extension-overlay",affiliateLinkConfirmed:/[?&](matt_tool|wid|sid)=/.test(location.href)});
    }
    return [...found.values()];
  }
  let products = [], selected = new Set();
  const list = root.querySelector("#coia-list"), count = root.querySelector("#coia-count"), status = root.querySelector("#coia-status");
  const money = n => n == null ? "Preço não identificado" : n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  function render() {
    list.innerHTML = "";
    if (!products.length) list.innerHTML = '<div class="empty">Não encontrei cartões de produtos nesta página. Abra uma página de busca/categoria ou tente Atualizar lista.</div>';
    products.forEach((p,i)=>{
      const row=document.createElement("label"); row.className="item";
      const check=document.createElement("input"); check.type="checkbox";check.checked=selected.has(i);check.addEventListener("change",()=>{check.checked?selected.add(i):selected.delete(i);updateCount();});
      const img=document.createElement("img");img.className="thumb";img.alt="";img.src=p.image;img.onerror=()=>{img.style.display="none";};
      const details=document.createElement("div");details.className="details";
      const name=document.createElement("div");name.className="name";name.textContent=p.title;
      const price=document.createElement("div");price.className="price";price.textContent=money(p.price);
      const domain=document.createElement("div");domain.className="domain";domain.textContent=p.site+" · "+new URL(p.url).pathname.slice(0,70);
      details.append(name,price,domain);row.append(check,img,details);list.appendChild(row);
    });
    updateCount();
  }
  function updateCount(){count.textContent=selected.size+" de "+products.length+" produto(s) selecionado(s)";}
  async function scan(){status.textContent="";products=extractProducts();selected=new Set(products.map((_,i)=>i));render();status.textContent=products.length?"Selecione os produtos que deseja guardar. Confira preço e link antes de divulgar.":"";}
  root.addEventListener("click",async e=>{
    const btn=e.target.closest("button[data-act]");if(!btn)return;
    const act=btn.dataset.act;
    if(act==="close"){root.remove();style.remove();return;}
    if(act==="all"){selected=new Set(products.map((_,i)=>i));render();return;}
    if(act==="none"){selected.clear();render();return;}
    if(act==="refresh"){await scan();return;}
    if(act==="add"){
      const chosen=[...selected].map(i=>products[i]);if(!chosen.length){status.textContent="Selecione pelo menos um produto.";return;}
      try{
        const current=await chrome.storage.local.get({products:[]});const queue=Array.isArray(current.products)?current.products:[];
        const known=new Set(queue.map(p=>p.url));let added=0,dupes=0;
        for(const p of chosen){if(known.has(p.url)){dupes++;continue;}queue.unshift({...p,id:p.url,affiliateLinkConfirmed:!!p.affiliateLinkConfirmed});known.add(p.url);added++;}
        await chrome.storage.local.set({products:queue});
        status.textContent=added+" produto(s) adicionado(s) à fila. "+dupes+" duplicado(s) ignorado(s). Links originais preservados.";
      }catch(err){status.textContent="Não consegui salvar. Abra a extensão pelo ícone do Chrome e tente novamente.";}
    }
  });
  scan();
})();