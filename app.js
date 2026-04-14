const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TRAINING_REFERENCES = "ACSM/NSCA/ACE/NASM ranges";
const SESSION_BUFFER_MINUTES = 10;

const exerciseMap = {
  chest: ["Bench Press", "Incline Dumbbell Press", "Push-Ups", "Chest Fly"],
  back: ["Lat Pulldown", "Seated Cable Row", "Barbell Row", "Single Arm Row"],
  legs: ["Back Squat", "Leg Press", "Romanian Deadlift", "Walking Lunges"],
  shoulders: ["Overhead Press", "Lateral Raise", "Face Pull", "Rear Delt Fly"],
  biceps: ["Barbell Curl", "Hammer Curl", "Cable Curl", "Preacher Curl"],
  triceps: ["Triceps Pushdown", "Overhead Extension", "Dips", "Skull Crushers"],
  core: ["Plank", "Crunches", "Hanging Knee Raise", "Russian Twists"],
  cardio: ["Treadmill Incline Walk", "Rowing Machine", "Bike Intervals", "Jump Rope"],
  fullBody: ["Goblet Squat", "Push-Ups", "Dumbbell Row", "Plank", "Lunges"],
};

const exerciseProfiles = {
  "Bench Press": { type: "compound" },
  "Incline Dumbbell Press": { type: "compound" },
  "Push-Ups": { type: "bodyweight" },
  "Chest Fly": { type: "isolation" },
  "Lat Pulldown": { type: "compound" },
  "Seated Cable Row": { type: "compound" },
  "Barbell Row": { type: "compound" },
  "Single Arm Row": { type: "compound" },
  "Back Squat": { type: "compound" },
  "Leg Press": { type: "compound" },
  "Romanian Deadlift": { type: "compound" },
  "Walking Lunges": { type: "compound" },
  "Overhead Press": { type: "compound" },
  "Lateral Raise": { type: "isolation" },
  "Face Pull": { type: "isolation" },
  "Rear Delt Fly": { type: "isolation" },
  "Barbell Curl": { type: "isolation" },
  "Hammer Curl": { type: "isolation" },
  "Cable Curl": { type: "isolation" },
  "Preacher Curl": { type: "isolation" },
  "Triceps Pushdown": { type: "isolation" },
  "Overhead Extension": { type: "isolation" },
  Dips: { type: "bodyweight" },
  "Skull Crushers": { type: "isolation" },
  Plank: { type: "core" },
  Crunches: { type: "core" },
  "Hanging Knee Raise": { type: "core" },
  "Russian Twists": { type: "core" },
  "Treadmill Incline Walk": { type: "cardio" },
  "Rowing Machine": { type: "cardio" },
  "Bike Intervals": { type: "cardio" },
  "Jump Rope": { type: "cardio" },
  "Goblet Squat": { type: "compound" },
  "Dumbbell Row": { type: "compound" },
  Lunges: { type: "compound" },
};

const splitTemplates = {
  fullBody: ["Full Body", "Full Body", "Full Body", "Full Body", "Full Body", "Full Body", "Full Body"],
  ppl: ["Push", "Pull", "Legs", "Push", "Pull", "Legs", "Recovery Cardio"],
  upperLower: ["Upper", "Lower", "Upper", "Lower", "Core + Cardio", "Recovery Cardio", "Mobility"],
  fiveSplit: ["Chest + Triceps", "Back + Biceps", "Legs", "Shoulders", "Core + Cardio", "Accessory Full Body", "Recovery Cardio"],
  sevenMix: ["Push", "Pull", "Legs", "Upper", "Lower", "Core + Cardio", "Recovery Cardio"],
};

const state = { profile: null, analysis: null, schedule: [], dayCount: 3, sessionHours: 2, plan: [] };

const els = {
  profileForm: document.getElementById("profileForm"),
  formSection: document.getElementById("formSection"),
  analysisSection: document.getElementById("analysisSection"),
  scheduleSection: document.getElementById("scheduleSection"),
  programSection: document.getElementById("programSection"),
  cmHeightWrap: document.getElementById("cmHeightWrap"),
  ftHeightWrap: document.getElementById("ftHeightWrap"),
  heightCm: document.getElementById("heightCm"),
  heightFt: document.getElementById("heightFt"),
  heightIn: document.getElementById("heightIn"),
  daysPerWeek: document.getElementById("daysPerWeek"),
  daysPerWeekLabel: document.getElementById("daysPerWeekLabel"),
  sessionHours: document.getElementById("sessionHours"),
  sessionHoursLabel: document.getElementById("sessionHoursLabel"),
  daysPicker: document.getElementById("daysPicker"),
  bmiValue: document.getElementById("bmiValue"),
  bmiCategory: document.getElementById("bmiCategory"),
  healthStatus: document.getElementById("healthStatus"),
  idealRange: document.getElementById("idealRange"),
  bmiPointer: document.getElementById("bmiPointer"),
  weightDirection: document.getElementById("weightDirection"),
  waterSuggestion: document.getElementById("waterSuggestion"),
  toProgramBtn: document.getElementById("toProgramBtn"),
  analysisBackBtn: document.getElementById("analysisBackBtn"),
  scheduleBackBtn: document.getElementById("scheduleBackBtn"),
  programBackBtn: document.getElementById("programBackBtn"),
  generatePlanBtn: document.getElementById("generatePlanBtn"),
  planContainer: document.getElementById("planContainer"),
  planMeta: document.getElementById("planMeta"),
  regenBtn: document.getElementById("regenBtn"),
  printBtn: document.getElementById("printBtn"),
};

init();

function init() {
  renderDaysPicker();
  bindHeightUnitToggle();
  applyHeightUnitVisibility("cm");
  bindForm();
  bindSchedule();
  bindActions();
  loadFromStorage();
}

function bindHeightUnitToggle() {
  document.querySelectorAll("input[name='heightUnit']").forEach((radio) => {
    radio.addEventListener("change", (e) => {
      applyHeightUnitVisibility(e.target.value);
    });
  });
}

function applyHeightUnitVisibility(unit) {
  const isCm = unit === "cm";
  els.cmHeightWrap.style.display = isCm ? "grid" : "none";
  els.ftHeightWrap.style.display = isCm ? "none" : "grid";
  els.cmHeightWrap.classList.toggle("hidden", !isCm);
  els.ftHeightWrap.classList.toggle("hidden", isCm);
  els.heightCm.required = isCm;
  els.heightFt.required = !isCm;
  els.heightIn.required = !isCm;
}

function bindForm() {
  els.profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const profile = readProfile();
    if (!profile) return;
    state.profile = profile;
    state.analysis = analyzeProfile(profile);
    renderAnalysis();
    showSection(els.analysisSection);
    persist();
  });
}

function bindSchedule() {
  els.daysPerWeek.addEventListener("input", (e) => {
    state.dayCount = Number(e.target.value);
    els.daysPerWeekLabel.textContent = `${state.dayCount} days`;
    if (state.schedule.length > state.dayCount) state.schedule = state.schedule.slice(0, state.dayCount);
    updateDayChipUI();
    persist();
  });

  els.sessionHours.addEventListener("change", (e) => {
    state.sessionHours = Number(e.target.value);
    els.sessionHoursLabel.textContent = `${state.sessionHours} hours`;
    persist();
  });
}

function bindActions() {
  els.analysisBackBtn.addEventListener("click", () => showSection(els.formSection));
  els.scheduleBackBtn.addEventListener("click", () => showSection(els.analysisSection));
  els.programBackBtn.addEventListener("click", () => showSection(els.scheduleSection));
  els.toProgramBtn.addEventListener("click", () => showSection(els.scheduleSection));

  els.generatePlanBtn.addEventListener("click", () => {
    if (state.schedule.length !== state.dayCount) {
      alert(`Please select exactly ${state.dayCount} days.`);
      return;
    }
    state.plan = generatePlan(state.profile, state.analysis, state.schedule, state.sessionHours);
    renderPlan();
    showSection(els.programSection);
    persist();
  });

  els.regenBtn.addEventListener("click", () => {
    if (!state.profile || !state.analysis || !state.schedule.length) return;
    state.plan = generatePlan(state.profile, state.analysis, state.schedule, state.sessionHours);
    renderPlan();
    persist();
  });

  els.printBtn.addEventListener("click", () => window.print());
}

function readProfile() {
  const dob = document.getElementById("dob").value;
  const weight = Number(document.getElementById("weight").value);
  const goal = document.getElementById("goal").value;
  const gender = document.getElementById("gender").value;
  const experience = document.getElementById("experience").value;
  const fitnessLevel = document.getElementById("fitnessLevel").value;
  const heightUnit = document.querySelector("input[name='heightUnit']:checked").value;
  let heightCm = 0;
  if (heightUnit === "cm") {
    heightCm = Number(els.heightCm.value);
  } else {
    heightCm = Math.round((Number(els.heightFt.value) * 30.48 + Number(els.heightIn.value) * 2.54) * 10) / 10;
  }
  const age = calculateAge(dob);
  if (!dob || !goal || !experience || !fitnessLevel || weight <= 0 || heightCm <= 0 || age < 8 || age > 100) return alert("Please provide valid data."), null;
  return { dob, age, weight, heightCm, goal, heightUnit, gender, experience, fitnessLevel };
}

function analyzeProfile(profile) {
  const hMeters = profile.heightCm / 100;
  const bmi = profile.weight / (hMeters * hMeters);
  let category = "Normal";
  let healthClass = "health-green";
  let healthStatus = "Healthy / Excellent";
  if (bmi < 18.5) [category, healthClass, healthStatus] = ["Underweight", "health-yellow", "Needs improvement"];
  else if (bmi < 25) [category, healthClass, healthStatus] = ["Normal", "health-green", "Healthy / Excellent"];
  else if (bmi < 30) [category, healthClass, healthStatus] = ["Overweight", "health-yellow", "Normal / Needs improvement"];
  else [category, healthClass, healthStatus] = ["Obese", "health-red", "Risk / Bad"];

  const idealMin = 21.7 * hMeters * hMeters;
  const idealMax = 22.5 * hMeters * hMeters;
  let direction = "You are at your ideal range.";
  if (profile.weight < idealMin) direction = `Gain ${(idealMin - profile.weight).toFixed(1)}kg to reach ideal zone.`;
  if (profile.weight > idealMax) direction = `Lose ${(profile.weight - idealMax).toFixed(1)}kg to reach ideal zone.`;

  return {
    bmi: Number(bmi.toFixed(1)),
    category,
    healthClass,
    healthStatus,
    idealMin: Number(idealMin.toFixed(1)),
    idealMax: Number(idealMax.toFixed(1)),
    direction,
    waterLiters: (profile.weight * 0.033).toFixed(1),
    bmiTrackPercent: Math.min(100, Math.max(0, (bmi / 40) * 100)),
  };
}

function generatePlan(profile, analysis, scheduleDays, sessionHours) {
  const sortedDays = [...scheduleDays].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
  const splitType = getSplitType(sortedDays.length, profile.goal);
  const baseSplit = splitTemplates[splitType];
  return sortedDays.map((day, index) => {
    const block = baseSplit[index];
    const planForDay = createTimedDayPlan(block, profile, analysis, index, sessionHours);
    return { day, block, ...planForDay };
  });
}

function getSplitType(dayCount, goal) {
  if (dayCount <= 2) return "fullBody";
  if (dayCount === 3) return goal === "general-fitness" ? "fullBody" : "ppl";
  if (dayCount === 4) return "upperLower";
  if (dayCount <= 6) return "fiveSplit";
  return "sevenMix";
}

function createTimedDayPlan(block, profile, analysis, seed, sessionHours) {
  const groups = getGroupsFromBlock(block);
  const level = deriveLevel(profile, analysis);
  const ageRule = getAgeRule(profile.age);
  const targetMinutes = sessionHours * 60;
  const trainMinutesBudget = Math.max(30, targetMinutes - SESSION_BUFFER_MINUTES);
  const recoveryFactor = getRecoveryFactor(profile, state.dayCount, sessionHours);
  const candidates = [];

  groups.forEach((group, groupIndex) => {
    const groupPool = pickRotated(exerciseMap[group] || exerciseMap.fullBody, 3, seed + groupIndex);
    groupPool.forEach((exerciseName, idx) => {
      const profileMeta = exerciseProfiles[exerciseName] || { type: "compound" };
      const prescription = getPrescription(profile.goal, group, ageRule, level, profileMeta, idx, analysis, profile, recoveryFactor);
      const estimated = estimateExerciseMinutes(prescription);
      candidates.push({
        name: exerciseName,
        sets: prescription.sets,
        reps: prescription.reps,
        weight: prescription.weightSuggestion,
        rest: prescription.rest,
        group: groupLabel(group),
        estimatedMinutes: estimated,
        imageLink: getGoogleImagesLink(exerciseName),
      });
    });
  });

  let chosen = fitExercisesToTime(candidates, trainMinutesBudget);
  if (!chosen.length) chosen = [candidates[0]];
  chosen = expandVolumeToTime(chosen, candidates, trainMinutesBudget);

  const workMinutes = chosen.reduce((sum, ex) => sum + ex.estimatedMinutes, 0);
  const totalMinutes = Math.round(workMinutes + SESSION_BUFFER_MINUTES);
  return { exercises: chosen, workMinutes: Math.round(workMinutes), totalMinutes, targetMinutes };
}

function fitExercisesToTime(candidates, budgetMinutes) {
  const selected = [];
  let used = 0;
  for (const ex of candidates) {
    if (used + ex.estimatedMinutes <= budgetMinutes || selected.length < 4) {
      selected.push({ ...ex });
      used += ex.estimatedMinutes;
    }
  }
  return compressSetsIfNeeded(selected, budgetMinutes);
}

function compressSetsIfNeeded(exercises, budgetMinutes) {
  let used = exercises.reduce((sum, ex) => sum + ex.estimatedMinutes, 0);
  while (used > budgetMinutes && exercises.length) {
    let changed = false;
    for (const ex of exercises) {
      if (ex.sets > 2 && used > budgetMinutes) {
        ex.sets -= 1;
        ex.estimatedMinutes = estimateExerciseMinutes(ex);
        used = exercises.reduce((sum, item) => sum + item.estimatedMinutes, 0);
        changed = true;
      }
    }
    if (!changed) break;
    if (used > budgetMinutes && exercises.length > 4) {
      exercises.pop();
      used = exercises.reduce((sum, item) => sum + item.estimatedMinutes, 0);
    }
  }
  return exercises;
}

function expandVolumeToTime(selected, candidates, budgetMinutes) {
  let used = selected.reduce((sum, ex) => sum + ex.estimatedMinutes, 0);
  const slack = budgetMinutes - used;
  if (slack < 8) return selected;

  for (const ex of selected) {
    if (used >= budgetMinutes - 4) break;
    if (ex.sets < 6 && !String(ex.reps).includes("min")) {
      ex.sets += 1;
      ex.estimatedMinutes = estimateExerciseMinutes(ex);
      used = selected.reduce((sum, item) => sum + item.estimatedMinutes, 0);
    }
  }

  for (const candidate of candidates) {
    if (used + candidate.estimatedMinutes <= budgetMinutes - 2 && selected.length < 16) {
      selected.push({ ...candidate });
      used += candidate.estimatedMinutes;
    }
    if (used >= budgetMinutes - 2) break;
  }
  return selected;
}

function estimateExerciseMinutes(exercise) {
  if (exercise.reps.includes("min")) {
    const minutes = midpointFromRange(exercise.reps.replace(" min", ""));
    return Math.max(8, Math.round(minutes));
  }
  const reps = midpointFromRange(exercise.reps);
  const restSeconds = restToSeconds(exercise.rest);
  const setSeconds = Math.max(25, reps * 4);
  const totalSeconds = exercise.sets * setSeconds + Math.max(0, exercise.sets - 1) * restSeconds;
  return Math.max(3, Math.round(totalSeconds / 60));
}

function midpointFromRange(value) {
  const nums = (value.match(/\d+/g) || []).map(Number);
  if (!nums.length) return 10;
  if (nums.length === 1) return nums[0];
  return (nums[0] + nums[1]) / 2;
}

function restToSeconds(rest) {
  if (rest.includes("continuous")) return 0;
  if (rest.includes("min")) return midpointFromRange(rest) * 60;
  return midpointFromRange(rest);
}

function getAgeRule(age) {
  if (age < 16) return "minor-safe";
  if (age <= 18) return "moderate-controlled";
  return "full-program";
}

function deriveLevel(profile, analysis) {
  const score = profile.age >= 18 ? 2 : 1;
  if (analysis.bmi >= 30) return Math.max(0, score - 1);
  if (analysis.bmi <= 19 && profile.goal === "build-muscle") return score + 1;
  return score;
}

function getPrescription(goal, group, ageRule, level, profileMeta, i, analysis, profile, recoveryFactor) {
  const isCardio = profileMeta.type === "cardio";
  const isCore = profileMeta.type === "core";
  const isCompound = profileMeta.type === "compound" || profileMeta.type === "bodyweight";
  const isIsolation = profileMeta.type === "isolation";
  let base = { sets: 3, reps: "8-12", rest: "60-90s", intensity: "65-80% 1RM" };

  if (goal === "strength") {
    base = isCompound ? { sets: 4, reps: "3-6", rest: "2-3 min", intensity: "80-90% 1RM" } : isIsolation ? { sets: 3, reps: "8-12", rest: "75-90s", intensity: "65-75% 1RM" } : isCore ? { sets: 3, reps: "8-12", rest: "45-60s", intensity: "Bodyweight+" } : { sets: 1, reps: "12-18 min", rest: "continuous", intensity: "RPE 7-8" };
  } else if (goal === "build-muscle") {
    base = isCompound ? { sets: 3 + (level > 1 ? 1 : 0), reps: "6-12", rest: "75-120s", intensity: "65-85% 1RM" } : isIsolation ? { sets: 2 + (level > 0 ? 1 : 0), reps: "10-15", rest: "45-75s", intensity: "55-70% 1RM" } : isCore ? { sets: 3, reps: "12-20", rest: "30-45s", intensity: "Bodyweight / Cable" } : { sets: 1, reps: "12-20 min", rest: "continuous", intensity: "RPE 5-6" };
  } else if (goal === "lose-fat") {
    base = isCardio ? { sets: 1, reps: "20-35 min", rest: "continuous", intensity: "Zone 2-3 (RPE 6-7)" } : isCompound ? { sets: 3, reps: "8-12", rest: "60-90s", intensity: "60-75% 1RM" } : isIsolation ? { sets: 2 + (i % 2), reps: "12-15", rest: "45-60s", intensity: "50-65% 1RM" } : { sets: 3, reps: "12-20", rest: "30-45s", intensity: "Bodyweight+" };
  } else {
    base = isCardio ? { sets: 1, reps: "15-30 min", rest: "continuous", intensity: "RPE 5-7" } : isCompound ? { sets: 2 + (level > 0 ? 1 : 0), reps: "8-12", rest: "60-90s", intensity: "60-75% 1RM" } : isIsolation ? { sets: 2, reps: "10-15", rest: "45-60s", intensity: "50-65% 1RM" } : { sets: 2, reps: "10-20", rest: "30-45s", intensity: "Bodyweight" };
  }

  if (ageRule === "minor-safe") {
    base = isCardio ? { sets: 1, reps: "12-20 min", rest: "continuous", intensity: "RPE 5-6" } : { sets: Math.min(base.sets, 3), reps: isCompound ? "10-15" : "12-18", rest: "45-75s", intensity: "Bodyweight / Light load" };
  } else if (ageRule === "moderate-controlled") {
    base = isCardio ? { sets: 1, reps: "15-25 min", rest: "continuous", intensity: "RPE 6-7" } : { ...base, sets: Math.min(base.sets, 4), intensity: "Controlled moderate load" };
  }
  if (analysis.category === "Obese" && isCompound && !isCardio) {
    base.reps = goal === "strength" ? "5-8" : "8-12";
    base.rest = "75-120s";
  }

  base.sets = Math.max(2, Math.round(base.sets * recoveryFactor));
  const weightKg = suggestLoadKg(profileMeta, ageRule, goal, base.intensity, profile, analysis, base.reps, group);
  return { ...base, weightSuggestion: weightKg === null ? "N/A" : `${weightKg} kg` };
}

function suggestLoadKg(profileMeta, ageRule, goal, intensity, profile, analysis, repsText, group) {
  if (profileMeta.type === "cardio") return null;
  if (profileMeta.type === "core" || profileMeta.type === "bodyweight") {
    if (goal === "strength" && profile.age >= 18) return 10;
    return null;
  }

  const bw = profile.weight;
  const repMid = midpointFromRange(repsText);
  const sex = profile.gender || "male";
  const exp = profile.experience || "beginner";

  const oneRmRatioByLevel = {
    beginner: { lowerCompound: 0.9, upperCompound: 0.6, isolation: 0.2 },
    intermediate: { lowerCompound: 1.5, upperCompound: 1.0, isolation: 0.3 },
    advanced: { lowerCompound: 2.0, upperCompound: 1.35, isolation: 0.4 },
  };

  const levelRef = oneRmRatioByLevel[exp] || oneRmRatioByLevel.beginner;
  const sexFactorUpper = sex === "female" ? 0.72 : 1;
  const sexFactorLower = sex === "female" ? 0.82 : 1;

  const isLowerCompound = group === "legs";
  const compoundBase = profileMeta.type === "compound" ? (isLowerCompound ? levelRef.lowerCompound * sexFactorLower : levelRef.upperCompound * sexFactorUpper) : levelRef.isolation * sexFactorUpper;

  let estimated1RM = bw * compoundBase;
  if (analysis.category === "Underweight") estimated1RM *= 0.9;
  if (analysis.category === "Obese") estimated1RM *= 0.92;

  // Map rep range to common %1RM zones (strength/hypertrophy/endurance standards).
  let pct = 0.72;
  if (repMid <= 5) pct = 0.86;
  else if (repMid <= 8) pct = 0.8;
  else if (repMid <= 12) pct = 0.73;
  else if (repMid <= 15) pct = 0.67;
  else pct = 0.6;

  if (goal === "strength") pct += 0.05;
  if (goal === "lose-fat") pct -= 0.04;
  if (profile.fitnessLevel === "low") pct -= 0.04;
  if (profile.fitnessLevel === "high") pct += 0.02;
  if (ageRule === "minor-safe") pct = Math.min(pct, 0.45);
  if (ageRule === "moderate-controlled") pct = Math.min(pct, 0.65);

  const workWeight = Math.max(profileMeta.type === "isolation" ? 4 : 10, estimated1RM * pct);
  return roundToGymIncrement(workWeight, profileMeta.type, group);
}

function roundToGymIncrement(weight, exerciseType, group) {
  let increment = 5;
  if (group === "legs" || weight >= 80) increment = 10;
  if (exerciseType === "isolation" && weight < 40) increment = 5;
  const rounded = Math.round(weight / increment) * increment;
  return Math.max(increment, rounded);
}

function getGoogleImagesLink(exerciseName) {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(exerciseName)}`;
}

function getRecoveryFactor(profile, dayCount, sessionHours) {
  let factor = 1;
  if (profile.fitnessLevel === "low") factor -= 0.12;
  if (profile.fitnessLevel === "high") factor += 0.08;
  if (dayCount >= 6) factor -= 0.1;
  if (sessionHours >= 3) factor -= 0.06;
  if (profile.age > 40) factor -= 0.05;
  return Math.min(1.15, Math.max(0.78, factor));
}

function getGroupsFromBlock(block) {
  const lower = block.toLowerCase();
  if (lower.includes("push")) return ["chest", "shoulders", "triceps"];
  if (lower.includes("pull")) return ["back", "biceps"];
  if (lower.includes("legs")) return ["legs", "core"];
  if (lower.includes("upper")) return ["chest", "back", "shoulders", "biceps", "triceps"];
  if (lower.includes("lower")) return ["legs", "core"];
  if (lower.includes("chest")) return ["chest", "triceps"];
  if (lower.includes("back")) return ["back", "biceps"];
  if (lower.includes("shoulders")) return ["shoulders", "core"];
  if (lower.includes("core + cardio")) return ["core", "cardio"];
  if (lower.includes("recovery")) return ["cardio", "core"];
  return ["fullBody"];
}

function groupLabel(group) {
  const labels = { chest: "Chest", back: "Back", legs: "Legs", shoulders: "Shoulders", biceps: "Arms", triceps: "Arms", core: "Core", cardio: "Cardio", fullBody: "Full Body" };
  return labels[group] || "General";
}

function pickRotated(arr, count, seed = 0) {
  const start = seed % arr.length;
  return arr.slice(start).concat(arr.slice(0, start)).slice(0, count);
}

function renderDaysPicker() {
  els.daysPicker.innerHTML = DAYS.map((day) => `<button type="button" class="day-chip" data-day="${day}">${day}</button>`).join("");
  els.daysPicker.querySelectorAll(".day-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const day = chip.dataset.day;
      if (state.schedule.includes(day)) state.schedule = state.schedule.filter((d) => d !== day);
      else if (state.schedule.length < state.dayCount) state.schedule.push(day);
      else alert(`You can only select ${state.dayCount} days.`);
      updateDayChipUI();
      persist();
    });
  });
}

function updateDayChipUI() {
  els.daysPicker.querySelectorAll(".day-chip").forEach((chip) => chip.classList.toggle("selected", state.schedule.includes(chip.dataset.day)));
}

function renderAnalysis() {
  const a = state.analysis;
  els.bmiValue.textContent = a.bmi;
  els.bmiCategory.textContent = a.category;
  els.healthStatus.textContent = a.healthStatus;
  els.healthStatus.className = a.healthClass;
  els.idealRange.textContent = `${a.idealMin} - ${a.idealMax} kg`;
  els.weightDirection.textContent = a.direction;
  els.waterSuggestion.textContent = `Suggested water intake: ${a.waterLiters} L/day`;
  els.bmiPointer.style.left = `${a.bmiTrackPercent}%`;
}

function renderPlan() {
  const ageRule = getAgeRule(state.profile.age);
  const ageMessage = ageRule === "minor-safe" ? "Age rule: Bodyweight, light resistance, and strict form safety." : ageRule === "moderate-controlled" ? "Age rule: Controlled progressive overload with moderate weights." : "Age rule: Full gym programming enabled.";

  els.planMeta.innerHTML = `
    <p><strong>Goal:</strong> ${readableGoal(state.profile.goal)} | <strong>Age:</strong> ${state.profile.age} | <strong>BMI:</strong> ${state.analysis.bmi}</p>
    <p><strong>Experience:</strong> ${capitalize(state.profile.experience)} | <strong>Fitness capacity:</strong> ${capitalize(state.profile.fitnessLevel)} | <strong>Gender:</strong> ${state.profile.gender ? capitalize(state.profile.gender) : "Not specified"}</p>
    <p>${ageMessage}</p>
    <p><strong>Programming standard:</strong> ${TRAINING_REFERENCES} professional ranges</p>
    <p><strong>Session target:</strong> ${state.sessionHours}h (${Math.round(state.sessionHours * 60)} min), including ${SESSION_BUFFER_MINUTES} min transition buffer</p>
  `;

  els.planContainer.innerHTML = state.plan.map((dayPlan, dayIndex) => {
    const rows = dayPlan.exercises.map((ex) => `
      <tr>
        <td>${ex.name}</td>
        <td>${ex.sets}</td>
        <td>${ex.reps}</td>
        <td>${ex.weight}</td>
        <td>${ex.rest}</td>
        <td>${ex.group}</td>
        <td>${ex.estimatedMinutes} min</td>
        <td><a class="image-action" href="${ex.imageLink}" target="_blank" rel="noopener noreferrer">Image</a></td>
      </tr>
    `).join("");
    return `
      <article class="day-card">
        <h3>${dayPlan.day} - ${dayPlan.block}</h3>
        <p class="hint">Estimated total: ${dayPlan.totalMinutes} min (work ${dayPlan.workMinutes} min + ${SESSION_BUFFER_MINUTES} min buffer)</p>
        <div class="scroll-x">
          <table>
            <thead>
              <tr>
                <th>Exercise Name</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Suggested Weight</th>
                <th>Rest Time</th>
                <th>Target Muscle Group</th>
                <th>Approx Time / Exercise</th>
                <th>Exercise Image</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </article>
    `;
  }).join("");
}

function showSection(target) {
  [els.formSection, els.analysisSection, els.scheduleSection, els.programSection].forEach((s) => s.classList.add("hidden"));
  target.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function calculateAge(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

function readableGoal(goal) {
  const labels = { "lose-fat": "Lose Fat", "build-muscle": "Build Muscle", strength: "Strength", "general-fitness": "General Fitness" };
  return labels[goal] || goal;
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function persist() {
  localStorage.setItem("gymawy-state", JSON.stringify(state));
}

function loadFromStorage() {
  const raw = localStorage.getItem("gymawy-state");
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    Object.assign(state, saved);
    if (state.profile) {
      document.getElementById("dob").value = state.profile.dob;
      document.getElementById("weight").value = state.profile.weight;
      document.getElementById("goal").value = state.profile.goal;
      document.getElementById("gender").value = state.profile.gender || "";
      document.getElementById("experience").value = state.profile.experience || "";
      document.getElementById("fitnessLevel").value = state.profile.fitnessLevel || "";
      els.heightCm.value = state.profile.heightCm;
      if (state.profile.heightUnit === "ft") {
        document.querySelector("input[name='heightUnit'][value='ft']").checked = true;
        const totalInches = state.profile.heightCm / 2.54;
        els.heightFt.value = Math.floor(totalInches / 12);
        els.heightIn.value = Math.round(totalInches % 12);
        applyHeightUnitVisibility("ft");
      } else {
        document.querySelector("input[name='heightUnit'][value='cm']").checked = true;
        applyHeightUnitVisibility("cm");
      }
    } else {
      document.querySelector("input[name='heightUnit'][value='cm']").checked = true;
      applyHeightUnitVisibility("cm");
    }
    els.daysPerWeek.value = state.dayCount;
    els.daysPerWeekLabel.textContent = `${state.dayCount} days`;
    els.sessionHours.value = state.sessionHours || 2;
    els.sessionHoursLabel.textContent = `${els.sessionHours.value} hours`;
    updateDayChipUI();

    // Always start from profile form so user is asked for data each time.
    showSection(els.formSection);
  } catch {
    localStorage.removeItem("gymawy-state");
  }
}
