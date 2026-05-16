require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Models inline pour éviter les imports ──
const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  telephone: { type: String },
  photo: { type: String },
  adresse: { type: String },
  isConnected: { type: Boolean, default: false },
  role: { type: String, enum: ['client', 'commercant', 'admin'], default: 'client' },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offre' }],
  nomCommerce: { type: String },
  adresseCommerce: { type: String },
  descriptionShop: { type: String },
  totalUsers: { type: Number, default: 0 },
  totalSellers: { type: Number, default: 0 },
  totalClients: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  co2Saved: { type: Number, default: 0 },
  mealsSaved: { type: Number, default: 0 },
  latitude: { type: Number },
  longitude: { type: Number },
  actif: { type: Boolean, default: true },
  emailVerifie: { type: Boolean, default: true },
  codeVerif: { type: String },
  codeVerifExpiry: { type: Date }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const offreSchema = new mongoose.Schema({
  commercant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  titre: { type: String, required: true },
  description: { type: String },
  prixOriginal: { type: Number },
  prix: { type: Number, required: true },
  quantiteDisponible: { type: Number, required: true, min: 0 },
  minQuantiteParReservation: { type: Number, default: 1 },
  maxQuantiteParReservation: { type: Number, default: 10 },
  dateExpiration: { type: Date, required: true },
  statut: { type: String, enum: ['disponible', 'epuisee', 'expiree'], default: 'disponible' },
  categorie: { type: String, enum: ['boulangerie', 'restaurant', 'epicerie', 'autre'], default: 'autre' },
  photo: { type: String },
  active: { type: Boolean, default: true },
  recurrence: { type: String, enum: ['', 'quotidien', 'hebdomadaire', 'weekend'], default: '' },
  dernierePublication: { type: Date },
  adresse: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  // ✅ Added pickupStart / pickupEnd for edit mode compatibility
  pickupStart: { type: String, default: '' },
  pickupEnd: { type: String, default: '' }
}, { timestamps: true });
offreSchema.index({ location: '2dsphere' });
const Offre = mongoose.model('Offre', offreSchema);

const historiqueSchema = new mongoose.Schema({
  ancienStatut: { type: String },
  nouveauStatut: { type: String, required: true },
  modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  raison: { type: String },
  date: { type: Date, default: Date.now }
});
const commandeSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offre: { type: mongoose.Schema.Types.ObjectId, ref: 'Offre', required: true },
  commercant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prixUnitaire: { type: Number, required: true },
  prixTotal: { type: Number, required: true },
  quantite: { type: Number, required: true, min: 1 },
  statut: { type: String, enum: ['EN_ATTENTE', 'CONFIRMEE', 'PRETE', 'RECUPEREE', 'ANNULEE'], default: 'EN_ATTENTE' },
  pickupDeadline: { type: Date },
  codeRetrait: { type: String, unique: true },
  notes: { type: String },
  raisonAnnulation: { type: String },
  annuleePar: { type: String, default: null },
  historique: [historiqueSchema]
}, { timestamps: true });
const Commande = mongoose.model('Commande', commandeSchema);

const notifSchema = new mongoose.Schema({
  destinataire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  titre: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['nouvelle_offre', 'confirmation', 'annulation', 'prete', 'recuperee'], required: true },
  commande: { type: mongoose.Schema.Types.ObjectId, ref: 'Commande' },
  lu: { type: Boolean, default: false },
  readAt: { type: Date, default: null }
}, { timestamps: true });
const Notification = mongoose.model('Notification', notifSchema);

const demandeVendeurSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nomCommerce: { type: String, required: true },
  adresseCommerce: { type: String, required: true },
  descriptionShop: { type: String, required: true },
  telephone: { type: String, required: true },
  categorie: { type: String, enum: ['boulangerie', 'restaurant', 'epicerie', 'autre'], required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  statut: { type: String, enum: ['EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'], default: 'EN_ATTENTE' },
  raisonRefus: { type: String }
}, { timestamps: true });
const DemandeVendeur = mongoose.model('DemandeVendeur', demandeVendeurSchema);

// ── Générateur de code retrait ──
const genCode = () => {
  const l = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return `${l[Math.floor(Math.random()*26)]}${l[Math.floor(Math.random()*26)]}${l[Math.floor(Math.random()*26)]}-${Math.floor(1000+Math.random()*9000)}`;
};

// ── Real Unsplash photos (full URLs → offerService.getOfferImageUrl handles them directly) ──
const PHOTOS = {
  pain:        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
  patisseries: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
  couscous:    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  tajine:      'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  epicerie:    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
  cafe:        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',
  admin:       'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
  karim:       'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  fatima:      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  ahmed:       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
  sara:        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/foodapp');
    console.log('✅ Connecté à MongoDB');

    // ── Nettoyer les collections ──
    await User.deleteMany({});
    await Offre.deleteMany({});
    await Commande.deleteMany({});
    await Notification.deleteMany({});
    await DemandeVendeur.deleteMany({});
    console.log('🧹 Base de données nettoyée');

    // ── Créer les utilisateurs ──
    const mdpHash = await bcrypt.hash('password123', 10);

    const admin = await User.create({
      nom: 'Admin Système', email: 'admin@foodapp.com',
      motDePasse: mdpHash, role: 'admin',
      telephone: '0550000000', photo: PHOTOS.admin,
      adresse: 'Alger Centre', isConnected: true,
      totalUsers: 4, totalSellers: 2, totalClients: 2, totalRevenue: 1400,
      co2Saved: 50, mealsSaved: 10, actif: true, emailVerifie: true
    });

    const commercant1 = await User.create({
      nom: 'Karim Benali', email: 'boulangerie@foodapp.com',
      motDePasse: mdpHash, role: 'commercant',
      telephone: '0551111111', photo: PHOTOS.karim,
      adresse: '8 Rue Asselah Hocine, Alger', isConnected: false,
      nomCommerce: 'Boulangerie El Baraka',
      adresseCommerce: '12 Rue Didouche Mourad, Alger',
      descriptionShop: 'Boulangerie traditionnelle avec pains frais et pâtisseries',
      latitude: 36.7762, longitude: 3.0597, actif: true, emailVerifie: true
    });

    const commercant2 = await User.create({
      nom: 'Fatima Cherif', email: 'restaurant@foodapp.com',
      motDePasse: mdpHash, role: 'commercant',
      telephone: '0552222222', photo: PHOTOS.fatima,
      adresse: '5 Boulevard Zighoud Youcef, Alger', isConnected: true,
      nomCommerce: 'Restaurant Chez Fatima',
      adresseCommerce: '3 Rue Khelifa Boukhalfa, Hydra',
      descriptionShop: 'Restaurant familial servant cuisine algérienne authentique',
      latitude: 36.7642, longitude: 3.0505, actif: true, emailVerifie: true
    });

    const client1 = await User.create({
      nom: 'Ahmed Meziane', email: 'ahmed@foodapp.com',
      motDePasse: mdpHash, role: 'client',
      telephone: '0553333333', photo: PHOTOS.ahmed,
      adresse: 'Alger Centre', isConnected: false,
      latitude: 36.7762, longitude: 3.0597, actif: true, emailVerifie: true,
      favorites: []
    });

    const client2 = await User.create({
      nom: 'Sara Hadj', email: 'sara@foodapp.com',
      motDePasse: mdpHash, role: 'client',
      telephone: '0554444444', photo: PHOTOS.sara,
      adresse: 'Hydra, Alger', isConnected: true,
      latitude: 36.7525, longitude: 3.0325, actif: true, emailVerifie: true,
      favorites: []
    });

    console.log('👥 Utilisateurs créés');

    // ── Créer les offres avec pickupStart / pickupEnd ──
    const demain = new Date(Date.now() + 86400000);
    const apresdemain = new Date(Date.now() + 172800000);

    const offre1 = await Offre.create({
      commercant: commercant1._id,
      titre: 'Lot de pains du jour',
      description: 'Assortiment de pains variés invendus, encore très frais',
      prix: 150, prixOriginal: 400,
      quantiteDisponible: 3,
      minQuantiteParReservation: 1, maxQuantiteParReservation: 3,
      dateExpiration: demain, statut: 'disponible', categorie: 'boulangerie',
      photo: PHOTOS.pain, active: true,
      recurrence: 'quotidien', dernierePublication: new Date(),
      adresse: '12 Rue Didouche Mourad, Alger',
      location: { type: 'Point', coordinates: [3.0597, 36.7762] },
      pickupStart: '08:00',
      pickupEnd: '11:00'
    });

    const offre2 = await Offre.create({
      commercant: commercant1._id,
      titre: 'Pâtisseries du soir',
      description: 'Croissants, pains au chocolat et gâteaux du jour',
      prix: 200, prixOriginal: 600,
      quantiteDisponible: 5,
      minQuantiteParReservation: 1, maxQuantiteParReservation: 5,
      dateExpiration: demain, statut: 'disponible', categorie: 'boulangerie',
      photo: PHOTOS.patisseries, active: true,
      recurrence: 'quotidien', dernierePublication: new Date(),
      adresse: '3 Rue Khelifa Boukhalfa, Hydra',
      location: { type: 'Point', coordinates: [3.0621, 36.7798] },
      pickupStart: '17:00',
      pickupEnd: '20:00'
    });

    const offre3 = await Offre.create({
      commercant: commercant2._id,
      titre: 'Menu midi invendu',
      description: 'Plat du jour complet : couscous + boisson',
      prix: 300, prixOriginal: 800,
      quantiteDisponible: 2,
      minQuantiteParReservation: 1, maxQuantiteParReservation: 2,
      dateExpiration: demain, statut: 'disponible', categorie: 'restaurant',
      photo: PHOTOS.couscous, active: true,
      recurrence: 'quotidien', dernierePublication: new Date(),
      adresse: '5 Boulevard Zighoud Youcef, Alger',
      location: { type: 'Point', coordinates: [3.0505, 36.7642] },
      pickupStart: '13:00',
      pickupEnd: '15:00'
    });

    const offre4 = await Offre.create({
      commercant: commercant2._id,
      titre: 'Tajine de légumes',
      description: 'Tajine maison préparé ce matin, à consommer aujourd\'hui',
      prix: 250, prixOriginal: 700,
      quantiteDisponible: 4,
      minQuantiteParReservation: 1, maxQuantiteParReservation: 4,
      dateExpiration: apresdemain, statut: 'disponible', categorie: 'restaurant',
      photo: PHOTOS.tajine, active: true,
      recurrence: 'hebdomadaire', dernierePublication: new Date(),
      adresse: '3 Rue Khelifa Boukhalfa, Hydra',
      location: { type: 'Point', coordinates: [3.0412, 36.7553] },
      pickupStart: '12:00',
      pickupEnd: '14:00'
    });

    console.log('🏪 Offres créées (avec pickupStart / pickupEnd)');

    // ── Créer les commandes dans tous les statuts ──

    // 1. Commande EN_ATTENTE
    const cmd1 = await Commande.create({
      client: client1._id, offre: offre1._id, commercant: commercant1._id,
      prixUnitaire: 150, prixTotal: 150, quantite: 1, statut: 'EN_ATTENTE',
      pickupDeadline: new Date(Date.now() + 86400000), codeRetrait: genCode(), notes: 'Je passe vers 18h',
      historique: [{ ancienStatut: null, nouveauStatut: 'EN_ATTENTE', modifiePar: client1._id, date: new Date() }]
    });

    // 2. Commande CONFIRMEE
    const cmd2 = await Commande.create({
      client: client2._id, offre: offre2._id, commercant: commercant1._id,
      prixUnitaire: 200, prixTotal: 400, quantite: 2, statut: 'CONFIRMEE',
      pickupDeadline: new Date(Date.now() + 86400000), codeRetrait: genCode(),
      historique: [
        { ancienStatut: null, nouveauStatut: 'EN_ATTENTE', modifiePar: client2._id, date: new Date(Date.now() - 3600000) },
        { ancienStatut: 'EN_ATTENTE', nouveauStatut: 'CONFIRMEE', modifiePar: commercant1._id, date: new Date() }
      ]
    });

    // 3. Commande PRETE
    const cmd3 = await Commande.create({
      client: client1._id, offre: offre3._id, commercant: commercant2._id,
      prixUnitaire: 300, prixTotal: 300, quantite: 1, statut: 'PRETE',
      pickupDeadline: new Date(Date.now() + 86400000), codeRetrait: genCode(), notes: 'Allergie aux arachides',
      historique: [
        { ancienStatut: null, nouveauStatut: 'EN_ATTENTE', modifiePar: client1._id, date: new Date(Date.now() - 7200000) },
        { ancienStatut: 'EN_ATTENTE', nouveauStatut: 'CONFIRMEE', modifiePar: commercant2._id, date: new Date(Date.now() - 3600000) },
        { ancienStatut: 'CONFIRMEE', nouveauStatut: 'PRETE', modifiePar: commercant2._id, date: new Date() }
      ]
    });

    // 4. Commande RECUPEREE
    const cmd4 = await Commande.create({
      client: client2._id, offre: offre4._id, commercant: commercant2._id,
      prixUnitaire: 250, prixTotal: 250, quantite: 1, statut: 'RECUPEREE',
      pickupDeadline: new Date(Date.now() + 172800000), codeRetrait: genCode(),
      historique: [
        { ancienStatut: null, nouveauStatut: 'EN_ATTENTE', modifiePar: client2._id, date: new Date(Date.now() - 10800000) },
        { ancienStatut: 'EN_ATTENTE', nouveauStatut: 'CONFIRMEE', modifiePar: commercant2._id, date: new Date(Date.now() - 7200000) },
        { ancienStatut: 'CONFIRMEE', nouveauStatut: 'PRETE', modifiePar: commercant2._id, date: new Date(Date.now() - 3600000) },
        { ancienStatut: 'PRETE', nouveauStatut: 'RECUPEREE', modifiePar: commercant2._id, date: new Date() }
      ]
    });

    // 5. Commande ANNULEE par client
    const cmd5 = await Commande.create({
      client: client1._id, offre: offre2._id, commercant: commercant1._id,
      prixUnitaire: 200, prixTotal: 200, quantite: 1, statut: 'ANNULEE',
      pickupDeadline: new Date(Date.now() + 86400000), codeRetrait: genCode(), raisonAnnulation: 'Changement de programme',
      annuleePar: 'client',
      historique: [
        { ancienStatut: null, nouveauStatut: 'EN_ATTENTE', modifiePar: client1._id, date: new Date(Date.now() - 5400000) },
        { ancienStatut: 'EN_ATTENTE', nouveauStatut: 'ANNULEE', modifiePar: client1._id, raison: 'Changement de programme', date: new Date() }
      ]
    });

    // 6. Commande ANNULEE par commerçant
    const cmd6 = await Commande.create({
      client: client2._id, offre: offre1._id, commercant: commercant1._id,
      prixUnitaire: 150, prixTotal: 300, quantite: 2, statut: 'ANNULEE',
      pickupDeadline: new Date(Date.now() + 86400000), codeRetrait: genCode(), raisonAnnulation: 'Stock épuisé',
      annuleePar: 'commercant',
      historique: [
        { ancienStatut: null, nouveauStatut: 'EN_ATTENTE', modifiePar: client2._id, date: new Date(Date.now() - 4800000) },
        { ancienStatut: 'EN_ATTENTE', nouveauStatut: 'ANNULEE', modifiePar: commercant1._id, raison: 'Stock épuisé', date: new Date() }
      ]
    });

    console.log('📦 Commandes créées (tous les statuts)');

    // ── Créer des notifications ──
    await Notification.create([
      { destinataire: commercant1._id, titre: 'Nouvelle réservation', message: `Nouvelle réservation de ${client1.nom} pour "Lot de pains du jour"`, type: 'confirmation', commande: cmd1._id, lu: false },
      { destinataire: client2._id, titre: 'Réservation confirmée', message: `Votre réservation #${cmd2.codeRetrait} a été confirmée !`, type: 'confirmation', commande: cmd2._id, lu: false },
      { destinataire: client1._id, titre: 'Commande prête', message: `Votre commande #${cmd3.codeRetrait} est prête ! Venez la récupérer.`, type: 'prete', commande: cmd3._id, lu: false },
      { destinataire: client2._id, titre: 'Commande récupérée', message: `Votre commande #${cmd4.codeRetrait} a bien été récupérée. Merci !`, type: 'recuperee', commande: cmd4._id, lu: true, readAt: new Date() },
      { destinataire: commercant1._id, titre: 'Commande annulée', message: `La commande #${cmd5.codeRetrait} a été annulée par le client`, type: 'annulation', commande: cmd5._id, lu: false },
      { destinataire: client2._id, titre: 'Commande annulée', message: `Votre commande #${cmd6.codeRetrait} a été annulée. Raison: Stock épuisé`, type: 'annulation', commande: cmd6._id, lu: false },
    ]);

    console.log('🔔 Notifications créées');

    // ── Créer des demandes vendeur ──
    await DemandeVendeur.create([
      {
        user: client1._id, 
        nomCommerce: 'Epicerie Meziane',
        adresseCommerce: '25 Rue Larbi Ben M\'Hidi, Alger',
        descriptionShop: 'Epicerie fine avec produits locaux et bio',
        telephone: '0553333333',
        categorie: 'epicerie',
        latitude: 36.7762,
        longitude: 3.0597,
        statut: 'EN_ATTENTE'
      },
      {
        user: client2._id,
        nomCommerce: 'Café Hadj',
        adresseCommerce: '10 Place des Martyrs, Hydra',
        descriptionShop: 'Café traditionnel avec pâtisseries maison',
        telephone: '0554444444',
        categorie: 'autre',
        latitude: 36.7525,
        longitude: 3.0325,
        statut: 'ACCEPTEE'
      }
    ]);

    console.log('📋 Demandes vendeur créées');

    // ── Résumé ──
    console.log('\n════════════════════════════════════════');
    console.log('✅ BASE DE DONNÉES CHARGÉE AVEC SUCCÈS !');
    console.log('════════════════════════════════════════');
    console.log('\n👥 COMPTES DE TEST (mot de passe: password123)');
    console.log('─────────────────────────────────────────');
    console.log('🛡️  Admin        : admin@foodapp.com');
    console.log('🏪 Commerçant 1 : boulangerie@foodapp.com  (Boulangerie El Baraka)');
    console.log('🏪 Commerçant 2 : restaurant@foodapp.com   (Restaurant Chez Fatima)');
    console.log('👤 Client 1     : ahmed@foodapp.com');
    console.log('👤 Client 2     : sara@foodapp.com');
    console.log('\n📦 COMMANDES CRÉÉES');
    console.log('─────────────────────────────────────────');
    console.log(`⏳ EN_ATTENTE  : ${cmd1.codeRetrait}  (Ahmed → Boulangerie)`);
    console.log(`✅ CONFIRMEE   : ${cmd2.codeRetrait}  (Sara → Boulangerie)`);
    console.log(`🛍️  PRETE       : ${cmd3.codeRetrait}  (Ahmed → Restaurant)`);
    console.log(`🎉 RECUPEREE   : ${cmd4.codeRetrait}  (Sara → Restaurant)`);
    console.log(`❌ ANNULEE     : ${cmd5.codeRetrait}  (par client)`);
    console.log(`❌ ANNULEE     : ${cmd6.codeRetrait}  (par commerçant)`);
    console.log('\n🚀 Lance node server.js puis ouvre test-interface.html');
    console.log('════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

seed(); 