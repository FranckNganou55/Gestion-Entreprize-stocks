/* ==========================================================================
   Vue : Abonnement — essai gratuit, formules, paiement Orange Money / MTN MoMo
   Le paiement est volontairement simple : on affiche le numéro, un lien vers le
   menu USSD, le montant exact, une référence, puis « J'ai payé ».
   ========================================================================== */

const LIBELLE_PLAN = { mensuel: 'Mensuel', annuel: 'Annuel', essai: 'Essai gratuit' };
const LIBELLE_SERVICE = { orange_money: 'Orange Money', mtn_momo: 'MTN Mobile Money', mastercard: 'Carte bancaire MasterCard' };
const COULEUR_SERVICE = { orange_money: '#ff7900', mtn_momo: '#ffcc00', mastercard: '#eb001b' };
const LIBELLE_PAIEMENT = {
  en_attente: '<span class="badge attente">En attente de validation</span>',
  valide: '<span class="badge ok">Validé</span>',
  rejete: '<span class="badge ko">Rejeté</span>',
};

/** 693007397 -> 693 00 73 97 */
function numeroJoli(n) {
  const c = String(n || '').replace(/\D/g, '');
  if (c.length === 9) return `${c.slice(0, 3)} ${c.slice(3, 5)} ${c.slice(5, 7)} ${c.slice(7, 9)}`;
  return String(n || '—');
}

App.enregistrerVue('abonnement', {
  titre: 'Abonnement', icone: '💳',
  permissions: ['abonnement.consulter', 'abonnement.gerer'],
  groupe: 'Administration',

  async rendre(zone) {
    let d = await Api.get('/abonnement');
    if (!document.body.contains(zone)) return;

    const dessiner = () => {
      const t = d.tarifs;
      /* Les formules (durée + montant) sont définies par le propriétaire de la
         plateforme ; on retombe sur mensuel/annuel si la liste n'est pas fournie. */
      const formules = (t.formules && t.formules.length) ? t.formules : [
        { code: 'mensuel', libelle: 'Mensuel', duree_jours: 30, montant: Number(t.mensuel), montant_par_mois: Number(t.mensuel) },
        { code: 'annuel', libelle: 'Annuel', duree_jours: 365, montant: Number(t.annuel),
          montant_par_mois: Number(t.mensuel_equivalent_annuel) },
      ];
      const expire = d.statut === 'expire';
      /* Seuls les moyens de paiement activés par le propriétaire sont proposés. */
      const servicesActifs = ['orange_money', 'mtn_momo', 'mastercard']
        .filter((code) => {
          const s = (d.paiement.services || {})[code];
          return s && s.actif !== false;
        });
      const classeStatut = expire ? 'rouge' : (d.en_essai ? 'ambre' : 'vert');
      const classeBadge = expire ? 'ko' : (d.en_essai ? 'attente' : 'ok');
      const attente = d.paiement_en_attente;
      const serviceAttente = attente ? (d.paiement.services[attente.service] || {}) : null;
      /* Retour de la page de paiement du prestataire : on n'active rien ici,
         c'est la notification vérifiée (webhook) qui prolonge l'abonnement. */
      const retourRef = ((location.hash || '').match(/retour=([^&]+)/) || [])[1] || '';

      zone.innerHTML = `
        ${retourRef ? `<div class="bandeau abonnement attente">
            <b>⏳ Paiement ${Fmt.echapper(decodeURIComponent(retourRef))} transmis</b> —
            nous attendons la confirmation du prestataire de paiement. Votre abonnement
            s'activera automatiquement dès sa réception (quelques secondes).
            Cette page se met à jour toute seule.
          </div>` : ''}
        ${expire ? `<div class="bandeau abonnement ko">
            <b>⛔ Abonnement expiré :</b> les ventes et les mouvements de stock sont suspendus.
            Réglez votre abonnement ci-dessous. L’accès est rétabli après confirmation du paiement.
          </div>` : ''}
        ${!expire && d.alerte_bientot ? `<div class="bandeau abonnement attente">
            <b>⏳ Il reste ${Fmt.nombre(d.jours_restants)} jour(s)</b> avant l'échéance du ${Fmt.date(d.date_fin)}.
            Pensez à régler votre abonnement dès maintenant.
          </div>` : ''}

        <div class="carte">
          <div class="carte-entete">
            <h3>${d.en_essai ? '🎁 Essai gratuit en cours' : (expire ? '⛔ Abonnement expiré' : '✅ Abonnement actif')}</h3>
            <div class="droite"><span class="badge ${classeBadge}">${Fmt.echapper(d.statut_libelle)}</span></div>
          </div>
          <div class="carte-corps">
            <div class="grille g-4">
              <div class="kpi ${classeStatut}"><div class="libelle">Statut</div>
                <div class="valeur" style="font-size:19px">${Fmt.echapper(d.statut_libelle)}</div>
                <div class="pied">${d.en_essai ? 'Aucun paiement requis pendant l’essai' : (expire ? 'Opérations suspendues' : 'Merci de votre confiance')}</div></div>
              <div class="kpi ${d.jours_restants <= 3 ? 'rouge' : 'ambre'}"><div class="libelle">Jours restants</div>
                <div class="valeur">${Fmt.nombre(d.jours_restants)}</div>
                <div class="pied">Échéance : ${Fmt.date(d.date_fin)}</div></div>
              <div class="kpi bleu"><div class="libelle">Formule en cours</div>
                <div class="valeur" style="font-size:19px">${Fmt.echapper(LIBELLE_PLAN[d.plan] || d.plan)}</div>
                <div class="pied">${d.en_essai ? `${Fmt.nombre(t.essai_jours)} jours offerts` : 'Payé ' + Fmt.fcfa(d.montant)}</div></div>
              <div class="kpi"><div class="libelle">Total réglé</div>
                <div class="valeur" style="font-size:19px">${Fmt.fcfa(d.totaux.encaisse)}</div>
                <div class="pied">${Fmt.nombre(d.totaux.nb_paiements)} paiement(s) validé(s)</div></div>
            </div>
            ${d.en_essai ? `<div class="aide" style="margin-top:10px">
              Votre période d'essai de <b>${Fmt.nombre(t.essai_jours)} jours gratuits</b> a débuté le ${Fmt.date(d.date_debut)}.
              À la fin de l'essai : <b>${Fmt.fcfa(t.mensuel)} par mois</b> ou <b>${Fmt.fcfa(t.annuel)} par an</b>.</div>` : ''}
          </div>
        </div>

        ${attente ? `<div class="carte" style="border-color:#fde68a;background:#fffbeb">
          <div class="carte-entete"><h3>⏳ Paiement en attente de validation</h3>
            <div class="droite">${LIBELLE_PAIEMENT.en_attente}</div></div>
          <div class="carte-corps">
            <div class="grille g-4">
              <div><div class="petit texte-muted">Référence</div><b class="mono">${Fmt.echapper(attente.reference)}</b></div>
              <div><div class="petit texte-muted">Montant</div><b>${Fmt.fcfa(attente.montant)}</b></div>
              <div><div class="petit texte-muted">Service</div><b>${Fmt.echapper(LIBELLE_SERVICE[attente.service] || attente.service)}</b></div>
              <div><div class="petit texte-muted">Demandé le</div><b>${Fmt.dateH(attente.created_at)}</b></div>
            </div>
            <div class="aide" style="margin-top:10px">${Fmt.echapper(attente.message || 'Validation en cours par l’administrateur.')}</div>
            ${d.peut_gerer ? `<div class="barre-outils" style="margin-top:10px">
              <button class="btn primaire petit" data-valider="${attente.id}">✅ Valider le paiement</button>
              <button class="btn danger petit" data-rejeter="${attente.id}">✖ Rejeter</button>
            </div>` : ''}
          </div>
        </div>` : ''}

        <div class="carte">
          <div class="carte-entete"><h3>Choisir un moyen de paiement</h3>
            <div class="droite petit texte-muted">Formule → moyen de paiement → confirmation sécurisée</div></div>
          <div class="carte-corps">
            <div class="grille g-2">
              <div>
                <b class="petit">1. Choisissez votre formule</b>
                <div class="choix-formules" style="margin-top:8px">
                  ${formules.map((f, i) => `<label class="choix-carte" data-plan="${Fmt.echapper(f.code)}">
                    <input type="radio" name="plan" value="${Fmt.echapper(f.code)}" ${i === 0 ? 'checked' : ''}>
                    <div><b>${Fmt.echapper(f.libelle)}</b>
                      <div class="petit texte-muted">${Fmt.nombre(f.duree_jours)} jours d'utilisation</div></div>
                    <div class="prix">${Fmt.fcfa(f.montant)}
                      ${f.montant_par_mois && f.duree_jours !== 30
                        ? `<div class="petit texte-muted" style="font-weight:400">soit ${Fmt.fcfa(f.montant_par_mois)}/mois</div>` : ''}</div>
                  </label>`).join('')}
                </div>
                ${t.economie_annuelle ? `<div class="aide" style="margin-top:8px">💡 La formule annuelle vous fait économiser <b>${Fmt.fcfa(t.economie_annuelle)}</b> sur l'année.</div>` : ''}
              </div>
              <div>
                <b class="petit">2. Choisissez le service de paiement</b>
                <div class="choix-services logos" style="margin-top:8px">
                  ${servicesActifs.length ? servicesActifs.map((code) => {
                    const s = d.paiement.services[code] || {};
                    return code === 'mastercard'
                      ? `<button type="button" class="logo-paiement" data-service="mastercard"
                           title="Payer par Visa ou Mastercard"
                           style="border-left:5px solid ${COULEUR_SERVICE.mastercard}">
                           <img src="img/cartes.svg" alt="Visa et Mastercard">
                           <div class="petit texte-muted">Visa / Mastercard</div>
                         </button>`
                      : `<button type="button" class="logo-paiement" data-service="${code}"
                           title="Payer par ${Fmt.echapper(LIBELLE_SERVICE[code])}"
                           style="border-left:5px solid ${COULEUR_SERVICE[code] || '#94a3b8'}">
                           <img src="img/${code === 'orange_money' ? 'orange-money' : 'mtn-momo'}.png"
                                alt="${Fmt.echapper(LIBELLE_SERVICE[code])}">
                           <div class="petit texte-muted">${Fmt.echapper(LIBELLE_SERVICE[code])}</div>
                         </button>`;
                  }).join('') : `<div class="vide"><span>💤</span>Aucun moyen de paiement n'est
                    disponible pour le moment. Merci de réessayer plus tard ou de contacter l'assistance.</div>`}
                </div>
                ${servicesActifs.length ? `<div class="aide" style="margin-top:8px">Choisissez votre service, vérifiez le montant puis suivez les instructions. Ne communiquez jamais votre code secret.</div>` : ''}
              </div>
            </div>
            <div class="panier-total" style="margin-top:14px;border-top:1px dashed var(--line);padding-top:12px">
              <span>Montant du paiement<div id="recap-detail" class="petit texte-muted" style="font-weight:400"></div></span>
              <b id="recap-montant" style="font-size:16px">${Fmt.fcfa(formules[0] ? formules[0].montant : 0)}</b>
            </div>
            <div class="grille g-2" style="margin-top:12px;align-items:end">
              <label class="champ"><span>Code de réduction (facultatif)</span>
                <input id="code-reduction" placeholder="Ex. BIENVENUE20" autocomplete="off"
                  style="text-transform:uppercase"></label>
              <button class="btn" id="verif-reduction" type="button">Vérifier le code</button>
            </div>
            <div id="reduction-retour" class="petit" style="margin-top:6px"></div>
          </div>
        </div>

        <div class="carte">
          <div class="carte-entete"><h3>🧾 Historique des paiements</h3>
            <div class="droite petit texte-muted">${Fmt.nombre(d.historique.length)} ligne(s)</div></div>
          <div class="carte-corps serre">
            ${tableau([
              { titre: 'Référence', rendre: (l) => `<b class="mono">${Fmt.echapper(l.reference)}</b>` },
              { titre: 'Date', rendre: (l) => Fmt.dateH(l.created_at) },
              { titre: 'Service', rendre: (l) => `${Fmt.echapper(LIBELLE_SERVICE[l.service] || l.service)}<div class="petit texte-muted mono">${Fmt.echapper(l.telephone_payeur || '—')}</div>` },
              { titre: 'Formule', rendre: (l) => `${Fmt.echapper(LIBELLE_PLAN[l.plan] || l.plan)}<div class="petit texte-muted">${Fmt.nombre(l.duree_jours)} j</div>` },
              { titre: 'Montant', num: true, rendre: (l) => Fmt.fcfa(l.montant) },
              { titre: 'Statut', rendre: (l) => (LIBELLE_PAIEMENT[l.statut] || Fmt.echapper(l.statut))
                  + (l.valide_par_nom ? `<div class="petit texte-muted">par ${Fmt.echapper(l.valide_par_nom)}</div>` : '') },
              { titre: 'Demandé par', rendre: (l) => Fmt.echapper(l.utilisateur || '—') },
              { titre: '', rendre: (l) => d.peut_gerer ? `<div class="actions">
                  ${l.statut === 'en_attente' ? `<button class="btn petit primaire" data-valider="${l.id}">Valider</button>
                  <button class="btn petit danger" data-rejeter="${l.id}">Rejeter</button>` : ''}
                  <button class="btn petit" data-suppr="${l.id}" title="Supprimer cette ligne (saisie erronée)">🗑</button></div>` : '' },
            ], d.historique, { vide: 'Aucun paiement enregistré pour le moment' })}
          </div>
        </div>

        ${App.peut('plateforme.gerer') ? `
        <div class="carte">
          <div class="carte-entete"><h3>⚙️ Réglages de la plateforme</h3>
            <div class="droite petit texte-muted">Réservé au propriétaire de l'application</div></div>
          <div class="carte-corps">
            <form id="form-ab">
              <div class="grille-form">
                <div class="champ"><label>Tarif mensuel (FCFA)</label><input type="number" step="500" name="tarif_mensuel" value="${Fmt.echapper(t.mensuel)}"></div>
                <div class="champ"><label>Tarif annuel (FCFA)</label><input type="number" step="1000" name="tarif_annuel" value="${Fmt.echapper(t.annuel)}"></div>
                <div class="champ"><label>Jours d'essai gratuit</label><input type="number" name="essai_jours" value="${Fmt.echapper(t.essai_jours)}"></div>
                <div class="champ"><label>Nom du marchand</label><input name="paiement_marchand" value="${Fmt.echapper(d.paiement.marchand)}"></div>
                <div class="champ"><label>Numéro Orange Money</label><input name="om_numero" value="${Fmt.echapper(d.paiement.services.orange_money.numero)}"></div>
                <div class="champ"><label>Code USSD Orange Money</label><input name="om_ussd" value="${Fmt.echapper(d.paiement.services.orange_money.ussd)}"></div>
                <div class="champ"><label>Numéro MTN Mobile Money</label><input name="mtn_numero" value="${Fmt.echapper(d.paiement.services.mtn_momo.numero)}"></div>
                <div class="champ"><label>Code USSD MTN MoMo</label><input name="mtn_ussd" value="${Fmt.echapper(d.paiement.services.mtn_momo.ussd)}"></div>
              </div>
              <div class="barre-outils">
                <button class="btn primaire" type="submit">💾 Enregistrer les réglages</button>
                <button class="btn" type="button" id="ab-essai">🎁 Offrir ${Fmt.nombre(t.essai_jours)} jours à une entreprise (console propriétaire)</button>
                <button class="btn danger" type="button" id="ab-expirer" title="Utile pour tester le blocage">⏳ Simuler l'expiration</button>
              </div>
              <div class="aide" style="margin-top:8px">La validation d'un paiement prolonge l'abonnement en <b>cumulant</b> les jours restants (aucun jour payé n'est perdu).</div>
            </form>
          </div>
        </div>` : `
        <div class="carte">
          <div class="carte-entete"><h3>⚙️ Tarifs et moyens de paiement</h3>
            <div class="droite"><span class="badge neutre">Fixés par l'éditeur</span></div></div>
          <div class="carte-corps">
            <div class="grille g-3">
              <div><div class="petit texte-muted">Formule mensuelle</div><b>${Fmt.fcfa(t.mensuel)}</b></div>
              <div><div class="petit texte-muted">Formule annuelle</div><b>${Fmt.fcfa(t.annuel)}</b></div>
              <div><div class="petit texte-muted">Essai gratuit</div><b>${Fmt.nombre(t.essai_jours)} jours</b></div>
            </div>
            <div class="aide" style="margin-top:10px">
              Les tarifs et les codes de paiement sont fixés par l'éditeur de l'application.
              Besoin d'une facture ou d'un geste commercial ?
              <a href="${App.lienAide('Bonjour, j’ai une question sur mon abonnement Inventa GestyPro.')}" target="_blank" rel="noopener">💬 Contacter l'assistance WhatsApp</a>.
            </div>
          </div>
        </div>`}
      `;

      /* ------- interactions ------- */
      /* Le montant vient de la formule choisie (durée et prix définis par le
         propriétaire de la plateforme), moins l'éventuelle réduction appliquée. */
      let remiseAppliquee = 0;
      let codeValide = null;
      const formuleChoisie = () => {
        const el = zone.querySelector('input[name=plan]:checked');
        return formules.find((f) => f.code === (el ? el.value : null)) || formules[0] || { montant: 0, duree_jours: 0, code: '', libelle: '' };
      };
      const montant = () => Math.max(0, Number(formuleChoisie().montant) - remiseAppliquee);
      const majRecap = () => {
        const f = formuleChoisie();
        zone.querySelector('#recap-montant').textContent = Fmt.fcfa(montant());
        const det = zone.querySelector('#recap-detail');
        if (det) {
          det.innerHTML = remiseAppliquee
            ? `<s>${Fmt.fcfaCourt(f.montant)}</s> − ${Fmt.fcfaCourt(remiseAppliquee)}
               <span class="badge ok">${Fmt.echapper(codeValide || '')}</span>`
            : `${Fmt.nombre(f.duree_jours)} jours d'accès`;
        }
      };

      /** Vérifie le code de réduction saisi et recalcule le montant. */
      async function verifierReduction(silencieux) {
        const champ = zone.querySelector('#code-reduction');
        const retour = zone.querySelector('#reduction-retour');
        const code = (champ.value || '').trim().toUpperCase();
        if (!code) {
          remiseAppliquee = 0; codeValide = null;
          if (retour) retour.innerHTML = '';
          majRecap();
          return;
        }
        try {
          const r = await Api.post('/abonnement/reduction/verifier', { code, plan: formuleChoisie().code });
          remiseAppliquee = Number(r.remise) || 0;
          codeValide = r.code;
          if (retour) {
            const intitule = r.libelle ? `${r.code} — ${r.libelle}` : r.code;
            retour.innerHTML = remiseAppliquee >= 0
              ? `<span style="color:var(--good)">✅ ${Fmt.echapper(intitule)} :
                   − ${Fmt.fcfa(remiseAppliquee)} — vous payez <b>${Fmt.fcfa(r.montant)}</b></span>`
              : `<span style="color:var(--bad)">⚠️ ${Fmt.echapper(intitule)} :
                   + ${Fmt.fcfa(Math.abs(remiseAppliquee))} — montant <b>${Fmt.fcfa(r.montant)}</b></span>`;
          }
          if (!silencieux) notifier(`Code ${r.code} appliqué`);
        } catch (e) {
          remiseAppliquee = 0; codeValide = null;
          if (retour) retour.innerHTML = `<span style="color:var(--bad)">❌ ${Fmt.echapper(e.message)}</span>`;
          if (!silencieux) notifier(e.message, 'erreur');
        }
        majRecap();
      }

      zone.querySelectorAll('input[name=plan]').forEach((r) => r.onchange = () => {
        zone.querySelectorAll('.choix-carte[data-plan]').forEach((c) => c.classList.toggle('actif', c.querySelector('input').checked));
        majRecap();
        /* Le code peut être réservé à une formule : on le revérifie. */
        if ((zone.querySelector('#code-reduction').value || '').trim()) verifierReduction(true);
      });
      zone.querySelectorAll('.choix-carte[data-plan]').forEach((c) => c.classList.toggle('actif', c.querySelector('input').checked));
      zone.querySelector('#verif-reduction').onclick = () => verifierReduction(false);
      zone.querySelector('#code-reduction').addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); verifierReduction(false); }
      });
      majRecap();

      /* Seuls l'administrateur (et le propriétaire) peuvent régler l'abonnement. */
      const peutPayer = App.peut('abonnement.gerer');
      zone.querySelectorAll('.logo-paiement').forEach((b) => {
        if (!peutPayer) { b.disabled = true; b.title = 'Réservé à l’administrateur'; }
        b.onclick = () => {
          const service = b.dataset.service;
          const f = formuleChoisie();
          const base = {
            plan: f.code, montant: montant(), montant_brut: Number(f.montant),
            duree_jours: f.duree_jours, formule_libelle: f.libelle,
            code_reduction: codeValide, d, recharger,
          };
          ouvrirPaiementSecurise({ ...base, service });
        };
      });

      zone.querySelectorAll('[data-valider]').forEach((b) => b.onclick = async () => {
        if (!(await confirmer('Confirmer la réception de ce paiement et prolonger l\'abonnement ?', { valider: 'Valider le paiement' }))) return;
        try {
          const r = await Api.post('/abonnement/paiements/' + b.dataset.valider + '/valider');
          notifier(`Paiement validé — abonnement actif jusqu'au ${Fmt.date(r.etat.date_fin)}`);
          recharger();
        } catch (e) { notifier(e.message, 'erreur'); }
      });
      zone.querySelectorAll('[data-rejeter]').forEach((b) => b.onclick = async () => {
        const motif = prompt('Motif du rejet (facultatif) :') || '';
        try {
          await Api.post('/abonnement/paiements/' + b.dataset.rejeter + '/rejeter', { motif });
          notifier('Paiement rejeté', 'attente'); recharger();
        } catch (e) { notifier(e.message, 'erreur'); }
      });

      zone.querySelectorAll('[data-suppr]').forEach((b) => b.onclick = async () => {
        if (!(await confirmer('Supprimer cette ligne de l\'historique ? (à réserver aux saisies erronées)', { danger: true, valider: 'Supprimer' }))) return;
        try { await Api.del('/abonnement/paiements/' + b.dataset.suppr); notifier('Ligne supprimée', 'attente'); recharger(); }
        catch (e) { notifier(e.message, 'erreur'); }
      });

      const form = zone.querySelector('#form-ab');
      if (form) {
        form.onsubmit = async (ev) => {
          ev.preventDefault();
          try {
            await Api.put('/abonnement/parametres', lireFormulaire(form));
            notifier('Réglages enregistrés'); recharger();
          } catch (e) { notifier(e.message, 'erreur'); }
        };
        zone.querySelector('#ab-essai').onclick = async () => {
          try { const r = await Api.post('/abonnement/essai', { jours: t.essai_jours });
            notifier(`Essai de ${Fmt.nombre(t.essai_jours)} jours relancé`); d = r.etat; rafraichirContexte(); dessiner(); }
          catch (e) { notifier(e.message, 'erreur'); }
        };
        zone.querySelector('#ab-expirer').onclick = async () => {
          if (!(await confirmer('Simuler l\'expiration ? Les opérations seront suspendues jusqu\'à validation d\'un paiement (l\'administrateur garde l\'accès).', { danger: true, valider: 'Simuler' }))) return;
          try { const r = await Api.post('/abonnement/essai', { jours: -1 });
            d = r.etat; notifier('Abonnement expiré (simulation)', 'attente'); rafraichirContexte(); dessiner(); }
          catch (e) { notifier(e.message, 'erreur'); }
        };
      }
    };

    async function recharger() {
      d = await Api.get('/abonnement');
      rafraichirContexte();
      dessiner();
    }
    function rafraichirContexte() {
      App.etat.abonnement = App.etat.abonnement || {};
      App.etat.abonnement = Object.assign({}, App.etat.abonnement, {
        statut: d.statut, statut_libelle: d.statut_libelle, jours_restants: d.jours_restants,
        expire: d.expire, en_essai: d.en_essai, alerte_bientot: d.alerte_bientot, date_fin: d.date_fin,
      });
      App.majBadgeAbonnement();
    }

    dessiner();
  },
});

/* ==========================================================================
   Assistant de paiement : facturation puis page hébergée du prestataire
   ========================================================================== */
/* La carte est saisie uniquement sur la page hébergée du prestataire. */
function ouvrirPaiementSecurise({ service, plan, montant, formule_libelle, code_reduction, d }) {
  const carte = service === 'mastercard';
  const disponible = !!(d.psp && d.psp.configure);
  const nom = carte ? 'Visa / Mastercard' : LIBELLE_SERVICE[service];
  let cle = crypto.randomUUID();
  const u = App.etat.utilisateur;
  const champ = (name, label, type = 'text', valeur = '') => '<div class="champ"><label for="checkout-' + name + '">' + label + '</label><input id="checkout-' + name + '" name="' + name + '" type="' + type + '" value="' + Fmt.echapper(valeur) + '" required></div>';
  ouvrirModale({
    titre: 'Payer avec ' + nom, largeur: carte ? 'large' : 'etroite',
    contenu: '<div class="checkout-resume"><span class="checkout-etape">PAIEMENT SÉCURISÉ</span><h3>' + Fmt.echapper(formule_libelle || plan) + '</h3><strong>' + Fmt.fcfa(montant) + '</strong><p>Montant facturé : ' + Fmt.nombre(montant) + ' FCFA (XAF)</p></div>'
      + (!disponible ? '<div class="bandeau attente">Vous pouvez remplir vos coordonnées. Pour accéder ensuite à la saisie de carte ou à la confirmation Mobile Money, le propriétaire doit connecter un compte marchand. Aucun prélèvement ne sera effectué avant cette activation.</div>' : '')
      + (carte ? '<p>À l’étape suivante, saisissez le numéro de carte, sa date d’expiration et le cryptogramme sur la page sécurisée du prestataire. L’abonnement sera activé après confirmation du paiement.</p><h4>Coordonnées de facturation</h4><div class="grille-form">'
        + champ('nom','Nom') + champ('prenom','Prénom') + champ('email','Email','email',u.email) + champ('telephone','Téléphone','tel')
        + champ('adresse','Adresse') + champ('ville','Ville') + champ('region','Région') + champ('code_postal','Code postal') + '</div>'
        : '<div class="checkout-telephone">' + champ('telephone','Numéro du compte ' + nom + ' à débiter','tel') + '<p class="aide">Exemple : +237 6XX XX XX XX. Utilisez le compte de la personne qui autorisera le paiement.</p></div><ol class="checkout-instructions"><li>Renseignez le compte à débiter.</li><li>Continuez sur le portail sécurisé et confirmez sur votre téléphone selon les instructions de l’opérateur.</li><li>Le paiement est confirmé dans votre espace après vérification. Un message est adressé à l’entreprise et au propriétaire.</li></ol>')
      + '<p class="aide">Ne communiquez jamais votre code secret Mobile Money. Les informations de carte sont saisies uniquement chez le prestataire.</p><div id="checkout-erreur" role="alert"></div>',
    pied: '<button class="btn" data-annuler>Annuler</button><button class="btn primaire" data-continuer>Continuer vers le paiement sécurisé</button>',
    surOuverture(mod, fermer) {
      mod.querySelector('[data-annuler]').onclick = fermer;
      mod.querySelector('[data-continuer]').onclick = async ev => {
        const inputs = [...mod.querySelectorAll('input[required]')];
        const invalide = inputs.find(i => !i.checkValidity()); if (invalide) { invalide.reportValidity(); return; }
        if (!disponible) {
          mod.querySelector('#checkout-erreur').textContent = 'Coordonnées complétées. La saisie sécurisée ' + (carte ? 'de la carte' : 'du paiement Mobile Money') + ' nécessite la connexion du compte marchand par le propriétaire. Aucun paiement n’a été lancé.';
          return;
        }
        const champs = lireFormulaire(mod), bouton = ev.currentTarget; bouton.disabled = true;
        try {
          const r = await Api.post('/abonnement/checkout', { service, plan, code_reduction: code_reduction || null, telephone: champs.telephone, facturation: carte ? champs : undefined, cle_idempotence: cle });
          if (!/^https:\/\//i.test(r.url_paiement || '')) throw new Error('La page de paiement sécurisée est indisponible.');
          window.location.assign(r.url_paiement);
        } catch(e) {
          mod.querySelector('#checkout-erreur').textContent = e.message;
          bouton.disabled = false;
        }
      };
    }
  });
}
