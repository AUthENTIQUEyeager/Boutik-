-- ============================================================================
-- Données de démonstration pour Boutik+
-- IMPORTANT : ce script suppose qu'un utilisateur de test a déjà été créé via
-- l'inscription normale de l'app (téléphone + mot de passe), car les comptes
-- doivent exister dans auth.users avant qu'on référence leur id ici.
--
-- Étapes :
-- 1. Inscris-toi normalement dans l'app avec un numéro de test, ex: 70000000
-- 2. Récupère l'UUID généré : select id from profiles where phone = '70000000';
-- 3. Remplace <SHOP_ID> ci-dessous par cet UUID puis exécute ce script.
-- ============================================================================

do $$
declare
  shop uuid := '<SHOP_ID>'; -- <-- remplace par l'UUID du profil de démo
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid; p7 uuid;
begin
  -- Clients
  insert into clients (shop_id, nom, telephone, notes) values
    (shop, 'Awa Traoré', '70111111', 'Cliente fidèle, achète chaque semaine') returning id into c1;
  insert into clients (shop_id, nom, telephone, notes) values
    (shop, 'Boubacar Sanogo', '70222222', null) returning id into c2;
  insert into clients (shop_id, nom, telephone, notes) values
    (shop, 'Fatimata Ouédraogo', '70333333', 'Paie souvent en retard') returning id into c3;
  insert into clients (shop_id, nom, telephone, notes) values
    (shop, 'Issa Kaboré', '70444444', null) returning id into c4;
  insert into clients (shop_id, nom, telephone, notes) values
    (shop, 'Mariam Coulibaly', '70555555', 'Achète en gros') returning id into c5;

  -- Produits
  insert into produits (shop_id, nom, prix_achat, prix_vente, quantite_stock, seuil_alerte_stock) values
    (shop, 'Sac de riz 25kg', 12500, 15000, 20, 5) returning id into p1;
  insert into produits (shop_id, nom, prix_achat, prix_vente, quantite_stock, seuil_alerte_stock) values
    (shop, 'Huile végétale 1L', 900, 1200, 40, 10) returning id into p2;
  insert into produits (shop_id, nom, prix_achat, prix_vente, quantite_stock, seuil_alerte_stock) values
    (shop, 'Savon Palmida', 350, 500, 60, 15) returning id into p3;
  insert into produits (shop_id, nom, prix_achat, prix_vente, quantite_stock, seuil_alerte_stock) values
    (shop, 'Sucre 1kg', 600, 800, 4, 10) returning id into p4;
  insert into produits (shop_id, nom, prix_achat, prix_vente, quantite_stock, seuil_alerte_stock) values
    (shop, 'Boîte de tomate concentrée', 250, 400, 100, 20) returning id into p5;
  insert into produits (shop_id, nom, prix_achat, prix_vente, quantite_stock, seuil_alerte_stock) values
    (shop, 'Lait en poudre 400g', 1500, 2000, 25, 8) returning id into p6;
  insert into produits (shop_id, nom, prix_achat, prix_vente, quantite_stock, seuil_alerte_stock) values
    (shop, 'Thé Lipton (paquet)', 800, 1100, 30, 10) returning id into p7;

  -- Ventes (le trigger calcule le bénéfice et décrémente le stock)
  insert into ventes (shop_id, client_id, produit_id, quantite) values (shop, c1, p2, 3);
  insert into ventes (shop_id, client_id, produit_id, quantite) values (shop, c2, p3, 5);
  insert into ventes (shop_id, client_id, produit_id, quantite) values (shop, null, p5, 10);
  insert into ventes (shop_id, client_id, produit_id, quantite) values (shop, c4, p1, 1);
  insert into ventes (shop_id, client_id, produit_id, quantite) values (shop, c5, p7, 4);

  -- Dépenses
  insert into depenses (shop_id, montant, categorie, description) values
    (shop, 15000, 'Transport', 'Livraison de marchandises depuis Bobo');
  insert into depenses (shop_id, montant, categorie, description) values
    (shop, 5000, 'Electricité', 'Facture SONABEL du mois');
  insert into depenses (shop_id, montant, categorie, description) values
    (shop, 2000, 'Nettoyage', 'Produits d''entretien de la boutique');

  -- Dettes
  insert into dettes (shop_id, client_id, montant, montant_paye, date_echeance) values
    (shop, c3, 8000, 2000, current_date + interval '3 days');
  insert into dettes (shop_id, client_id, montant, montant_paye, date_echeance) values
    (shop, c1, 5000, 5000, current_date - interval '2 days');
  insert into dettes (shop_id, client_id, montant, montant_paye, date_echeance) values
    (shop, c4, 12000, 0, current_date - interval '1 days');
end $$;
