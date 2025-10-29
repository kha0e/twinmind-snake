# TwinMind Snake

TwinMind Snake est un jeu coopératif de type « snake » dans lequel deux joueurs contrôlent un seul serpent de largeur **2 cases**. Le serpent ne peut tourner que si les deux joueurs choisissent la même direction dans une fenêtre de synchronisation configurable. En cas de désaccord, il continue tout droit. L'objectif est de ramasser des fruits sans entrer en collision avec des murs, son propre corps ou des obstacles.

## Fonctionnalités principales (S1)

* **Consensus à deux joueurs :** un seul serpent est contrôlé par deux cerveaux. Toutes les `WINDOW_MS` millisecondes, les intentions des deux joueurs sont agrégées. Si elles concordent, la direction change. Sinon le serpent poursuit sa course.
* **Serpent de largeur 2 cases :** la grille occupe une perspective isométrique simple pour une bonne lisibilité. Le serpent occupe deux cases en largeur, ce qui modifie la manière de naviguer dans les goulots.
* **Temps réel :** le serveur est autoritatif et envoie des instantanés à 10 Hz. Le client prédit l'état localement entre les corrections.
* **Cartes variées :** trois thèmes sont fournis (hangar, jardin zen et circuit néon) avec des obstacles simples. Les cartes sont générées à partir d'un seed communiqué au début de la partie.
* **Power‑ups :** deux bonus sont disponibles : **Affinage** (le serpent se rétrécit temporairement pour traverser des ponts étroits) et **Ancre** (bloque la direction pendant un tick pour éviter des désaccords accidentels).

## Démarrage rapide

Ce dépôt utilise une structure **monorepo** avec deux packages : `client` et `server`. Chaque package contient son propre `package.json` et peut être développé indépendamment.

### Prérequis

* **Node.js >= 18**
* **pnpm** (recommandé) ou `npm`
* (facultatif) **Docker** pour tester les images de production

### Installation

```bash
git clone https://github.com/<votre-org>/twinmind-snake.git
cd twinmind-snake
pnpm install # installe les dépendances du client et du serveur
```

### Lancer le serveur en développement

```bash
cd server
pnpm dev
```

Le serveur démarre par défaut sur le port `4000` et expose un WebSocket à l'URL `ws://localhost:4000`.

### Lancer le client en développement

Dans un autre terminal :

```bash
cd client
pnpm dev
```

Le client est servi via Vite sur `http://localhost:5173` et se connecte automatiquement au serveur WebSocket en se basant sur la variable d'environnement `VITE_WS_URL`.

### Construction pour la production

```bash
cd server && pnpm build
cd ../client && pnpm build
```

### Déploiement sur Render

Deux services Render doivent être configurés :

1. **Service Web** (client) :
   * Type : *Static Site*
   * Build : `pnpm --filter client --filter server install && pnpm --filter client build`
   * Répertoire public : `client/dist`

2. **Service Web** (serveur) :
   * Type : *Web Service*
   * Runtime : *Node.js*
   * Build : `pnpm --filter server install && pnpm --filter server build`
   * Commande de démarrage : `node dist/server.js`
   * Variables d'environnement : voir la section [Env vars](#variables-denvironnement)

### Variables d'environnement

Le jeu est configuré via des variables d'environnement :

| Nom                 | Description                                                   | Exemple                          |
|---------------------|---------------------------------------------------------------|----------------------------------|
| `DATABASE_URL`      | Chaîne de connexion PostgreSQL                               | `postgresql://user:pass@...`     |
| `REDIS_URL`         | URL de connexion Redis (optionnel pour un usage local)       | `redis://localhost:6379`         |
| `JWT_SECRET`        | Secret pour signer les tokens JSON Web Token                 | `supersecretjwtkey`              |
| `ROOM_TICK`         | Vitesse du tick serveur en ms (default : `100`)              | `100`                            |
| `CONSENSUS_WINDOW_MS`| Fenêtre de consensus en ms (default : `120`)                | `120`                            |
| `ROOM_CAPACITY`     | Nombre maximum de joueurs par salle                          | `2`                              |

Pour la production sur Render, créez ces variables via l'interface et associez‑les au service `server`.

## Arborescence

```
/ (mono-repo)
  /client          # Application front-end (PixiJS + Vite)
    /src
    /public
    /assets
    Dockerfile
  /server          # Serveur Node.js autoritatif (WebSocket)
    /src
    /rooms
    Dockerfile
  /infra/render    # Fichiers spécifiques à Render (déploiement)
  .github/workflows
  README.md
```

## Licence

Ce projet est distribué sous licence MIT. Voir le fichier `LICENSE` pour plus d'informations.
