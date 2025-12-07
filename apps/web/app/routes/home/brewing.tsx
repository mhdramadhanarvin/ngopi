import React, { useState, useMemo, useEffect, useRef } from "react";

// Default export React component (App)
export function Brewing() {
  // Core states
  const [dose, setDose] = useState(15); // grams
  const [ratio, setRatio] = useState(15); // 1:ratio
  const [character, setCharacter] = useState<number>(1); // 1:ratio
  const [roast, setRoast] = useState("Medium");
  const [grind, setGrind] = useState("Medium-Fine");

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
    const firstPhase = totalWater * 0.4; // 40%
    const secondPhase = totalWater * 0.6; // 60%

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
      return { ...p, cumulative: Math.min(cum, totalWater) };
    });
  }, [totalWater, secondPhasePours, firstPhaseSplit]);

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
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Inputs */}
        <div className="col-span-1 md:col-span-1 space-y-4">
          <h1 className="text-2xl font-semibold">Manual Brew Assistant</h1>
          <p className="text-sm text-gray-500">V60 — Hario 4:6 Method (adjustable)</p>

          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium">Coffee Dose (g)</label>
            <input
              type="range"
              min={10}
              max={30}
              value={dose}
              onChange={(e) => setDose(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>10g</span>
              <span>{dose} g</span>
              <span>30g</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ratio (1 : x)</label>
            <input
              type="range"
              min={12}
              max={18}
              step={0.5}
              value={ratio}
              onChange={(e) => setRatio(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>12</span>
              <span>1 : {ratio}</span>
              <span>18</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Roast Level</label>
            <select
              value={roast}
              onChange={(e) => setRoast(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option>Light</option>
              <option>Medium</option>
              <option>Dark</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">After Taste</label>
            <select
              value={character}
              onChange={(e) => setCharacter(Number(e.target.value))}
              className="w-full border rounded p-2"
            >
              <option value={1}>Default Beans Note</option>
              <option value={2}>Sweetness</option>
              <option value={3}>Acidity</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Grind</label>
            <select
              value={grind}
              onChange={(e) => setGrind(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option>Fine</option>
              <option>Medium-Fine</option>
              <option>Medium</option>
              <option>Coarse</option>
            </select>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setIsBrewing((b) => !b)}
              className="w-full bg-amber-500 text-white rounded py-2 font-medium"
            >
              {isBrewing ? "Stop Brewing" : "Start Brewing Timer"}
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            <strong>Note:</strong> Suggested timings and amounts are approximate. Adjust to taste
            and gear.
          </div>
        </div>

        {/* Middle: Steps & Summary */}
        <div className="col-span-1 md:col-span-1 space-y-4">
          <SummaryCard
            dose={dose}
            ratio={ratio}
            totalWater={totalWater}
            grind={grind}
            roast={roast}
          />

          <div className="bg-gray-50 p-3 rounded">
            <h3 className="font-semibold mb-2">Pour Steps (4:6 Hario)</h3>
            <ol className="list-decimal ml-5 text-sm space-y-1">
              {pours.map((p, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>
                    Phase {p.phase} — Pour {p.pourNumber}
                  </span>
                  <span>
                    {p.amount} ml (cum {p.cumulative} ml)
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-3">
              <h4 className="font-medium">Timer</h4>
              <div className="text-sm text-gray-700 mt-2">
                {isBrewing ? (
                  <div>
                    <div>
                      Step: {currentStepIndex + 1} / {pourSuggestedTimes.length}
                    </div>
                    <div>Remaining: {formatSeconds(stepRemaining)}</div>
                  </div>
                ) : (
                  <div>Not brewing — press Start to begin the guided timer.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Taste Profile & Adjustments */}
        <div className="col-span-1 md:col-span-1 space-y-4">
          <TasteProfile profile={tasteProfile} />

          <div className="bg-gray-50 p-4 rounded text-sm space-y-3">
            <h4 className="font-semibold">Taste Adjustments</h4>

            {/*
            <div>
              <label className="text-xs">Sweetness adjustment</label>
              <input
                type="range"
                min={-3}
                max={3}
                step={1}
                value={userSweetnessAdj}
                onChange={(e) => setUserSweetnessAdj(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>-3</span>
                <span>{userSweetnessAdj}</span>
                <span>+3</span>
              </div>
              <div className="text-xs text-gray-500">
                Sweetness mainly influenced by the first 40% pours (10% first pour, 30% second
                pour).
              </div>
            </div>

            <div>
              <label className="text-xs">Acidity adjustment</label>
              <input
                type="range"
                min={-3}
                max={3}
                step={1}
                value={userAcidityAdj}
                onChange={(e) => setUserAcidityAdj(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>-3</span>
                <span>{userAcidityAdj}</span>
                <span>+3</span>
              </div>
              <div className="text-xs text-gray-500">
                Acidity mainly influenced by the first 40% pours (30% first pour, 10% second pour).
              </div>
            </div>
            */}
            <div>
              <label className="text-xs">Body / Strength adjustment</label>
              <input
                type="range"
                min={-3}
                max={3}
                step={1}
                value={userBodyAdj}
                onChange={(e) => setUserBodyAdj(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>-3</span>
                <span>{userBodyAdj}</span>
                <span>+3</span>
              </div>
              <div className="text-xs text-gray-500">
                Higher body increases the number of pours in the 60% phase (stronger). Lower body
                reduces pour count.
              </div>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            <strong>Grind suggestion:</strong> For V60 Hario 4:6, try <em>Medium-Fine</em> and
            adjust ± one click.
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------- Helper components -------------------------

function SummaryCard({ dose, ratio, totalWater, grind, roast }) {
  return (
    <div className="bg-white border rounded p-4">
      <h3 className="font-semibold">Summary</h3>
      <div className="mt-2 text-sm text-gray-700 space-y-1">
        <div className="flex justify-between">
          <span>Coffee</span>
          <span>{dose} g</span>
        </div>
        <div className="flex justify-between">
          <span>Ratio</span>
          <span>1 : {ratio}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Water</span>
          <span>{totalWater} ml</span>
        </div>
        <div className="flex justify-between">
          <span>Grind</span>
          <span>{grind}</span>
        </div>
        <div className="flex justify-between">
          <span>Roast</span>
          <span>{roast}</span>
        </div>
      </div>
    </div>
  );
}

function TasteProfile({ profile }) {
  const bars = [
    { label: "Acidity", value: profile.acidity },
    { label: "Sweetness", value: profile.sweetness },
    { label: "Body", value: profile.body },
  ];
  return (
    <div className="bg-white border rounded p-4">
      <h3 className="font-semibold mb-2">Taste Profile</h3>
      <div className="space-y-3">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between text-sm mb-1">
              <span>{b.label}</span>
              <span>{b.value}/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
              <div
                className="h-3 rounded"
                style={{
                  width: `${(b.value / 5) * 100}%`,
                  background: `linear-gradient(90deg, #f59e0b, #ef4444)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
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
