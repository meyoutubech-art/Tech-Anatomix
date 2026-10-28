import React, { useState, useEffect, useMemo } from 'react';
import {
  ANATOMY_PLAY_MISSIONS,
  AnatomyPlayMission,
  learnThroughPlayManager,
  LearnThroughPlayState,
} from '../../utils/learnThroughPlayEngine';
import { soundEngine } from '../../utils/soundEngine';
import {
  Volume2,
  Play,
  CheckCircle2,
  Sparkles,
  Activity,
} from 'lucide-react';

export interface AnatomyPlayMissionsBarProps {
  selectedSpecimen: 'frog' | 'human';
  onSelectSpecimen: (specimen: 'frog' | 'human') => void;
}

export const AnatomyPlayMissionsBar: React.FC<AnatomyPlayMissionsBarProps> = ({
  selectedSpecimen,
  onSelectSpecimen,
}) => {
  const [playState, setPlayState] = useState<LearnThroughPlayState>(() =>
    learnThroughPlayManager.getState()
  );
  const specimenMissions = useMemo(
    () => ANATOMY_PLAY_MISSIONS.filter((m) => m.specimen === selectedSpecimen),
    [selectedSpecimen]
  );
  const [activeMissionId, setActiveMissionId] = useState<string>(
    specimenMissions[0]?.id || ANATOMY_PLAY_MISSIONS[0].id
  );
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean;
    text: string;
  } | null>(null);
  const [isPlayingBioPulse, setIsPlayingBioPulse] = useState(false);

  useEffect(() => {
    return learnThroughPlayManager.subscribe(setPlayState);
  }, []);

  useEffect(() => {
    if (specimenMissions.length > 0 && !specimenMissions.some((m) => m.id === activeMissionId)) {
      setActiveMissionId(specimenMissions[0].id);
    }
    setSelectedAnswerId(null);
    setAnswerFeedback(null);
  }, [selectedSpecimen, specimenMissions]);

  useEffect(() => {
    return () => {
      soundEngine.stopSource('anatomy-play-mission-preview');
    };
  }, []);

  const activeMission: AnatomyPlayMission =
    specimenMissions.find((m) => m.id === activeMissionId) ||
    specimenMissions[0] ||
    ANATOMY_PLAY_MISSIONS[0];

  const isMastered = Boolean(playState.discoveries[activeMission.id]);

  const handleTogglePhysiologyPulseAudio = () => {
    if (isPlayingBioPulse) {
      soundEngine.stopSource('anatomy-play-mission-preview');
      setIsPlayingBioPulse(false);
      return;
    }

    setIsPlayingBioPulse(true);
    learnThroughPlayManager.markStageCompleted(activeMission.id, 'try');
    learnThroughPlayManager.markStageCompleted(activeMission.id, 'observe');

    if (activeMission.targetOrganId.includes('heart')) {
      const bpm = activeMission.specimen === 'frog' ? 48 : 72;
      soundEngine.syncHeartbeat({
        sourceId: 'anatomy-play-mission-preview',
        active: true,
        bpm,
        isPlaying: true,
      });
      setTimeout(() => {
        soundEngine.stopSource('anatomy-play-mission-preview');
        setIsPlayingBioPulse(false);
      }, 4500);
    } else {
      const rate = activeMission.specimen === 'frog' ? 16 : 14;
      soundEngine.syncRespiration({
        sourceId: 'anatomy-play-mission-preview',
        active: true,
        breathsPerMinute: rate,
        isPlaying: true,
      });
      setTimeout(() => {
        soundEngine.stopSource('anatomy-play-mission-preview');
        setIsPlayingBioPulse(false);
      }, 4500);
    }
  };

  const handleSelectOption = (opt: AnatomyPlayMission['applyOptions'][number]) => {
    setSelectedAnswerId(opt.id);
    setAnswerFeedback({ isCorrect: opt.isCorrect, text: opt.feedback });
    learnThroughPlayManager.recordChallengeAttempt(activeMission.id, opt.isCorrect);

    if (opt.isCorrect) {
      learnThroughPlayManager.markStageCompleted(activeMission.id, 'discover');
      learnThroughPlayManager.markStageCompleted(activeMission.id, 'apply');
      learnThroughPlayManager.recordDiscovery({
        id: activeMission.id,
        domain: 'anatomy',
        title: activeMission.title,
        symbol: activeMission.symbol,
        scientificPrinciple: activeMission.discoverPrinciple,
        formulaOrRule: activeMission.shortVisualLabel,
        accuracyPct: 100,
      });
      learnThroughPlayManager.speakInstruction(
        `${activeMission.id}-correct`,
        `${opt.feedback} ${activeMission.discoverPrinciple}`,
        true
      );
    } else {
      learnThroughPlayManager.speakInstruction(`${activeMission.id}-retry`, opt.feedback, true);
    }
  };

  return (
    <div
      id="anatomy-learn-through-play-bar"
      data-testid="anatomy-learn-through-play-bar"
      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-base">
            {activeMission.symbol}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Learn Through Play · Guided Dissection &amp; Organ Missions
              </h2>
              {isMastered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Organ System Mastered</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Follow the visual steps below to dissect, listen to live organ physiology, and discover how {selectedSpecimen === 'frog' ? 'amphibian' : 'human'} organs work!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              learnThroughPlayManager.speakInstruction(
                `${activeMission.id}-guide`,
                activeMission.spokenGuide,
                true
              )
            }
            data-testid="anatomy-play-speak-button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-sky-600" />
            <span>🔊 Listen Guide</span>
          </button>

          <button
            type="button"
            onClick={handleTogglePhysiologyPulseAudio}
            data-testid="anatomy-play-pulse-button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              isPlayingBioPulse
                ? 'bg-rose-600 text-white'
                : 'bg-teal-600 hover:bg-teal-500 text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>
              {isPlayingBioPulse
                ? '🔊 Playing Organ Sound...'
                : activeMission.targetOrganId.includes('heart')
                ? `🫀 Hear ${activeMission.specimen === 'frog' ? '48 BPM Frog' : '72 BPM Human'} Heartbeat`
                : '🫁 Hear Respiratory Airflow'}
            </span>
          </button>
        </div>
      </div>

      {/* Mission Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {ANATOMY_PLAY_MISSIONS.map((m) => {
          const isSelected = m.id === activeMission.id;
          const mMastered = Boolean(playState.discoveries[m.id]);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                if (m.specimen !== selectedSpecimen) {
                  onSelectSpecimen(m.specimen);
                }
                setActiveMissionId(m.id);
                setSelectedAnswerId(null);
                setAnswerFeedback(null);
              }}
              data-testid={`anatomy-mission-card-${m.id}`}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-base">{m.symbol}</span>
                {mMastered ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mastered</span>
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-mono uppercase ${
                      isSelected ? 'text-teal-300' : 'text-slate-500'
                    }`}
                  >
                    {m.specimen}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold leading-snug">{m.title}</div>
                <div
                  className={`text-[10px] font-mono mt-1 truncate ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {m.shortVisualLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Mission Visual Steps + Apply Check */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
        <div className="lg:col-span-7 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
            ✂️ Visual Dissection &amp; Observation Steps ({activeMission.targetOrganName})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-800 block">1. SEE</span>
              <span className="text-slate-600">{activeMission.seeVisualCue}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-800 block">2. TRY</span>
              <span className="text-slate-600">{activeMission.tryVisualCue}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-bold text-slate-800 block">3. OBSERVE</span>
              <span className="text-slate-600">{activeMission.observeVisualCue}</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-teal-50/80 border border-teal-200 text-[11px] text-teal-950">
            <strong>💡 Scientific Principle:</strong> {activeMission.discoverPrinciple}
          </div>
        </div>

        <div className="lg:col-span-5 p-3.5 rounded-xl bg-slate-900 text-white flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>🎯 Apply &amp; Master Organ Function</span>
            </span>
            <p className="text-xs font-bold text-white">{activeMission.applyQuestion}</p>
          </div>

          <div className="space-y-1.5">
            {activeMission.applyOptions.map((opt) => {
              const isChosen = selectedAnswerId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  data-testid={`anatomy-apply-option-${opt.id}`}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isChosen
                      ? opt.isCorrect
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                        : 'bg-rose-950 border-rose-500 text-rose-200'
                      : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{opt.symbol}</span>
                    <span>{opt.label}</span>
                  </div>
                  {isChosen && opt.isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {answerFeedback && (
            <div
              className={`p-2 rounded-lg text-[11px] font-medium border ${
                answerFeedback.isCorrect
                  ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
                  : 'bg-amber-950/90 border-amber-700 text-amber-200'
              }`}
            >
              {answerFeedback.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
