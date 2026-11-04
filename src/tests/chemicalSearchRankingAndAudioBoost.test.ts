import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  rankChemicalSearchResults,
} from '../utils/chemicalSearchRanker';
import {
  StateDrivenSoundEngine,
  DEFAULT_AUDIO_SETTINGS,
} from '../utils/soundEngine';
import { REAGENTS } from '../data/chemicalLibraryData';
import { getCanonicalRegistry } from '../data/compoundRegistry';

describe('Tech-Anatomix Chemical Search Ranking, Related Results & Stadium SFX Power', () => {
  const allReagents = [...REAGENTS, ...getCanonicalRegistry()];

  describe('1. Chemical Search Relevance & Top Rank #1 Accuracy', () => {
    it('ranks exact formula matches (NaCl, HCl, CuSO4, H2O2, KI) at the very top (Rank #1)', () => {
      // 1. NaCl
      const naclResult = rankChemicalSearchResults('NaCl', allReagents);
      assert.ok(naclResult.directMatches.length > 0);
      assert.ok(naclResult.directMatches[0].formula.startsWith('NaCl'));
      assert.ok(naclResult.directMatches[0].name.includes('Sodium Chloride'));

      // 2. HCl
      const hclResult = rankChemicalSearchResults('HCl', allReagents);
      assert.ok(hclResult.directMatches.length > 0);
      assert.equal(hclResult.directMatches[0].formula, 'HCl (aq)');
      assert.ok(hclResult.directMatches[0].name.includes('Hydrochloric Acid'));

      // 3. CuSO4
      const cuso4Result = rankChemicalSearchResults('CuSO4', allReagents);
      assert.ok(cuso4Result.directMatches.length > 0);
      assert.equal(cuso4Result.directMatches[0].id, 'cuso4');

      // 4. KI
      const kiResult = rankChemicalSearchResults('KI', allReagents);
      assert.ok(kiResult.directMatches.length > 0);
      assert.equal(kiResult.directMatches[0].id, 'ki');
    });

    it('ranks exact compound names (copper, lead, sulfuric acid, sodium bicarbonate) at the top', () => {
      // 1. Copper
      const cuResult = rankChemicalSearchResults('copper', allReagents);
      assert.ok(cuResult.directMatches.length > 0);
      // Top match is either the pure metal Cu or Copper(II) Sulfate, not an unrelated compound
      assert.ok(
        cuResult.directMatches[0].id === 'cu' ||
        cuResult.directMatches[0].name.toLowerCase().startsWith('copper')
      );

      // 2. Lead
      const leadResult = rankChemicalSearchResults('lead', allReagents);
      assert.ok(leadResult.directMatches.length > 0);
      assert.ok(leadResult.directMatches[0].name.toLowerCase().includes('lead'));

      // 3. Sulfuric acid
      const h2so4Result = rankChemicalSearchResults('sulfuric acid', allReagents);
      assert.ok(h2so4Result.directMatches.length > 0);
      assert.equal(h2so4Result.directMatches[0].id, 'h2so4');
    });

    it('ranks word-boundary matches properly when searching functional categories like "acid"', () => {
      const acidResult = rankChemicalSearchResults('acid', allReagents);
      assert.ok(acidResult.directMatches.length >= 3);
      // Top matches must be actual acids (HCl, H2SO4, HNO3, Acetic, Citric), not substances that merely mention acid in descriptions
      const top3Types = acidResult.directMatches.slice(0, 3).map((r) => r.type);
      assert.ok(top3Types.every((t) => t === 'acid'));
    });
  });

  describe('2. Educational Related Search Results in Library Shelf', () => {
    it('surfaces educational co-reactants and related compounds when searching specific chemicals', () => {
      // 1. Searching NaCl surfaces precipitation co-reactant AgNO3 and other sodium/chloride salts
      const naclResult = rankChemicalSearchResults('NaCl', allReagents);
      assert.ok(naclResult.relatedCompounds.length > 0);
      const naclRelatedIds = naclResult.relatedCompounds.map((r) => r.compound.id);
      // Should include AgNO3 or related sodium/chloride compounds
      assert.ok(
        naclRelatedIds.includes('agno3') ||
        naclResult.relatedCompounds.some((r) => r.relationReason.includes('Sodium') || r.relationReason.includes('Chloride'))
      );

      // 2. Searching HCl surfaces neutralizing base NaOH and metal co-reactants (Zn / Mg)
      const hclResult = rankChemicalSearchResults('HCl', allReagents);
      assert.ok(hclResult.relatedCompounds.length > 0);
      const hclRelatedIds = hclResult.relatedCompounds.map((r) => r.compound.id);
      assert.ok(
        hclRelatedIds.includes('naoh') ||
        hclRelatedIds.includes('nahco3') ||
        hclRelatedIds.includes('zn')
      );

      // 3. Searching H2O2 surfaces catalysts (MnO2, KI)
      const h2o2Result = rankChemicalSearchResults('H2O2', allReagents);
      assert.ok(h2o2Result.relatedCompounds.length > 0);
      const h2o2RelatedIds = h2o2Result.relatedCompounds.map((r) => r.compound.id);
      assert.ok(
        h2o2RelatedIds.includes('mno2') ||
        h2o2RelatedIds.includes('ki') ||
        h2o2Result.relatedCompounds.some((r) => r.relationReason.toLowerCase().includes('catalyst'))
      );
    });

    it('excludes compounds that are already present in direct matches from the related compounds list', () => {
      const result = rankChemicalSearchResults('NaCl', allReagents);
      const directIds = new Set(result.directMatches.map((d) => d.id));
      for (const rel of result.relatedCompounds) {
        assert.ok(!directIds.has(rel.compound.id), `Related compound ${rel.compound.id} was already in direct matches`);
      }
    });
  });

  describe('3. Stadium Sound Levels & Acoustic Power (poora stadium awaaj se gunje)', () => {
    let engine: StateDrivenSoundEngine;

    beforeEach(() => {
      engine = new StateDrivenSoundEngine();
      engine.updateSettings({ ...DEFAULT_AUDIO_SETTINGS, enabled: true });
      engine.clearEventLog();
    });

    it('initializes default audio settings at maximum stadium volume levels', () => {
      const settings = engine.getSettings();
      assert.equal(settings.masterVolume, 1.0, 'Master volume should default to 1.0 (100%)');
      assert.equal(settings.simulationVolume, 1.0, 'Simulation volume should default to 1.0 (100%)');
      assert.equal(settings.uiVolume, 0.95, 'UI volume should default to 0.95 (95%)');
      assert.equal(settings.enabled, true);
    });

    it('computes effective simulation gain at high stadium levels', () => {
      const rawGain = 0.85;
      const effective = engine.getEffectiveSimulationGain(rawGain);
      // With master 1.0 and sim 1.0, effective gain equals rawGain (not dampened to 0.5)
      assert.equal(effective, 0.85);
    });

    it('records high-gain stadium bursts for violent reactions and explosions', () => {
      const reactionMock = {
        id: 'alkali_metal_water_combustion',
        name: 'Potassium + Water Violent Combustion',
        reactants: ['k_metal', 'water'],
        requiredAmounts: { k_metal: 10, water: 25 },
        products: ['KOH', 'H₂'],
        balancedEquation: '2K + 2H₂O → 2KOH + H₂↑',
        reactionType: 'combustion' as any,
        explanation: 'Alkali potassium metal violent combustion upon water contact',
        observableEffects: {
          colorChangeTo: '#FFFFFF',
          temperatureDelta: 85,
          producesGas: true,
          gasName: 'H₂ Gas',
          gasVigor: 'violent_foam' as any,
          producesPrecipitate: false,
          isViolent: true,
          hazardType: 'explosion' as any,
          description: 'Rapid exothermic detonation with lilac flame',
        },
      };

      engine.syncChemistryReactionState({
        sourceId: 'chemistry-lab',
        hasLiquid: true,
        totalVolume: 50,
        temperatureC: 95,
        reactionProgress: 0.1,
        activeReaction: reactionMock,
        reactionRunKey: 'test_explosion_1',
      });

      const events = engine.getEventLog();
      const burstEvent = events.find((e) => e.category === 'chemistry_reaction_burst');
      assert.ok(burstEvent, 'Explosion burst event should be logged');
      assert.equal(burstEvent.subtype, 'violent_combustion_burst');
      // Gain level must be high stadium amplitude (>= 0.90)
      assert.ok(burstEvent.gainLevel >= 0.90, `Expected stadium gain >= 0.90, got ${burstEvent.gainLevel}`);
    });

    it('records high-gain mechanical impact and UI feedback events', () => {
      // 1. Mechanical collision
      engine.playMechanicalImpact({
        sourceId: 'cradle-model',
        subtype: 'cradle_sphere_impact',
        impactVelocity: 4.5,
      });

      const events = engine.getEventLog();
      const impactEvent = events.find((e) => e.subtype === 'cradle_sphere_impact');
      assert.ok(impactEvent);
      assert.ok(impactEvent.gainLevel >= 0.60, `Impact gain should be >= 0.60, got ${impactEvent.gainLevel}`);

      // 2. UI feedback
      engine.playUiFeedback('reaction_complete');
      const uiEvent = engine.getEventLog().find((e) => e.subtype === 'reaction_complete');
      assert.ok(uiEvent);
      assert.ok(uiEvent.gainLevel >= 0.50, `UI feedback gain should be >= 0.50, got ${uiEvent.gainLevel}`);
    });
  });
});
