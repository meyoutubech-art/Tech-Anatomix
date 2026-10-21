export interface HumanOrganInfo {
  id: string;
  name: string;
  scientificName: string;
  system: string;
  color: string;
  location: string;
  function: string;
  clinicalSignificance: string;
}

export const SKETCHFAB_HUMAN_CONFIG = {
  externalBodyEmbedUrl:
    'https://sketchfab.com/models/9b0b079953b840bc9a13f524b60041e4/embed?autostart=1',
  internalOrgansEmbedUrl:
    'https://sketchfab.com/models/fe69d7b1ed6f46a3bd0b6933b796092e/embed?autostart=1',
  externalTitle: 'Animated Full Human Body Anatomy (External Musculoskeletal & Epidermal Specimen)',
  internalTitle: 'Human Internal Organs — 3D Visceral Cavity Specimen (by unlim3d)',
  externalSketchfabUrl: 'https://sketchfab.com/models/9b0b079953b840bc9a13f524b60041e4',
  internalSketchfabUrl: 'https://sketchfab.com/3d-models/human-internal-organs-fe69d7b1ed6f46a3bd0b6933b796092e',
  author: 'unlim3d / Sketchfab Medical Collection',
} as const;

export const HUMAN_ORGAN_LIST: HumanOrganInfo[] = [
  {
    id: 'human_brain',
    name: 'Human Brain & Cerebrum',
    scientificName: 'Encephalon',
    system: 'Central Nervous System',
    color: '#f472b6',
    location: 'Cranial cavity within the protective neurocranium',
    function:
      'Coordinates consciousness, sensory processing, neuromuscular locomotion, endocrine regulation, and cognitive homeostasis.',
    clinicalSignificance: 'Protected by three meningeal layers and the cerebrospinal fluid (CSF) blood-brain barrier.',
  },
  {
    id: 'human_heart',
    name: 'Four-Chambered Human Heart',
    scientificName: 'Cor humanum',
    system: 'Cardiovascular System',
    color: '#e11d48',
    location: 'Middle mediastinum of thorax, oblique behind the sternum',
    function:
      'Pumps deoxygenated blood to the pulmonary circuit via right atrium & right ventricle, and oxygenated blood to the systemic circuit via left atrium & thick left ventricle into the ascending aorta.',
    clinicalSignificance:
      'Unlike amphibians (3 chambers), human hearts have complete interventricular septum preventing any mixing of oxygenated and deoxygenated blood.',
  },
  {
    id: 'human_lungs',
    name: 'Paired Lobar Lungs & Tracheobronchial Tree',
    scientificName: 'Pulmones',
    system: 'Respiratory System',
    color: '#38bdf8',
    location: 'Thoracic cavity flanking the mediastinum, above the diaphragm',
    function:
      'Negative-pressure alveolar gas exchange across 300 million alveoli, driven by muscular diaphragm contraction and intercostal ribs.',
    clinicalSignificance:
      'Right lung has 3 lobes (superior, middle, inferior); left lung has 2 lobes with cardiac notch accommodating the heart.',
  },
  {
    id: 'human_liver',
    name: 'Four-Lobed Liver',
    scientificName: 'Hepar',
    system: 'Digestive & Metabolic System',
    color: '#881337',
    location: 'Right hypochondriac and epigastric regions of abdominal cavity beneath diaphragm',
    function:
      'Largest internal organ (approx 1.5 kg); synthesizes bile, metabolizes lipids/carbohydrates, detoxifies drugs, and produces essential blood clotting factors.',
    clinicalSignificance: 'Receives dual vascular supply: 75% via portal vein (nutrient-rich) and 25% via hepatic artery.',
  },
  {
    id: 'human_stomach',
    name: 'Muscular J-Stomach & Pancreas',
    scientificName: 'Gaster & Pancreas',
    system: 'Digestive & Endocrine System',
    color: '#d97706',
    location: 'Left upper quadrant (epigastric/hypochondriac region) connecting esophagus to duodenum',
    function:
      'Secretes hydrochloric acid (HCl) and pepsinogen for protein denaturation and churns food into semi-liquid chyme.',
    clinicalSignificance:
      'Pancreatic acinar cells release amylase, lipase, and proteases, while islets of Langerhans secrete insulin and glucagon.',
  },
  {
    id: 'human_kidneys',
    name: 'Retroperitoneal Kidneys',
    scientificName: 'Renes',
    system: 'Urinary System',
    color: '#9333ea',
    location: 'Posterior abdominal wall (retroperitoneal space at T12–L3 vertebral levels)',
    function:
      'Filter approximately 180 liters of blood plasma daily through 2 million nephrons, regulating fluid osmolarity, electrolyte balance, and blood pressure via the renin-angiotensin system.',
    clinicalSignificance: 'Ureters convey urine from renal pelvis down to the urinary bladder.',
  },
  {
    id: 'human_intestines',
    name: 'Small & Large Intestines',
    scientificName: 'Intestinum tenue et crassum',
    system: 'Digestive & Absorptive System',
    color: '#f59e0b',
    location: 'Umbilical, hypogastric, and lower abdominal quadrants',
    function:
      'Duodenum, jejunum, and ileum absorb amino acids, glucose, and fatty acids through mucosal villi; colon absorbs water and compacts waste towards rectum.',
    clinicalSignificance:
      'Total surface area of human intestinal brush border is approximately 32 square meters.',
  },
];
