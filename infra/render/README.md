# Render Infrastructure

Ce dossier contient des exemples de fichiers de configuration pour déployer TwinMind Snake sur la plateforme [Render](https://render.com/). Render permet de déployer à la fois des applications statiques et des services Node.js avec un minimum de configuration.

## Services à créer

TwinMind Snake nécessite deux services :

1. **Client (Static Site)**
   * **Type** : *Static Site*
   * **Repository** : Ce dépôt
   * **Branch** : `main` ou `staging`
   * **Build Command** : `npm --workspaces=false --prefix client install && npm --prefix client run build`
   * **Publish Directory** : `client/dist`

2. **Serveur (Web Service)**
   * **Type** : *Web Service*
   * **Runtime** : *Node.js*
   * **Repository** : Ce dépôt
   * **Branch** : `main` ou `staging`
   * **Build Command** : `npm --workspaces=false --prefix server install && npm --prefix server run build`
   * **Start Command** : `node server/dist/server.js`
   * **Env Vars** : définir `CONSENSUS_WINDOW_MS`, `ROOM_TICK`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `PORT` selon vos besoins.

Un exemple de fichier YAML pour Render se trouve ci-dessous. Ce fichier n'est pas utilisé directement par Render mais peut servir de documentation et de base pour automatiser votre déploiement via l'API Render.
