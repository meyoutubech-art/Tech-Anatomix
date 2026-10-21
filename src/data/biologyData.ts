import { OrganelleInfo, HeartStructureInfo, DnaBasePairInfo } from '../types/biology';

export const CELL_ORGANELLES: OrganelleInfo[] = [
  {
    id: 'nucleus',
    name: 'Cell Nucleus & Nucleolus',
    pronunciation: '/ˈnjuː.kli.əs/',
    dimensions: '5 - 10 µm diameter',
    function: 'Serves as the informational and genetic command center of the eukaryotic cell. Houses genomic DNA organized into chromatin fibers and directs transcription and ribosome assembly within the dense nucleolus.',
    structure: 'Enclosed by a double-membrane nuclear envelope punctuated by nuclear pore complexes that selectively regulate macromolecular transit.',
    curiousFact: 'If stretched out end-to-end, the DNA packed inside one single microscopic human cell nucleus would measure nearly 2 meters long!',
    color: '#818CF8', // gentle lavender indigo
  },
  {
    id: 'mitochondria',
    name: 'Mitochondrion',
    pronunciation: '/ˌmaɪ.təˈkɒn.dri.ən/',
    dimensions: '0.5 - 1.0 µm width, up to 7 µm length',
    function: 'The metabolic powerhouse of the cell. Generates the vast majority of chemical cellular energy in the form of Adenosine Triphosphate (ATP) via oxidative phosphorylation and the Krebs cycle.',
    structure: 'Possesses an outer lipid membrane and a deeply folded inner membrane creating high-surface-area cristae where electron transport chain complexes reside.',
    curiousFact: 'Mitochondria contain their own circular genome (mtDNA) and replicate independently, providing proof of their endosymbiotic bacterial ancestry.',
    color: '#F59E0B', // golden amber
  },
  {
    id: 'endoplasmic_reticulum',
    name: 'Endoplasmic Reticulum (ER)',
    dimensions: 'Continuous network (>50% of cell membrane)',
    function: 'Extensive labyrinth of membranous tubules and flattened sacs (cisternae). Rough ER synthesizes and folds transmembrane and secretory proteins; Smooth ER synthesizes lipids, metabolizes carbohydrates, and detoxifies xenobiotics.',
    structure: 'Rough ER is studded with membrane-bound ribosomes, whereas smooth ER consists of tubular interconnected branching channels.',
    curiousFact: 'In skeletal muscle cells, specialized smooth ER called the sarcoplasmic reticulum stores and releases massive calcium ions to trigger muscle contractions.',
    color: '#06B6D4', // clean cyan
  },
  {
    id: 'golgi_apparatus',
    name: 'Golgi Apparatus',
    dimensions: 'Stacks of 4 - 8 cisternae',
    function: 'Acts as the post office and shipping center of the cell. Chemically modifies, sorts, tags, and packages proteins and lipids received from the ER into secretory vesicles destined for lysosomes or the plasma membrane.',
    structure: 'Polarized stack of distinct flattened membranous discs with a receiving cis-face oriented toward the ER and an outgoing trans-face oriented toward the cell periphery.',
    curiousFact: 'Named after Nobel laureate Camillo Golgi, who discovered it in 1898 using a silver nitrate impregnation staining technique.',
    color: '#EC4899', // bright scientific magenta
  },
  {
    id: 'membrane',
    name: 'Plasma Cell Membrane',
    dimensions: '7 - 10 nm thickness',
    function: 'Selectively permeable boundary separating intracellular cytosol from the external environment. Mediates cell signaling, nutrient import, waste expulsion, and electrochemical ion gradients.',
    structure: 'Phospholipid bilayer arranged in a fluid mosaic model interspersed with cholesterol, integral transmembrane proteins, ion channels, and glycolipids.',
    curiousFact: 'Every second, millions of sodium-potassium ATP pumps across your membranes consume roughly 20% of your entire body energy just to maintain voltage!',
    color: '#10B981', // emerald green
  },
  {
    id: 'ribosomes',
    name: 'Ribosomes & Polysomes',
    dimensions: '20 - 30 nm diameter',
    function: 'Molecular ribonucleoprotein machines responsible for translation. Reads messenger RNA (mRNA) triplets and strings amino acids together into polypeptide chains based on genetic code.',
    structure: 'Composed of two unequal subunits (60S large subunit and 40S small subunit in eukaryotes) built from ribosomal RNA (rRNA) and catalytic proteins.',
    curiousFact: 'An active human liver cell contains an estimated 10 million individual ribosomes churning out thousands of vital proteins every minute.',
    color: '#F43F5E', // ruby rose
  },
];

export const HEART_STRUCTURES: HeartStructureInfo[] = [
  {
    id: 'left_ventricle',
    name: 'Left Ventricle',
    bloodType: 'oxygenated',
    role: 'The thickest muscular chamber of the heart. Forces oxygen-rich blood under high systemic pressure (~120 mmHg) through the aortic semilunar valve into the systemic arterial circulation.',
    pressures: 'Systolic: 120 mmHg / Diastolic: 8 mmHg',
    clinicalNote: 'The left ventricle myocardium is 3× thicker than the right ventricle due to the vast peripheral resistance of the systemic circulatory network.',
  },
  {
    id: 'right_ventricle',
    name: 'Right Ventricle',
    bloodType: 'deoxygenated',
    role: 'Pumps venous deoxygenated blood through the pulmonary semilunar valve into the low-pressure pulmonary trunk and arterial capillary bed of both lungs for gas exchange.',
    pressures: 'Systolic: 25 mmHg / Diastolic: 4 mmHg',
    clinicalNote: 'Lower pressure in pulmonary circulation protects delicate pulmonary alveolar capillaries from fluid extravasation and pulmonary edema.',
  },
  {
    id: 'aorta',
    name: 'Ascending Aorta & Arch',
    bloodType: 'oxygenated',
    role: 'The primary and largest systemic artery in the human body. Elastic walls stretch during ventricular systole and recoil during diastole (Windkessel effect) to maintain continuous peripheral flow.',
    pressures: 'Peak systolic ~120 mmHg',
    clinicalNote: 'High elastic collagen and elastin content allows the aorta to withstand over 2.5 billion cardiac pulsatile expansions across a typical human lifetime.',
  },
  {
    id: 'pulmonary_artery',
    name: 'Pulmonary Artery / Trunk',
    bloodType: 'deoxygenated',
    role: 'Carries deoxygenated blood from the right ventricle to the right and left lungs. One of the unique exceptions in anatomy where an artery carries deoxygenated blood.',
    pressures: 'Mean pressure ~15 mmHg',
    clinicalNote: 'Bifurcates immediately beneath the aortic arch, leading to extensive microvascular alveolar gas exchange beds.',
  },
  {
    id: 'atria',
    name: 'Right & Left Atria',
    bloodType: 'oxygenated',
    role: 'Receiving chambers. The right atrium collects systemic venous return via superior and inferior vena cava; the left atrium collects freshly oxygenated blood from pulmonary veins.',
    pressures: 'Low pressure (2 - 6 mmHg)',
    clinicalNote: 'Atrial contraction accounts for the final 20-30% of ventricular filling ("atrial kick"), which becomes crucial during elevated heart rates.',
  },
];

export const DNA_BASE_PAIRS: DnaBasePairInfo[] = [
  {
    id: 'at_pair',
    pairName: 'Adenine (A) = Thymine (T)',
    base1: { name: 'Adenine', symbol: 'A', ringType: 'Purine' },
    base2: { name: 'Thymine', symbol: 'T', ringType: 'Pyrimidine' },
    hydrogenBonds: 2,
    bondDistance: '0.28 nm - 0.30 nm',
    description: 'Adenine (a double-ring purine) forms exactly TWO directional hydrogen bonds with Thymine (a single-ring pyrimidine). Because it has fewer hydrogen bonds than G-C pairs, A-T rich regions melt and uncoil more easily at lower temperatures during DNA transcription and replication initiation.',
  },
  {
    id: 'gc_pair',
    pairName: 'Guanine (G) ≡ Cytosine (C)',
    base1: { name: 'Guanine', symbol: 'G', ringType: 'Purine' },
    base2: { name: 'Cytosine', symbol: 'C', ringType: 'Pyrimidine' },
    hydrogenBonds: 3,
    bondDistance: '0.29 nm - 0.30 nm',
    description: 'Guanine (purine) forms THREE robust hydrogen bonds with Cytosine (pyrimidine). The extra hydrogen bond confers higher thermal stability to DNA strands. Organisms living in extreme hydrothermal vents (thermophiles) possess genomes with substantially elevated G-C percentages to prevent DNA denaturation.',
  },
];
