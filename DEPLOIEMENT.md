# 🚀 Déploiement de meshmakeupstudio.com

Site **100 % statique** (pas de back-end). Domaine sur **Cloudflare**, déjà pointé vers le serveur.
Cible : serveur **Ubuntu** (`makeup`), accès via le **terminal web** (bastion), en **root**.

> ⚠️ `scp` direct depuis ton Mac ne marche pas (le serveur est sur un réseau privé,
> joignable seulement via le bastion web). Les fichiers arrivent donc soit par **git**,
> soit par le **bouton d'upload** de ton terminal web s'il en a un.

---

## ÉTAPE 1 — Mettre les fichiers sur le serveur

Choisis **UNE** des deux méthodes.

### Méthode A — Ton terminal web a un bouton « Upload » (le plus simple)
1. Sur ce Mac, le fichier **`~/Desktop/meshmakeupstudio.tar.gz`** est prêt (4,7 Mo).
2. Dans ton terminal web, utilise le bouton d'upload pour l'envoyer sur le serveur.
3. Puis colle (le fichier arrive en général dans `/root` ou ton dossier perso) :

```bash
mkdir -p /var/www/meshmakeupstudio
# adapte le chemin si l'upload l'a mis ailleurs (vérifie avec : ls -lh ~)
tar xzf ~/meshmakeupstudio.tar.gz -C /var/www/meshmakeupstudio
```

### Méthode B — via GitHub (universelle, recommandée — et facilite les mises à jour)
**B.1 — Publier le code sur GitHub (dans le navigateur, pas de scp) :**
1. Va sur **github.com**, connecte-toi (crée un compte gratuit si besoin).
2. **New repository** → nom : `meshmakeupstudio` → coche **Public** → **Create repository**.
3. Clique **« uploading an existing file »**.
4. Depuis le dossier `Desktop/MESH Site`, **glisse-dépose** tous les fichiers **+ le dossier `images`**
   (inutile d'envoyer `À-COMPLÉTER.md` / `DEPLOIEMENT.md`).
5. **Commit changes**.

**B.2 — Sur le serveur, colle :**
```bash
rm -rf /var/www/meshmakeupstudio
git clone https://github.com/TON-UTILISATEUR/meshmakeupstudio.git /var/www/meshmakeupstudio
```
> Remplace `TON-UTILISATEUR` par ton identifiant GitHub.

---

## ÉTAPE 2 — Installer et configurer le serveur web (à coller, en root)

```bash
# 1) Paquets nécessaires
apt update && apt install -y nginx git

# 2) Droits sur les fichiers
chown -R www-data:www-data /var/www/meshmakeupstudio
find /var/www/meshmakeupstudio -type d -exec chmod 755 {} \;
find /var/www/meshmakeupstudio -type f -exec chmod 644 {} \;

# 3) Configuration du site nginx
cat > /etc/nginx/sites-available/meshmakeupstudio <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name meshmakeupstudio.com www.meshmakeupstudio.com;

    root /var/www/meshmakeupstudio;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Mise en cache des images & assets
    location ~* \.(jpg|jpeg|png|svg|webp|css|js|ico)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # Bloquer l'accès aux fichiers cachés (.git, etc.)
    location ~ /\. { deny all; }
}
EOF

# 4) Activer le site, désactiver le site par défaut, tester et recharger
ln -sf /etc/nginx/sites-available/meshmakeupstudio /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 5) Pare-feu (si ufw est actif)
ufw allow 80/tcp  2>/dev/null
ufw allow 443/tcp 2>/dev/null
true

# 6) Test local sur le serveur (doit répondre "200 OK")
curl -I http://localhost
```

---

## ÉTAPE 3 — Cloudflare (dans le navigateur)

1. **DNS** → vérifie qu'il y a bien 2 enregistrements **A** pointant vers l'IP publique du serveur :
   - `meshmakeupstudio.com`
   - `www`
   (nuage **orange** = proxy activé : recommandé)
2. **SSL/TLS → Overview** → choisis le mode :
   - **Pour aller vite (mise en ligne immédiate) : `Flexible`.**
     → Les visiteurs ont le HTTPS via Cloudflare, le serveur sert en HTTP simple sur le port 80.
     Aucun certificat à installer. Parfait pour un site vitrine sans données sensibles.
   - (Plus tard, pour durcir : `Full (strict)` + certificat d'origine Cloudflare sur nginx — je te
     donnerai les étapes si tu veux.)
3. **SSL/TLS → Edge Certificates** → active **« Always Use HTTPS »**.

---

## ÉTAPE 4 — Vérifier

- Ouvre **https://meshmakeupstudio.com** → le site doit s'afficher avec le cadenas 🔒.
- Teste **www.meshmakeupstudio.com**, le menu, le bouton WhatsApp, le formulaire.
- Si une vieille version s'affiche : vide le cache (Cmd+Shift+R) ou purge le cache dans
  Cloudflare (**Caching → Configuration → Purge Everything**).

---

## 🔁 Mises à jour futures

- **Méthode A (tarball)** : je refais l'archive → tu la re-uploades → tu rejoues l'`tar xzf …`.
- **Méthode B (git)** : tu mets à jour le dépôt GitHub, puis sur le serveur :
```bash
cd /var/www/meshmakeupstudio && git pull && chown -R www-data:www-data .
```

---

## ℹ️ Notes
- L'archive prête : `~/Desktop/meshmakeupstudio.tar.gz`
- Un dépôt git local est déjà initialisé dans `Desktop/MESH Site` (1 commit).
- `À-COMPLÉTER.md` et ce guide ne sont **pas** déployés (fichiers internes).
