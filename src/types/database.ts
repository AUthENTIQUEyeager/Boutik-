export type Role = "commercant" | "superadmin";
export type ProfileStatus = "actif" | "bloque";
export type DetteStatut = "en_cours" | "soldee";

export interface Profile {
  id: string;
  phone: string;
  shop_name: string;
  role: Role;
  status: ProfileStatus;
  subscription_expires_at: string;
  ai_credits_used: number;
  created_at: string;
}

export interface Client {
  id: string;
  shop_id: string;
  nom: string;
  telephone: string | null;
  notes: string | null;
  created_at: string;
}

export interface Produit {
  id: string;
  shop_id: string;
  nom: string;
  prix_achat: number;
  prix_vente: number;
  quantite_stock: number;
  seuil_alerte_stock: number;
  created_at: string;
}

export interface Vente {
  id: string;
  shop_id: string;
  client_id: string | null;
  produit_id: string;
  quantite: number;
  prix_achat_unitaire: number;
  prix_vente_unitaire: number;
  benefice_calcule: number;
  created_at: string;
}

export interface Depense {
  id: string;
  shop_id: string;
  montant: number;
  categorie: string;
  description: string | null;
  created_at: string;
}

export interface Dette {
  id: string;
  shop_id: string;
  client_id: string;
  montant: number;
  montant_paye: number;
  statut: DetteStatut;
  date_echeance: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  shop_id: string;
  type: "stock_bas" | "dette_echeance" | "info";
  message: string;
  lu: boolean;
  created_at: string;
}
