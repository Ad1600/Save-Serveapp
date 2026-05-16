# 🥗 Food Anti-Gaspillage — Backend API

## 🚀 Installation et démarrage

### Prérequis
- Node.js v18+
- MongoDB (local ou MongoDB Atlas)

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer l'environnement
Modifiez le fichier `.env` :
```
MONGO_URI=mongodb://localhost:27017/foodapp
JWT_SECRET=secret_foodapp_2025_change_moi
PORT=5000
```

### 3. Démarrer le serveur
```bash
node server.js
```
Le serveur démarre sur `http://localhost:5000`

### 4. Ouvrir l'interface de test
Ouvrez `test-interface.html` dans votre navigateur.

---

## 📡 Routes API

### 🔐 Authentification
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/inscription | Créer un compte |
| POST | /api/auth/connexion | Se connecter |

### 🏪 Offres
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | /api/offres | ❌ | Liste des offres disponibles |
| GET | /api/offres/:id | ❌ | Détail d'une offre |
| POST | /api/offres | Commerçant | Créer une offre |
| PUT | /api/offres/:id | Commerçant | Modifier une offre |
| DELETE | /api/offres/:id | Commerçant | Supprimer une offre |

### 📦 Commandes
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | /api/commandes | Client | Créer une réservation |
| GET | /api/commandes/mes-commandes | Client | Mes commandes |
| DELETE | /api/commandes/:id/annuler | Client | Annuler sa commande |
| GET | /api/commandes/mes-offres | Commerçant | Réservations reçues |
| PUT | /api/commandes/:id/confirmer | Commerçant | Confirmer |
| PUT | /api/commandes/:id/prete | Commerçant | Marquer prête |
| PUT | /api/commandes/:id/recuperee | Commerçant | Valider récupération |
| PUT | /api/commandes/:id/refuser | Commerçant | Refuser/annuler |
| GET | /api/commandes/:id | Client/Commerçant | Détail d'une commande |
| GET | /api/commandes | Admin | Toutes les commandes |

### 📊 Stats & Notifications
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | /api/stats/moi | Connecté | Mes statistiques |
| GET | /api/stats/notifications | Connecté | Mes notifications |
| PUT | /api/stats/notifications/:id/lu | Connecté | Marquer comme lue |

---

## 🔄 Cycle de vie d'une commande
```
EN_ATTENTE → CONFIRMEE → PRETE → RECUPEREE
     ↓              ↓        ↓
   ANNULEE       ANNULEE  ANNULEE
```
