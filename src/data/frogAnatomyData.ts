import { FrogOrganInfo, FrogOrganId, DissectionStep, DissectionTool } from '../types/frogAnatomy';

/**
 * Educational frog anatomy data manifest for the first vertical slice.
 * Note: Only includes the 6 independently modeled internal organs.
 * Does not include absent systems (skeleton, reproductive organs, nervous system)
 * until procedural geometry for those systems is introduced.
 */
export const FROG_ORGAN_MANIFEST: Record<FrogOrganId, FrogOrganInfo> = {
  heart: {
    id: 'heart',
    name: 'Three-Chambered Heart',
    scientificName: 'Cor amphibium',
    system: 'Circulatory System',
    color: '#e11d48',
    threeColorHex: 0xe11d48,
    location: 'Anterior (cranial) ventral midline within pericardial sac',
    educationalDescription:
      'Unlike the 4-chambered mammalian heart, the adult amphibian heart possesses two atria (sinister et dexter) and a single undivided muscular ventricle. Deoxygenated systemic blood and oxygenated pulmonary blood undergo partial selective streaming within the conus arteriosus spiral valve before leaving for systemic and pulmocutaneous arches.',
    function:
      'Pumps mixed and oxygenated blood to the cephalic, systemic, and pulmocutaneous arterial circuits.',
    simplificationNotice:
      'Schematic educational mesh: Modeled as a conical ventricle with distinct bilateral atrial domes and cranial conus arteriosus. Internal trabeculae, sinus venosus, and internal spiral fold are not geometrically hollowed out in this vertical slice.',
    relativeCoordinates: { x: 0, y: 0.35, z: 0.28 },
  },

  liver: {
    id: 'liver',
    name: 'Three-Lobed Liver',
    scientificName: 'Hepar trilobatum',
    system: 'Digestive & Metabolic System',
    color: '#881337',
    threeColorHex: 0x881337,
    location: 'Central visceral cavity, directly posterior and flanking the heart',
    educationalDescription:
      'The largest visceral organ in the frog, divided into three distinct lobes: large left lobe, right lobe, and smaller median lobe. It produces bile (stored in the gallbladder between lobes), synthesizes glycogen, detoxifies blood absorbed from the gut via the hepatic portal vein, and stores lipids.',
    function:
      'Bile synthesis for lipid emulsification, carbohydrate storage (glycogen), and metabolic detoxification.',
    simplificationNotice:
      'Schematic educational mesh: Modeled as 3 continuous organic ellipsoidal lobes cradling the heart. Microscopic hepatic lobules and bile canaliculi are not rendered.',
    relativeCoordinates: { x: 0, y: 0.1, z: 0.22 },
  },

  lungs: {
    id: 'lungs',
    name: 'Paired Sacculated Lungs',
    scientificName: 'Pulmones',
    system: 'Respiratory System',
    color: '#ec4899',
    threeColorHex: 0xec4899,
    location: 'Dorsolateral to the heart and cranial to the stomach',
    educationalDescription:
      'A pair of thin-walled, sac-like, elastic structures lined with internal vascularized alveoli folds. Because frogs lack a diaphragm and ribs, pulmonary ventilation relies on positive-pressure buccal pumping: air is forced down through the glottis by elevating the floor of the mouth.',
    function:
      'Gas exchange augmenting cutaneous (skin) and buccopharyngeal respiration.',
    simplificationNotice:
      'Schematic educational mesh: Modeled as paired sacculated ovate bodies with textured alveolar partitions. The dynamic positive-pressure glottal valve mechanism is simplified in this slice.',
    relativeCoordinates: { x: 0, y: 0.42, z: 0.1 },
  },

  stomach: {
    id: 'stomach',
    name: 'J-Shaped Muscular Stomach',
    scientificName: 'Gaster / Ventriculus',
    system: 'Digestive System',
    color: '#d97706',
    threeColorHex: 0xd97706,
    location: 'Left visceral plane, curving from esophagus towards pylorus',
    educationalDescription:
      'A prominent curved muscular reservoir lying predominantly on the left side of the frog coelom. Food swallowed whole passes through the short esophagus into the cardiac region of the stomach, where gastric enzymes and hydrochloric acid churn it into acidic chyme before releasing it through the pyloric sphincter.',
    function:
      'Mechanical maceration and primary chemical digestion of ingested prey organisms.',
    simplificationNotice:
      'Schematic educational mesh: Modeled with curved tubular sweep and thickened pyloric constriction. Internal gastric rugae and mucosal glands are represented as an exterior topological form.',
    relativeCoordinates: { x: -0.28, y: -0.05, z: 0.16 },
  },

  small_intestine: {
    id: 'small_intestine',
    name: 'Small Intestine (Duodenum & Ileum)',
    scientificName: 'Intestinum tenue',
    system: 'Digestive & Absorptive System',
    color: '#f59e0b',
    threeColorHex: 0xf59e0b,
    location: 'Extending from the pyloric sphincter, coiled through central abdomen',
    educationalDescription:
      'Composed of an anterior U-shaped duodenal loop running parallel to the stomach, followed by the coiled ileum. In the mesentery between duodenum and stomach lies the pancreas. Chyme is neutralized and acted upon by pancreatic and hepatic enzymes, with nutrients absorbed through mucosal microvilli.',
    function:
      'Enzymatic breakdown of proteins, lipids, and carbohydrates, and absorption of nutrients into bloodstream.',
    simplificationNotice:
      'Schematic educational mesh: Modeled as procedural continuous tubular coiling. The delicate pancreatic parenchyma and supporting mesentery sheets are omitted in this initial vertical slice.',
    relativeCoordinates: { x: 0.15, y: -0.25, z: 0.18 },
  },

  large_intestine_cloaca: {
    id: 'large_intestine_cloaca',
    name: 'Large Intestine & Cloaca',
    scientificName: 'Rectum et Cloaca',
    system: 'Excretory & Digestive System',
    color: '#78350f',
    threeColorHex: 0x78350f,
    location: 'Posterior midline leading to the terminal pelvic vent',
    educationalDescription:
      'A short, wider straight tube that reabsorbs water and compacts fecal waste, emptying into the cloaca ("sewer"). The cloaca is the common exit chamber receiving products from the digestive tract (rectum), excretory system (urinary bladder and ureters), and reproductive ducts.',
    function:
      'Water reabsorption, fecal compaction, and common cloacal aperture discharge.',
    simplificationNotice:
      'Schematic educational mesh: Modeled as a widened posterior terminal tube tapering into the pelvic aperture. The internal urogenital sinus ostia are not modeled separately.',
    relativeCoordinates: { x: 0, y: -0.62, z: 0.12 },
  },
};

export const FROG_ORGAN_LIST: FrogOrganInfo[] = Object.values(FROG_ORGAN_MANIFEST);

export const FROG_ANATOMY_DISCLAIMER =
  'Educational Schematic Prototype: This 3D representation utilizes procedural geometric approximations designed for biological orientation and visceral topology instruction. It is not a certified veterinary dissection specimen or CT-reconstructed volumetric model.';

export const FROG_GLB_SPECIMEN_METADATA = {
  filename: 'frog.glb',
  path: '/models/frog.glb',
  filesizeBytes: 6292052,
  format: 'glTF binary (version 2.0)',
  generator: 'THREE.GLTFExporter r185',
  meshName: 'frog_body_1',
  nodeName: 'frog_body',
  vertexCount: 224195,
  dimensionsMm: {
    widthX: 256.07,
    heightY: 36.90,
    depthZ: 140.66,
  },
  hasInternalOrganMeshes: false,
  materialName: 'grey_mat',
  disclosure:
    'Single Unified External Anatomical Geometry: The imported GLB model contains a high-density, 224,195-vertex continuous surface mesh of the frog external body. It does not possess pre-segmented internal visceral sub-meshes (heart, liver, lungs, etc.). To isolate internal organs, a segmented multi-part GLB dataset is required.',
} as const;

export interface FrogGlbLandmark {
  id: string;
  name: string;
  region: string;
  description: string;
  relativeCenter: { x: number; y: number; z: number };
}

export const FROG_GLB_ANATOMICAL_LANDMARKS: FrogGlbLandmark[] = [
  {
    id: 'cranial_snout',
    name: 'Cranial Complex & Snout',
    region: 'Anterior Head',
    description: 'Prominent triangular amphibian cranium with anterior rostrum, dorsal orbits, and wide jawline.',
    relativeCenter: { x: -85, y: 15, z: 0 },
  },
  {
    id: 'dorsal_trunk',
    name: 'Dorsal Trunk & Sacral Ridge',
    region: 'Dorsal Midline',
    description: 'Dorsal hump characteristic of anuran posture, reflecting the fusion of caudal vertebrae into the rigid urostyle.',
    relativeCenter: { x: -20, y: 28, z: 0 },
  },
  {
    id: 'pectoral_forelimbs',
    name: 'Pectoral Girdle & Forelimbs',
    region: 'Anterolateral Appendages',
    description: 'Short anterior limbs with humerus and radio-ulna support, ending in 4 distinct digits for landing stabilization.',
    relativeCenter: { x: -50, y: 6, z: 45 },
  },
  {
    id: 'saltatory_hindlimbs',
    name: 'Elongated Saltatory Hindlimbs',
    region: 'Posterolateral Appendages',
    description: 'Strongly developed jumping limbs with elongated tibio-fibula and tarsal bones, ending in extensive webbed digits.',
    relativeCenter: { x: 80, y: 5, z: 35 },
  },
  {
    id: 'ventral_coelom',
    name: 'Ventral Abdominal Wall',
    region: 'Ventral Thoraco-abdominal',
    description: 'Smooth ventral belly surface overlying the pericardial and coelomic cavities, where surgical incision is performed in dissections.',
    relativeCenter: { x: -30, y: 2, z: 0 },
  },
];

/**
 * Verified Sketchfab 3D Embed Configurations
 */
export const SKETCHFAB_FROG_CONFIG = {
  outerFrogEmbedUrl:
    'https://sketchfab.com/models/0bddb0f89cc94df2a56889c1de9143a1/embed?preload=1',
  internalOrgansEmbedUrl:
    'https://sketchfab.com/models/7643345ba03f4f87831a2a2ca3c27ad0/embed?autostart=1&camera=0&annotations_visible=1&ui_watermark_link=0&ui_watermark=0',
  internalOrgansStableEmbedUrl:
    'https://sketchfab.com/models/7643345ba03f4f87831a2a2ca3c27ad0/embed?autostart=1&camera=0&annotations_visible=1&ui_watermark_link=0&ui_watermark=0',
  outerFrogTitle: 'Animated Frog — External Anatomy Specimen',
  internalOrgansTitle: 'Frog Heart and Lungs',
  outerFrogSketchfabUrl: 'https://sketchfab.com/models/0bddb0f89cc94df2a56889c1de9143a1',
  internalOrgansSketchfabUrl: 'https://sketchfab.com/3d-models/frog-heart-and-lungs-7643345ba03f4f87831a2a2ca3c27ad0',
  outerModelAuthor: 'Sketchfab Community / 3D Zoological Archive',
  internalModelAuthor: 'Blackburn Lab',
  internalModelAuthorUrl: 'https://sketchfab.com/ufherps',
  dissectionDisclaimer:
    'Educational Dissection Simulation: Visual presentation is rendered using high-fidelity 3D Sketchfab models. The dissection protocol provides guided procedural instruction and stage progression without destructive geometric modification of external meshes.',
} as const;

export const DISSECTION_TOOLS_METADATA: Record<
  DissectionTool,
  { name: string; description: string; clinicalRole: string }
> = {
  magnifier: {
    name: 'Inspection Magnifier',
    description: 'Stereoscopic hand lens for macroscopic epidermal and facial feature examination.',
    clinicalRole: 'Inspect external morphology, nictitating membranes, and dorsal pigmentation.',
  },
  pins: {
    name: 'Dissection T-Pins',
    description: 'Stainless steel angled pins for securing anatomical specimens to the wax tray.',
    clinicalRole: 'Stabilize limbs at 45° angle outward to prevent displacement during incisions.',
  },
  scalpel: {
    name: 'Surgical Scalpel (#10 Blade)',
    description: 'Curved precision surgical blade for controlled superficial dermal incisions.',
    clinicalRole: 'Initiate the initial midline incision through external skin layer only.',
  },
  scissors: {
    name: 'Blunt-Point Surgical Scissors',
    description: 'Fine scissors with blunt lower tip to prevent puncturing internal visceral organs.',
    clinicalRole: 'Extend midline cut anteriorly through sternum and pectoral girdle safely.',
  },
  forceps: {
    name: 'Tissue Forceps',
    description: 'Serrated gripping forceps for elevating dermal and muscular flaps.',
    clinicalRole: 'Gently lift skin away from abdominal wall to maintain clearance.',
  },
  probe: {
    name: 'Blunt Dissection Probe',
    description: 'Smooth blunt probe for teasing apart connective mesenteries and tracing vessels.',
    clinicalRole: 'Examine cardiorespiratory organs, conus arteriosus, and pulmonary vasculature.',
  },
};

export const DISSECTION_STEPS: DissectionStep[] = [
  {
    id: 'external_inspection',
    stepNumber: 1,
    title: 'External Morphological Inspection',
    phase: 'Orientation & External Anatomy',
    tool: 'magnifier',
    toolName: 'Inspection Magnifier',
    instructions: [
      'Observe the animated frog in 3D: note dorsal coloration, camouflage pattern, and ventral counter-shading.',
      'Examine the head: locate prominent dorsal eyes with transparent nictitating membranes for underwater protection.',
      'Identify the bilateral circular tympanic membranes (eardrums) located directly behind each eye.',
      'Note the saltatory hindlimbs with elongated tarsal bones and extensive webbing between digits.',
    ],
    anatomicalTarget: 'Dorsal skin, tympanum, external nares, and digital webbing',
    clinicalSafetyNotes: 'Always handle biological specimens with clean examination gloves and protective eyewear.',
    specimenView: 'external',
  },
  {
    id: 'preparation_pinning',
    stepNumber: 2,
    title: 'Dissection Pan Orientation & Four-Point Pinning',
    phase: 'Specimen Stabilization',
    tool: 'pins',
    toolName: 'Dissection T-Pins',
    instructions: [
      'Place the specimen ventral (belly) side up in the center of the dissection wax pan.',
      'Gently extend the right and left forelimbs laterally; insert pins through the digits at a 45° outward angle.',
      'Extend the muscular hindlimbs caudolaterally; insert pins through the feet into the wax tray.',
      'Ensure the specimen is fully stabilized so the ventral midline is taut and accessible.',
    ],
    anatomicalTarget: 'Forelimbs and hindlimbs (pectoral and pelvic girdles)',
    clinicalSafetyNotes: 'Angle pins outward away from the specimen body to avoid obstructing cutting instruments.',
    specimenView: 'external',
  },
  {
    id: 'ventral_incision',
    stepNumber: 3,
    title: 'Ventral Midline Dermal Incision',
    phase: 'Superficial Dermal Opening',
    tool: 'scalpel',
    toolName: 'Surgical Scalpel (#10 Blade)',
    instructions: [
      'Using forceps, gently grasp the loose ventral skin along the midline just cranial to the cloacal aperture.',
      'Make a small superficial incision through the skin only using the tip of the scalpel.',
      'Insert the blunt blade of the surgical scissors into the cut and cut forward along the midline (linea alba).',
      'Continue the cut cranial-ward until reaching the mandible (lower jaw).',
    ],
    anatomicalTarget: 'Ventral skin and superficial subcutaneous fascia',
    clinicalSafetyNotes: 'Keep the scissors blade angled shallowly upward to avoid cutting the muscular abdominal wall.',
    specimenView: 'external',
  },
  {
    id: 'flap_reflection',
    stepNumber: 4,
    title: 'Skin Flap Reflection & Abdominal Wall Exposure',
    phase: 'Muscular Wall & Coelom Exposure',
    tool: 'forceps',
    toolName: 'Tissue Forceps & Scissors',
    instructions: [
      'Make bilateral transverse cuts in the skin near the forelimbs and near the hindlimbs to form rectangular flaps.',
      'Peel back the skin flaps laterally like doors and pin them flat against the wax dissection pan.',
      'Inspect the underlying rectus abdominis muscle; identify the dark midline anterior abdominal vein.',
      'Carefully cut through the muscular body wall, avoiding the abdominal vein, and sever the pectoral sternum.',
    ],
    anatomicalTarget: 'Rectus abdominis muscle, anterior abdominal vein, pectoral sternum',
    clinicalSafetyNotes: 'Severing the anterior abdominal vein will obscure internal organs with dark venous blood.',
    specimenView: 'external',
  },
  {
    id: 'organ_exposure',
    stepNumber: 5,
    title: 'Coelomic Cavity & Visceral Organ Exposure',
    phase: 'Cardiorespiratory & Visceral Inspection',
    tool: 'probe',
    toolName: 'Internal Visceral Viewer & Probe',
    instructions: [
      'The coelomic cavity is now fully open, exposing the major visceral structures.',
      'Click "Inspect Internal Organs" to load the high-detail 3D Frog Heart and Lungs model.',
      'Examine the 3-chambered heart: locate the single muscular ventricle, left atrium, right atrium, and conus arteriosus.',
      'Inspect the paired sacculated lungs situated dorsolateral to the heart, noting alveolar wall vascularization.',
    ],
    anatomicalTarget: 'Three-chambered heart (Cor), paired sacculated lungs (Pulmones), conus arteriosus',
    clinicalSafetyNotes: 'The internal organ model features interactive 3D annotations highlighting cardiorespiratory anatomy.',
    specimenView: 'internal',
  },
];

