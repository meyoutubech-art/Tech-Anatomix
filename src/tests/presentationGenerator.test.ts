import test from 'node:test';
import assert from 'node:assert';
import {
  validatePresentationData,
  generateAndDownloadPptx,
  PresentationExportOptions,
} from '../utils/presentationGenerator';

test('Presentation / PPTX Generator Test Suite', async (t) => {
  await t.test('Validation: Rejects empty title or empty slides', () => {
    const invalid1 = validatePresentationData({ title: '', slides: [] });
    assert.strictEqual(invalid1.valid, false);

    const invalid2 = validatePresentationData({
      title: 'Valid Title',
      slides: [],
    });
    assert.strictEqual(invalid2.valid, false);

    const invalid3 = validatePresentationData({
      title: 'Valid Title',
      slides: [{ title: '' }],
    });
    assert.strictEqual(invalid3.valid, false);
  });

  await t.test('Validation: Accepts properly configured scientific slides', () => {
    const validData: PresentationExportOptions = {
      title: 'Acid-Base Neutralization Lab',
      subtitle: 'HCl + NaOH Titration Curve & Thermal Dissociation',
      category: 'chemistry',
      concept: 'Exothermic Neutralization Reaction',
      slides: [
        {
          title: 'Experiment Setup & Chemical Reagents',
          subtitle: 'Aqueous hydrochloric acid and sodium hydroxide',
          bullets: [
            'Hydrochloric acid: strong monoprotic mineral acid [HCl(aq)]',
            'Sodium hydroxide: caustic alkali hydroxide base [NaOH(aq)]',
            'Solvent: Deionized water in 250mL Pyrex reaction beaker',
          ],
          callout: 'Safety Note: Wear splash goggles and chemical nitrile gloves.',
        },
        {
          title: 'Reaction Kinetics & Thermodynamic Observation',
          details: [
            { label: 'Observed Effervescence', text: 'Gentle convective mixing, transparent solution' },
            { label: 'Calorimetry Shift', text: '+4.8 °C instantaneous exothermic enthalpy release' },
            { label: 'Equilibrium pH', text: 'Shifted from pH 1.0 to neutral pH 7.0 equivalence' },
          ],
          table: {
            headers: ['Parameter', 'Initial Value', 'Final Value'],
            rows: [
              ['Temperature', '25.0 °C', '29.8 °C'],
              ['HCl Concentration', '1.0 M', '0.0 M (consumed)'],
              ['NaCl Formed', '0.0 M', '0.5 M'],
            ],
          },
        },
      ],
    };

    const res = validatePresentationData(validData);
    assert.strictEqual(res.valid, true);
  });

  await t.test('Generation: Successfully compiles PPTX presentation into binary buffer', async () => {
    const validData: PresentationExportOptions = {
      title: 'Human Visceral Systems Exploration',
      subtitle: 'Cardiopulmonary and Gastrointestinal Morphology',
      category: 'anatomy',
      slides: [
        {
          title: 'Cardiovascular and Pulmonary System',
          bullets: [
            'Heart: 4-chambered muscular organ pumping blood through dual circulation',
            'Lungs: Dual respiratory organs exchanging O2 and CO2 across alveolar membranes',
          ],
        },
      ],
    };

    const result = await generateAndDownloadPptx(validData, 'Human_Anatomy_Test');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.slideCount, 2); // 1 title slide + 1 content slide
    assert.ok(result.blobSize > 1000, `Expected buffer size > 1000 bytes, got ${result.blobSize}`);
  });
});
