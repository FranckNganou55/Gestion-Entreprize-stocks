const { env } = require('./runtime');
async function register(data) {
  const { signup } = await import('@netlify/identity');
  return signup(String(data.email).trim().toLowerCase(), String(data.mot_de_passe), {
    full_name: [data.prenom_contact, data.nom_contact].filter(Boolean).join(' ') || data.nom,
  });
}
async function resend(email) {
  // GoTrue resends confirmation for an existing unconfirmed signup. The business
  // account continues to use its existing password hash, never a cleartext copy.
  const { signup } = await import('@netlify/identity');
  const { randomBytes } = require('node:crypto');
  await signup(email, randomBytes(32).toString('base64url'));
}
async function confirm(token) {
  const { confirmEmail } = await import('@netlify/identity');
  const identity = await confirmEmail(token);
  if (!identity.email || !identity.confirmedAt) throw new Error('Confirmation invalide.');
  const { db } = require('./db');
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(identity.email.toLowerCase());
  if (!user || !user.actif) throw new Error('Compte introuvable.');
  db.prepare("UPDATE users SET email_verifie=1, email_verifie_at=datetime('now','localtime') WHERE id=?").run(user.id);
  return { token: require('./auth').sign(user) };
}
function provisionOwner(identity) {
  const expected = String(env('OWNER_EMAIL') || require('./entreprises').PROPRIETAIRE.email).trim().toLowerCase();
  if (!identity.confirmedAt || identity.email?.toLowerCase() !== expected || !identity.roles?.includes('admin')) return null;
  const { db } = require('./db');
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(expected);
  if (user) return user.role === 'super_admin' ? user : null;
  const { randomBytes } = require('node:crypto');
  const hash = require('bcryptjs').hashSync(randomBytes(48).toString('base64url'), 10);
  const result = db.prepare("INSERT INTO users (nom,email,mot_de_passe,role,actif,email_verifie) VALUES (?,?,?,'super_admin',1,1)").run(identity.name || 'Propriétaire', expected, hash);
  return db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);
}
async function ownerLogin(email, password) {
  const expected = String(env('OWNER_EMAIL') || require('./entreprises').PROPRIETAIRE.email).trim().toLowerCase();
  if (String(email).trim().toLowerCase() !== expected) return null;
  const { login } = await import('@netlify/identity');
  return provisionOwner(await login(email, password));
}
async function acceptOwnerInvite(token, password) {
  if (typeof password !== 'string' || password.length < 12) throw new Error('Choisissez un mot de passe d’au moins 12 caractères.');
  const { acceptInvite } = await import('@netlify/identity');
  const user = provisionOwner(await acceptInvite(token, password));
  if (!user) throw new Error('Cette invitation ne permet pas d’activer le compte propriétaire. Vérifiez son adresse et son rôle dans Netlify.');
  return { token: require('./auth').sign(user) };
}
module.exports = { register, resend, confirm, ownerLogin, acceptOwnerInvite };
