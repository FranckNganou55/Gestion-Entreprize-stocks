/* Paramétrage de la plateforme : accès réservé au propriétaire. */
App.enregistrerVue('plateforme-parametres', {
  titre: 'Paramètres', icone: '⚙️', permissions: ['plateforme.gerer'], groupe: 'Plateforme',
  async rendre(zone) {
    const d = await Api.get('/plateforme/parametres');
    if (!document.body.contains(zone)) return;
    const p = d.valeurs, smtp = d.smtp;
    const champ = (nom, titre, valeur, type = 'text', attributs = '') => `<div class="champ"><label for="pp-${nom}">${titre}</label><input id="pp-${nom}" name="${nom}" type="${type}" value="${Fmt.echapper(valeur || '')}" ${attributs}></div>`;
    const utilisateur = App.etat.utilisateur;
    zone.innerHTML = entetePage({ titre: 'Paramètres de la plateforme', sous: 'Configurez les emails, les coordonnées et les préférences de votre plateforme.' }) + `
      <div class="carte">
        <div class="carte-entete"><h3>Compte propriétaire</h3></div>
        <div class="carte-corps">
          <b>${Fmt.echapper(utilisateur.nom)}</b><div>${Fmt.echapper(utilisateur.email)}</div>
          <p class="aide">Le compte propriétaire n’est pas soumis à la vérification des emails des entreprises clientes.</p>
          <button class="btn" id="pp-securite">Mon profil et mon mot de passe</button>
        </div>
      </div>
      <div class="carte">
        <div class="carte-entete"><h3>Envoi des emails — Gmail / Google Workspace</h3><span class="badge ${smtp.configure ? 'attente' : 'ko'}">${smtp.configure ? 'Renseigné · connexion à vérifier' : 'Envoi non configuré'}</span></div>
        <div class="carte-corps">
          <div class="bandeau ${smtp.problemes && smtp.problemes.length ? 'ko' : (smtp.configure ? 'attente' : 'ko')}" id="pp-etat-smtp">${smtp.problemes && smtp.problemes.length ? smtp.problemes.map(Fmt.echapper).join(' ') : (smtp.configure ? 'La configuration est renseignée. Vérifiez la connexion puis envoyez un email de test.' : 'Aucun code ne peut être livré par email tant que les identifiants d’envoi ne sont pas enregistrés.')}</div>
          <ol class="aide"><li>Activez la validation en deux étapes du compte Google expéditeur.</li>
            <li>Créez un <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">mot de passe d’application Google</a> pour Inventa GestyPro.</li>
            <li>Renseignez l’adresse Gmail complète et ce mot de passe d’application ci-dessous.</li>
            <li>Enregistrez, vérifiez la connexion, puis envoyez un email de test. Les entreprises pourront ensuite demander un nouveau code.</li></ol>
          <p class="aide">Certaines organisations Google Workspace désactivent les mots de passe d’application. Dans ce cas, contactez leur administrateur. <a href="https://support.google.com/mail/answer/185833?hl=fr" target="_blank" rel="noopener noreferrer">Aide Google</a></p>
          ${smtp.environnement.length ? `<div class="bandeau attente">Certains réglages sont imposés par le serveur : ${smtp.environnement.map(Fmt.echapper).join(', ')}. Les valeurs du serveur sont prioritaires.</div>` : ''}
          <form id="pp-form-smtp">
            <div class="grille-form">
              ${champ('smtp_host', 'Serveur SMTP', p.smtp_host || 'smtp.gmail.com', 'text', 'required autocomplete="off"')}
              ${champ('smtp_port', 'Port', p.smtp_port || '587', 'number', 'required min="1" max="65535"')}
              <div class="champ"><label for="pp-smtp_secure">Sécurité de la connexion</label><select id="pp-smtp_secure" name="smtp_secure"><option value="false">STARTTLS · port 587</option><option value="true" ${smtp.secure ? 'selected' : ''}>TLS direct · port 465</option></select></div>
              ${champ('smtp_user', 'Adresse Gmail expéditrice', p.smtp_user || utilisateur.email, 'email', 'required autocomplete="username"')}
              ${champ('smtp_pass', 'Mot de passe d’application Google', '', 'password', `${smtp.mot_de_passe_defini ? '' : 'required'} autocomplete="new-password" placeholder="${smtp.mot_de_passe_defini ? 'Déjà enregistré · laisser vide pour conserver' : '16 caractères fournis par Google'}"`)}
              ${champ('mail_from', 'Adresse expéditeur', p.mail_from || p.smtp_user || utilisateur.email, 'text', 'required')}
              ${champ('app_url', 'Adresse de connexion de l’application', p.app_url || location.origin, 'url', 'required')}
            </div>
            <p class="aide">L’adresse de connexion est insérée dans les emails. En ligne, renseignez l’adresse publique de l’application ; localhost fonctionne uniquement sur ce poste.</p>
            <div class="barre-outils"><button class="btn primaire" type="submit">Enregistrer Gmail</button><button class="btn" type="button" id="pp-verifier">Vérifier la connexion</button></div>
          </form>
          <div id="pp-resultat-smtp" role="status" aria-live="polite"></div>
          <form id="pp-form-test" class="barre-outils" style="margin-top:16px">
            <div class="champ"><label for="pp-email-test">Destinataire de l’email de test</label><input id="pp-email-test" type="email" value="${Fmt.echapper(utilisateur.email)}" required></div>
            <button class="btn" type="submit">Envoyer un email de test</button>
          </form>
          <div id="pp-resultat-test" role="status" aria-live="polite"></div>
          <a class="btn petit" href="#/plateforme-mails">Consulter le journal des emails</a>
        </div>
      </div>
      <div class="carte"><div class="carte-entete"><h3>Paiements en ligne</h3></div><div class="carte-corps"><p>Activez votre compte marchand pour recevoir les paiements Visa, Mastercard, Orange Money et MTN. Les débits et validations sur téléphone sont traités par le prestataire de paiement.</p><a class="btn primaire" href="#/plateforme-tarifs">Configurer le prestataire de paiement</a></div></div><div class="carte"><div class="carte-entete"><h3>Coordonnées et assistance</h3></div><div class="carte-corps">
        <form id="pp-form-contact"><div class="grille-form">
          ${champ('paiement_marchand', 'Nom du bénéficiaire des paiements', p.paiement_marchand)}
          ${champ('support_email', 'Email d’assistance', p.support_email, 'email')}
          ${champ('whatsapp_support', 'Numéro WhatsApp', p.whatsapp_support)}
          ${champ('om_numero', 'Numéro Orange Money', p.om_numero)}
          ${champ('mtn_numero', 'Numéro MTN MoMo', p.mtn_numero)}
        </div><button class="btn primaire" type="submit">Enregistrer les coordonnées</button></form>
        <div class="barre-outils"><a class="btn" href="#/plateforme-tarifs">Abonnements et tarifs</a><a class="btn" href="#/plateforme-mails">Journal des emails</a></div>
      </div></div>
      <div class="carte"><div class="carte-entete"><h3>Apparence</h3></div><div class="carte-corps grille g-2">
        <div class="champ"><label for="pp-langue">Langue</label><select id="pp-langue">${Object.values(LANGUES).map(l => `<option value="${l.code}" ${I18n.langue === l.code ? 'selected' : ''}>${l.nom}</option>`).join('')}</select></div>
        <div class="champ"><label for="pp-devise">Devise d’affichage</label><select id="pp-devise">${Devises.options()}</select><p class="aide">La devise automatique suit la langue : français/espagnol/allemand/italien → EUR, anglais → USD, mandarin → CNY, arabe → SAR, russe → RUB. Vous pouvez choisir FCFA, CAD, NGN ou une autre devise manuellement.</p></div><div class="barre-outils"><button class="btn" id="pp-clair">Clair</button><button class="btn" id="pp-sombre">Sombre</button></div>
      </div></div>`;
    const resultat = (id, message, succes) => { zone.querySelector(id).innerHTML = `<div class="bandeau ${succes ? 'ok' : 'ko'}" style="margin-top:12px">${Fmt.echapper(message)}</div>`; };
    let modifie = false;
    const form = zone.querySelector('#pp-form-smtp');
    form.oninput = () => { modifie = true; };
    zone.querySelector('#pp-smtp_secure').onchange = (ev) => { zone.querySelector('#pp-smtp_port').value = ev.target.value === 'true' ? '465' : '587'; modifie = true; };
    form.onsubmit = async ev => {
      ev.preventDefault(); const bouton = ev.submitter || form.querySelector('[type=submit]'); bouton.disabled = true;
      try {
        const valeurs = lireFormulaire(form); if (!valeurs.smtp_pass) delete valeurs.smtp_pass;
        await Api.put('/plateforme/parametres', valeurs); modifie = false;
        form.querySelector('[name=smtp_pass]').value = '';
        form.querySelector('[name=smtp_pass]').placeholder = 'Déjà enregistré · laisser vide pour conserver';
        zone.querySelector('#pp-etat-smtp').textContent = 'Configuration enregistrée. Vérifiez maintenant la connexion.';
        resultat('#pp-resultat-smtp', 'Configuration enregistrée. Aucun email n’a encore été envoyé.', true);
      } catch (e) { resultat('#pp-resultat-smtp', e.message, false); } finally { bouton.disabled = false; }
    };
    zone.querySelector('#pp-verifier').onclick = async ev => {
      if (modifie) return resultat('#pp-resultat-smtp', 'Enregistrez les modifications avant de tester la connexion.', false);
      const bouton = ev.currentTarget; bouton.disabled = true;
      try { await Api.post('/plateforme/mails/verifier-connexion'); resultat('#pp-resultat-smtp', 'Connexion SMTP réussie. Vous pouvez envoyer un email de test.', true); }
      catch(e) { resultat('#pp-resultat-smtp', e.message, false); } finally { bouton.disabled = false; }
    };
    zone.querySelector('#pp-form-test').onsubmit = async ev => {
      ev.preventDefault(); if (modifie) return resultat('#pp-resultat-test', 'Enregistrez les modifications avant l’envoi.', false);
      const bouton = ev.submitter || ev.target.querySelector('button'); bouton.disabled = true;
      try { const r = await Api.post('/plateforme/mails/tester', { email: zone.querySelector('#pp-email-test').value }); resultat('#pp-resultat-test', r.ok ? 'Email de test transmis au serveur Gmail. Vérifiez votre boîte de réception et les indésirables.' : 'Échec de l’envoi : ' + (r.erreur || r.statut), r.ok); }
      catch(e) { resultat('#pp-resultat-test', e.message, false); } finally { bouton.disabled = false; }
    };
    zone.querySelector('#pp-form-contact').onsubmit = async ev => { ev.preventDefault(); try { await Api.put('/plateforme/parametres', lireFormulaire(ev.target)); notifier('Coordonnées enregistrées'); } catch(e) { notifier(e.message, 'erreur'); } };
    zone.querySelector('#pp-securite').onclick = () => App.modaleProfil();
    zone.querySelector('#pp-langue').onchange = ev => I18n.changerLangue(ev.target.value);
    zone.querySelector('#pp-devise').onchange = ev => { Devises.choisir(ev.target.value); App.rendreCoquille(); App.monter('plateforme-parametres'); };
    zone.querySelector('#pp-clair').onclick = () => I18n.changerTheme('clair');
    zone.querySelector('#pp-sombre').onclick = () => I18n.changerTheme('sombre');
  }
});
