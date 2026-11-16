import sys, subprocess, json; sys.argv=["x","rien"]; __file__="parcours.py"
exec(open("parcours.py").read().split('etape = sys.argv[1]')[0])
E = ICI.replace("/parr", "/ep3"); APP = "https://mysite-app.com"
try:
    g = compte("Amar")
    pr = sb("prospects", "POST", {"user_id": g["id"], "nom": "Boulangerie du Parc", "metier": "Boulangerie", "ville": "Marseille", "code_postal": "13006", "adresse": "12 rue Paradis", "source": "exemple de démonstration", "indices": "Exemple fictif"})[0]
    p = compte("Amar Pro"); sb(f"profils?id=eq.{p['id']}", "PATCH", {"plan": "pro", "abonnement_statut": "active"})
    pr2 = sb("prospects", "POST", {"user_id": p["id"], "nom": "Boulangerie du Parc", "metier": "Boulangerie", "ville": "Marseille", "code_postal": "13006", "adresse": "12 rue Paradis", "telephone": "04 91 00 00 00", "siret": "12345678900011", "source": "exemple de démonstration"})[0]
    c, r, _ = appel(f"{APP}/api/studio", "POST", {"prospect_id": pr2["id"]}, {"Cookie": p["cookie"], "Origin": APP}); print("site express :", c)
    json.dump({"g": g["cookie"], "p": p["cookie"], "fiche": pr["id"], "site": r["id"]}, open(f"{E}/c.json", "w"))
    js = r"""const { chromium, devices } = require('playwright'); const E='%s'; const d=require(E+'/c.json');
const ck=(s)=>s.trim().split('; ').map(kv=>{const i=kv.indexOf('=');return {name:kv.slice(0,i),value:kv.slice(i+1),domain:'mysite-app.com',path:'/'}});
(async()=>{const b=await chromium.launch(); const o={viewport:{width:390,height:844},deviceScaleFactor:2.6667,isMobile:true,hasTouch:true,locale:'fr-FR'};
 let c=await b.newContext(o); await c.addCookies(ck(d.g)); let p=await c.newPage();
 await p.goto('https://mysite-app.com/espace/prospects/'+d.fiche,{waitUntil:'load'}); await p.waitForTimeout(1500);
 await p.addStyleTag({content:'.cote{position:static !important}'}); await p.waitForTimeout(300);
 await p.screenshot({path:E+'/fiche.png',fullPage:true});
 const y=await p.evaluate(()=>{const e=[...document.querySelectorAll('h2')].find(h=>h.textContent.includes('Son futur site')); return e? e.getBoundingClientRect().top+scrollY:0});
 const yb=await p.evaluate(()=>{const e=[...document.querySelectorAll('button')].find(h=>h.textContent.includes('Maquette express')); const r=e.getBoundingClientRect(); return [r.left+r.width/2, r.top+scrollY+r.height/2]});
 console.log('fiche : titre « Son futur site » à', y, 'bouton à', yb); await c.close();
 c=await b.newContext(o); await c.addCookies(ck(d.p)); p=await c.newPage();
 await p.goto('https://mysite-app.com/espace/studio/'+d.site,{waitUntil:'load'}); await p.waitForTimeout(2500);
 await p.getByRole('button',{name:'Publier',exact:true}).first().click().catch(()=>{}); await p.locator('[role=tab]:has-text("Publier")').first().click().catch(()=>{}); await p.waitForTimeout(1500);
 await p.getByLabel(/gérant a validé/).check().catch(e=>console.log('case',String(e).slice(0,80))); await p.waitForTimeout(500);
 const dis=await p.evaluate(()=>{const e=[...document.querySelectorAll('button')].find(h=>/mettre en ligne/i.test(h.textContent)); return e?e.disabled:null}); console.log('bouton désactivé ?', dis);
 await p.addStyleTag({content:'.cote{position:static !important}'}); await p.waitForTimeout(300);
 await p.screenshot({path:E+'/studio.png',fullPage:true});
 const pub=await p.evaluate(()=>{const e=[...document.querySelectorAll('button')].find(h=>/mettre en ligne/i.test(h.textContent)); if(!e) return null; const r=e.getBoundingClientRect(); return [r.left+r.width/2, r.top+scrollY+r.height/2, e.textContent.trim()]});
 const ong=await p.evaluate(()=>[...document.querySelectorAll('button,[role=tab]')].map(e=>e.textContent.trim()).filter(t=>t&&t.length<30).slice(0,40));
 console.log('studio : bouton de mise en ligne', pub); console.log('onglets', ong.join(' | ')); await b.close();})();""" % E
    open(f"{E}/captd.js", "w").write(js)
    r = subprocess.run(["node", f"{E}/captd.js"], capture_output=True, text=True, timeout=200); print(r.stdout, r.stderr[-800:])
finally:
    for x in etat["users"]: appel(f"{SB}/auth/v1/admin/users/{x}", "DELETE", h=ADM)
    print("comptes supprimés")
