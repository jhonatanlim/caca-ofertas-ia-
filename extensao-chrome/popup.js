const $ = id => document.getElementById(id);
const DASHBOARD_URL = "https://jhonatanlim.github.io/caca-ofertas-ia-/";
let currentProduct = null;
function parsePrice(value) {
  if (!value) return null;
  const s = String(value).replace(/[^0-9,.]/g, "");
  if (!s) return null;
  if (s.includes(",") && s.includes(".")) return Number(s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, ""));
  return Number(s.replace(",", "."));
}
async function getQueue() {
  const d = await chrome.storage.local.get({products:[]});
  return Array.isArray(d.products) ? d.products : [];
}
async function refreshCount() {
  const q = await getQueue();
  $("count").textContent = q.length + (q.length === 1 ? " produto" : " produtos");
}
async function inspectTab() {
  const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
  if (!tab?.id || !/^https?:/.test(tab.url || "")) {
    $("productTitle").textContent = "Abra uma página de produto para começar";
    $("capture").disabled = true; return;
  }
  try {
    const result = await chrome.scripting.executeScript({target:{tabId:tab.id},func:() => {
      const meta = selectors => {
        for (const s of selectors) {
          const e = document.querySelector(s);
          const v = e?.content || e?.getAttribute("content") || e?.textContent;
          if (v?.trim()) return v.trim();
        }
        return "";
      };
      return {
        title: meta(['meta[property="og:title"]','meta[name="twitter:title"]']) || document.querySelector("h1")?.innerText || document.title,
        image: meta(['meta[property="og:image"]','meta[name="twitter:image"]']),
        priceText: meta(['meta[property="product:price:amount"]','meta[itemprop="price"]','meta[property="og:price:amount"]']) || document.querySelector('[itemprop="price"]')?.innerText || document.querySelector(".andes-money-amount__fraction")?.innerText || "",
        currency: meta(['meta[property="product:price:currency"]','meta[itemprop="priceCurrency"]']) || "BRL",
        url: location.href, site: location.hostname, capturedAt: new Date().toISOString()
      };
    }});
    const raw = result?.[0]?.result;
    if (!raw) throw new Error("no data");
    const price = parsePrice(raw.priceText);
    currentProduct = {id:raw.url,title:String(raw.title||"").replace(/\s+/g," ").trim(),price:Number.isFinite(price)?price:null,currency:raw.currency||"BRL",image:raw.image||"",url:raw.url,site:raw.site,capturedAt:raw.capturedAt,source:"extensao-chrome",affiliateLinkConfirmed:false};
    $("productTitle").textContent = currentProduct.title || "Título não encontrado";
    $("productPrice").textContent = currentProduct.price !== null ? currentProduct.price.toLocaleString("pt-BR",{style:"currency",currency:currentProduct.currency==="BRL"?"BRL":"USD"}) : "Preço não identificado — confira manualmente";
    $("productUrl").textContent = currentProduct.site + " · " + currentProduct.url;
    $("capture").disabled = false;
  } catch {
    currentProduct = null; $("productTitle").textContent = "Não foi possível ler esta página";
    $("productPrice").textContent = ""; $("productUrl").textContent = "";
    $("capture").disabled = true; $("status").textContent = "Tente novamente em uma página de produto comum.";
  }
}
$("capture").addEventListener("click", async () => {
  if (!currentProduct) return;
  const q = await getQueue();
  if (q.some(p => p.url === currentProduct.url)) {$("status").textContent="Este link já está na fila.";return;}
  q.unshift(currentProduct); await chrome.storage.local.set({products:q});
  $("status").textContent="Produto adicionado à fila local!"; await refreshCount();
});
$("export").addEventListener("click", async () => {
  const q = await getQueue();
  if (!q.length) {$("status").textContent="Sua fila está vazia.";return;}
  const url=URL.createObjectURL(new Blob([JSON.stringify(q,null,2)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="caca-ofertas-produtos.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $("status").textContent="Arquivo JSON exportado.";
});
$("open").addEventListener("click",()=>chrome.tabs.create({url:DASHBOARD_URL}));
$("clear").addEventListener("click",async()=>{
  if(!confirm("Tem certeza de que deseja apagar a fila local desta extensão?"))return;
  await chrome.storage.local.set({products:[]});await refreshCount();$("status").textContent="Fila limpa.";
});
inspectTab();refreshCount();
$("multi").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
  if (!tab?.id || !/^https?:/.test(tab.url || "")) {
    $("status").textContent = "Abra primeiro uma página de produtos.";
    return;
  }
  try {
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:["overlay.js"]});
    window.close();
  } catch (error) {
    $("status").textContent = "Não foi possível abrir o seletor nesta página. Tente recarregar a página e novamente.";
  }
});
