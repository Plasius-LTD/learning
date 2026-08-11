import type {
  AssessmentRubricV1,
  CourseMaterialsManifestV1,
  HardwareItemV1,
  HardwareRequirementManifestV1,
  LearningModuleVersionV1,
  LearningPathVersionV1,
  MissionV1,
  ModuleAgentDefinitionV1,
  ModuleCategoryV1,
} from "./contracts.js";

const SOFTWARE_HARDWARE: HardwareRequirementManifestV1 = {
  requirementsVersion: "1.0.0",
  mode: "none",
  hardwareIncluded: false,
  simulatorAvailable: true,
  verificationStatus: "not-applicable",
  publicSaleBlocked: false,
  preparationMinutes: 0,
  items: [],
  warnings: ["No specialist physical equipment is required."],
  supportedPlatforms: ["Current Chromium, Firefox or Safari browser"],
};

const CORE_ROBOT_ITEMS: HardwareItemV1[] = [
  {
    id: "pico-2-w",
    label: "Raspberry Pi Pico 2 W",
    quantity: 1,
    requirement: "required",
    exactSpecification: "Raspberry Pi Pico 2 W with soldered headers",
    adultOnly: false,
    stage: "core",
  },
  {
    id: "breadboard",
    label: "Solderless breadboard",
    quantity: 1,
    requirement: "required",
    exactSpecification: "400-point or larger solderless breadboard",
    adultOnly: false,
    stage: "core",
  },
  {
    id: "usb-data-cable",
    label: "USB data cable",
    quantity: 1,
    requirement: "required",
    exactSpecification: "Data-capable USB cable compatible with the Pico 2 W",
    adultOnly: false,
    stage: "core",
  },
  {
    id: "jumper-wires",
    label: "Jumper wires",
    quantity: 12,
    requirement: "required",
    exactSpecification: "Insulated male-to-male breadboard jumper wires",
    adultOnly: false,
    stage: "core",
  },
];

const ROBOT_WARNING =
  "Physical publication is blocked until every listed actuator, driver, sensor and power configuration passes an adult bench test.";

function physicalHardware(
  requirementsVersion: string,
  preparationMinutes: number,
  items: HardwareItemV1[],
  platforms: string[],
): HardwareRequirementManifestV1 {
  return {
    requirementsVersion,
    mode: "physical-first",
    hardwareIncluded: false,
    simulatorAvailable: true,
    verificationStatus: "pending-bench-test",
    publicSaleBlocked: true,
    preparationMinutes,
    items: [...CORE_ROBOT_ITEMS, ...items],
    warnings: [ROBOT_WARNING, "An adult must disconnect actuator power before changing wiring."],
    supportedPlatforms: platforms,
  };
}

function materials(slug: string, robot = false): CourseMaterialsManifestV1 {
  return {
    version: "1.0.0",
    learner: [
      { id: `${slug}-child-guide`, kind: "child-guide", audience: "learner" },
      { id: `${slug}-mission-cards`, kind: "mission-cards", audience: "learner" },
      { id: `${slug}-starter`, kind: "starter-project", audience: "learner" },
      { id: `${slug}-assets`, kind: "asset-pack", audience: "learner" },
      { id: `${slug}-printable`, kind: "printable", audience: "learner" },
    ],
    facilitator: [
      { id: `${slug}-facilitator`, kind: "facilitator-guide", audience: "facilitator" },
      { id: `${slug}-answers`, kind: "answer-key", audience: "facilitator" },
      { id: `${slug}-tests`, kind: "protected-tests", audience: "facilitator" },
      ...(robot
        ? [
            {
              id: `${slug}-hardware`,
              kind: "hardware-guide" as const,
              audience: "facilitator" as const,
            },
          ]
        : []),
    ],
  };
}

function agents(slug: string): ModuleAgentDefinitionV1[] {
  return [
    {
      id: `${slug}-assessor`,
      role: "assessor",
      evidenceBound: true,
      maySuggestSingleFix: false,
      mayAssignScore: false,
      mayAwardReward: false,
      mayPublish: false,
      mayControlHardware: false,
    },
    {
      id: `${slug}-debugger`,
      role: "debugger",
      evidenceBound: true,
      maySuggestSingleFix: false,
      mayAssignScore: false,
      mayAwardReward: false,
      mayPublish: false,
      mayControlHardware: false,
    },
    {
      id: `${slug}-fix-guide`,
      role: "fix-guide",
      evidenceBound: true,
      maySuggestSingleFix: true,
      mayAssignScore: false,
      mayAwardReward: false,
      mayPublish: false,
      mayControlHardware: false,
    },
    {
      id: `${slug}-concept-explainer`,
      role: "concept-explainer",
      evidenceBound: true,
      maySuggestSingleFix: false,
      mayAssignScore: false,
      mayAwardReward: false,
      mayPublish: false,
      mayControlHardware: false,
    },
  ];
}

function rubric(slug: string): AssessmentRubricV1 {
  return {
    version: "1.0.0",
    completionScore: 80,
    criteria: [
      {
        id: `${slug}-build`,
        label: "The project is structurally valid and starts successfully.",
        dimension: "structure",
        points: 20,
        mandatory: true,
        visibility: "visible",
      },
      {
        id: `${slug}-goal-one`,
        label: "The first published project behaviour works.",
        dimension: "behaviour",
        points: 20,
        mandatory: true,
        visibility: "visible",
      },
      {
        id: `${slug}-goal-two`,
        label: "The second published project behaviour works.",
        dimension: "behaviour",
        points: 20,
        mandatory: true,
        visibility: "visible",
      },
      {
        id: `${slug}-goal-three`,
        label: "The complete project challenge works.",
        dimension: "behaviour",
        points: 10,
        mandatory: false,
        visibility: "visible",
      },
      {
        id: `${slug}-edge-one`,
        label: "The project handles its first protected edge case.",
        dimension: "resilience",
        points: 10,
        mandatory: false,
        visibility: "protected",
      },
      {
        id: `${slug}-edge-two`,
        label: "The project handles its second protected edge case.",
        dimension: "resilience",
        points: 10,
        mandatory: false,
        visibility: "protected",
      },
      {
        id: `${slug}-safety`,
        label: "The project obeys its mandatory safety and privacy boundary.",
        dimension: "safety",
        points: 10,
        mandatory: true,
        visibility: "visible",
      },
    ],
  };
}

function mission(
  slug: string,
  index: number,
  title: string,
  concepts: string[],
  statement: string,
  sideAdventure: string,
): MissionV1 {
  return {
    id: `${slug}-mission-${index}`,
    title,
    estimatedMinutes: index === 4 ? 25 : 20,
    concepts,
    goals: [
      {
        id: `${slug}-goal-${index}`,
        statement,
        evidence: "assessment",
      },
    ],
    sideAdventure,
  };
}

interface ModuleInput {
  slug: string;
  title: string;
  category: ModuleCategoryV1;
  summary: string;
  tools: string[];
  concepts: string[];
  tokenSubunits: string;
  hosting?: boolean;
  hardware?: HardwareRequirementManifestV1;
  missionTitles: [string, string, string, string];
}

function module(input: ModuleInput): LearningModuleVersionV1 {
  const isRobot = input.category === "robot";
  return {
    id: `junior-coder.${input.slug}`,
    slug: input.slug,
    version: "1.0.0",
    contentRevision: "2026-07-21.1",
    title: input.title,
    category: input.category,
    summary: input.summary,
    estimatedMinutes: 90,
    tools: input.tools,
    concepts: input.concepts,
    selfContained: true,
    prerequisiteModuleIds: [],
    pricing: {
      state: "pilot-grant-only",
      tokenSubunits: input.tokenSubunits,
      includesMaterials: true,
      includesAssessmentRetries: true,
      includesAgents: true,
      includesHostingAllowance: input.hosting ?? false,
    },
    materials: materials(input.slug, isRobot),
    hardware: input.hardware ?? SOFTWARE_HARDWARE,
    missions: input.missionTitles.map((title, index) =>
      mission(
        input.slug,
        index + 1,
        title,
        input.concepts.slice(0, 3),
        `Complete ${title.toLocaleLowerCase("en-GB")} and explain the observed result.`,
        `Invent one safe remix for ${title.toLocaleLowerCase("en-GB")}.`,
      ),
    ),
    assessment: rubric(input.slug),
    agents: agents(input.slug),
    badges: [
      {
        id: `${input.slug}-mission-complete`,
        title: `${input.title} Champion`,
        evidence: "module-score",
        tradeable: false,
        tokenConvertible: false,
      },
      ...(isRobot
        ? [
            {
              id: `${input.slug}-physical-builder`,
              title: `${input.title} Physical Builder`,
              evidence: "adult-physical-signoff" as const,
              tradeable: false as const,
              tokenConvertible: false as const,
            },
          ]
        : []),
    ],
  };
}

const modules: LearningModuleVersionV1[] = [
  module({
    slug: "robot-maze-dash",
    title: "Robot Maze Dash",
    category: "game",
    summary: "Guide rescue robots through original mazes with visual programs and side-by-side text code.",
    tools: ["Visual blocks", "JavaScript view", "Python view", "C++ view"],
    concepts: ["sequence", "variables", "loops", "conditions", "functions"],
    tokenSubunits: "8000",
    missionTitles: ["Meet Your Robot", "Repeat the Rescue", "Choose the Safe Path", "Lost Robot Challenge"],
  }),
  module({
    slug: "road-hopper-rally",
    title: "Road Hopper Rally",
    category: "game",
    summary: "Build an original road-crossing game with changing lanes and rescue targets.",
    tools: ["JavaScript", "Educational canvas API"],
    concepts: ["events", "coordinates", "animation", "collision", "scoring"],
    tokenSubunits: "10000",
    missionTitles: ["Draw the Rescue Road", "Move the Hopper", "Add Moving Traffic", "Rally Challenge"],
  }),
  module({
    slug: "skywing-sprint",
    title: "Skywing Sprint",
    category: "game",
    summary: "Fly a rescue craft through procedurally changing sky gates.",
    tools: ["JavaScript", "Educational canvas API"],
    concepts: ["velocity", "gravity", "timing", "randomness", "obstacles"],
    tokenSubunits: "10000",
    missionTitles: ["Give Skywing Lift", "Build a Gate", "Score a Safe Flight", "Sky Sprint Challenge"],
  }),
  module({
    slug: "paddle-pulse",
    title: "Paddle Pulse",
    category: "game",
    summary: "Create a paddle-and-energy-ball arcade game with levels and original power-ups.",
    tools: ["JavaScript", "Educational canvas API"],
    concepts: ["angles", "collision response", "levels", "power-ups", "state"],
    tokenSubunits: "12000",
    missionTitles: ["Move the Pulse Paddle", "Bounce the Energy Ball", "Build a Target Wall", "Power-Up Challenge"],
  }),
  module({
    slug: "meteor-shield",
    title: "Meteor Shield",
    category: "game",
    summary: "Protect rescue bases with careful targeting and limited shield energy.",
    tools: ["JavaScript", "Educational canvas API"],
    concepts: ["targeting", "projectiles", "timers", "waves", "resources"],
    tokenSubunits: "12000",
    missionTitles: ["Mark the Rescue Bases", "Launch a Shield", "Create Meteor Waves", "Last Base Challenge"],
  }),
  module({
    slug: "rescue-crew-commander",
    title: "Rescue Crew Commander",
    category: "game",
    summary: "Assign safe jobs, routes and priorities to a team of original helper creatures.",
    tools: ["Visual blocks", "JavaScript"],
    concepts: ["state machines", "routes", "priorities", "group behaviour", "debugging"],
    tokenSubunits: "14000",
    missionTitles: ["Meet the Rescue Crew", "Give a Crew Job", "Choose a Safe Route", "Commander Challenge"],
  }),
  module({
    slug: "pixel-trail-challenge",
    title: "Pixel Trail Challenge",
    category: "game",
    summary: "Use Python lists and grid movement to grow a safe energy trail.",
    tools: ["Python", "Pyodide", "Educational drawing API"],
    concepts: ["lists", "grid movement", "spawning", "collision", "score"],
    tokenSubunits: "10000",
    missionTitles: ["Move the Pixel", "Grow the Trail", "Place Energy Orbs", "Trail Challenge"],
  }),
  module({
    slug: "star-defender-squadron",
    title: "Star Defender Squadron",
    category: "game",
    summary: "Build a multi-level space-rescue finale with original entities and enemy patterns.",
    tools: ["Python", "JavaScript", "Educational drawing API"],
    concepts: ["entities", "projectiles", "patterns", "health", "levels"],
    tokenSubunits: "16000",
    missionTitles: ["Launch the Squadron", "Build a Rescue Wave", "Add Shields and Health", "Star Defender Finale"],
  }),
  module({
    slug: "beacon-bot",
    title: "Beacon Bot",
    category: "robot",
    summary: "Program visible and infrared rescue signals with C++ and a Pico 2 W.",
    tools: ["C++", "Pico 2 W", "Simulator"],
    concepts: ["digital output", "timing", "functions", "signals", "sensor input"],
    tokenSubunits: "8000",
    hardware: physicalHardware("1.0.0", 30, [
      { id: "led-pack", label: "Visible LEDs", quantity: 3, requirement: "required", exactSpecification: "5 mm low-current red, amber and green LEDs", adultOnly: false, stage: "core" },
      { id: "led-resistors", label: "LED current-limiting resistors", quantity: 3, requirement: "required", exactSpecification: "330 ohm, 0.25 W resistors", adultOnly: false, stage: "core" },
      { id: "ir-pair", label: "Infrared emitter and receiver", quantity: 1, requirement: "required", exactSpecification: "Matched 940 nm IR LED and 3.3 V-compatible digital receiver pair; exact reference model pending bench verification", adultOnly: true, stage: "sensor" },
    ], ["Pico SDK on Raspberry Pi OS or supported desktop toolchain"]),
    missionTitles: ["Blink a Rescue Signal", "Build a Signal Function", "Send an IR Message", "Beacon Challenge"],
  }),
  module({
    slug: "servo-creature",
    title: "Servo Creature",
    category: "robot",
    summary: "Give a servo creature safe movements, moods and sensor reactions.",
    tools: ["C++", "Pico 2 W", "Simulator"],
    concepts: ["PWM", "angles", "sequences", "limits", "interaction"],
    tokenSubunits: "10000",
    hardware: physicalHardware("1.0.0", 40, [
      { id: "micro-servo", label: "Micro servo", quantity: 1, requirement: "required", exactSpecification: "3.3 V signal-compatible micro servo; exact reference model and external power arrangement pending bench verification", adultOnly: true, stage: "servo" },
      { id: "servo-power", label: "Servo power supply", quantity: 1, requirement: "required", exactSpecification: "Switched regulated supply sized for the verified servo, with common signal ground", adultOnly: true, stage: "servo" },
    ], ["Pico SDK on Raspberry Pi OS or supported desktop toolchain"]),
    missionTitles: ["Wake the Creature", "Make a Movement Sequence", "Choose a Mood", "Creature Show Challenge"],
  }),
  module({
    slug: "dance-rover",
    title: "Dance Rover",
    category: "robot",
    summary: "Build reusable movement functions and a fail-safe rover dance.",
    tools: ["C++", "Pico 2 W", "Simulator"],
    concepts: ["motor direction", "PWM speed", "functions", "sequences", "emergency stop"],
    tokenSubunits: "14000",
    hardware: physicalHardware("1.0.0", 90, [
      { id: "dual-motor-driver", label: "Dual motor driver", quantity: 1, requirement: "required", exactSpecification: "3.3 V logic-compatible dual H-bridge; exact reference model pending bench verification", adultOnly: true, stage: "rover" },
      { id: "geared-motors", label: "Matching geared motors", quantity: 2, requirement: "required", exactSpecification: "Matching low-voltage geared DC motors compatible with the verified driver and supply", adultOnly: true, stage: "rover" },
      { id: "rover-chassis", label: "Rover chassis set", quantity: 1, requirement: "required", exactSpecification: "Two-wheel chassis with matching wheels and caster or skid", adultOnly: true, stage: "rover" },
      { id: "motor-power", label: "Switched motor power supply", quantity: 1, requirement: "required", exactSpecification: "Fused or protected switched supply within verified driver and motor ratings", adultOnly: true, stage: "rover" },
    ], ["Pico SDK on Raspberry Pi OS or supported desktop toolchain"]),
    missionTitles: ["Lifted-Wheel Safety Test", "Drive and Turn", "Build Movement Functions", "Rover Dance Challenge"],
  }),
  module({
    slug: "obstacle-explorer",
    title: "Obstacle Explorer",
    category: "robot",
    summary: "Use IR sensing, state and watchdogs to navigate and stop safely.",
    tools: ["C++", "Pico 2 W", "Simulator"],
    concepts: ["booleans", "state", "navigation", "watchdogs", "fail-safe stop"],
    tokenSubunits: "14000",
    hardware: physicalHardware("1.0.0", 60, [
      { id: "verified-rover", label: "Verified Dance Rover build", quantity: 1, requirement: "required", exactSpecification: "Bench-signed rover matching the published Dance Rover reference build", adultOnly: true, stage: "rover" },
      { id: "obstacle-sensors", label: "Digital IR obstacle sensors", quantity: 2, requirement: "required", exactSpecification: "3.3 V-compatible digital IR obstacle sensors; exact reference model pending bench verification", adultOnly: true, stage: "sensor" },
    ], ["Pico SDK on Raspberry Pi OS or supported desktop toolchain"]),
    missionTitles: ["Read an Obstacle", "Choose a Safe Response", "Add a Watchdog", "Explorer Maze Challenge"],
  }),
  module({
    slug: "rainbow-rescue-rover",
    title: "Rainbow Rescue Rover",
    category: "robot",
    summary: "Recognise local colour targets and send bounded serial commands to a safe rover.",
    tools: ["Python", "C++", "Pico 2 W", "Pi Zero 2 W", "Camera Module 3", "Simulator"],
    concepts: ["colour recognition", "coordinates", "serial protocol", "heartbeats", "integration"],
    tokenSubunits: "18000",
    hardware: physicalHardware("1.0.0", 120, [
      { id: "verified-explorer", label: "Verified Obstacle Explorer build", quantity: 1, requirement: "required", exactSpecification: "Bench-signed rover matching the published Obstacle Explorer reference build", adultOnly: true, stage: "rover" },
      { id: "pi-zero-2-w", label: "Raspberry Pi Zero 2 W", quantity: 1, requirement: "required", exactSpecification: "Raspberry Pi Zero 2 W with supported Raspberry Pi OS image", adultOnly: true, stage: "camera" },
      { id: "camera-3", label: "Raspberry Pi Camera Module 3", quantity: 1, requirement: "required", exactSpecification: "Raspberry Pi Camera Module 3 with the correct Zero-series camera ribbon", adultOnly: true, stage: "camera" },
      { id: "pi-storage-power", label: "Pi storage and power", quantity: 1, requirement: "required", exactSpecification: "Supported microSD card and regulated Raspberry Pi power supply", adultOnly: true, stage: "camera" },
    ], ["Current Raspberry Pi OS", "Pico SDK"]),
    missionTitles: ["Find a Colour Target", "Report Left Centre or Right", "Send Safe Serial Commands", "Rainbow Rescue Challenge"],
  }),
  module({
    slug: "vibe-game-remix-lab",
    title: "Vibe Game Remix Lab",
    category: "vibe",
    summary: "Transform a supplied mini-game through structured, evidence-bound AI suggestions.",
    tools: ["Structured prompt builder", "Diff review", "JavaScript sandbox"],
    concepts: ["intent", "constraints", "diffs", "testing", "explanation"],
    tokenSubunits: "12000",
    missionTitles: ["Describe the Remix", "Constrain the Change", "Review One Diff", "Remix Challenge"],
  }),
  module({
    slug: "vibe-bug-detective",
    title: "Vibe Bug Detective",
    category: "vibe",
    summary: "Repair an intentionally broken project using assessment evidence and focused suggestions.",
    tools: ["Structured prompt builder", "Diff review", "Assessment runner"],
    concepts: ["diagnostics", "hypotheses", "minimal fixes", "regression tests", "reflection"],
    tokenSubunits: "12000",
    missionTitles: ["Read the Evidence", "Ask a Focused Question", "Inspect a Suggested Fix", "Regression Challenge"],
  }),
  module({
    slug: "vibe-idea-studio",
    title: "Vibe Idea Studio",
    category: "vibe",
    summary: "Turn a bounded original idea into goals, acceptance tests and a working prototype.",
    tools: ["Intent cards", "Structured prompt builder", "Diff review", "Sandbox"],
    concepts: ["goals", "acceptance tests", "iteration", "trade-offs", "explanation"],
    tokenSubunits: "16000",
    missionTitles: ["Shape the Idea", "Write Success Tests", "Build One Step", "Prototype Showcase"],
  }),
  module({
    slug: "adventure-mission-planner",
    title: "Adventure Mission Planner",
    category: "web-app",
    summary: "Build an accessible planner for fictional quests and activities.",
    tools: ["HTML", "CSS", "JavaScript", "Private preview"],
    concepts: ["semantic HTML", "forms", "validation", "arrays", "local persistence"],
    tokenSubunits: "10000",
    hosting: true,
    missionTitles: ["Make a Semantic Page", "Add a Mission Form", "Save Fictional Missions", "Accessible Planner Challenge"],
  }),
  module({
    slug: "creature-care-dashboard",
    title: "Creature Care Dashboard",
    category: "web-app",
    summary: "Create a responsive dashboard for a fictional digital creature.",
    tools: ["HTML", "CSS", "JavaScript", "Private preview"],
    concepts: ["components", "events", "timers", "status displays", "reduced motion"],
    tokenSubunits: "12000",
    hosting: true,
    missionTitles: ["Design the Creature Card", "Update Creature State", "Add a Safe Timer", "Care Dashboard Challenge"],
  }),
  module({
    slug: "robot-mission-control",
    title: "Robot Mission Control",
    category: "web-app",
    summary: "Build a simulated control and telemetry interface with safety confirmations.",
    tools: ["HTML", "CSS", "JavaScript", "Serial simulator", "Private preview"],
    concepts: ["commands", "state machines", "confirmations", "charts", "responsive controls"],
    tokenSubunits: "14000",
    hosting: true,
    missionTitles: ["Build the Control Panel", "Simulate Telemetry", "Add Stop Confirmations", "Mission Control Challenge"],
  }),
];

/**
 * Uniform price for the immutable 1.1.0 pilot catalog.
 *
 * The GBP value is product-copy reference metadata under the published
 * 10p-per-Token economy reference rate. It does not create redemption rights.
 */
export const JUNIOR_CODER_MODULE_PRICE_V1_1 = Object.freeze({
  tokenSubunits: "50000",
  referencePrice: Object.freeze({
    currency: "GBP" as const,
    minorUnits: "500",
    basis: "nominal-reference" as const,
    cashRedemptionAllowed: false as const,
  }),
});

/** Initial immutable Junior Coder path manifest for pilot grants and shadow pricing. */
export const JUNIOR_CODER_ROBOT_RESCUE_PATH_V1: LearningPathVersionV1 = {
  id: "junior-coder.robot-rescue-arcade",
  slug: "robot-rescue-arcade",
  version: "1.0.0",
  title: "Junior Coder: Robot Rescue Arcade",
  description: "Nineteen self-contained game, robotics, Vibe Coding and web-app projects for young programmers.",
  catalogState: "pilot",
  publicLaunchAtomic: true,
  featureFlag: "learning.junior-coder.catalog.enabled",
  modules,
};

/**
 * Uniformly priced successor to the immutable 1.0.0 pilot catalog.
 *
 * All modules remain independently sellable and retain their existing content,
 * manifests and safeguards. The new module and path versions bind the new price
 * without altering previously published records.
 */
export const JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1: LearningPathVersionV1 = {
  ...JUNIOR_CODER_ROBOT_RESCUE_PATH_V1,
  version: "1.1.0",
  modules: JUNIOR_CODER_ROBOT_RESCUE_PATH_V1.modules.map((entry) => ({
    ...entry,
    version: "1.1.0",
    contentRevision: "2026-07-28.1",
    pricing: {
      ...entry.pricing,
      tokenSubunits: JUNIOR_CODER_MODULE_PRICE_V1_1.tokenSubunits,
      referencePrice: JUNIOR_CODER_MODULE_PRICE_V1_1.referencePrice,
    },
  })),
};

/** Digest-pinned content package for the independently released 54-stage course. */
export const ROAD_HOPPER_RALLY_EXTERNAL_CONTENT_V1 = Object.freeze({
  packageName: "@plasius/learning-road-hopper-rally",
  packageVersion: "1.0.0",
  exportName: "ROAD_HOPPER_RALLY_COURSE_V2",
  sha256: "1a20741beba028004e0be527d05aae2b2881082d3b578e0d62308a59bf1323f0",
});

const roadHopperV1_1 = JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.find(
  (entry) => entry.id === "junior-coder.road-hopper-rally",
)!;

const ROAD_HOPPER_RALLY_V2_MISSIONS = [
  {
    id: "board",
    title: "Build the Rally Board",
    concepts: ["coordinate grids", "arrays", "entity state", "rendering"],
    statement: "Create the road, median, river and five distinct home bays in board.js.",
    sideAdventure: "Design an original high-contrast board palette without changing its mechanics.",
  },
  {
    id: "hopper",
    title: "Move the Hopper",
    concepts: ["events", "bounded movement", "keyboard input", "touch input", "respawning"],
    statement: "Implement four-direction tile movement, bounds, equivalent inputs and respawning in hopper.js.",
    sideAdventure: "Add an accessible movement status phrase for every successful hop.",
  },
  {
    id: "traffic",
    title: "Create Rally Traffic",
    concepts: ["spawning", "fixed-step updates", "wrapping", "collision detection", "difficulty"],
    statement: "Implement five deterministic traffic lanes, collisions, lives and difficulty in traffic.js.",
    sideAdventure: "Invent an original vehicle type while preserving the entity and collision limits.",
  },
  {
    id: "river",
    title: "Cross the Moving River",
    concepts: ["moving platforms", "carrying", "hazards", "state machines", "off-screen bounds"],
    statement: "Implement logs, carrying, water deaths, diving platforms and edge hazards in river.js.",
    sideAdventure: "Create an original visual warning for a platform that is about to dive.",
  },
  {
    id: "rules",
    title: "Add Rally Rules",
    concepts: ["timers", "lives", "scoring", "bonuses", "levels", "game over"],
    statement: "Implement homes, occupied and blocked bays, timer, scoring, bonuses and level progression in rules.js.",
    sideAdventure: "Tune a practice-speed preset that keeps every rule deterministic.",
  },
  {
    id: "game",
    title: "Complete Road Hopper Rally",
    concepts: ["system assembly", "pause and restart", "alternating players", "audio", "accessibility", "testing"],
    statement: "Assemble the systems, accessibility modes and alternating-player finale in game.js, then pass the protected challenge.",
    sideAdventure: "Polish the finished game with original captions, visual cues and reduced-motion feedback.",
  },
] as const;

/** Road Hopper Rally 2.0 catalog record; course data stays in the referenced package. */
export const JUNIOR_CODER_ROAD_HOPPER_RALLY_V2: LearningModuleVersionV1 = {
  ...roadHopperV1_1,
  version: "2.0.0",
  contentRevision: "2026-08-11.1",
  summary: "Recreate the systems behind a classic road-and-river crossing game using original Road Hopper Rally code, art, audio and presentation.",
  estimatedMinutes: 450,
  tools: [
    "JavaScript",
    "QuickJS sandbox",
    "Deterministic 30 Hz engine",
    "Road Hopper renderer",
  ],
  concepts: [
    "coordinates",
    "arrays and entity state",
    "events and input",
    "fixed-step update and render",
    "spawning and movement",
    "collision detection",
    "state machines",
    "timers, lives and scoring",
    "difficulty progression",
    "audio integration",
    "debugging",
    "deterministic testing",
  ],
  missions: ROAD_HOPPER_RALLY_V2_MISSIONS.map((missionDefinition, index) => ({
    id: `road-hopper-rally-mission-${index + 1}-${missionDefinition.id}`,
    title: missionDefinition.title,
    estimatedMinutes: 75,
    concepts: [...missionDefinition.concepts],
    goals: [
      {
        id: `road-hopper-rally-v2-${missionDefinition.id}`,
        statement: missionDefinition.statement,
        evidence: "assessment",
      },
    ],
    sideAdventure: missionDefinition.sideAdventure,
  })),
  assessment: {
    version: "2.0.0",
    completionScore: 80,
    criteria: [
      { id: "road-hopper-v2-structure", label: "All six bounded JavaScript files compile and assemble.", dimension: "structure", points: 20, mandatory: true, visibility: "visible" },
      { id: "road-hopper-v2-road", label: "Board, input and traffic behaviours pass deterministic scenarios.", dimension: "behaviour", points: 15, mandatory: true, visibility: "visible" },
      { id: "road-hopper-v2-river", label: "River platforms, carrying and hazards pass deterministic scenarios.", dimension: "behaviour", points: 15, mandatory: true, visibility: "visible" },
      { id: "road-hopper-v2-rules", label: "Homes, timer, lives, scoring, bonuses and levels behave correctly.", dimension: "behaviour", points: 20, mandatory: true, visibility: "visible" },
      { id: "road-hopper-v2-final", label: "The complete game passes the server-only protected final challenge.", dimension: "resilience", points: 20, mandatory: true, visibility: "protected" },
      { id: "road-hopper-v2-safety", label: "The project stays within the sandbox, resource and privacy boundaries.", dimension: "safety", points: 10, mandatory: true, visibility: "visible" },
    ],
  },
  badges: [
    {
      id: "road-hopper-rally-v2-complete",
      title: "Road Hopper Rally Champion",
      evidence: "module-score",
      tradeable: false,
      tokenConvertible: false,
    },
  ],
  externalContent: ROAD_HOPPER_RALLY_EXTERNAL_CONTENT_V1,
};

/** Mixed-version successor: Road Hopper 2.0 plus every other immutable 1.1 module. */
export const JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_2: LearningPathVersionV1 = {
  ...JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1,
  version: "1.2.0",
  modules: JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_1.modules.map((entry) =>
    entry.id === JUNIOR_CODER_ROAD_HOPPER_RALLY_V2.id
      ? JUNIOR_CODER_ROAD_HOPPER_RALLY_V2
      : entry),
};

/** Current pilot catalog for server adapters that intentionally follow releases. */
export const JUNIOR_CODER_ROBOT_RESCUE_PATH_CURRENT =
  JUNIOR_CODER_ROBOT_RESCUE_PATH_V1_2;
