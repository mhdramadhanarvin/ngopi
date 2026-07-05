import { useMemo, useEffect, useRef, useState } from "react";

// Default export React component (App)
export function Brewing() {
  // Core states
  const [dose, setDose] = useState(15); // grams
  const [ratio, setRatio] = useState(15); // 1:ratio
  const [character, setCharacter] = useState<number>(1); // 1:ratio
  const [roast, setRoast] = useState("Medium");
  const [grind, setGrind] = useState("Medium-Fine");
  const [brewMethod, setBrewMethod] = useState<"v60" | "japanese">("v60");
  const [iceRatio, setIceRatio] = useState(50); // 20-60%, default 50%

  // User taste adjustment sliders (-3 .. +3)
  const [userSweetnessAdj, setUserSweetnessAdj] = useState(0);
  const [userAcidityAdj, setUserAcidityAdj] = useState(0);
  const [userBodyAdj, setUserBodyAdj] = useState(0);

  // Brewing timer / flow
  const [isBrewing, setIsBrewing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [stepRemaining, setStepRemaining] = useState(0);
  const intervalRef = useRef(null);

  // Derived calcs
  const totalWater = useMemo(() => Math.round(dose * ratio), [dose, ratio]);
  const brewingWater = useMemo(() => {
    if (brewMethod === "japanese") {
      return Math.round(totalWater * (1 - iceRatio / 100));
    }
    return totalWater;
  }, [brewMethod, totalWater, iceRatio]);
  const iceAmount = useMemo(() => {
    if (brewMethod === "japanese") {
      return Math.round(totalWater * (iceRatio / 100));
    }
    return 0;
  }, [brewMethod, totalWater, iceRatio]);

  // Determine number of pours for second phase (60%) based on body adjustment
  // Base secondPhasePours = 3, adjust by userBodyAdj (-3..+3) -> clamp between 1 and 5
  const secondPhasePours = useMemo(() => {
    const base = 3;
    const adjusted = base + Math.round(userBodyAdj);
    return Math.max(1, Math.min(5, adjusted));
  }, [userBodyAdj]);

  const firstPhaseSplit = useMemo(() => {
    if (character === 2) {
      // Sweetness: first pour smaller (1/3), second larger (2/3)
      return { pour1Fraction: 1 / 3, pour2Fraction: 2 / 3 };
    }
    if (character === 3) {
      // Acidity: first pour larger (2/3), second smaller (1/3)
      return { pour1Fraction: 2 / 3, pour2Fraction: 1 / 3 };
    }
    // Default: equal split (1/2 each)
    return { pour1Fraction: 0.5, pour2Fraction: 0.5 };
  }, [character]);

  // Pour distribution according to 4:6 rule and dynamic second phase pours
  const pours = useMemo(() => {
    const firstPhase = brewingWater * 0.4; // 40%
    const secondPhase = brewingWater * 0.6; // 60%

    // First phase: 2 pours with dynamic split
    // Second phase: dynamic pours
    const secondPerPour = secondPhase / secondPhasePours;

    const poursArr = [];
    // First phase pours (2)
    poursArr.push({
      phase: 1,
      pourNumber: 1,
      amount: Math.round(firstPhase * firstPhaseSplit.pour1Fraction),
    });
    poursArr.push({
      phase: 1,
      pourNumber: 2,
      amount: Math.round(firstPhase * firstPhaseSplit.pour2Fraction),
    });
    // Second phase pours (dynamic)
    for (let i = 0; i < secondPhasePours; i++) {
      poursArr.push({ phase: 2, pourNumber: i + 1, amount: Math.round(secondPerPour) });
    }

    // Add cumulative
    let cum = 0;
    return poursArr.map((p) => {
      cum += p.amount;
      return { ...p, cumulative: Math.min(cum, brewingWater) };
    });
  }, [brewingWater, secondPhasePours, firstPhaseSplit]);

  // Taste estimator
  // Returns values 0..5 for acidity, sweetness, body
  const tasteProfile = useMemo(() => {
    const roastBase = {
      Light: { acidity: 4, sweetness: 3, body: 2 },
      Medium: { acidity: 3, sweetness: 3, body: 3 },
      Dark: { acidity: 2, sweetness: 2, body: 4 },
    };
    const base = roastBase[roast] || roastBase.Medium;

    // Effects from ratio and dose
    const ratioFactor = (ratio - 15) / 3; // roughly -1..+1
    const doseFactor = (dose - 15) / 5; // roughly -1..+3
    const grindSweetnessBonus = grind.includes("Fine") ? 0.3 : grind.includes("Coarse") ? -0.3 : 0;

    function clamp(v: number) {
      return Math.max(0, Math.min(5, Math.round(v)));
    }

    // Base computed values
    let acidity = base.acidity + ratioFactor - doseFactor;
    let sweetness = base.sweetness + (ratioFactor > 0.5 ? 0.5 : 0) + grindSweetnessBonus;
    let body = base.body - ratioFactor + doseFactor;

    // Apply "After Taste" selection directly to profile
    if (character === 2) {
      // Sweetness
      sweetness += 1;
    } else if (character === 3) {
      // Acidity
      acidity += 1;
    }

    // Apply user adjustments but scale sweetness/acidity by the 40% phase impact
    // The 4:6 rule says sweetness & acidity largely influenced by the first 40%
    const firstPhaseImpact = 0.4; // 40% of total influence
    acidity += userAcidityAdj * firstPhaseImpact;
    sweetness += userSweetnessAdj * firstPhaseImpact;

    // Body adjustment applies to overall strength (60% impact) and also affects pour counts
    const secondPhaseImpact = 0.6; // 60% of total influence
    body += userBodyAdj * secondPhaseImpact;

    return { acidity: clamp(acidity), sweetness: clamp(sweetness), body: clamp(body) };
  }, [roast, ratio, dose, grind, userAcidityAdj, userSweetnessAdj, userBodyAdj, character]);

  // Suggested per-pour timings (seconds) - simple heuristic: bloom + even spacing
  const pourSuggestedTimes = useMemo(() => {
    const arr = [];
    // First pour: bloom ~30s
    arr.push(30);
    // Second pour (first phase): 30s
    arr.push(30);
    // Second phase pours: each 30s by default
    for (let i = 0; i < secondPhasePours; i++) arr.push(30);
    return arr;
  }, [secondPhasePours]);

  // Timer effect
  useEffect(() => {
    // if (!isBrewing) {
    //   clearInterval(intervalRef.current);
    //   intervalRef.current = null;
    //   setCurrentStepIndex(-1);
    //   setStepRemaining(0);
    //   return;
    // }
    //
    // // Start or resume
    // if (currentStepIndex === -1) {
    //   setCurrentStepIndex(0);
    //   setStepRemaining(pourSuggestedTimes[0]);
    // }
    //
    // if (!intervalRef.current) {
    //   intervalRef.current = setInterval(() => {
    //     setStepRemaining((s) => {
    //       if (s <= 1) {
    //         setCurrentStepIndex((idx) => {
    //           const next = idx + 1;
    //           if (next >= pourSuggestedTimes.length) {
    //             // finished
    //             setIsBrewing(false);
    //             clearInterval(intervalRef.current);
    //             intervalRef.current = null;
    //             return -1;
    //           }
    //           setStepRemaining(pourSuggestedTimes[next]);
    //           return next;
    //         });
    //         return 0;
    //       }
    //       return s - 1;
    //     });
    //   }, 1000);
    // }
    //
    // return () => {
    //   clearInterval(intervalRef.current);
    //   intervalRef.current = null;
    // };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBrewing]);

  // UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-3 py-6 sm:px-6">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Coffee Brewing Calculator</h1>
          <p className="text-sm sm:text-base text-slate-600">V60 Hario 4:6 Method — Adjustable for your taste</p>
        </div>

        {/* Main Grid: responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Left: Inputs (1 col on mobile, 1 col on lg) */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-5">
            {/* Brew Method Toggle - Featured */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-5 border-2 border-slate-200 hover:border-slate-300 transition">
              <label className="block text-xs uppercase font-bold text-slate-500 mb-3">Brewing Method</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setBrewMethod("v60")}
                  className={`flex-1 py-3 px-3 rounded-md font-semibold text-sm transition ${
                    brewMethod === "v60"
                      ? "bg-amber-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  V60 Basic
                </button>
                <button
                  onClick={() => setBrewMethod("japanese")}
                  className={`flex-1 py-3 px-3 rounded-md font-semibold text-sm transition ${
                    brewMethod === "japanese"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Iced
                </button>
              </div>
            </div>

            {/* Coffee Dose Card */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-5">
              <label className="block text-xs uppercase font-bold text-slate-500 mb-3">Coffee Dose</label>
              <div className="flex items-baseline gap-3">
                <input
                  type="range"
                  min={10}
                  max={30}
                  value={dose}
                  onChange={(e) => setDose(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="text-2xl font-bold text-amber-600 w-12 text-right">{dose}g</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>10g</span>
                <span>30g</span>
              </div>
            </div>

            {/* Ratio Card */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-5">
              <label className="block text-xs uppercase font-bold text-slate-500 mb-3">Coffee-to-Water Ratio</label>
              <div className="flex items-baseline gap-3">
                <input
                  type="range"
                  min={12}
                  max={18}
                  step={0.5}
                  value={ratio}
                  onChange={(e) => setRatio(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-2xl font-bold text-blue-600 w-16 text-right">1:{ratio}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>1:12</span>
                <span>1:18</span>
              </div>
            </div>

            {/* Roast Level */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-5">
              <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Roast Level</label>
              <select
                value={roast}
                onChange={(e) => setRoast(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-md p-2 sm:p-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-amber-500 transition"
              >
                <option>Light</option>
                <option>Medium</option>
                <option>Dark</option>
              </select>
            </div>

            {/* After Taste */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-5">
              <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Taste Focus</label>
              <select
                value={character}
                onChange={(e) => setCharacter(Number(e.target.value))}
                className="w-full border-2 border-slate-200 rounded-md p-2 sm:p-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition"
              >
                <option value={1}>Default Beans Note</option>
                <option value={2}>Sweetness</option>
                <option value={3}>Acidity</option>
              </select>
            </div>

            {/* Grind Size */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-5">
              <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Grind Size</label>
              <select
                value={grind}
                onChange={(e) => setGrind(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-md p-2 sm:p-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-slate-500 transition"
              >
                <option>Fine</option>
                <option>Medium-Fine</option>
                <option>Medium</option>
                <option>Coarse</option>
              </select>
            </div>

          {brewMethod === "japanese" && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-md p-4 sm:p-5 border-2 border-blue-200">
              <label className="block text-xs uppercase font-bold text-blue-700 mb-3">Ice Ratio</label>
              <div className="flex items-baseline gap-3">
                <input
                  type="range"
                  min={20}
                  max={60}
                  value={iceRatio}
                  onChange={(e) => setIceRatio(Number(e.target.value))}
                  className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-2xl font-bold text-blue-700 w-14 text-right">{iceRatio}%</span>
              </div>
              <div className="flex justify-between text-xs text-blue-600 mt-2">
                <span>20%</span>
                <span>60%</span>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200 text-sm">
                <div className="flex justify-between text-blue-700">
                  <span className="font-medium">Ice</span>
                  <span className="font-bold">{iceAmount} ml</span>
                </div>
                <div className="flex justify-between text-blue-700 mt-1">
                  <span className="font-medium">Brewing Water</span>
                  <span className="font-bold">{brewingWater} ml</span>
                </div>
              </div>
            </div>
          )}

            {/* Start Button */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5">
              <button
                onClick={() => setIsBrewing((b) => !b)}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg py-3 sm:py-4 font-bold text-base sm:text-lg shadow-md hover:shadow-xl transition transform hover:scale-105"
              >
                {isBrewing ? "⏸ Stop Timer" : "▶ Start Brewing"}
              </button>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Timings are approximate. Adjust to taste and equipment.
              </p>
            </div>
          </div>

          {/* Middle: Summary & Pour Steps (2 cols on desktop) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            <SummaryCard
              dose={dose}
              ratio={ratio}
              totalWater={totalWater}
              grind={grind}
              roast={roast}
              brewMethod={brewMethod}
              brewingWater={brewingWater}
              iceAmount={iceAmount}
            />

            {/* Pour Steps */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Pour Steps</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">4:6 Hario</span>
              </div>
              <div className="space-y-2">
                {pours.map((p, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-md transition ${
                      currentStepIndex === idx && isBrewing
                        ? "bg-amber-100 border-2 border-amber-400"
                        : p.phase === 1
                          ? "bg-amber-50"
                          : "bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
                          p.phase === 1 ? "bg-amber-500" : "bg-blue-600"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">Phase {p.phase} · Pour {p.pourNumber}</div>
                        <div className="text-xs text-slate-500">Cumulative: {p.cumulative} ml</div>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{p.amount}<span className="text-xs text-slate-500 ml-1">ml</span></span>
                  </div>
                ))}
              </div>

              {/* Timer Status */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">Timer</h4>
                {isBrewing ? (
                  <div className="bg-amber-50 rounded-md p-3">
                    <div className="text-sm text-slate-700">Step {currentStepIndex + 1} / {pourSuggestedTimes.length}</div>
                    <div className="text-2xl font-bold text-amber-600">{formatSeconds(stepRemaining)}</div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Press Start to begin the guided timer.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Taste Profile */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-xl">🎯</span> Taste Profile
              </h3>
              <TasteProfile profile={tasteProfile} />
              <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                <strong>Grind tip:</strong> For V60 4:6, try <em>Medium-Fine</em> ± one click.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------- Helper components -------------------------

function SummaryCard({ dose, ratio, totalWater, grind, roast, brewMethod, brewingWater, iceAmount }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-5 sm:p-6 border-l-4 border-amber-500">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span>📋</span> Recipe Summary
      </h3>
      <div className="space-y-3">
        {/* Coffee */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Coffee</span>
          <span className="text-lg font-bold text-slate-900">{dose} g</span>
        </div>
        {/* Ratio */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Ratio</span>
          <span className="text-lg font-bold text-blue-600">1 : {ratio}</span>
        </div>
        {/* Water breakdown */}
        {brewMethod === "japanese" ? (
          <>
            <div className="bg-blue-50 rounded-md p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Ice</span>
                <span className="text-lg font-bold text-blue-700">{iceAmount} ml</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Brewing Water</span>
                <span className="text-lg font-bold text-blue-700">{brewingWater} ml</span>
              </div>
              <div className="border-t border-blue-200 pt-2 flex justify-between items-center">
                <span className="text-xs text-blue-600">Total</span>
                <span className="text-sm font-bold text-blue-600">{totalWater} ml</span>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-amber-50 rounded-md p-3 flex justify-between items-center">
            <span className="text-sm text-amber-700">Total Water</span>
            <span className="text-lg font-bold text-amber-700">{totalWater} ml</span>
          </div>
        )}
        {/* Grind & Roast */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-sm text-slate-600">Grind</span>
          <span className="text-sm font-semibold text-slate-800">{grind}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Roast</span>
          <span className="text-sm font-semibold text-slate-800">{roast}</span>
        </div>
      </div>
    </div>
  );
}

function TasteProfile({ profile }) {
  const bars = [
    { label: "Acidity", value: profile.acidity, color: "bg-orange-400", lightBg: "bg-orange-50" },
    { label: "Sweetness", value: profile.sweetness, color: "bg-amber-400", lightBg: "bg-amber-50" },
    { label: "Body", value: profile.body, color: "bg-slate-600", lightBg: "bg-slate-100" },
  ];
  return (
    <div className="space-y-4">
      {bars.map((b) => (
        <div key={b.label} className="bg-slate-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700">{b.label}</span>
            <span className="text-lg font-bold text-slate-900">{b.value}/5</span>
          </div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-3 rounded-full transition ${
                  i < b.value ? b.color : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------- Utilities -------------------------

function formatSeconds(s: number | null) {
  if (s == null) return "0:00";
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}
