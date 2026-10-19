/* ==========================================================================
   Vue : Caisse (point de vente)
   ========================================================================== */
App.enregistrerVue('caisse', {
  titre: 'Caisse', icone: '🧾', permissions: ['caisse.utiliser'], groupe: 'Ventes',

  async rendre(zone) {
    const magasin = App.magasinCourant();
    if (!magasin) {
      zone.innerHTML = '<div class="carte"><div class="carte-corps">Aucun magasin associé à votre profil. Contactez un administrateur.</div></div>';
      return;
    }
    const [produits, clients, categories, session] = await Promise.all([
      Api.get('/produits', { magasin_id: magasin, actif: 1 }),
      Api.get('/clients'),
      Api.get('/categories'),
      Api.get('/caisse/session', { magasin_id: magasin }),
    ]);
    if (!document.body.contains(zone)) return; // vue remplacée pendant le chargement
    const magasinNom = (App.etat.magasins.find((m) => Number(m.id) === Number(magasin)) || {}).nom
      || (App.etat.utilisateur.magasin ? App.etat.utilisateur.magasin.nom : 'Magasin');

    let panier = [];
    let clientId = '';
    let mode = 'especes';
    let remiseGlobale = 0;
    let promo = null;
    let codePromo = '';
    let messagePromo = '';
    let categorieFiltre = '';
    let recherche = '';

    zone.innerHTML = `
      <div class="grille g-caisse">
        <div>
          <div class="carte">
            <div class="carte-entete">
              <h3>🛒 Produits — ${Fmt.echapper(magasinNom)}</h3>
              <div class="droite">
                <div class="recherche" style="min-width:240px"><input id="pos-recherche" placeholder="Rechercher un produit (nom, code, code-barres)…"></div>
              </div>
            </div>
            <div class="carte-corps">
              <div class="onglets" id="pos-categories">
                <button class="actif" data-cat="">Toutes</button>
                ${categories.map((c) => `<button data-cat="${c.id}">${Fmt.echapper(c.nom)}</button>`).join('')}
              </div>
              <div class="pos-grille" id="pos-produits"></div>
            </div>
          </div>
          <div class="carte">
            <div class="carte-entete"><h3>🧾 Ventes encaissées aujourd'hui</h3>
              <div class="droite petit texte-muted" id="pos-session-jour"><b>${Fmt.nombre(session.jour.nb)}</b> vente(s) · <b>${Fmt.fcfa(session.jour.ca)}</b></div>
            </div>
            <div class="carte-corps serre" id="pos-dernieres">
              ${tableau([
                { titre: 'Référence', rendre: (l) => `<b>${Fmt.echapper(l.reference)}</b> <span class="petit texte-muted">${Fmt.heure(l.created_at)}</span>` },
                { titre: 'Paiement', rendre: (l) => Fmt.echapper(LIBELLE_MODE[l.mode_paiement] || l.mode_paiement) },
                { titre: 'Montant', num: true, rendre: (l) => `<b>${Fmt.fcfa(l.total)}</b>` },
              ], session.derniere, { vide: 'Aucune vente enregistrée depuis ce magasin aujourd’hui' })}
            </div>
          </div>
        </div>

        <div class="panier">
          <div class="carte">
            <div class="carte-entete"><h3>🧺 Panier</h3>
              <div class="droite"><button class="btn petit danger" id="pos-vider">Vider</button></div></div>
            <div class="carte-corps">
              <div class="panier-lignes" id="pos-lignes"></div>
              <div id="pos-resume"></div>
            </div>
          </div>
        </div>
      </div>`;

    const zoneProduits = document.getElementById('pos-produits');
    const zoneLignes = document.getElementById('pos-lignes');
    const zoneResume = document.getElementById('pos-resume');

    /* ----- Grille produits ----- */
    function dessinerProduits() {
      const q = recherche.toLowerCase();
      const liste = produits.filter((p) => {
        if (categorieFiltre && String(p.categorie_id) !== String(categorieFiltre)) return false;
        if (q && !(p.nom.toLowerCase().includes(q) || String(p.code).toLowerCase().includes(q) || String(p.code_barres || '').includes(q))) return false;
        return true;
      });
      if (!liste.length) { zoneProduits.innerHTML = '<div class="vide"><span>🔍</span>Aucun produit ne correspond</div>'; return; }
      zoneProduits.innerHTML = liste.map((p) => {
        const dispo = Number(p.stock_magasin) || 0;
        return `<button class="pos-produit ${dispo <= 0 ? 'rupture' : ''}" data-id="${p.id}" ${dispo <= 0 ? 'disabled' : ''}>
          <div class="cat">${Fmt.echapper(p.categorie || 'Divers')}</div>
          <div class="nom">${Fmt.echapper(p.nom)}</div>
          <div class="bas"><span class="prix">${p.prix_vente ? Fmt.fcfa(p.prix_vente) : 'Prix à définir'}</span>
          <span class="dispo">${dispo <= 0 ? 'rupture' : Fmt.nombre(dispo) + ' dispo'}</span></div>
        </button>`;
      }).join('');
      zoneProduits.querySelectorAll('.pos-produit').forEach((b) => {
        b.onclick = () => ajouter(Number(b.dataset.id));
      });
    }

    /* ----- Panier ----- */
    function ajouter(produitId) {
      const p = produits.find((x) => x.id === produitId);
      const ligne = panier.find((l) => l.produit_id === produitId);
      const dispo = Number(p.stock_magasin) || 0;
      if (ligne) {
        if (ligne.quantite + 1 > dispo) return notifier(`Stock maximum atteint pour ${p.nom} (${dispo})`, 'erreur');
        ligne.quantite++;
      } else {
        if (dispo < 1) return notifier('Produit en rupture de stock', 'erreur');
        panier.push({ produit_id: p.id, nom: p.nom, prix: Number(p.prix_vente) || 0, quantite: 1, remise: 0, dispo,
          sans_prix: !(Number(p.prix_vente) > 0) });
      }
      majPanier();
    }

    function majPanier() {
      if (!panier.length) {
        zoneLignes.innerHTML = '<div class="vide" style="padding:20px"><span>🛒</span>Cliquez sur un produit pour l’ajouter au panier</div>';
      } else {
        zoneLignes.innerHTML = panier.map((l, i) => `
          <div class="panier-ligne">
            <div><div class="nom">${Fmt.echapper(l.nom)}</div>
              <div class="pu">${l.sans_prix
                ? `Prix de vente : <input type="number" min="0" step="any" data-prix="${i}" value="${l.prix ? Devises.saisie(l.prix) : ''}" style="width:96px"> ${Devises.libelle()}`
                : Fmt.fcfa(l.prix) + ' / unité'} · dispo ${Fmt.nombre(l.dispo)}</div>
              <div class="qte-ctrl">
                <button data-moins="${i}">−</button>
                <input type="number" min="0.1" step="1" value="${l.quantite}" data-qte="${i}">
                <button data-plus="${i}">+</button>
                <button class="btn petit danger" style="margin-left:6px" data-suppr="${i}">🗑</button>
              </div>
            </div>
            <div class="droite"><b>${Fmt.fcfa(l.prix * l.quantite)}</b>
              ${panier.length > 1 ? `<div class="pu" style="margin-top:6px">Ligne ${i + 1}</div>` : ''}</div>
          </div>`).join('');
        zoneLignes.querySelectorAll('[data-plus]').forEach((b) => b.onclick = () => {
          const l = panier[Number(b.dataset.plus)];
          if (l.quantite + 1 > l.dispo) return notifier('Stock maximum atteint', 'erreur');
          l.quantite++; majPanier();
        });
        zoneLignes.querySelectorAll('[data-moins]').forEach((b) => b.onclick = () => {
          const l = panier[Number(b.dataset.moins)];
          if (l.quantite > 1) l.quantite--; else panier.splice(Number(b.dataset.moins), 1);
          majPanier();
        });
        zoneLignes.querySelectorAll('[data-suppr]').forEach((b) => b.onclick = () => {
          panier.splice(Number(b.dataset.suppr), 1); majPanier();
        });
        zoneLignes.querySelectorAll('[data-prix]').forEach((inp) => inp.onchange = () => {
          const l = panier[Number(inp.dataset.prix)];
          l.prix = Math.max(0, Devises.versBase(inp.value) || 0);
          majPanier();
        });
        zoneLignes.querySelectorAll('[data-qte]').forEach((inp) => inp.onchange = () => {
          const l = panier[Number(inp.dataset.qte)];
          const v = Math.max(0, Number(inp.value) || 0);
          if (v > l.dispo) { notifier(`Seulement ${l.dispo} en stock`, 'attente'); l.quantite = l.dispo; }
          else if (v === 0) panier.splice(Number(inp.dataset.qte), 1);
          else l.quantite = v;
          majPanier();
        });
      }

      const totalArticles = panier.reduce((s, l) => s + l.quantite, 0);
      const sousTotal = panier.reduce((s, l) => s + l.prix * l.quantite, 0);
      if (promo && (promo.montant !== sousTotal || promo.client !== clientId)) {
        promo = null; messagePromo = 'Panier ou client modifié : vérifiez à nouveau le code.';
      }
      const total = Math.max(0, sousTotal - (promo ? promo.remise : remiseGlobale));
      zoneResume.innerHTML = `
        <div style="margin-top:10px">
          <div class="champ"><label>Client</label>
            <select id="pos-client">
              <option value="">Client de passage</option>
              ${clients.map((c) => `<option value="${c.id}" ${String(clientId) === String(c.id) ? 'selected' : ''}>${Fmt.echapper(c.nom)}${c.telephone ? ' — ' + Fmt.echapper(c.telephone) : ''}</option>`).join('')}
            </select>
            <button class="btn petit" id="pos-nouveau-client" style="margin-top:8px">＋ Ajouter un client</button>
            <div class="aide">Le client gagne des points de fidélité (1 pt / 5 000 FCFA).</div>
          </div>
          <div class="champ"><label for="pos-promo">Code promo du client</label>
            <input id="pos-promo" value="${Fmt.echapper(codePromo)}" placeholder="Code fourni par l’administrateur" autocomplete="off">
            <button class="btn petit" id="pos-verifier-promo" style="margin-top:8px">Vérifier le code promo</button>
            ${codePromo ? '<button class="btn petit" id="pos-retirer-promo">Retirer le code</button>' : ''}
            <div role="status" class="aide" id="pos-resultat-promo">${promo ? '✓ ' + Fmt.echapper(promo.code) + ' — ' + (promo.type === 'pourcentage' ? promo.valeur + ' % · ' : '') + 'Remise : ' + Fmt.fcfa(promo.remise) : Fmt.echapper(messagePromo)}</div>
          </div>
          <div class="panier-total"><span>${panier.length} ligne(s) · ${Fmt.nombre(totalArticles)} article(s)</span><b>${Fmt.fcfa(sousTotal)}</b></div>
          <div class="champ" style="margin:6px 0"><label>Remise globale (${Devises.libelle()})</label>
            <input type="number" id="pos-remise" min="0" step="any" value="${Devises.saisie(promo ? promo.remise : remiseGlobale)}" ${promo ? 'disabled' : ''}></div>
          <div class="panier-total grand"><span>TOTAL</span><span>${Fmt.fcfa(total)}</span></div>

          <label class="petit" style="font-weight:700;display:block;margin-top:10px">Mode de paiement</label>
          <div class="mode-paiement">
            ${Object.entries(LIBELLE_MODE).map(([k, v]) => `<button data-mode="${k}" class="${mode === k ? 'actif' : ''}">${v}</button>`).join('')}
          </div>

          ${mode === 'credit' ? '<div class="aide" style="color:#b45309">Vente à crédit : le montant ne sera pas encaissé immédiatement.</div>' : `
            <div class="ligne-paiement">
              <div class="champ" style="margin:0"><label>Montant reçu</label>
                <input type="number" id="pos-paye" min="0" step="any" value="${Devises.saisie(Math.ceil(total / 500) * 500)}"></div>
              <div class="champ" style="margin:0"><label>Monnaie à rendre</label>
                <input id="pos-monnaie" value="${Fmt.fcfa(0)}" disabled></div>
            </div>`}

          <button class="btn primaire btn-bloc" id="pos-valider" style="padding:12px;margin-top:12px;font-size:15px" ${panier.length && (!codePromo.trim() || promo) ? '' : 'disabled'}>
            ✅ Encaisser ${Fmt.fcfa(total)}
          </button>
        </div>`;

      const selClient = document.getElementById('pos-client');
      document.getElementById('pos-nouveau-client').onclick = () => ouvrirModale({
        titre: 'Ajouter un client au panier',
        contenu: '<div class="grille-form"><div class="champ"><label>Nom du client</label><input name="nom" required></div><div class="champ"><label>Téléphone</label><input name="telephone" type="tel"></div><div class="champ"><label>Email (facultatif)</label><input name="email" type="email"></div><div class="champ"><label>Adresse (facultatif)</label><input name="adresse"></div></div>',
        pied: '<button class="btn" data-annuler>Annuler</button><button class="btn primaire" data-ajouter>Créer et sélectionner</button>',
        surOuverture(mod, fermer) {
          mod.querySelector('[data-annuler]').onclick = fermer;
          mod.querySelector('[data-ajouter]').onclick = async ev => {
            const invalide = [...mod.querySelectorAll('input')].find(i => !i.checkValidity());
            if (invalide) return invalide.reportValidity();
            const bouton = ev.currentTarget; bouton.disabled = true;
            try {
              const c = await Api.post('/clients', lireFormulaire(mod));
              clients.push(c); clientId = String(c.id); fermer(); majPanier(); notifier('Client créé et sélectionné dans le panier.');
            } catch (e) { notifier(e.message, 'erreur'); }
            finally { bouton.disabled = false; }
          };
        }
      });
      document.getElementById('pos-promo').oninput = e => {
        codePromo = e.target.value; promo = null; messagePromo = '';
        document.getElementById('pos-resultat-promo').textContent = 'Cliquez sur Vérifier pour appliquer ce code.';
        document.getElementById('pos-valider').disabled = true;
        if (!codePromo.trim()) majPanier();
      };
      document.getElementById('pos-verifier-promo').onclick = async ev => {
        const bouton = ev.currentTarget; bouton.disabled = true;
        const code = codePromo, client = clientId, montant = sousTotal;
        try {
          const r = await Api.post('/caisse/promo/verifier', { code, client_id: client || null, montant });
          if (codePromo !== code || clientId !== client || panier.reduce((s,l) => s+l.prix*l.quantite,0) !== montant) return;
          promo = { ...r, montant, client }; remiseGlobale = 0; messagePromo = '';
        } catch (e) { promo = null; messagePromo = e.message; }
        finally { majPanier(); }
      };
      const retirerPromo = document.getElementById('pos-retirer-promo');
      if (retirerPromo) retirerPromo.onclick = () => { promo = null; codePromo = ''; messagePromo = ''; majPanier(); };
      if (selClient) selClient.onchange = (e) => { clientId = e.target.value; majPanier(); };
      const champRemise = document.getElementById('pos-remise');
      if (champRemise) champRemise.onchange = (e) => {
        remiseGlobale = Math.max(0, Devises.versBase(e.target.value) || 0);
        if (remiseGlobale > sousTotal) { remiseGlobale = sousTotal; notifier('Remise plafonnée au sous-total', 'attente'); }
        majPanier();
      };
      zoneResume.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => { mode = b.dataset.mode; majPanier(); });
      const paye = document.getElementById('pos-paye');
      const monnaie = document.getElementById('pos-monnaie');
      const calculerMonnaie = () => {
        if (!monnaie || !paye) return;
        const m = Math.max(0, (Devises.versBase(paye.value) || 0) - total);
        monnaie.value = Fmt.fcfa(m);
        paye.style.borderColor = (Number(paye.value) || 0) < total ? '#dc2626' : '';
      };
      if (paye) { paye.oninput = calculerMonnaie; calculerMonnaie(); }
      const btn = document.getElementById('pos-valider');
      if (btn) btn.onclick = () => valider(sousTotal, total);
    }

    /* ----- Encaissement ----- */
    async function valider(sousTotal, total) {
      if (codePromo.trim() && !promo) return notifier('Vérifiez le code promo ou retirez-le avant d’encaisser.', 'erreur');
      const payeEl = document.getElementById('pos-paye');
      const montantPaye = mode === 'credit' ? 0 : (payeEl ? Devises.versBase(payeEl.value) : total);
      if (mode !== 'credit' && montantPaye < total) return notifier('Le montant reçu est insuffisant', 'erreur');
      const btn = document.getElementById('pos-valider');
      btn.disabled = true; btn.textContent = 'Enregistrement…';
      try {
        const sansPrix = panier.find((l) => l.sans_prix && !(l.prix > 0));
        if (sansPrix) { btn.disabled = false; btn.textContent = 'Encaisser'; return notifier(`Donnez un prix de vente à « ${sansPrix.nom} »`, 'erreur'); }
        const vente = await Api.post('/ventes', {
          magasin_id: magasin,
          client_id: clientId || null,
          lignes: panier.map((l) => ({ produit_id: l.produit_id, quantite: l.quantite, remise: l.remise, prix_unitaire: l.prix })),
          remise: promo ? 0 : remiseGlobale,
          code_promo: promo ? promo.code : null,
          mode_paiement: mode,
          montant_paye: montantPaye,
        });
        if (!document.body.contains(zone)) return; // vue remplacée pendant le chargement
        notifier(`Vente ${vente.reference} enregistrée (${Fmt.fcfa(vente.total)})`);
        panier = []; remiseGlobale = 0; promo = null; codePromo = ''; messagePromo = ''; mode = 'especes'; clientId = '';
        const maj = await Api.get('/produits', { magasin_id: magasin, actif: 1 });
        if (!document.body.contains(zone)) return; // vue remplacée pendant le chargement
        produits.length = 0; produits.push(...maj);
        dessinerProduits();
        majPanier();
        App.rafraichirAlertes();
        App.afficherTicket(vente.id, {
          apresFermeture: async () => {
            const s = await Api.get('/caisse/session', { magasin_id: magasin });
            const carte = document.getElementById('pos-dernieres');
            if (carte) carte.innerHTML = tableau([
              { titre: 'Référence', rendre: (l) => `<b>${Fmt.echapper(l.reference)}</b> <span class="petit texte-muted">${Fmt.heure(l.created_at)}</span>` },
              { titre: 'Paiement', rendre: (l) => Fmt.echapper(LIBELLE_MODE[l.mode_paiement] || l.mode_paiement) },
              { titre: 'Montant', num: true, rendre: (l) => `<b>${Fmt.fcfa(l.total)}</b>` },
            ], s.derniere, { vide: 'Aucune vente aujourd’hui' });
          },
        });
      } catch (e) {
        notifier(e.message, 'erreur');
      } finally {
        if (btn) { btn.disabled = false; }
      }
    }

    /* ----- Événements ----- */
    document.getElementById('pos-recherche').oninput = (e) => { recherche = e.target.value; dessinerProduits(); };
    document.querySelectorAll('#pos-categories button').forEach((b) => b.onclick = () => {
      categorieFiltre = b.dataset.cat;
      document.querySelectorAll('#pos-categories button').forEach((x) => x.classList.toggle('actif', x === b));
      dessinerProduits();
    });
    document.getElementById('pos-vider').onclick = async () => {
      if (!panier.length) return;
      if (await confirmer('Vider le panier en cours ?', { danger: true, valider: 'Vider' })) { panier = []; remiseGlobale = 0; promo = null; codePromo = ''; messagePromo = ''; majPanier(); }
    };
    if (window.__raccourciCaisse) document.removeEventListener('keydown', window.__raccourciCaisse);
    window.__raccourciCaisse = (e) => {
      if (!document.getElementById('pos-recherche')) { document.removeEventListener('keydown', window.__raccourciCaisse); return; }
      if (e.key === 'F2') { e.preventDefault(); document.getElementById('pos-recherche').focus(); }
      if (e.key === 'F4' && panier.length) { e.preventDefault(); document.getElementById('pos-valider').click(); }
    };
    document.addEventListener('keydown', window.__raccourciCaisse);

    dessinerProduits();
    majPanier();

    /** Relit les produits (stocks disponibles) et les dernières ventes du magasin. */
    async function rafraichirCaisse() {
      if (!document.body.contains(zone)) return;          // écran quitté
      const maj = await Api.get('/produits', { magasin_id: magasin, limite: 500 }).catch(() => null);
      if (maj && Array.isArray(maj)) { produits.length = 0; produits.push(...maj); }
      dessinerProduits();
      const s = await Api.get('/caisse/session', { magasin_id: magasin }).catch(() => null);
      if (!s) return;
      const carte = document.getElementById('pos-dernieres');
      if (carte) {
        carte.innerHTML = tableau([
          { titre: 'Référence', rendre: (l) => `<b>${Fmt.echapper(l.reference)}</b> <span class="petit texte-muted">${Fmt.heure(l.created_at)}</span>` },
          { titre: 'Paiement', rendre: (l) => Fmt.echapper(LIBELLE_MODE[l.mode_paiement] || l.mode_paiement) },
          { titre: 'Montant', num: true, rendre: (l) => `<b>${Fmt.fcfa(l.total)}</b>` },
        ], s.derniere, { vide: 'Aucune vente aujourd’hui' });
      }
      const entete = document.getElementById('pos-session-jour');
      if (entete && s.jour) {
        entete.innerHTML = `<b>${Fmt.nombre(s.jour.nb)}</b> vente(s) · <b>${Fmt.fcfa(s.jour.ca)}</b>`;
      }
    }

    /* ---- Temps réel : les ventes des autres postes et les mouvements de stock
       rafraîchissent la caisse (produits, stocks disponibles, dernières ventes) ---- */
    App.suivre({ vue: 'caisse', types: ['vente', 'stock'], rafraichir: () => rafraichirCaisse() });
  },
});
