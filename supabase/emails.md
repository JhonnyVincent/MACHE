# Templates d'e-mail Supabase

À coller dans **Dashboard Supabase → Authentication → Emails**.

Ces deux templates sont nécessaires au fonctionnement de l'authentification :
le code applicatif sait les traiter, mais c'est le template qui décide de la
forme de ce que reçoit l'utilisateur.

---

## 1. Magic Link — connexion par code

Onglet **Magic Link**. Par défaut ce template envoie un lien ; la page
`/login/code` attend un code à 6 chiffres. C'est `{{ .Token }}` qui affiche
ce code.

**Objet :** `Votre code de connexion Maché`

```html
<h2>Votre code de connexion</h2>

<p>Entrez ce code sur Maché pour vous connecter :</p>

<p style="font-size:30px;font-weight:bold;letter-spacing:6px;margin:24px 0">
  {{ .Token }}
</p>

<p style="color:#666;font-size:13px">
  Ce code expire dans quelques minutes. Si vous n'avez pas demandé à vous
  connecter, ignorez cet e-mail.
</p>
```

---

## 2. Reset Password — réinitialisation du mot de passe

Onglet **Reset Password**. Le template par défaut produit un lien `?code=`
qui repose sur le flux PKCE : il ne fonctionne que dans le navigateur ayant
fait la demande, et échoue donc quand l'e-mail est ouvert depuis Gmail ou
depuis un autre appareil (erreur « PKCE code verifier not found in storage »).

`{{ .TokenHash }}` produit un lien validé côté serveur, qui fonctionne
partout.

**Objet :** `Réinitialiser votre mot de passe Maché`

```html
<h2>Réinitialiser votre mot de passe</h2>

<p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>

<p>
  <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">
    Choisir un nouveau mot de passe
  </a>
</p>

<p style="color:#666;font-size:13px">
  Ce lien expire dans une heure. Si vous n'avez pas fait cette demande,
  ignorez cet e-mail.
</p>
```

---

## Réglages liés

**Authentication → URL Configuration**

- **Site URL** : `https://mache-two.vercel.app` (sans `/` final)
- **Redirect URLs** : y ajouter `https://mache-two.vercel.app/**`, et les
  URL de prévisualisation Vercel si vous testez dessus.

**Authentication → Providers → Email**

- **Confirm email** : peut être désactivé temporairement pour tester, mais
  doit être réactivé avant l'ouverture au public. Sans confirmation,
  n'importe qui peut créer un compte avec l'adresse d'un tiers.
