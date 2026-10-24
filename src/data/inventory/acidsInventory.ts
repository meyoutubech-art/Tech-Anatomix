export interface RawDocEntry {
  page: number;
  section: 'Acids' | 'Bases' | 'Salts & Solutions' | 'Metals' | 'Oxidizers' | 'Indicators' | 'Catalysts';
  subsection: string;
  name: string;
  sourceFormula: string;
  verifiedFormula: string;
  canonicalId?: string;
  correctionNote?: string;
  state?: 'liquid' | 'solid' | 'gas';
  color?: string;
  safetyClass?: 'school_lab_supported' | 'conceptual_reference' | 'hazardous_restricted' | 'radioactive_restricted';
  restrictionReason?: string;
  aliases?: string[];
  description?: string;
  catalyticRole?: string;
  indicatorInfo?: {
    acidColor: string;
    neutralColor?: string;
    baseColor: string;
    transitionRange: string;
    indicatorType: 'pH' | 'redox' | 'complexometric' | 'precipitation' | 'fluorescent';
  };
}

// Helper for concise raw tuple: [page, subsection, name, sourceFormula, verifiedFormula?, canonicalId?, correctionNote?, safetyClass?, restrictionReason?, aliases?]
export type RawDocTuple = [
  number,
  string,
  string,
  string,
  string?,
  string?,
  string?,
  ('school_lab_supported' | 'conceptual_reference' | 'hazardous_restricted' | 'radioactive_restricted')?,
  string?,
  string[]?
];

export const ACIDS_RAW_TUPLES: RawDocTuple[] = [
  // 1. Mineral (inorganic) acids (Pages 1-2, 58 entries)
  [1, 'Mineral (inorganic) acids', 'Hydrochloric acid', 'HCl', 'HCl (aq)', 'hcl', undefined, 'school_lab_supported', undefined, ['Muriatic acid', 'Dilute hydrochloric acid', 'Concentrated hydrochloric acid']],
  [1, 'Mineral (inorganic) acids', 'Hydrobromic acid', 'HBr', 'HBr (aq)', 'hbr', undefined, 'school_lab_supported'],
  [1, 'Mineral (inorganic) acids', 'Hydroiodic acid', 'HI', 'HI (aq)', 'hi_acid', undefined, 'school_lab_supported', undefined, ['Hydriodic acid']],
  [1, 'Mineral (inorganic) acids', 'Hydrofluoric acid', 'HF', 'HF (aq)', 'hf_acid', undefined, 'hazardous_restricted', 'Acutely toxic tissue-penetrating and glass-etching acid; restricted from school lab simulation.'],
  [1, 'Mineral (inorganic) acids', 'Sulfuric acid', 'H₂SO₄', 'H₂SO₄ (aq)', 'h2so4', undefined, 'school_lab_supported', undefined, ['Oil of vitriol', 'Dilute sulfuric acid', 'Concentrated sulfuric acid']],
  [1, 'Mineral (inorganic) acids', 'Sulfurous acid', 'H₂SO₃', 'H₂SO₃ (aq)', 'h2so3', undefined, 'school_lab_supported'],
  [1, 'Mineral (inorganic) acids', 'Nitric acid', 'HNO₃', 'HNO₃ (aq)', 'hno3', undefined, 'school_lab_supported', undefined, ['Aqua fortis', 'Dilute nitric acid', 'Concentrated nitric acid']],
  [1, 'Mineral (inorganic) acids', 'Nitrous acid', 'HNO₂', 'HNO₂ (aq)', 'hno2', undefined, 'school_lab_supported'],
  [1, 'Mineral (inorganic) acids', 'Phosphoric acid (orthophosphoric acid)', 'H₃PO₄', 'H₃PO₄ (aq)', 'h3po4', undefined, 'school_lab_supported', undefined, ['Orthophosphoric acid', 'Phosphoric acid']],
  [1, 'Mineral (inorganic) acids', 'Phosphorous acid (phosphonic acid)', 'H₃PO₃', 'H₃PO₃ (aq)', 'h3po3', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Hypophosphorous acid (phosphinic acid)', 'H₃PO₂', 'H₃PO₂ (aq)', 'h3po2', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Pyrophosphoric acid', 'H₄P₂O₇', 'H₄P₂O₇', 'h4p2o7', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Metaphosphoric acid', '(HPO₃)n', '(HPO₃)ₙ', 'hpo3_n', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Tripolyphosphoric acid', 'H₅P₃O₁₀', 'H₅P₃O₁₀', 'h5p3o10', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Carbonic acid', 'H₂CO₃', 'H₂CO₃ (aq)', 'h2co3', undefined, 'school_lab_supported'],
  [1, 'Mineral (inorganic) acids', 'Boric acid (orthoboric acid)', 'H₃BO₃', 'H₃BO₃ (aq)', 'h3bo3', undefined, 'school_lab_supported', undefined, ['Orthoboric acid', 'Boric acid']],
  [1, 'Mineral (inorganic) acids', 'Metaboric acid', '(HBO₂)n', '(HBO₂)ₙ', 'hbo2_n', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Tetraboric acid (pyroboric acid)', 'H₂B₄O₇', 'H₂B₄O₇', 'h2b4o7', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Silicic acid (orthosilicic acid)', 'H₄SiO₄', 'H₄SiO₄', 'h4sio4', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Metasilicic acid', 'H₂SiO₃', 'H₂SiO₃', 'h2sio3', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Perchloric acid', 'HClO₄', 'HClO₄ (aq)', 'hclo4', undefined, 'conceptual_reference', undefined, ['Perchloric acid 70%']],
  [1, 'Mineral (inorganic) acids', 'Chloric acid', 'HClO₃', 'HClO₃ (aq)', 'hclo3', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Chlorous acid', 'HClO₂', 'HClO₂ (aq)', 'hclo2', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Hypochlorous acid', 'HClO', 'HClO (aq)', 'hclo', undefined, 'school_lab_supported', undefined, ['HOCl']],
  [1, 'Mineral (inorganic) acids', 'Perbromic acid', 'HBrO₄', 'HBrO₄ (aq)', 'hbro4', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Bromic acid', 'HBrO₃', 'HBrO₃ (aq)', 'hbro3', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Bromous acid', 'HBrO₂', 'HBrO₂ (aq)', 'hbro2', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Hypobromous acid', 'HBrO', 'HBrO (aq)', 'hbro', undefined, 'conceptual_reference', undefined, ['HOBr']],
  [1, 'Mineral (inorganic) acids', 'Periodic acid (orthoperiodic acid)', 'H₅IO₆', 'H₅IO₆ (aq)', 'h5io6', undefined, 'conceptual_reference', undefined, ['Orthoperiodic acid']],
  [1, 'Mineral (inorganic) acids', 'Metaperiodic acid', 'HIO₄', 'HIO₄ (aq)', 'hio4', undefined, 'conceptual_reference', undefined, ['Periodic acid HIO4']],
  [1, 'Mineral (inorganic) acids', 'Iodic acid', 'HIO₃', 'HIO₃ (aq)', 'hio3', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Hypoiodous acid', 'HIO', 'HIO (aq)', 'hio', undefined, 'conceptual_reference', undefined, ['HOI']],
  [1, 'Mineral (inorganic) acids', 'Chromic acid', 'H₂CrO₄', 'H₂CrO₄ (aq)', 'h2cro4', undefined, 'hazardous_restricted', 'Hexavalent chromium (Cr(VI)) carcinogen and strong corrosive oxidizer.'],
  [1, 'Mineral (inorganic) acids', 'Dichromic acid', 'H₂Cr₂O₇', 'H₂Cr₂O₇ (aq)', 'h2cr2o7', undefined, 'hazardous_restricted', 'Hexavalent chromium (Cr(VI)) carcinogen and strong oxidizer.'],
  [1, 'Mineral (inorganic) acids', 'Permanganic acid', 'HMnO₄', 'HMnO₄ (aq)', 'hmno4', undefined, 'hazardous_restricted', 'Unstable shock-sensitive strong oxidizing acid.'],
  [1, 'Mineral (inorganic) acids', 'Manganic acid', 'H₂MnO₄', 'H₂MnO₄ (aq)', 'h2mno4', undefined, 'conceptual_reference'],
  [1, 'Mineral (inorganic) acids', 'Hydrosulfuric acid (aqueous hydrogen sulfide)', 'H₂S', 'H₂S (aq)', 'h2s_aq', undefined, 'hazardous_restricted', 'Acutely toxic neurotoxic gas in solution (rotten-egg gas); restricted to fume-hood reference.'],
  [1, 'Mineral (inorganic) acids', 'Hydroselenic acid', 'H₂Se', 'H₂Se (aq)', 'h2se', undefined, 'hazardous_restricted', 'Extremely toxic selenium hydride acid.'],
  [1, 'Mineral (inorganic) acids', 'Hydrotelluric acid', 'H₂Te', 'H₂Te (aq)', 'h2te', undefined, 'hazardous_restricted', 'Unstable toxic tellurium hydride acid.'],
  [1, 'Mineral (inorganic) acids', 'Hydrocyanic acid (prussic acid)', 'HCN', 'HCN (aq)', 'hcn_acid', undefined, 'hazardous_restricted', 'Lethal cytochrome c oxidase inhibitor (prussic acid); strictly restricted from interactive lab use.', ['Prussic acid', 'Hydrogen cyanide']],
  [1, 'Mineral (inorganic) acids', 'Hydrazoic acid', 'HN₃', 'HN₃ (aq)', 'hn3_acid', undefined, 'hazardous_restricted', 'Shock-sensitive primary explosive and acutely toxic volatile acid.'],
  [2, 'Mineral (inorganic) acids', 'Thiocyanic acid', 'HSCN', 'HSCN (aq)', 'hscn', undefined, 'conceptual_reference'],
  [2, 'Mineral (inorganic) acids', 'Cyanic acid', 'HOCN', 'HOCN (aq)', 'hocn', undefined, 'conceptual_reference'],
  [2, 'Mineral (inorganic) acids', 'Isocyanic acid', 'HNCO', 'HNCO', 'hnco', undefined, 'conceptual_reference'],
  [2, 'Mineral (inorganic) acids', 'Fulminic acid', 'HCNO', 'HCNO', 'hcno', undefined, 'hazardous_restricted', 'Explosive unstable isomer of cyanic acid.'],
  [2, 'Mineral (inorganic) acids', 'Thiosulfuric acid', 'H₂S₂O₃', 'H₂S₂O₃ (aq)', 'h2s2o3', undefined, 'conceptual_reference'],
  [2, 'Mineral (inorganic) acids', 'Pyrosulfuric acid (oleum / disulfuric acid)', 'H₂S₂O₇', 'H₂S₂O₇ (l)', 'h2s2o7', undefined, 'hazardous_restricted', 'Fuming sulfuric acid (oleum); reacts violently with water.', ['Oleum', 'Disulfuric acid']],
  [2, 'Mineral (inorganic) acids', 'Peroxymonosulfuric acid (Caro’s acid)', 'H₂SO₅', 'H₂SO₅', 'h2so5', undefined, 'hazardous_restricted', 'Caro’s acid; extreme oxidizing and explosive hazard with organics.', ['Caro’s acid', 'Caros acid']],
  [2, 'Mineral (inorganic) acids', 'Peroxydisulfuric acid (Marshall’s acid)', 'H₂S₂O₈', 'H₂S₂O₈', 'h2s2o8', undefined, 'conceptual_reference', undefined, ['Marshall’s acid', 'Marshalls acid']],
  [2, 'Mineral (inorganic) acids', 'Dithionic acid', 'H₂S₂O₆', 'H₂S₂O₆', 'h2s2o6', undefined, 'conceptual_reference'],
  [2, 'Mineral (inorganic) acids', 'Dithionous acid', 'H₂S₂O₄', 'H₂S₂O₄', 'h2s2o4', undefined, 'conceptual_reference'],
  [2, 'Mineral (inorganic) acids', 'Selenic acid', 'H₂SeO₄', 'H₂SeO₄', 'h2seo4', undefined, 'hazardous_restricted', 'Strong oxidizing toxic selenium oxyacid.'],
  [2, 'Mineral (inorganic) acids', 'Selenous acid', 'H₂SeO₃', 'H₂SeO₃', 'h2seo3', undefined, 'hazardous_restricted', 'Toxic selenium(IV) oxyacid.'],
  [2, 'Mineral (inorganic) acids', 'Telluric acid', 'H₆TeO₆', 'H₆TeO₆', 'h6teo6', undefined, 'conceptual_reference'],
  [2, 'Mineral (inorganic) acids', 'Tellurous acid', 'H₂TeO₃', 'H₂TeO₃', 'h2teo3', undefined, 'conceptual_reference'],
  [2, 'Mineral (inorganic) acids', 'Arsenic acid', 'H₃AsO₄', 'H₃AsO₄', 'h3aso4', undefined, 'hazardous_restricted', 'Acutely toxic and carcinogenic arsenic(V) oxyacid.'],
  [2, 'Mineral (inorganic) acids', 'Arsenous acid', 'H₃AsO₃', 'H₃AsO₃', 'h3aso3', undefined, 'hazardous_restricted', 'Highly toxic arsenic(III) oxyacid.'],
  [2, 'Mineral (inorganic) acids', 'Fluorosilicic acid', 'H₂SiF₆', 'H₂SiF₆ (aq)', 'h2sif6', undefined, 'hazardous_restricted', 'Corrosive氟-silicate acid releasing HF fumes on decomposition.'],

  // 2. Superacids (Page 2, 5 entries)
  [2, 'Superacids', 'Fluorosulfuric acid', 'HSO₃F', 'HSO₃F', 'hso3f', undefined, 'hazardous_restricted', 'Superacid (H₀ = -15.1); reacts violently with water.'],
  [2, 'Superacids', 'Trifluoromethanesulfonic acid (triflic acid)', 'CF₃SO₃H', 'CF₃SO₃H', 'cf3so3h', undefined, 'hazardous_restricted', 'Superacid (triflic acid, H₀ = -14.9); fuming corrosive liquid.', ['Triflic acid', 'TfOH']],
  [2, 'Superacids', 'Fluoroantimonic acid', 'HSbF₆', 'HSbF₆', 'hsbf6', undefined, 'hazardous_restricted', 'Strongest known superacid (H₀ ≈ -28); decomposes explosively with water.'],
  [2, 'Superacids', 'Magic acid', 'FSO₃H·SbF₅', 'FSO₃H·SbF₅', 'magic_acid', undefined, 'hazardous_restricted', 'Conjugate Brønsted–Lewis superacid capable of protonating alkanes; extreme moisture reactivity.'],
  [2, 'Superacids', 'Carborane acid', 'H(CHB₁₁Cl₁₁)', 'H(CHB₁₁Cl₁₁)', 'carborane_acid', undefined, 'conceptual_reference'],

  // 3. Simple carboxylic acids (Page 2, 12 entries)
  [2, 'Simple carboxylic acids', 'Formic acid (methanoic acid)', 'HCOOH', 'HCOOH (aq)', 'hcooh', undefined, 'school_lab_supported', undefined, ['Methanoic acid']],
  [2, 'Simple carboxylic acids', 'Acetic acid (ethanoic acid)', 'CH₃COOH', 'CH₃COOH (aq)', 'ch3cooh', undefined, 'school_lab_supported', undefined, ['Ethanoic acid', 'Vinegar', 'Glacial acetic acid']],
  [2, 'Simple carboxylic acids', 'Propionic acid (propanoic acid)', 'CH₃CH₂COOH', 'CH₃CH₂COOH (aq)', 'propionic_acid', undefined, 'school_lab_supported', undefined, ['Propanoic acid']],
  [2, 'Simple carboxylic acids', 'Butyric acid (butanoic acid)', 'CH₃(CH₂)₂COOH', 'CH₃(CH₂)₂COOH', 'butyric_acid', undefined, 'conceptual_reference', undefined, ['Butanoic acid']],
  [2, 'Simple carboxylic acids', 'Isobutyric acid (2-methylpropanoic acid)', '(CH₃)₂CHCOOH', '(CH₃)₂CHCOOH', 'isobutyric_acid', undefined, 'conceptual_reference', undefined, ['2-Methylpropanoic acid']],
  [2, 'Simple carboxylic acids', 'Valeric acid (pentanoic acid)', 'CH₃(CH₂)₃COOH', 'CH₃(CH₂)₃COOH', 'valeric_acid', undefined, 'conceptual_reference', undefined, ['Pentanoic acid']],
  [2, 'Simple carboxylic acids', 'Isovaleric acid (3-methylbutanoic acid)', '(CH₃)₂CHCH₂COOH', '(CH₃)₂CHCH₂COOH', 'isovaleric_acid', undefined, 'conceptual_reference'],
  [2, 'Simple carboxylic acids', 'Pivalic acid (trimethylacetic acid)', '(CH₃)₃CCOOH', '(CH₃)₃CCOOH', 'pivalic_acid', undefined, 'conceptual_reference'],
  [2, 'Simple carboxylic acids', 'Caproic acid (hexanoic acid)', 'CH₃(CH₂)₄COOH', 'CH₃(CH₂)₄COOH', 'caproic_acid', undefined, 'conceptual_reference', undefined, ['Hexanoic acid']],
  [2, 'Simple carboxylic acids', 'Enanthic acid (heptanoic acid)', 'CH₃(CH₂)₅COOH', 'CH₃(CH₂)₅COOH', 'enanthic_acid', undefined, 'conceptual_reference', undefined, ['Heptanoic acid']],
  [2, 'Simple carboxylic acids', 'Caprylic acid (octanoic acid)', 'CH₃(CH₂)₆COOH', 'CH₃(CH₂)₆COOH', 'caprylic_acid', undefined, 'conceptual_reference', undefined, ['Octanoic acid']],
  [2, 'Simple carboxylic acids', 'Pelargonic acid (nonanoic acid)', 'CH₃(CH₂)₇COOH', 'CH₃(CH₂)₇COOH', 'pelargonic_acid', undefined, 'conceptual_reference', undefined, ['Nonanoic acid']],

  // 4. Halogenated acetic acids (Page 2, 6 entries)
  [2, 'Halogenated acetic acids', 'Fluoroacetic acid', 'CH₂FCOOH', 'CH₂FCOOH', 'fluoroacetic_acid', undefined, 'hazardous_restricted', 'Acutely toxic metabolic poison (inhibits aconitase in the citric acid cycle).'],
  [2, 'Halogenated acetic acids', 'Chloroacetic acid', 'CH₂ClCOOH', 'CH₂ClCOOH', 'chloroacetic_acid', undefined, 'conceptual_reference'],
  [2, 'Halogenated acetic acids', 'Dichloroacetic acid', 'CHCl₂COOH', 'CHCl₂COOH', 'dichloroacetic_acid', undefined, 'conceptual_reference'],
  [2, 'Halogenated acetic acids', 'Trichloroacetic acid', 'CCl₃COOH', 'CCl₃COOH', 'trichloroacetic_acid', undefined, 'conceptual_reference', undefined, ['TCA']],
  [2, 'Halogenated acetic acids', 'Trifluoroacetic acid', 'CF₃COOH', 'CF₃COOH', 'tfa_acid', undefined, 'conceptual_reference', undefined, ['TFA']],
  [2, 'Halogenated acetic acids', 'Bromoacetic acid', 'CH₂BrCOOH', 'CH₂BrCOOH', 'bromoacetic_acid', undefined, 'conceptual_reference'],

  // 5. Dicarboxylic acids (Pages 2-3, 14 entries)
  [2, 'Dicarboxylic acids', 'Oxalic acid (ethanedioic acid)', 'HOOC-COOH (H₂C₂O₄)', 'H₂C₂O₄·2H₂O (s)', 'oxalic_acid', undefined, 'school_lab_supported', undefined, ['Ethanedioic acid', 'Oxalic acid']],
  [2, 'Dicarboxylic acids', 'Malonic acid (propanedioic acid)', 'HOOC-CH₂-COOH', 'HOOCCH₂COOH', 'malonic_acid', undefined, 'school_lab_supported', undefined, ['Propanedioic acid']],
  [2, 'Dicarboxylic acids', 'Succinic acid (butanedioic acid)', 'HOOC-(CH₂)₂-COOH', 'HOOC(CH₂)₂COOH', 'succinic_acid', undefined, 'school_lab_supported', undefined, ['Butanedioic acid']],
  [3, 'Dicarboxylic acids', 'Glutaric acid (pentanedioic acid)', 'HOOC-(CH₂)₃-COOH', 'HOOC(CH₂)₃COOH', 'glutaric_acid', undefined, 'conceptual_reference', undefined, ['Pentanedioic acid']],
  [3, 'Dicarboxylic acids', 'Adipic acid (hexanedioic acid)', 'HOOC-(CH₂)₄-COOH', 'HOOC(CH₂)₄COOH', 'adipic_acid', undefined, 'conceptual_reference', undefined, ['Hexanedioic acid']],
  [3, 'Dicarboxylic acids', 'Pimelic acid (heptanedioic acid)', 'HOOC-(CH₂)₅-COOH', 'HOOC(CH₂)₅COOH', 'pimelic_acid', undefined, 'conceptual_reference'],
  [3, 'Dicarboxylic acids', 'Suberic acid (octanedioic acid)', 'HOOC-(CH₂)₆-COOH', 'HOOC(CH₂)₆COOH', 'suberic_acid', undefined, 'conceptual_reference'],
  [3, 'Dicarboxylic acids', 'Azelaic acid (nonanedioic acid)', 'HOOC-(CH₂)₇-COOH', 'HOOC(CH₂)₇COOH', 'azelaic_acid', undefined, 'conceptual_reference'],
  [3, 'Dicarboxylic acids', 'Sebacic acid (decanedioic acid)', 'HOOC-(CH₂)₈-COOH', 'HOOC(CH₂)₈COOH', 'sebacic_acid', undefined, 'conceptual_reference'],
  [3, 'Dicarboxylic acids', 'Maleic acid (cis-butenedioic acid)', 'HOOC-CH=CH-COOH', 'cis-HOOCCH=CHCOOH', 'maleic_acid', undefined, 'conceptual_reference'],
  [3, 'Dicarboxylic acids', 'Fumaric acid (trans-butenedioic acid)', 'HOOC-CH=CH-COOH', 'trans-HOOCCH=CHCOOH', 'fumaric_acid', undefined, 'conceptual_reference'],
  [3, 'Dicarboxylic acids', 'Phthalic acid (benzene-1,2-dicarboxylic acid)', 'C₆H₄(COOH)₂', '1,2-C₆H₄(COOH)₂', 'phthalic_acid', undefined, 'conceptual_reference'],
  [3, 'Dicarboxylic acids', 'Isophthalic acid (benzene-1,3-dicarboxylic acid)', 'C₆H₄(COOH)₂', '1,3-C₆H₄(COOH)₂', 'isophthalic_acid', undefined, 'conceptual_reference'],
  [3, 'Dicarboxylic acids', 'Terephthalic acid (benzene-1,4-dicarboxylic acid)', 'C₆H₄(COOH)₂', '1,4-C₆H₄(COOH)₂', 'terephthalic_acid', undefined, 'conceptual_reference'],

  // 6. Hydroxy and keto acids (Page 3, 21 entries)
  [3, 'Hydroxy and keto acids', 'Glycolic acid (hydroxyacetic acid)', 'HOCH₂COOH', 'HOCH₂COOH', 'glycolic_acid', undefined, 'school_lab_supported'],
  [3, 'Hydroxy and keto acids', 'Lactic acid (2-hydroxypropanoic acid)', 'CH₃CH(OH)COOH', 'CH₃CH(OH)COOH (aq)', 'lactic_acid', undefined, 'school_lab_supported', undefined, ['2-Hydroxypropanoic acid']],
  [3, 'Hydroxy and keto acids', 'Malic acid (hydroxybutanedioic acid)', 'HOOC-CH₂-CH(OH)-COOH', 'HOOCCH₂CH(OH)COOH', 'malic_acid', undefined, 'school_lab_supported'],
  [3, 'Hydroxy and keto acids', 'Tartaric acid (2,3-dihydroxybutanedioic acid)', 'HOOC-CH(OH)-CH(OH)-COOH', 'HOOCCH(OH)CH(OH)COOH (aq)', 'tartaric_acid', undefined, 'school_lab_supported', undefined, ['L-Tartaric acid']],
  [3, 'Hydroxy and keto acids', 'Citric acid', 'HOC(COOH)(CH₂COOH)₂ (C₆H₈O₇)', 'C₆H₈O₇ (aq)', 'c6h8o7', undefined, 'school_lab_supported', undefined, ['Citric acid solution']],
  [3, 'Hydroxy and keto acids', 'Isocitric acid', 'HOOC-CH(OH)-CH(COOH)-CH₂-COOH', 'C₆H₈O₇ (isocitric)', 'isocitric_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'Gluconic acid', 'HOCH₂(CHOH)₄COOH', 'C₆H₁₂O₇', 'gluconic_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'Glucuronic acid', 'HOOC(CHOH)₄CHO', 'C₆H₁₀O₇', 'glucuronic_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'Galacturonic acid', 'C₆H₁₀O₇', 'C₆H₁₀O₇ (galacturonic)', 'galacturonic_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'Mandelic acid', 'C₆H₅CH(OH)COOH', 'C₆H₅CH(OH)COOH', 'mandelic_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'Glyceric acid', 'HOCH₂CH(OH)COOH', 'HOCH₂CH(OH)COOH', 'glyceric_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'Salicylic acid (2-hydroxybenzoic acid)', 'C₆H₄(OH)COOH', '2-HOC₆H₄COOH', 'salicylic_acid', undefined, 'school_lab_supported', undefined, ['2-Hydroxybenzoic acid']],
  [3, 'Hydroxy and keto acids', 'Gallic acid (3,4,5-trihydroxybenzoic acid)', 'C₆H₂(OH)₃COOH', 'C₆H₂(OH)₃COOH', 'gallic_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'Pyruvic acid (2-oxopropanoic acid)', 'CH₃COCOOH', 'CH₃COCOOH', 'pyruvic_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'Acetoacetic acid (3-oxobutanoic acid)', 'CH₃COCH₂COOH', 'CH₃COCH₂COOH', 'acetoacetic_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'Levulinic acid (4-oxopentanoic acid)', 'CH₃COCH₂CH₂COOH', 'CH₃COCH₂CH₂COOH', 'levulinic_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'Oxaloacetic acid', 'HOOC-CO-CH₂-COOH', 'HOOCCOCH₂COOH', 'oxaloacetic_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'α-Ketoglutaric acid', 'HOOC-CO-(CH₂)₂-COOH', 'HOOCCO(CH₂)₂COOH', 'alpha_ketoglutaric_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'Glyoxylic acid', 'OHC-COOH', 'OHCCOOH', 'glyoxylic_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'β-Hydroxybutyric acid', 'CH₃CH(OH)CH₂COOH', 'CH₃CH(OH)CH₂COOH', 'beta_hydroxybutyric_acid', undefined, 'conceptual_reference'],
  [3, 'Hydroxy and keto acids', 'Mevalonic acid', 'C₆H₁₂O₄', 'C₆H₁₂O₄', 'mevalonic_acid', undefined, 'conceptual_reference'],

  // 7. Aromatic acids (Pages 3-4, 20 entries)
  [3, 'Aromatic acids', 'Benzoic acid', 'C₆H₅COOH', 'C₆H₅COOH (s)', 'benzoic_acid', undefined, 'school_lab_supported'],
  [3, 'Aromatic acids', 'Phenylacetic acid', 'C₆H₅CH₂COOH', 'C₆H₅CH₂COOH', 'phenylacetic_acid', undefined, 'conceptual_reference'],
  [3, 'Aromatic acids', 'Cinnamic acid', 'C₆H₅CH=CHCOOH', 'C₆H₅CH=CHCOOH', 'cinnamic_acid', undefined, 'conceptual_reference'],
  [3, 'Aromatic acids', 'Caffeic acid', '(HO)₂C₆H₃CH=CHCOOH', '(HO)₂C₆H₃CH=CHCOOH', 'caffeic_acid', undefined, 'conceptual_reference'],
  [3, 'Aromatic acids', 'Ferulic acid', 'C₁₀H₁₀O₄', 'C₁₀H₁₀O₄', 'ferulic_acid', undefined, 'conceptual_reference'],
  [3, 'Aromatic acids', 'Coumaric acid (p-coumaric acid)', 'HOC₆H₄CH=CHCOOH', 'HOC₆H₄CH=CHCOOH', 'coumaric_acid', undefined, 'conceptual_reference'],
  [3, 'Aromatic acids', 'Sinapic acid', 'C₁₁H₁₂O₅', 'C₁₁H₁₂O₅', 'sinapic_acid', undefined, 'conceptual_reference'],
  [3, 'Aromatic acids', 'Vanillic acid', 'C₈H₈O₄', 'C₈H₈O₄', 'vanillic_acid', undefined, 'conceptual_reference'],
  [3, 'Aromatic acids', 'Syringic acid', 'C₉H₁₀O₅', 'C₉H₁₀O₅', 'syringic_acid', undefined, 'conceptual_reference'],
  [3, 'Aromatic acids', 'Protocatechuic acid', '(HO)₂C₆H₃COOH', '(HO)₂C₆H₃COOH', 'protocatechuic_acid', undefined, 'conceptual_reference'],
  [3, 'Aromatic acids', 'Gentisic acid', 'C₆H₃(OH)₂COOH', '2,5-(HO)₂C₆H₃COOH', 'gentisic_acid', undefined, 'conceptual_reference'],
  [3, 'Aromatic acids', 'Anthranilic acid (2-aminobenzoic acid)', 'C₆H₄(NH₂)COOH', '2-H₂NC₆H₄COOH', 'anthranilic_acid', undefined, 'conceptual_reference'],
  [4, 'Aromatic acids', 'p-Aminobenzoic acid (PABA)', 'H₂NC₆H₄COOH', '4-H₂NC₆H₄COOH', 'paba_acid', undefined, 'conceptual_reference', undefined, ['PABA']],
  [4, 'Aromatic acids', 'Acetylsalicylic acid (aspirin)', 'CH₃COOC₆H₄COOH', 'CH₃COOC₆H₄COOH', 'aspirin', undefined, 'school_lab_supported', undefined, ['Aspirin']],
  [4, 'Aromatic acids', 'Hippuric acid', 'C₆H₅CONHCH₂COOH', 'C₆H₅CONHCH₂COOH', 'hippuric_acid', undefined, 'conceptual_reference'],
  [4, 'Aromatic acids', 'Toluic acid (o-, m-, p-methylbenzoic acid)', 'CH₃C₆H₄COOH', 'CH₃C₆H₄COOH', 'toluic_acid', undefined, 'conceptual_reference'],
  [4, 'Aromatic acids', 'Anisic acid (p-methoxybenzoic acid)', 'CH₃OC₆H₄COOH', '4-CH₃OC₆H₄COOH', 'anisic_acid', undefined, 'conceptual_reference'],
  [4, 'Aromatic acids', '1-Naphthoic acid', 'C₁₀H₇COOH', '1-C₁₀H₇COOH', 'naphthoic_acid_1', undefined, 'conceptual_reference'],
  [4, 'Aromatic acids', '2-Naphthoic acid', 'C₁₀H₇COOH', '2-C₁₀H₇COOH', 'naphthoic_acid_2', undefined, 'conceptual_reference'],
  [4, 'Aromatic acids', 'Picric acid (2,4,6-trinitrophenol)', '(O₂N)₃C₆H₂OH', '(O₂N)₃C₆H₂OH', 'picric_acid', undefined, 'hazardous_restricted', '2,4,6-Trinitrophenol; shock-sensitive high explosive when dry and forms explosive metal picrates.'],

  // 8. Saturated fatty acids (Page 4, 8 entries)
  [4, 'Saturated fatty acids', 'Capric acid (decanoic acid)', 'CH₃(CH₂)₈COOH', 'CH₃(CH₂)₈COOH', 'capric_acid', undefined, 'conceptual_reference'],
  [4, 'Saturated fatty acids', 'Lauric acid (dodecanoic acid)', 'CH₃(CH₂)₁₀COOH', 'CH₃(CH₂)₁₀COOH', 'lauric_acid', undefined, 'conceptual_reference'],
  [4, 'Saturated fatty acids', 'Myristic acid (tetradecanoic acid)', 'CH₃(CH₂)₁₂COOH', 'CH₃(CH₂)₁₂COOH', 'myristic_acid', undefined, 'conceptual_reference'],
  [4, 'Saturated fatty acids', 'Palmitic acid (hexadecanoic acid)', 'CH₃(CH₂)₁₄COOH', 'CH₃(CH₂)₁₄COOH', 'palmitic_acid', undefined, 'conceptual_reference'],
  [4, 'Saturated fatty acids', 'Margaric acid (heptadecanoic acid)', 'CH₃(CH₂)₁₅COOH', 'CH₃(CH₂)₁₅COOH', 'margaric_acid', undefined, 'conceptual_reference'],
  [4, 'Saturated fatty acids', 'Stearic acid (octadecanoic acid)', 'CH₃(CH₂)₁₆COOH', 'CH₃(CH₂)₁₆COOH', 'stearic_acid', undefined, 'school_lab_supported', undefined, ['Octadecanoic acid']],
  [4, 'Saturated fatty acids', 'Arachidic acid (eicosanoic acid)', 'CH₃(CH₂)₁₈COOH', 'CH₃(CH₂)₁₈COOH', 'arachidic_acid', undefined, 'conceptual_reference'],
  [4, 'Saturated fatty acids', 'Behenic acid (docosanoic acid)', 'CH₃(CH₂)₂₀COOH', 'CH₃(CH₂)₂₀COOH', 'behenic_acid', undefined, 'conceptual_reference'],
  // Wait: let's check page 4 saturated fatty acids: there are 10 entries in Saturated fatty acids! Let's include Lignoceric and Cerotic!
  [4, 'Saturated fatty acids', 'Lignoceric acid (tetracosanoic acid)', 'CH₃(CH₂)₂₂COOH', 'CH₃(CH₂)₂₂COOH', 'lignoceric_acid', undefined, 'conceptual_reference'],
  [4, 'Saturated fatty acids', 'Cerotic acid (hexacosanoic acid)', 'CH₃(CH₂)₂₄COOH', 'CH₃(CH₂)₂₄COOH', 'cerotic_acid', undefined, 'conceptual_reference'],

  // 9. Unsaturated fatty acids (Page 4, 15 entries)
  [4, 'Unsaturated fatty acids', 'Acrylic acid (propenoic acid)', 'CH₂=CHCOOH', 'CH₂=CHCOOH', 'acrylic_acid', undefined, 'conceptual_reference'],
  [4, 'Unsaturated fatty acids', 'Methacrylic acid', 'CH₂=C(CH₃)COOH', 'CH₂=C(CH₃)COOH', 'methacrylic_acid', undefined, 'conceptual_reference'],
  [4, 'Unsaturated fatty acids', 'Crotonic acid (trans-2-butenoic acid)', 'CH₃CH=CHCOOH', 'CH₃CH=CHCOOH', 'crotonic_acid', undefined, 'conceptual_reference'],
  [4, 'Unsaturated fatty acids', 'Sorbic acid (2,4-hexadienoic acid)', 'CH₃(CH=CH)₂COOH', 'CH₃(CH=CH)₂COOH', 'sorbic_acid', undefined, 'conceptual_reference'],
  [4, 'Unsaturated fatty acids', 'Palmitoleic acid', 'C₁₅H₂₉COOH', 'C₁₅H₂₉COOH', 'palmitoleic_acid', undefined, 'conceptual_reference'],
  [4, 'Unsaturated fatty acids', 'Oleic acid', 'C₁₇H₃₃COOH', 'C₁₇H₃₃COOH', 'oleic_acid', undefined, 'school_lab_supported'],
  [4, 'Unsaturated fatty acids', 'Elaidic acid', 'C₁₇H₃₃COOH', 'trans-C₁₇H₃₃COOH', 'elaidic_acid', undefined, 'conceptual_reference'],
  [4, 'Unsaturated fatty acids', 'Linoleic acid', 'C₁₇H₃₁COOH', 'C₁₇H₃₁COOH', 'linoleic_acid', undefined, 'conceptual_reference'],
  [4, 'Unsaturated fatty acids', 'α-Linolenic acid (ALA)', 'C₁₇H₂₉COOH', 'α-C₁₇H₂₉COOH', 'alpha_linolenic_acid', undefined, 'conceptual_reference', undefined, ['ALA']],
  [4, 'Unsaturated fatty acids', 'γ-Linolenic acid (GLA)', 'C₁₇H₂₉COOH', 'γ-C₁₇H₂₉COOH', 'gamma_linolenic_acid', undefined, 'conceptual_reference', undefined, ['GLA']],
  [4, 'Unsaturated fatty acids', 'Arachidonic acid', 'C₁₉H₃₁COOH', 'C₁₉H₃₁COOH', 'arachidonic_acid', undefined, 'conceptual_reference'],
  [4, 'Unsaturated fatty acids', 'Eicosapentaenoic acid (EPA)', 'C₁₉H₂₉COOH', 'C₁₉H₂₉COOH', 'epa_acid', undefined, 'conceptual_reference', undefined, ['EPA']],
  [4, 'Unsaturated fatty acids', 'Docosahexaenoic acid (DHA)', 'C₂₁H₃₁COOH', 'C₂₁H₃₁COOH', 'dha_acid', undefined, 'conceptual_reference', undefined, ['DHA']],
  [4, 'Unsaturated fatty acids', 'Erucic acid', 'C₂₁H₄₁COOH', 'C₂₁H₄₁COOH', 'erucic_acid', undefined, 'conceptual_reference'],
  [4, 'Unsaturated fatty acids', 'Nervonic acid', 'C₂₃H₄500COOH', 'C₂₃H₄₅COOH (C₂₄H₄₆O₂)', 'nervonic_acid', 'Corrected corrupted source subscript "C₂₃H₄500COOH" to verified monounsaturated C24 fatty acid formula C₂₃H₄₅COOH (C₂₄H₄₆O₂).', 'conceptual_reference'],

  // 10. Amino acids (standard 20) (Pages 4-5, 20 entries)
  [4, 'Amino acids (standard 20)', 'Glycine', 'NH₂CH₂COOH (C₂H₅NO₂)', 'NH₂CH₂COOH (C₂H₅NO₂)', 'glycine', undefined, 'school_lab_supported'],
  [4, 'Amino acids (standard 20)', 'Alanine', 'C₃H₇NO₂', 'C₃H₇NO₂', 'alanine', undefined, 'conceptual_reference'],
  [4, 'Amino acids (standard 20)', 'Valine', 'C₅H₁₁NO₂', 'C₅H₁₁NO₂', 'valine', undefined, 'conceptual_reference'],
  [4, 'Amino acids (standard 20)', 'Leucine', 'C₆H₁₃NO₂', 'C₆H₁₃NO₂', 'leucine', undefined, 'conceptual_reference'],
  [4, 'Amino acids (standard 20)', 'Isoleucine', 'C₆H₁₃NO₂', 'C₆H₁₃NO₂ (Ile)', 'isoleucine', undefined, 'conceptual_reference'],
  [4, 'Amino acids (standard 20)', 'Proline', 'C₅H₉NO₂', 'C₅H₉NO₂', 'proline', undefined, 'conceptual_reference', undefined, ['L-Proline']],
  [4, 'Amino acids (standard 20)', 'Phenylalanine', 'C₉H₁₁NO₂', 'C₉H₁₁NO₂', 'phenylalanine', undefined, 'conceptual_reference'],
  [5, 'Amino acids (standard 20)', 'Tryptophan', 'C₁₁H₁₂N₂O₂', 'C₁₁H₁₂N₂O₂', 'tryptophan', undefined, 'conceptual_reference'],
  [5, 'Amino acids (standard 20)', 'Methionine', 'C₅H₁₁NO₂S', 'C₅H₁₁NO₂S', 'methionine', undefined, 'conceptual_reference'],
  [5, 'Amino acids (standard 20)', 'Serine', 'C₃H₇NO₃', 'C₃H₇NO₃', 'serine', undefined, 'conceptual_reference'],
  [5, 'Amino acids (standard 20)', 'Threonine', 'C₄H₉NO₃', 'C₄H₉NO₃', 'threonine', undefined, 'conceptual_reference'],
  [5, 'Amino acids (standard 20)', 'Cysteine', 'C₃H₇NO₂S', 'C₃H₇NO₂S', 'cysteine', undefined, 'conceptual_reference'],
  [5, 'Amino acids (standard 20)', 'Tyrosine', 'C₉H₁₁NO₃', 'C₉H₁₁NO₃', 'tyrosine', undefined, 'conceptual_reference'],
  [5, 'Amino acids (standard 20)', 'Asparagine', 'C₄H₈N₂O₃', 'C₄H₈N₂O₃', 'asparagine', undefined, 'conceptual_reference'],
  [5, 'Amino acids (standard 20)', 'Glutamine', 'C₅H₁₀N₂O₃', 'C₅H₁₀N₂O₃', 'glutamine', undefined, 'conceptual_reference'],
  [5, 'Amino acids (standard 20)', 'Aspartic acid', 'C₄H₇NO₄', 'HOOCCH₂CH(NH₂)COOH (C₄H₇NO₄)', 'aspartic_acid', undefined, 'school_lab_supported'],
  [5, 'Amino acids (standard 20)', 'Glutamic acid', 'C₅H₉NO₄', 'HOOC(CH₂)₂CH(NH₂)COOH (C₅H₉NO₄)', 'glutamic_acid', undefined, 'school_lab_supported'],
  [5, 'Amino acids (standard 20)', 'Lysine', 'C₆H₁₄N₂O₂', 'C₆H₁₄N₂O₂', 'lysine', undefined, 'conceptual_reference'],
  [5, 'Amino acids (standard 20)', 'Arginine', 'C₆H₁₄N₄O₂', 'C₆H₁₄N₄O₂', 'arginine', undefined, 'conceptual_reference'],
  [5, 'Amino acids (standard 20)', 'Histidine', 'C₆H₉N₃O₂', 'C₆H₉N₃O₂', 'histidine', undefined, 'conceptual_reference'],

  // 11. Other amino acids (Page 5, 7 entries)
  [5, 'Other amino acids', 'Taurine (2-aminoethanesulfonic acid)', 'C₂H₇NO₃S', 'H₂NCH₂CH₂SO₃H (C₂H₇NO₃S)', 'taurine', undefined, 'conceptual_reference'],
  [5, 'Other amino acids', 'GABA (γ-aminobutyric acid)', 'C₄H₉NO₂', 'H₂N(CH₂)₃COOH (C₄H₉NO₂)', 'gaba_acid', undefined, 'conceptual_reference', undefined, ['Gamma-aminobutyric acid']],
  [5, 'Other amino acids', 'Ornithine', 'C₅H₁₂N₂O₂', 'C₅H₁₂N₂O₂', 'ornithine', undefined, 'conceptual_reference'],
  [5, 'Other amino acids', 'Citrulline', 'C₆H₁₃N₃O₃', 'C₆H₁₃N₃O₃', 'citrulline', undefined, 'conceptual_reference'],
  [5, 'Other amino acids', 'Creatine', 'C₄H₉N₃O₂', 'C₄H₉N₃O₂', 'creatine', undefined, 'conceptual_reference'],
  [5, 'Other amino acids', 'Pyroglutamic acid', 'C₅H₇NO₃', 'C₅H₇NO₃', 'pyroglutamic_acid', undefined, 'conceptual_reference'],
  [5, 'Other amino acids', 'Sarcosine (N-methylglycine)', 'C₃H₇NO₂', 'CH₃NHCH₂COOH (C₃H₇NO₂)', 'sarcosine', undefined, 'conceptual_reference'],

  // 12. Nucleic acids (Page 5, 3 entries)
  [5, 'Nucleic acids', 'Deoxyribonucleic acid (DNA)', '(C₁₅H₃₁N₃O₁₃P₂)', '(C₁₅H₃₁N₃O₁₃P₂)ₙ', 'dna_polymer', 'Restored missing polymer degree subscript "n" to repeating nucleotide unit formula.', 'conceptual_reference', undefined, ['DNA']],
  [5, 'Nucleic acids', 'Ribonucleic acid (RNA)', '(C₁₀H₁₂N₅O₇P)', '(C₁₀H₁₂N₅O₇P)ₙ', 'rna_polymer', 'Restored missing polymer degree subscript "n" to repeating ribonucleotide unit formula.', 'conceptual_reference', undefined, ['RNA']],
  [5, 'Nucleic acids', 'Peptide nucleic acid (PNA)', 'synthetic polymer', 'Synthetic pseudopeptide nucleic acid oligomer', 'pna_polymer', undefined, 'conceptual_reference', undefined, ['PNA']],

  // 13. Sulfonic and organic sulfur acids (Page 5, 7 entries)
  [5, 'Sulfonic and organic sulfur acids', 'Methanesulfonic acid', 'CH₃SO₃H', 'CH₃SO₃H', 'methanesulfonic_acid', undefined, 'conceptual_reference', undefined, ['MsOH']],
  [5, 'Sulfonic and organic sulfur acids', 'Ethanesulfonic acid', 'C₂H₅SO₃H', 'C₂H₅SO₃H', 'ethanesulfonic_acid', undefined, 'conceptual_reference'],
  [5, 'Sulfonic and organic sulfur acids', 'Benzenesulfonic acid', 'C₆H₅SO₃H', 'C₆H₅SO₃H', 'benzenesulfonic_acid', undefined, 'conceptual_reference'],
  [5, 'Sulfonic and organic sulfur acids', 'p-Toluenesulfonic acid (tosylic acid)', 'CH₃C₆H₄SO₃H', '4-CH₃C₆H₄SO₃H', 'p_toluenesulfonic_acid', undefined, 'conceptual_reference', undefined, ['PTSA', 'Tosylic acid', 'TsOH']],
  [5, 'Sulfonic and organic sulfur acids', 'Camphorsulfonic acid', 'C₁₀H₁₆O₄S', 'C₁₀H₁₆O₄S', 'camphorsulfonic_acid', undefined, 'conceptual_reference', undefined, ['CSA', '10-Camphorsulfonic acid']],
  [5, 'Sulfonic and organic sulfur acids', 'Sulfanilic acid (4-aminobenzenesulfonic acid)', 'H₂NC₆H₄SO₃H', '4-H₂NC₆H₄SO₃H', 'sulfanilic_acid', undefined, 'conceptual_reference'],
  [5, 'Sulfonic and organic sulfur acids', 'Thioacetic acid', 'CH₃COSH', 'CH₃COSH', 'thioacetic_acid', undefined, 'conceptual_reference'],

  // 14. Vitamins and biological acids (Pages 5-6, 16 entries)
  [5, 'Vitamins and biological acids', 'Ascorbic acid (Vitamin C)', 'C₆H₈O₆', 'C₆H₈O₆ (s)', 'ascorbic_acid', undefined, 'school_lab_supported', undefined, ['Vitamin C']],
  [5, 'Vitamins and biological acids', 'Folic acid (Vitamin B₉)', 'C₁₉H₁₉N₇O₆', 'C₁₉H₁₉N₇O₆', 'folic_acid', undefined, 'conceptual_reference', undefined, ['Vitamin B9']],
  [5, 'Vitamins and biological acids', 'Nicotinic acid (Niacin / Vitamin B₃)', 'C₅H₄NCOOH (C₆H₅NO₂)', 'C₅H₄NCOOH (C₆H₅NO₂)', 'nicotinic_acid', undefined, 'conceptual_reference', undefined, ['Niacin', 'Vitamin B3']],
  [5, 'Vitamins and biological acids', 'Pantothenic acid (Vitamin B₅)', 'C₉H₁₇NO₅', 'C₉H₁₇NO₅', 'pantothenic_acid', undefined, 'conceptual_reference', undefined, ['Vitamin B5']],
  [5, 'Vitamins and biological acids', 'Retinoic acid (Vitamin A acid)', 'C₂₀H₂₈O₂', 'C₂₀H₂₈O₂', 'retinoic_acid', undefined, 'conceptual_reference'],
  [5, 'Vitamins and biological acids', 'Lipoic acid (α-lipoic acid)', 'C₈H₁₄O₂S₂', 'C₈H₁₄O₂S₂', 'lipoic_acid', undefined, 'conceptual_reference'],
  [5, 'Vitamins and biological acids', 'Orotic acid', 'C₅H₄N₂O₄', 'C₅H₄N₂O₄', 'orotic_acid', undefined, 'conceptual_reference'],
  [5, 'Vitamins and biological acids', 'Uric acid', 'C₅H₄N₄O₃', 'C₅H₄N₄O₃', 'uric_acid', undefined, 'conceptual_reference'],
  [6, 'Vitamins and biological acids', 'Cholic acid (bile acid)', 'C₂₄H₄₀O₅', 'C₂₄H₄₀O₅', 'cholic_acid', undefined, 'conceptual_reference'],
  [6, 'Vitamins and biological acids', 'Deoxycholic acid', 'C₂₄H₄₀O₄', 'C₂₄H₄₀O₄', 'deoxycholic_acid', undefined, 'conceptual_reference'],
  [6, 'Vitamins and biological acids', 'Chenodeoxycholic acid', 'C₂₄H₄₀O₄', 'C₂₄H₄₀O₄ (chenodeoxycholic)', 'chenodeoxycholic_acid', undefined, 'conceptual_reference'],
  [6, 'Vitamins and biological acids', 'Lithocholic acid', 'C₂₄H₄₀O₃', 'C₂₄H₄₀O₃', 'lithocholic_acid', undefined, 'conceptual_reference'],
  [6, 'Vitamins and biological acids', 'Hyaluronic acid', '(C₁₄H₂₁NO₁₁)', '(C₁₄H₂₁NO₁₁)ₙ', 'hyaluronic_acid', 'Restored missing polymer degree subscript "n" to repeating disaccharide unit formula (C₁₄H₂₁NO₁₁)ₙ.', 'conceptual_reference'],
  [6, 'Vitamins and biological acids', 'Alginic acid', '(C₆H₈O₆)n', '(C₆H₈O₆)ₙ', 'alginic_acid', undefined, 'conceptual_reference'],
  [6, 'Vitamins and biological acids', 'Neuraminic acid (sialic acid)', 'C₉H₁₇NO₈', 'C₉H₁₇NO₈', 'neuraminic_acid', undefined, 'conceptual_reference'],
  [6, 'Vitamins and biological acids', 'Shikimic acid', 'C₇H₁₀O₅', 'C₇H₁₀O₅', 'shikimic_acid', undefined, 'conceptual_reference'],

  // 15. Other notable organic acids (Page 6, 26 entries)
  [6, 'Other notable organic acids', 'oxalic acid', 'C₂H₂O₄', 'H₂C₂O₄·2H₂O (s)', 'oxalic_acid', 'Deduplicated lowercase duplicate of Oxalic acid in section 15.', 'school_lab_supported'],
  [6, 'Other notable organic acids', 'Abietic acid (rosin acid)', 'C₂₀H₃₀O₂', 'C₂₀H₃₀O₂', 'abietic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Tannic acid', 'C₇₆H₅₂O₄₆', 'C₇₆H₅₂O₄₆', 'tannic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Humic acid', 'complex mixture', 'Complex macromolecular aromatic humic polyacid', 'humic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Fulvic acid', 'complex mixture', 'Low-molecular-weight humic polyacid fraction', 'fulvic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'EDTA (ethylenediaminetetraacetic acid)', 'C₁₀H₁₆N₂O₈', 'C₁₀H₁₆N₂O₈', 'edta_solution', undefined, 'school_lab_supported', undefined, ['Ethylenediaminetetraacetic acid', 'EDTA']],
  [6, 'Other notable organic acids', 'DTPA (diethylenetriaminepentaacetic acid)', 'C₁₄H₂₃N₃O₁₀', 'C₁₄H₂₃N₃O₁₀', 'dtpa_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Nitriloacetic acid (NTA)', 'N(CH₂COOH)₃', 'N(CH₂COOH)₃', 'nta_acid', undefined, 'conceptual_reference', undefined, ['Nitrilotriacetic acid', 'NTA']],
  [6, 'Other notable organic acids', 'Barbituric acid', 'C₄H₄N₂O₃', 'C₄H₄N₂O₃', 'barbituric_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Meldrum’s acid', 'C₆H₈O₄', 'C₆H₈O₄', 'meldrums_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Squaric acid', 'C₄H₂O₄', 'C₄H₂O₄', 'squaric_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Croconic acid', 'C₅H₂O₅', 'C₅H₂O₅', 'croconic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Rhodizonic acid', 'C₆H₂O₆', 'C₆H₂O₆', 'rhodizonic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Peracetic acid (peroxyacetic acid)', 'CH₃COOOH', 'CH₃COOOH', 'peracetic_acid', undefined, 'conceptual_reference', undefined, ['Peroxyacetic acid']],
  [6, 'Other notable organic acids', 'm-Chloroperoxybenzoic acid (mCPBA)', 'ClC₆H₄COOOH', '3-ClC₆H₄COOOH', 'mcpba', undefined, 'conceptual_reference', undefined, ['mCPBA']],
  [6, 'Other notable organic acids', 'Performic acid', 'HCO₃H', 'HCOOOH (CH₂O₃)', 'performic_acid', 'Clarified condensed peroxy formula HCO₃H to structural peroxyformic acid HCOOOH.', 'conceptual_reference', undefined, ['Peroxyformic acid']],
  [6, 'Other notable organic acids', 'Phenylboronic acid', 'C₆H₅B(OH)₂', 'C₆H₅B(OH)₂', 'phenylboronic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Methylphosphonic acid', 'CH₃PO(OH)₂', 'CH₃PO(OH)₂', 'methylphosphonic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Phytic acid (inositol hexaphosphoric acid)', 'C₆H₁₈O₂₄P₆', 'C₆H₁₈O₂₄P₆', 'phytic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Cacodylic acid (dimethylarsinic acid)', '(CH₃)₂AsO₂H', '(CH₃)₂AsO₂H', 'cacodylic_acid', undefined, 'hazardous_restricted', 'Toxic organoarsenic compound (dimethylarsinic acid).'],
  [6, 'Other notable organic acids', 'Ascorbic acid 2-phosphate', 'C₆H₉O₉P', 'C₆H₉O₉P', 'ascorbic_acid_2_phosphate', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Kojic acid', 'C₆H₆O₄', 'C₆H₆O₄', 'kojic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Usnic acid', 'C₁₈H₁₆O₇', 'C₁₈H₁₆O₇', 'usnic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Chlorogenic acid', 'C₁₆H₁₈O₉', 'C₁₆H₁₈O₉', 'chlorogenic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Rosmarinic acid', 'C₁₈H₁₆O₈', 'C₁₈H₁₆O₈', 'rosmarinic_acid', undefined, 'conceptual_reference'],
  [6, 'Other notable organic acids', 'Ellagic acid', 'C₁₄H₆O₈', 'C₁₄H₆O₈', 'ellagic_acid', undefined, 'conceptual_reference'],
];
