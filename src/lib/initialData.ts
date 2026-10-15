import { Equipment, Sale } from '@/types/inventory';

export const INITIAL_EQUIPMENT: Equipment[] = [
  // 1. BANDES DE BOXE STANDARD PRO
  {
    id: 'bnd-std-pro',
    name: 'Bandes de Boxe Élastiques Standard Pro',
    category: 'bandes',
    brand: 'Standard Pro',
    model: 'Élastique Pro',
    minStockAlert: 10,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'BND-STD-PRO',
    description: 'Bandes de protection kickboxing en coton extensible avec fermeture velcro résistante.',
    sizes: [
      {
        size: '3,5m',
        colors: [{ color: 'Noir / Assorti', quantity: 30 }],
      },
      {
        size: '4,5m',
        colors: [{ color: 'Noir / Assorti', quantity: 30 }],
      },
      {
        size: '5,5m',
        colors: [{ color: 'Noir / Assorti', quantity: 20 }],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 2. GANTS VENUM CHALLENGER
  {
    id: 'gnt-vnm-challenger',
    name: 'Gants Venum Challenger',
    category: 'gants',
    brand: 'Venum',
    model: 'Challenger',
    minStockAlert: 3,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'VNM-CHALLENGER',
    description: 'Gants de boxe Venum Challenger triple densité avec paume respirante.',
    sizes: [
      {
        size: '12 oz',
        colors: [
          { color: 'Noir', quantity: 5 },
          { color: 'Gold / Noir', quantity: 5 },
          { color: 'Rouge / Noir', quantity: 5 },
          { color: 'Blanc / Noir', quantity: 2 },
          { color: 'Vert', quantity: 2 },
        ],
      },
      {
        size: '14 oz',
        colors: [
          { color: 'Noir', quantity: 5 },
        ],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 3. GANTS BAKLEE FC BAKLEE
  {
    id: 'gnt-bak-fc',
    name: 'Gants Baklee FC Baklee',
    category: 'gants',
    brand: 'Baklee',
    model: 'FC Baklee',
    minStockAlert: 3,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'BAK-FC-BLK',
    description: 'Gants de boxe Baklee FC pour entraînement quotidien et sparring.',
    sizes: [
      {
        size: '10 oz',
        colors: [{ color: 'Noir', quantity: 5 }],
      },
      {
        size: '12 oz',
        colors: [{ color: 'Noir', quantity: 5 }],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 4. GANTS PAKKA BX1010 PRO
  {
    id: 'gnt-pk-bx1010',
    name: 'Gants Pakka BX1010 Pro',
    category: 'gants',
    brand: 'Pakka',
    model: 'BX1010 Pro',
    minStockAlert: 3,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'PK-BX1010',
    description: 'Gants Pakka série pro BX1010, excellente qualité de finition et absorption des chocs.',
    sizes: [
      {
        size: '10 oz',
        colors: [
          { color: 'Noir', quantity: 3 },
          { color: 'Rouge', quantity: 2 },
        ],
      },
      {
        size: '12 oz',
        colors: [
          { color: 'Noir', quantity: 3 },
          { color: 'Bleu', quantity: 2 },
        ],
      },
      {
        size: '14 oz',
        colors: [
          { color: 'Noir', quantity: 3 },
          { color: 'Blanc', quantity: 2 },
        ],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 5. GANTS PAKKA FC 1041 (JUNIOR)
  {
    id: 'gnt-pk-fc1041',
    name: 'Gants Pakka FC 1041 (Junior)',
    category: 'gants',
    brand: 'Pakka',
    model: 'FC 1041',
    minStockAlert: 4,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'PK-FC1041',
    description: 'Gants de boxe format Junior et Enfant avec protection du pouce renforcée.',
    sizes: [
      {
        size: '4 oz',
        colors: [
          { color: 'Noir', quantity: 3 },
          { color: 'Rouge', quantity: 2 },
        ],
      },
      {
        size: '6 oz',
        colors: [
          { color: 'Noir', quantity: 5 },
          { color: 'Bleu', quantity: 5 },
        ],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 6. GANTS PAKKA FC 1051
  {
    id: 'gnt-pk-fc1051',
    name: 'Gants Pakka FC 1051',
    category: 'gants',
    brand: 'Pakka',
    model: 'FC 1051',
    minStockAlert: 4,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'PK-FC1051',
    description: 'Gants Pakka polyvalents pour frappe sur sac et travail aux paos.',
    sizes: [
      {
        size: '8 oz',
        colors: [
          { color: 'Noir', quantity: 5 },
          { color: 'Rouge', quantity: 5 },
        ],
      },
      {
        size: '10 oz',
        colors: [
          { color: 'Noir', quantity: 5 },
          { color: 'Bleu', quantity: 5 },
        ],
      },
      {
        size: '12 oz',
        colors: [
          { color: 'Noir', quantity: 3 },
          { color: 'Rouge', quantity: 2 },
        ],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 7. GANTS FAIRTEX BXF A44
  {
    id: 'gnt-ftx-bxfa44',
    name: 'Gants Fairtex BXF A44',
    category: 'gants',
    brand: 'Fairtex',
    model: 'BXF A44',
    minStockAlert: 2,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'FTX-BXFA44',
    description: 'Gants de boxe haut de gamme Fairtex, cuir véritable thaïlandais.',
    sizes: [
      {
        size: '12 oz',
        colors: [
          { color: 'Blanc / Noir', quantity: 1 },
          { color: 'Noir / Or', quantity: 1 },
        ],
      },
      {
        size: '14 oz',
        colors: [
          { color: 'Blanc / Noir', quantity: 1 },
          { color: 'Noir / Or', quantity: 1 },
        ],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 8. PROTÈGE-TIBIAS BS FC 2026
  {
    id: 'pt-bs-fc2026',
    name: 'Protège-Tibias BS FC 2026',
    category: 'protege_tibias',
    brand: 'BS',
    model: 'FC BS 2026',
    minStockAlert: 4,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'BS-FC2026',
    description: 'Protège-tibias compétition BS FC 2026 double sangle velcro ergonomique.',
    sizes: [
      {
        size: 'S',
        colors: [{ color: 'Noir / Rouge', quantity: 10 }],
      },
      {
        size: 'M',
        colors: [{ color: 'Noir / Rouge', quantity: 10 }],
      },
      {
        size: 'L',
        colors: [{ color: 'Noir / Rouge', quantity: 5 }],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 9. PROTÈGE-TIBIAS PAKKA SHPA20
  {
    id: 'pt-pk-shpa20',
    name: 'Protège-Tibias Pakka SHPA20',
    category: 'protege_tibias',
    brand: 'Pakka',
    model: 'SHPA20',
    minStockAlert: 3,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'PK-SHPA20',
    description: 'Protège-tibias semi-rigides Pakka SHPA20 avec mousse haute densité sur l’arête tibiale.',
    sizes: [
      {
        size: 'M',
        colors: [
          { color: 'Rouge', quantity: 3 },
          { color: 'Gris', quantity: 3 },
        ],
      },
      {
        size: 'L',
        colors: [
          { color: 'Rouge', quantity: 3 },
          { color: 'Gris', quantity: 3 },
        ],
      },
      {
        size: 'XL',
        colors: [
          { color: 'Rouge', quantity: 2 },
          { color: 'Gris', quantity: 2 },
        ],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 10. PROTÈGE-TIBIAS PAKKA BS1009
  {
    id: 'pt-pk-bs1009',
    name: 'Protège-Tibias Pakka BS1009',
    category: 'protege_tibias',
    brand: 'Pakka',
    model: 'BS1009',
    minStockAlert: 3,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'PK-BS1009',
    description: 'Protège-tibias Pakka BS1009 coloris mixte résistant.',
    sizes: [
      {
        size: 'M',
        colors: [
          { color: 'Noir / Rouge', quantity: 3 },
          { color: 'Bleu', quantity: 2 },
        ],
      },
      {
        size: 'L',
        colors: [
          { color: 'Noir / Rouge', quantity: 3 },
          { color: 'Bleu', quantity: 2 },
        ],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 11. PROTÈGE-TIBIAS ÉLASTIQUE (T9CHIRA)
  {
    id: 'pt-t9-elastic',
    name: 'Protège-Tibias Élastique (T9chira)',
    category: 'protege_tibias',
    brand: 'Standard Club',
    model: 'T9chira Club Elastic',
    minStockAlert: 5,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'PT-T9CHIRA',
    description: 'Chaussettes de protection tibias/pieds en coton élastique tubulaire lavable en machine.',
    sizes: [
      {
        size: 'S',
        colors: [
          { color: 'Noir', quantity: 5 },
          { color: 'Bleu', quantity: 3 },
          { color: 'Rouge', quantity: 2 },
        ],
      },
      {
        size: 'M',
        colors: [
          { color: 'Noir', quantity: 5 },
          { color: 'Bleu', quantity: 3 },
          { color: 'Rouge', quantity: 2 },
        ],
      },
      {
        size: 'L',
        colors: [
          { color: 'Noir', quantity: 5 },
          { color: 'Bleu', quantity: 3 },
          { color: 'Rouge', quantity: 2 },
        ],
      },
      {
        size: 'XL',
        colors: [
          { color: 'Noir', quantity: 10 },
        ],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 12. PROTÈGE-DENTS BAKLEE BK 035
  {
    id: 'pd-baklee-bk035',
    name: 'Protège-Dents Baklee BK 035',
    category: 'protege_dents',
    brand: 'Baklee',
    model: 'BK 035',
    minStockAlert: 5,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'BAK-BK035',
    description: 'Protège-dents thermo-moulable avec boîte hygiénique de rangement.',
    sizes: [
      {
        size: 'Adulte',
        colors: [
          { color: 'Noir', quantity: 10 },
          { color: 'Blanc', quantity: 5 },
          { color: 'Bleu', quantity: 5 },
        ],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 13. PROTÈGE-DENTS VENUM CHALLENGER GEL
  {
    id: 'pd-venum-challenger',
    name: 'Protège-Dents Venum Challenger Gel',
    category: 'protege_dents',
    brand: 'Venum',
    model: 'Challenger Gel',
    minStockAlert: 4,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'VNM-PD-CHALL',
    description: 'Cadre gel Nextfit et canal respiratoire optimisé pour les combats intenses.',
    sizes: [
      {
        size: 'Adulte',
        colors: [
          { color: 'Noir', quantity: 8 },
          { color: 'Rouge', quantity: 7 },
        ],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 14. PROTÈGE-DENTS SIMPLE STANDARD (PAS DE TAILLE - SANS TAILLE)
  {
    id: 'pd-normale-standard',
    name: 'Protège-Dents Simple Standard',
    category: 'protege_dents',
    brand: 'Standard Club',
    model: 'Classique',
    minStockAlert: 10,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'PD-SIMPLE-STD',
    description: 'Protège-dents simple arcade standard pour débutants (taille unique standard).',
    sizes: [
      {
        // Pas de taille spécifique pour ce modèle
        colors: [
          { color: 'Rouge', quantity: 15 },
          { color: 'Noir', quantity: 15 },
          { color: 'Bleu', quantity: 10 },
          { color: 'Orange', quantity: 10 },
        ],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },

  // 15. COQUILLE DE PROTECTION HOMME
  {
    id: 'coq-pro',
    name: 'Coquille de Protection Homme Anatomique',
    category: 'coquilles',
    brand: 'Standard Pro',
    model: 'Anatomique Cup',
    minStockAlert: 4,
    costPrice: 0.0,
    sellingPrice: 0.0,
    barcode: 'COQ-PRO-BLK',
    description: 'Coquille kickboxing & sports de combat avec ceinture élastique confort et bords en gel.',
    sizes: [
      {
        size: 'S',
        colors: [{ color: 'Noir', quantity: 10 }],
      },
      {
        size: 'M',
        colors: [{ color: 'Noir', quantity: 15 }],
      },
      {
        size: 'L',
        colors: [{ color: 'Noir', quantity: 5 }],
      },
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
];

// Initial sales start empty so all statistics reflect genuine transactions
export const INITIAL_SALES: Sale[] = [];
