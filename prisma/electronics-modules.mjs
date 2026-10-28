// Programmable Electronics — the shared Arduino + micro:bit project spine.
// Originally IgniteHer's (and Abaco's) Module 3; lives here so every org that
// teaches it builds from one source. Eight Arduino projects (built-in LED
// blink → external LED → push button → sensors, real wiring, real sketches,
// Wokwi simulator path throughout) and eight micro:bit projects on the same
// spine.
//
//   electronicsModules()                                  — both tracks
//   electronicsModules({ boards: ["microbit"] })          — one track
//   electronicsModules({ title: (t) => `Y7 · ${t}` })     — per-class titles
//
// Returns createModule() data, Arduino track first, each track in project
// order. moduleWriter upserts by title, so an org seeding several copies
// (one per class) needs the `title` option to keep them apart.

import { block, wrapUpPrompt, wrapUpCriterion, photoCriterion, audioCriterion } from "./seed-lib.mjs";

export const ELECTRONICS = "Programmable Electronics";

// The exact sketches the tutorial teaches, compiled to hex once per seed run
// so the in-page simulator (circuit blocks) can run them instantly in the
// browser.
const SKETCH = {
  blink13:
    "void setup() {\n  pinMode(13, OUTPUT);   // pin 13 will push power out\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);  // LED on\n  delay(1000);             // wait 1000 ms = 1 second\n  digitalWrite(13, LOW);   // LED off\n  delay(1000);\n}",
  blink8:
    "void setup() {\n  pinMode(8, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);\n  delay(1000);\n  digitalWrite(8, LOW);\n  delay(1000);\n}",
  button:
    "void setup() {\n  pinMode(8, OUTPUT);\n  pinMode(2, INPUT_PULLUP);   // button pin; PULLUP = no extra resistor needed\n}\n\nvoid loop() {\n  if (digitalRead(2) == LOW) {   // LOW means PRESSED (pullup logic is flipped)\n    digitalWrite(8, HIGH);\n  } else {\n    digitalWrite(8, LOW);\n  }\n}",
  traffic:
    "void setup() {\n  pinMode(8, OUTPUT);   // red\n  pinMode(9, OUTPUT);   // yellow\n  pinMode(10, OUTPUT);  // green\n}\n\nvoid loop() {\n  digitalWrite(10, HIGH);  delay(5000);  digitalWrite(10, LOW);  // green 5 s\n  digitalWrite(9, HIGH);   delay(2000);  digitalWrite(9, LOW);   // yellow 2 s\n  digitalWrite(8, HIGH);   delay(5000);  digitalWrite(8, LOW);   // red 5 s\n}",
  tmp36:
    'void setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int reading = analogRead(A0);\n  float voltage = reading * 5.0 / 1024.0;\n  float tempC = (voltage - 0.5) * 100.0;   // TMP36 formula\n  Serial.print("Temp: ");\n  Serial.print(tempC);\n  Serial.println(" C");\n  delay(500);\n}',
  police:
    "void setup() {\n  pinMode(8, OUTPUT);   // red\n  pinMode(9, OUTPUT);   // blue\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);  digitalWrite(9, LOW);\n  delay(150);\n  digitalWrite(8, LOW);   digitalWrite(9, HIGH);\n  delay(150);\n}",
  toggle:
    "bool lightOn = false;   // the flashlight remembers its state\n\nvoid setup() {\n  pinMode(8, OUTPUT);\n  pinMode(2, INPUT_PULLUP);\n}\n\nvoid loop() {\n  if (digitalRead(2) == LOW) {          // pressed\n    lightOn = !lightOn;                 // flip it\n    digitalWrite(8, lightOn ? HIGH : LOW);\n    while (digitalRead(2) == LOW) {}    // wait for your finger to lift\n    delay(50);                          // debounce\n  }\n}",
  heatalarm:
    'void setup() {\n  pinMode(8, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int reading = analogRead(A0);\n  float tempC = (reading * 5.0 / 1024.0 - 0.5) * 100.0;\n  Serial.print("Temp: ");\n  Serial.println(tempC);\n  if (tempC > 30) {                // too hot — sound the alarm!\n    digitalWrite(8, HIGH);  delay(200);\n    digitalWrite(8, LOW);   delay(200);\n  } else {\n    digitalWrite(8, LOW);\n    delay(200);\n  }\n}',
};

// Compile an Arduino sketch to AVR hex via Wokwi's free build service (the
// real arduino-cli toolchain). Runs once per sketch at seed time, so learners'
// browsers only ever load the finished hex — no runtime compile dependency.
async function compileHex(sketch) {
  const res = await fetch("https://hexi.wokwi.com/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sketch }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.hex) {
    throw new Error(
      "Arduino sketch failed to compile via hexi.wokwi.com:\n" +
        (data.stderr || data.stdout || `HTTP ${res.status}`),
    );
  }
  return data.hex;
}

// Compiled lazily (only when an Arduino track is asked for) and once per
// process, however many classes seed the Arduino track.
let hexPromise;
function compiledHex() {
  if (!hexPromise) {
    console.log("Compiling Programmable Electronics Arduino sketches via hexi.wokwi.com…");
    hexPromise = Promise.all(
      Object.entries(SKETCH).map(async ([name, src]) => [name, await compileHex(src)]),
    ).then(Object.fromEntries);
  }
  return hexPromise;
}

// One small project module per entry: one project, its own badge, its own
// checkpoints. `board` defaults to arduino.
const projects = (HEX) => [
  {
    topic: ELECTRONICS,
    title: "First Blink",
    summary: "Take control of the Arduino's on-board LED — your first code that touches hardware.",
    badgeName: "First Spark",
    badgeIcon: "⚡",
    badgeDescription: "Programmed real hardware for the first time: uploaded a sketch and controlled the Arduino's on-board LED.",
    blocks: [
      block("heading", { text: "Code you can touch" }),
      block("text", {
        kind: "learn",
        minutes: 2,
        text: "So far your code lived on a screen. Today it controls electricity.\n\nAn Arduino is a tiny computer the size of a cracker. It reads INPUTS (buttons, sensors) and switches OUTPUTS (LEDs, motors, buzzers). Your microwave, a game controller, a traffic light — inside, they all work exactly like what you build today.",
        tip: "No Arduino at your station? The in-page simulator (and wokwi.com) behaves exactly like the real thing — every step works there too.",
      }),
      block("heading", { text: "Safety first — every single time" }),
      block("text", {
        kind: "learn",
        minutes: 2,
        text: "Three rules, no exceptions:\n\n⚡ Wire with the power OFF (USB unplugged). Plug in only after you've checked the circuit.\n\n➕ Check POLARITY: electricity flows + to −. An LED's LONG leg is + (positive); the short leg goes to ground (GND).\n\n🚧 LEDs always get a resistor (220 Ω — red-red-brown stripes). It's a speed bump for electricity; without it, the LED burns out.",
        warn: "Read the diagram YOURSELF — the person who wires the circuit is the person who learns.",
      }),
      block("heading", { text: "First blink (no wiring needed)" }),
      block("text", {
        kind: "build",
        minutes: 8,
        text: "The Arduino has a tiny LED built into the board, wired to pin 13. Take control of it:",
        actions: [
          "Open the Arduino IDE (arduino.cc/en/software) — or your Wokwi project",
          "Plug in via USB · Tools → Board 'Arduino Uno' · Tools → Port → the USB one",
          "Type the sketch on the next card, then click Upload (the → arrow) — in Wokwi, press green Play",
          "Watch the little LED marked 'L' blink once per second",
        ],
        tip: "That blink means the board is running YOUR instructions. You are now programming hardware.",
      }),
      block("code", {
        kind: "learn",
        text: SKETCH.blink13,
        tip: "This is the exact sketch the simulator below runs — read it over before you press ▶.",
      }),
      block("text", {
        kind: "build",
        minutes: 5,
        text: "Now OWN it — change the numbers and re-upload:",
        actions: [
          "delay(100) → panic blink",
          "delay(2000) → lighthouse",
          "Make a heartbeat: two quick blinks, then a long pause (hint: four digitalWrite lines, four delays)",
        ],
        tip: "Notice: loop() runs forever — the same 'forever' loop from your game. delay(1000) is a variable you're tuning. Same ideas, new world.",
      }),
      block("heading", { text: "See it run RIGHT HERE" }),
      block("circuit", {
        kind: "build",
        minutes: 3,
        sketch: SKETCH.blink13,
        hex: HEX.blink13,
        text: "This is a real Arduino simulator running the exact sketch above. Press ▶ Run and watch the tiny 'L' LED near the middle of the board blink once per second — that's pin 13.",
        tip: "No board at your station? This simulator (and wokwi.com) behaves exactly like the real thing.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Blink photo",
        text: "Photo of the blinking LED — your real board's 'L' light, or a screenshot of the simulator running right here. Caption: which delay numbers you tried.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What did changing the delay numbers teach you about how the code runs?"),
    ],
    criteria: [
      photoCriterion(0, "Blink photo", "The on-board LED blinking — real board or the in-page simulator."),
      wrapUpCriterion(1, "Written reflection on running code on hardware for the first time."),
    ],
  },

  {
    topic: ELECTRONICS,
    title: "Wire a Real LED",
    summary: "Bring the blink off the board: breadboard, resistor, polarity — and the debugging hunt every engineer runs.",
    badgeName: "Circuit Builder",
    badgeIcon: "💡",
    badgeDescription: "Wired a working LED circuit on a breadboard with correct polarity and a resistor, and debugged it hands-on.",
    blocks: [
      block("heading", { text: "Wire a REAL LED" }),
      block("circuit", {
        kind: "build",
        minutes: 12,
        parts: [
          { id: "led1", kind: "led", pin: 8, color: "red", label: "LED", at: "10a", catAt: "12a" },
          { id: "r1", kind: "resistor", at: "5b", toAt: "10b", label: "220 Ω" },
        ],
        wires: [
          { id: "w-sig", from: "8", to: "5a", color: "#f59e0b" },
          { id: "w-gnd", from: "GND.1", to: "12b", color: "#1f2937" },
        ],
        steps: [
          { text: "UNPLUG the USB first — always wire with the power off", add: [] },
          { text: "LED into the breadboard: long leg row 10, short leg row 12", add: ["led1"] },
          { text: "Resistor (220 Ω): one end row 10 (with the long leg), other end row 5", add: ["r1"] },
          { text: "Jumper from Arduino pin 8 → row 5", add: ["w-sig"] },
          { text: "Jumper from Arduino GND → row 12", add: ["w-gnd"] },
          { text: "In your sketch change BOTH 13s to 8 · plug in · upload", add: [] },
        ],
        sketch: SKETCH.blink8,
        hex: HEX.blink8,
        text: "Bring the blink off the board. Tap through the checklist to wire the circuit on screen — the same moves, in the same order, you'll make on the real breadboard. When it's complete, press ▶ Run. If your real build doesn't match this, jump to the debugging hunt below.",
        tip: "Breadboard secret: the 5 holes in each numbered row are connected inside — two parts in the same row are wired together. The path is a circle: pin 8 → resistor → long leg → LED → short leg → GND.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Working circuit photo",
        text: "Photo of your circuit with the LED lit or mid-blink — wiring visible. Simulator screenshots count! Caption: which pin you used.",
      }),
      block("heading", { text: "When it doesn't work (and it won't)" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "Circuits fail in honest ways. When yours does, DON'T shotgun random changes — run the hunt in order, one check at a time:",
        actions: [
          "Power: is the board's ON light lit?",
          "Polarity: long leg on the resistor side? (Backwards LED = nothing, forever)",
          "Rows: are the parts REALLY in the rows you think? Count the holes",
          "Code: does the pin number in the sketch match the pin the wire is in?",
          "The part: swap in a different LED — parts do die",
        ],
        tip: "That patient hunt is the actual skill. Engineers call it debugging — it's most of the job.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: debugging story",
        text: "Press record and tell today's debugging story: what didn't work, and how you tracked it down step by step? (Nothing broke? Then explain which of the five checks you'd run first and why.)",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Include the moment something finally worked — what fixed it?"),
    ],
    criteria: [
      photoCriterion(0, "Working circuit photo", "A powered, working LED circuit (external LED, wired with resistor) — real or simulated."),
      audioCriterion(1, "Voice note: debugging story", "A debugging story: what failed and the step-by-step hunt that found it."),
      wrapUpCriterion(2, "Written reflection on building and debugging the circuit."),
    ],
  },

  {
    topic: ELECTRONICS,
    title: "Push-Button Light",
    summary: "Read the world: a push button controls your LED — sense, decide, act.",
    badgeName: "Input Master",
    badgeIcon: "🔘",
    badgeDescription: "Read a real-world input with digitalRead and used it to control an output — the sense → decide → act loop.",
    blocks: [
      block("heading", { text: "Inputs: wire a push button" }),
      block("circuit", {
        kind: "build",
        minutes: 10,
        parts: [
          { id: "led1", kind: "led", pin: 8, color: "red", label: "LED", at: "10a", catAt: "12a" },
          { id: "r1", kind: "resistor", at: "5b", toAt: "10b", label: "220 Ω" },
          { id: "btn1", kind: "pushbutton", pin: 2, label: "Button", cols: [20, 22] },
        ],
        wires: [
          { id: "w-sig8", from: "8", to: "5a", color: "#f59e0b" },
          { id: "w-gnd-led", from: "GND.1", to: "12b", color: "#1f2937" },
          { id: "w-sig2", from: "2", to: "20a", color: "#3b82f6" },
          { id: "w-gnd-btn", from: "GND.1", to: "22j", color: "#1f2937" },
        ],
        steps: [
          { text: "Unplug the USB before touching any wires", add: [] },
          { text: "Your LED circuit stays exactly as it was — pin 8, resistor, GND", add: ["led1", "r1", "w-sig8", "w-gnd-led"] },
          { text: "Push the button across the center gap — legs in rows 20 and 22", add: ["btn1"] },
          { text: "Jumper from Arduino pin 2 → row 20", add: ["w-sig2"] },
          { text: "Jumper from GND → row 22 (bottom half of the board)", add: ["w-gnd-btn"] },
          { text: "Wiring done — plug back in. The code that reads it comes next", add: [] },
        ],
        sketch: SKETCH.button,
        hex: HEX.button,
        text: "Time for the other half: INPUT. Hardware first, code second — wire the button step by step, the same moves you'll make on the real breadboard. Then press ▶ Run to check the circuit: click and HOLD the button: light. Let go: dark.",
      }),
      block("heading", { text: "Now the code that reads it" }),
      block("code", {
        kind: "build",
        minutes: 5,
        text: SKETCH.button,
        actions: [
          "Type this sketch into your IDE (or your Wokwi project)",
          "Upload it to your wired-up board",
          "Hold the button — light. Let go — dark",
        ],
        tip: "digitalRead(2) checks your finger 16 million times a second. INPUT_PULLUP keeps the pin HIGH until the button connects it to GND — that's why PRESSED reads LOW.",
      }),
      block("text", {
        kind: "learn",
        minutes: 2,
        text: "Hold the button: light. Release: dark. You've built the complete loop every smart device runs: sense → decide → act.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Working button photo",
        text: "Photo of your button build working — real or simulated, code visible if you can. Caption: what happens when you hold the button.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Explain in your own words why LOW means PRESSED with INPUT_PULLUP."),
    ],
    criteria: [
      photoCriterion(0, "Working button photo", "The push-button circuit controlling the LED — real or simulated."),
      wrapUpCriterion(1, "Written reflection on reading inputs."),
    ],
  },

  {
    topic: ELECTRONICS,
    title: "Traffic Light",
    summary: "Three LEDs, one sequence: green, yellow, red — forever.",
    badgeName: "Traffic Controller",
    badgeIcon: "🚦",
    badgeDescription: "Sequenced multiple outputs with digitalWrite and delay to run a real traffic-light cycle.",
    blocks: [
      block("heading", { text: "🚦 Build the full circuit" }),
      block("text", {
        kind: "build",
        minutes: 3,
        text: "Red, yellow, green LEDs on pins 8, 9, 10 — each with its own resistor and its own GND jumper. The sketch sequences them: green 5 s → yellow 2 s → red 5 s, forever.",
        tip: "It's the LED circuit you already know, three times over. Build one color at a time and test as you go.",
      }),
      block("circuit", {
        kind: "create",
        minutes: 6,
        parts: [
          { id: "led-r", kind: "led", pin: 8, color: "red", label: "red", at: "6a", catAt: "8a" },
          { id: "r-r", kind: "resistor", at: "3b", toAt: "6b" },
          { id: "led-y", kind: "led", pin: 9, color: "yellow", label: "yellow", at: "15a", catAt: "17a" },
          { id: "r-y", kind: "resistor", at: "12b", toAt: "15b" },
          { id: "led-g", kind: "led", pin: 10, color: "green", label: "green", at: "24a", catAt: "26a" },
          { id: "r-g", kind: "resistor", at: "21b", toAt: "24b" },
        ],
        wires: [
          { id: "w-r-sig", from: "8", to: "3a", color: "#ef4444" },
          { id: "w-r-gnd", from: "GND.1", to: "8b", color: "#1f2937" },
          { id: "w-y-sig", from: "9", to: "12a", color: "#eab308" },
          { id: "w-y-gnd", from: "GND.1", to: "17b", color: "#1f2937" },
          { id: "w-g-sig", from: "10", to: "21a", color: "#22c55e" },
          { id: "w-g-gnd", from: "GND.1", to: "26b", color: "#1f2937" },
        ],
        steps: [
          { text: "RED light: LED long leg row 6, short leg row 8 · resistor row 6 → row 3", add: ["led-r", "r-r"] },
          { text: "Wire red: pin 8 → row 3 · GND → row 8", add: ["w-r-sig", "w-r-gnd"] },
          { text: "YELLOW light: LED long leg row 15, short leg row 17 · resistor row 15 → row 12", add: ["led-y", "r-y"] },
          { text: "Wire yellow: pin 9 → row 12 · GND → row 17", add: ["w-y-sig", "w-y-gnd"] },
          { text: "GREEN light: LED long leg row 24, short leg row 26 · resistor row 24 → row 21", add: ["led-g", "r-g"] },
          { text: "Wire green: pin 10 → row 21 · GND → row 26", add: ["w-g-sig", "w-g-gnd"] },
        ],
        sketch: SKETCH.traffic,
        hex: HEX.traffic,
        text: "Three LED circuits side by side — same recipe, three times. Build it, then ▶ Run: green 5 s → yellow 2 s → red 5 s, forever.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Traffic light photo",
        text: "Photo of your traffic light mid-cycle — real or simulated. Caption: which color was lit when you snapped it.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("How would you add a flashing-yellow night mode?"),
    ],
    criteria: [
      photoCriterion(0, "Traffic light photo", "The three-LED traffic light running its sequence — real or simulated."),
      wrapUpCriterion(1, "Written reflection on sequencing outputs."),
    ],
  },

  {
    topic: ELECTRONICS,
    title: "Temperature Logger",
    summary: "A TMP36 sensor + the Serial Monitor: watch live temperature data stream from your code.",
    badgeName: "Data Logger",
    badgeIcon: "🌡️",
    badgeDescription: "Read an analog sensor, converted raw readings to real units, and streamed live data over Serial.",
    blocks: [
      block("heading", { text: "🌡️ Be the experiment" }),
      block("text", {
        kind: "build",
        minutes: 3,
        text: "TMP36 temperature sensor: flat side facing you, legs = 5V, A0, GND. Read it with analogRead(A0), convert to degrees, print with Serial.println(), and watch live in Tools → Serial Monitor.",
        tip: "Pinch the sensor between your fingers and watch the number rise — you're the experiment!",
      }),
      block("circuit", {
        kind: "create",
        minutes: 5,
        parts: [{ id: "tmp1", kind: "tmp36", label: "TMP36 — A0", at: "15a" }],
        wires: [
          { id: "w-5v", from: "5V", to: "14e", color: "#ef4444" },
          { id: "w-a0", from: "A0", to: "15e", color: "#a855f7" },
          { id: "w-gnd", from: "GND.2", to: "16e", color: "#1f2937" },
        ],
        steps: [
          { text: "TMP36 into the breadboard, flat side facing you — legs in rows 14, 15, 16", add: ["tmp1"] },
          { text: "Left leg is power: 5V → row 14", add: ["w-5v"] },
          { text: "Middle leg is the signal: A0 → row 15", add: ["w-a0"] },
          { text: "Right leg is ground: GND → row 16", add: ["w-gnd"] },
        ],
        sketch: SKETCH.tmp36,
        hex: HEX.tmp36,
        text: "Wire the sensor, press ▶ Run, then drag the temperature slider — that's you pinching the sensor. The Serial Monitor shows exactly what you'll see in Tools → Serial Monitor on the real thing.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Sensor build photo",
        text: "Photo of your sensor build with the Serial Monitor showing readings — real or simulated. Caption: the temperature it read.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What was the highest temperature you measured, and how did you make it climb?"),
    ],
    criteria: [
      photoCriterion(0, "Sensor build photo", "The TMP36 circuit streaming readings to the Serial Monitor — real or simulated."),
      wrapUpCriterion(1, "Written reflection on reading sensor data."),
    ],
  },

  {
    topic: ELECTRONICS,
    title: "Police Flasher",
    summary: "Two LEDs taking turns at 150 ms — patterns and timing.",
    badgeName: "Flash Master",
    badgeIcon: "🚨",
    badgeDescription: "Built an alternating two-LED flasher and tuned its timing pattern.",
    blocks: [
      block("heading", { text: "🚨 Red, blue, red, blue" }),
      block("circuit", {
        kind: "create",
        minutes: 8,
        parts: [
          { id: "led-r", kind: "led", pin: 8, color: "red", label: "red", at: "6a", catAt: "8a" },
          { id: "r-r", kind: "resistor", at: "3b", toAt: "6b" },
          { id: "led-b", kind: "led", pin: 9, color: "blue", label: "blue", at: "15a", catAt: "17a" },
          { id: "r-b", kind: "resistor", at: "12b", toAt: "15b" },
        ],
        wires: [
          { id: "w-r-sig", from: "8", to: "3a", color: "#ef4444" },
          { id: "w-r-gnd", from: "GND.1", to: "8b", color: "#1f2937" },
          { id: "w-b-sig", from: "9", to: "12a", color: "#3b82f6" },
          { id: "w-b-gnd", from: "GND.1", to: "17b", color: "#1f2937" },
        ],
        steps: [
          { text: "RED LED: long leg row 6, short leg row 8 · resistor row 6 → row 3", add: ["led-r", "r-r"] },
          { text: "Wire red: pin 8 → row 3 · GND → row 8", add: ["w-r-sig", "w-r-gnd"] },
          { text: "BLUE LED: long leg row 15, short leg row 17 · resistor row 15 → row 12", add: ["led-b", "r-b"] },
          { text: "Wire blue: pin 9 → row 12 · GND → row 17", add: ["w-b-sig", "w-b-gnd"] },
        ],
        sketch: SKETCH.police,
        hex: HEX.police,
        text: "Red, blue, red, blue — each LED gets 150 ms. Challenge for your real build: make it strobe (two quick red flashes, then two quick blue). Hint: four digitalWrite pairs.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Flasher photo",
        text: "Photo of your flasher mid-flash — real or simulated. Caption: your delay numbers.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What pattern did you invent when you changed the delays?"),
    ],
    criteria: [
      photoCriterion(0, "Flasher photo", "The alternating two-LED flasher running — real or simulated."),
      wrapUpCriterion(1, "Written reflection on timing patterns."),
    ],
  },

  {
    topic: ELECTRONICS,
    title: "Toggle Flashlight",
    summary: "Press on, press off — one variable that remembers. That's state.",
    badgeName: "Switch Wizard",
    badgeIcon: "🔦",
    badgeDescription: "Used a state variable to turn a momentary button into a real on/off switch.",
    blocks: [
      block("heading", { text: "🔦 Same wiring, brand-new brain" }),
      block("circuit", {
        kind: "create",
        minutes: 8,
        parts: [
          { id: "led1", kind: "led", pin: 8, color: "red", label: "LED", at: "10a", catAt: "12a" },
          { id: "r1", kind: "resistor", at: "5b", toAt: "10b", label: "220 Ω" },
          { id: "btn1", kind: "pushbutton", pin: 2, label: "Button", cols: [20, 22] },
        ],
        wires: [
          { id: "w-sig8", from: "8", to: "5a", color: "#f59e0b" },
          { id: "w-gnd-led", from: "GND.1", to: "12b", color: "#1f2937" },
          { id: "w-sig2", from: "2", to: "20a", color: "#3b82f6" },
          { id: "w-gnd-btn", from: "GND.1", to: "22j", color: "#1f2937" },
        ],
        steps: [
          { text: "The LED circuit you know by heart: LED rows 10/12, resistor to row 5, pin 8 → row 5, GND → row 12", add: ["led1", "r1", "w-sig8", "w-gnd-led"] },
          { text: "Button across the gap at rows 20/22 · pin 2 → row 20 · GND → row 22 (bottom half)", add: ["btn1", "w-sig2", "w-gnd-btn"] },
        ],
        sketch: SKETCH.toggle,
        hex: HEX.toggle,
        text: "Same wiring as the push-button project — completely different behavior. Click the button once: light stays ON. Click again: off. The magic is one variable that remembers. That's how every light switch, TV remote, and power button works.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Flashlight photo",
        text: "Photo of your toggle flashlight ON with your finger OFF the button — that's the proof it remembers. Real or simulated.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Explain lightOn = !lightOn to a friend who's never coded."),
    ],
    criteria: [
      photoCriterion(0, "Flashlight photo", "The toggle flashlight holding its state — LED on with the button released."),
      wrapUpCriterion(1, "Written reflection on state and memory."),
    ],
  },

  {
    topic: ELECTRONICS,
    title: "Heat Alarm",
    summary: "Sensor + LED + a decision: flash the alarm when it gets too hot.",
    badgeName: "Alarm Engineer",
    badgeIcon: "🔥",
    badgeDescription: "Combined an analog sensor with an output and a threshold decision — a complete sense → decide → act device.",
    blocks: [
      block("heading", { text: "🔥 Sense → decide → act" }),
      block("circuit", {
        kind: "create",
        minutes: 8,
        parts: [
          { id: "tmp1", kind: "tmp36", label: "TMP36 — A0", at: "15a" },
          { id: "led1", kind: "led", pin: 8, color: "red", label: "alarm", at: "22a", catAt: "24a" },
          { id: "r1", kind: "resistor", at: "19b", toAt: "22b" },
        ],
        wires: [
          { id: "w-5v", from: "5V", to: "14e", color: "#ef4444" },
          { id: "w-a0", from: "A0", to: "15e", color: "#a855f7" },
          { id: "w-gnd-t", from: "GND.2", to: "16e", color: "#1f2937" },
          { id: "w-sig", from: "8", to: "19a", color: "#f59e0b" },
          { id: "w-gnd-led", from: "GND.1", to: "24b", color: "#1f2937" },
        ],
        steps: [
          { text: "TMP36 into the breadboard, flat side facing you — legs in rows 14, 15, 16", add: ["tmp1"] },
          { text: "Sensor wires: 5V → row 14 · A0 → row 15 · GND → row 16", add: ["w-5v", "w-a0", "w-gnd-t"] },
          { text: "Alarm LED: long leg row 22, short leg row 24 · resistor row 22 → row 19", add: ["led1", "r1"] },
          { text: "Wire the alarm: pin 8 → row 19 · GND → row 24", add: ["w-sig", "w-gnd-led"] },
        ],
        sketch: SKETCH.heatalarm,
        hex: HEX.heatalarm,
        text: "Run it, then drag the slider past 30°C — the alarm LED starts flashing. Under 30, silence. This is a real thermostat, a fire alarm, a fever thermometer: sense → decide → act. Challenge: change the danger line to 35.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Heat alarm photo",
        text: "Photo of your alarm FLASHING with the temperature reading visible — real or simulated. Caption: your danger threshold.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What other alarms could this same sense → decide → act loop build?"),
    ],
    criteria: [
      photoCriterion(0, "Heat alarm photo", "The heat alarm triggering above the threshold — real or simulated."),
      wrapUpCriterion(1, "Written reflection on thresholds and decisions."),
    ],
  },

  // ==========================================================================
  // MODULE 3, micro:bit track — same eight-project spine as e1–e8, adapted to
  // what the micro:bit does well: an onboard 5×5 LED matrix, buttons A/B, and
  // a temperature sensor mean several projects need no external wiring at
  // all. `microbit` blocks run on an in-page simulator (components/MicrobitSim
  // .tsx) — same "one fixed, authored program per block" model as the Arduino
  // circuit blocks above, just without a CPU to emulate. Real code-writing
  // happens externally at makecode.microbit.org or a real board, named in the
  // instructions the same way the Arduino IDE and wokwi.com are named above.
  // Titles are deliberately distinct from e1–e8's (moduleWriter upserts by
  // title, so a same-named module would silently merge with the Arduino one).
  // ==========================================================================

  {
    topic: ELECTRONICS,
    board: "microbit",
    title: "First Flash",
    summary: "Take control of the micro:bit's 5×5 LED matrix — your first code that touches hardware.",
    badgeName: "First Spark",
    badgeIcon: "🔆",
    badgeDescription: "Programmed real hardware for the first time: built a MakeCode program and lit the on-board LED matrix.",
    blocks: [
      block("heading", { text: "Code you can touch" }),
      block("text", {
        kind: "learn",
        minutes: 2,
        text: "So far your code lived on a screen. Today it controls electricity.\n\nA micro:bit is a tiny computer the size of a matchbox. It reads INPUTS (buttons, sensors) and switches OUTPUTS (LEDs, sound, radio). Your microwave, a game controller, a traffic light — inside, they all work exactly like what you build today. And the micro:bit already has an OUTPUT built right in: a 5×5 grid of LEDs.",
        tip: "No micro:bit at your station? The in-page simulator (and makecode.microbit.org) behaves exactly like the real thing — every step works there too.",
      }),
      block("heading", { text: "First flash (no wiring needed)" }),
      block("text", {
        kind: "build",
        minutes: 8,
        text: "Take control of one LED in the built-in grid:",
        actions: [
          "Open makecode.microbit.org — or your own micro:bit editor",
          "From the Basic drawer: forever → show leds (light the center dot) → pause 1000 → clear screen → pause 1000",
          "Click ▶ in MakeCode's simulator, or flash it to a real board",
          "Or skip straight to the simulator below — it's running that exact program",
        ],
        tip: "That blink means the board is running YOUR instructions. You are now programming hardware.",
      }),
      block("code", {
        kind: "learn",
        text: "basic.forever(function () {\n    basic.showLeds(`\n        . . . . .\n        . . . . .\n        . # . . .\n        . . . . .\n        . . . . .\n        `)\n    basic.pause(1000)\n    basic.clearScreen()\n    basic.pause(1000)\n})",
        tip: "This is the exact MakeCode JavaScript for the blink above — the block editor builds this same program. The simulator below runs it.",
      }),
      block("text", {
        kind: "build",
        minutes: 5,
        text: "Now OWN it — change the numbers and re-run:",
        actions: [
          "pause(100) → panic blink",
          "pause(2000) → lighthouse",
          "Make a heartbeat: two quick flashes, then a long pause (hint: an extra showLeds/pause pair)",
        ],
        tip: "Notice: 'forever' runs, well, forever — the same 'forever' loop from your game. pause(1000) is a variable you're tuning. Same ideas, new hardware.",
      }),
      block("heading", { text: "See it run RIGHT HERE" }),
      block("microbit", {
        kind: "build",
        minutes: 3,
        text: "This is a live micro:bit simulator running the exact program above. Press ▶ Run and watch the center LED blink once per second.",
        program: { kind: "matrix-blink", cells: [[2, 2]], onMs: 1000, offMs: 1000 },
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Flash photo",
        text: "Photo of the blinking LED — your real board's matrix, or a screenshot of the simulator running right here. Caption: which pause numbers you tried.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What did changing the pause numbers teach you about how the code runs?"),
    ],
    criteria: [
      photoCriterion(0, "Flash photo", "The on-board LED matrix flashing — real board or the in-page simulator."),
      wrapUpCriterion(1, "Written reflection on running code on hardware for the first time."),
    ],
  },

  {
    topic: ELECTRONICS,
    board: "microbit",
    title: "Light It Up",
    summary: "Bring the flash off the matrix: edge connector, resistor, polarity — and the debugging hunt every engineer runs.",
    badgeName: "Circuit Builder",
    badgeIcon: "💡",
    badgeDescription: "Wired a working LED circuit to the micro:bit's edge connector with correct polarity and a resistor, and debugged it hands-on.",
    blocks: [
      block("heading", { text: "Wire a REAL LED" }),
      block("text", {
        kind: "build",
        minutes: 12,
        text: "Bring the flash off the built-in grid and onto a wired LED. Three crocodile clips, one resistor, one rule: current flows from a HIGH pin to GND, and an LED only lets it through one way.",
        actions: [
          "LED long leg (+, anode) → a 220 Ω resistor → crocodile clip → pin P0",
          "LED short leg (−, cathode) → crocodile clip → GND",
          "Double-check the clips aren't touching each other before you run any code",
          "Build the blink below, then press ▶ in the simulator to check the LOGIC — then try it on your real board",
        ],
        tip: "Edge-connector secret: the big pads (P0, P1, P2, 3V, GND) are made for crocodile clips — no breadboard needed for a simple on/off LED.",
      }),
      block("code", {
        kind: "learn",
        text: "basic.forever(function () {\n    pins.digitalWritePin(DigitalPin.P0, 1)\n    basic.pause(1000)\n    pins.digitalWritePin(DigitalPin.P0, 0)\n    basic.pause(1000)\n})",
        tip: "The exact MakeCode program for the P0 blink — this is what the wiring diagram below is running.",
      }),
      block("microbit", {
        kind: "build",
        minutes: 10,
        text: "Tap through the checklist to wire the circuit on screen — the same moves you'll make with real crocodile clips. When it's complete, press ▶ Run.",
        parts: [{ id: "led1", pin: "P0", color: "#ef4444", label: "LED" }],
        steps: [
          { text: "Unplug the USB first — always wire with the power off", add: [] },
          { text: "Clip the LED's long leg, through a 220 Ω resistor, to pin P0", add: ["led1"] },
          { text: "Clip the LED's short leg to GND", add: [] },
          { text: "Wiring done — plug back in and run it", add: [] },
        ],
        program: { kind: "pin-blink", pin: "P0", onMs: 1000, offMs: 1000 },
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Working circuit photo",
        text: "Photo of your circuit with the LED lit or mid-blink — wiring visible. Simulator screenshots count! Caption: which pin you used.",
      }),
      block("heading", { text: "When it doesn't work (and it won't)" }),
      block("text", {
        kind: "learn",
        minutes: 4,
        text: "Circuits fail in honest ways. When yours does, DON'T shotgun random changes — run the hunt in order, one check at a time:",
        actions: [
          "Power: is the board plugged in and the code actually running?",
          "Polarity: long leg toward the resistor/pin side? (Backwards LED = nothing, forever)",
          "Contact: is each crocodile clip really biting metal, not just plastic insulation?",
          "Code: does the pin number in your program match the pin the clip is actually on?",
          "The part: swap in a different LED — parts do die",
        ],
        tip: "That patient hunt is the actual skill. Engineers call it debugging — it's most of the job.",
      }),
      block("checkpoint", {
        capture: "audio",
        criterionLabel: "Voice note: debugging story",
        text: "Press record and tell today's debugging story: what didn't work, and how you tracked it down step by step? (Nothing broke? Then explain which of the five checks you'd run first and why.)",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Include the moment something finally worked — what fixed it?"),
    ],
    criteria: [
      photoCriterion(0, "Working circuit photo", "A powered, working LED circuit wired to the edge connector — real or simulated."),
      audioCriterion(1, "Voice note: debugging story", "A debugging story: what failed and the step-by-step hunt that found it."),
      wrapUpCriterion(2, "Written reflection on building and debugging the circuit."),
    ],
  },

  {
    topic: ELECTRONICS,
    board: "microbit",
    title: "Press A to Light",
    summary: "Read the world with the built-in button: press A controls the LED grid — sense, decide, act.",
    badgeName: "Input Master",
    badgeIcon: "👆",
    badgeDescription: "Read a real-world input with a button-A poll and used it to control an output — the sense → decide → act loop, with zero wiring.",
    blocks: [
      block("heading", { text: "Inputs: the button that's already there" }),
      block("text", {
        kind: "build",
        minutes: 8,
        text: "No wiring today — the micro:bit has two buttons built in. You'll read button A continuously and light the grid for exactly as long as it's held down.",
        actions: [
          "On makecode.microbit.org (or a real micro:bit): forever → if button A is pressed → show leds, else → clear screen",
          "Press ▶ in MakeCode's simulator, or flash it to a real board",
          "Or skip straight to the simulator below — click and HOLD button A: light. Let go: dark",
        ],
        tip: "'button is pressed' checks your finger continuously, the same way digitalRead does on other boards — no wiring needed because the button is already soldered to the chip.",
      }),
      block("code", {
        kind: "learn",
        text: "basic.forever(function () {\n    if (input.buttonIsPressed(Button.A)) {\n        basic.showLeds(`\n            . . . . .\n            . . . . .\n            . # . . .\n            . . . . .\n            . . . . .\n            `)\n    } else {\n        basic.clearScreen()\n    }\n})",
        tip: "The exact MakeCode program for reading button A — the simulator below runs it.",
      }),
      block("microbit", {
        kind: "build",
        minutes: 5,
        text: "This is a live micro:bit simulator running the logic above. Press ▶ Run, then click and HOLD button A to test it.",
        program: { kind: "button-hold-matrix", button: "A", cells: [[2, 2]] },
      }),
      block("text", {
        kind: "learn",
        minutes: 2,
        text: "Hold the button: light. Release: dark. You've built the complete loop every smart device runs: sense → decide → act — and this time, zero crocodile clips.",
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Working button photo",
        text: "Photo of your button build working — real or simulated. Caption: what happens when you hold button A.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Explain in your own words why we check the button inside a forever loop instead of just once."),
    ],
    criteria: [
      photoCriterion(0, "Working button photo", "Button A controlling the LED grid — real or simulated."),
      wrapUpCriterion(1, "Written reflection on reading inputs."),
    ],
  },

  {
    topic: ELECTRONICS,
    board: "microbit",
    title: "Traffic Light, Wired",
    summary: "Three LEDs, one sequence: green, yellow, red — forever, wired to the edge connector.",
    badgeName: "Traffic Controller",
    badgeIcon: "🚦",
    badgeDescription: "Sequenced multiple outputs with digital-write-pin and pause to run a real traffic-light cycle.",
    blocks: [
      block("heading", { text: "🚦 Build the full circuit" }),
      block("text", {
        kind: "build",
        minutes: 6,
        text: "Red, yellow, green LEDs on P0, P1, P2 — each with its own resistor and its own GND clip. The program sequences them: green 5 s → yellow 2 s → red 5 s, forever.",
        actions: [
          "Red LED: long leg → resistor → P0 · short leg → GND",
          "Yellow LED: long leg → resistor → P1 · short leg → GND",
          "Green LED: long leg → resistor → P2 · short leg → GND",
        ],
        tip: "It's the LED circuit you already know, three times over. Build one color at a time and test as you go.",
      }),
      block("code", {
        kind: "learn",
        text: "basic.forever(function () {\n    pins.digitalWritePin(DigitalPin.P2, 1) // green\n    basic.pause(5000)\n    pins.digitalWritePin(DigitalPin.P2, 0)\n    pins.digitalWritePin(DigitalPin.P1, 1) // yellow\n    basic.pause(2000)\n    pins.digitalWritePin(DigitalPin.P1, 0)\n    pins.digitalWritePin(DigitalPin.P0, 1) // red\n    basic.pause(5000)\n    pins.digitalWritePin(DigitalPin.P0, 0)\n})",
        tip: "The exact MakeCode program for the traffic-light sequence — this is what the wiring diagram below is running.",
      }),
      block("microbit", {
        kind: "create",
        minutes: 6,
        text: "Tap through the wiring checklist, then press ▶ Run: green 5 s → yellow 2 s → red 5 s, forever.",
        parts: [
          { id: "led-r", pin: "P0", color: "#ef4444", label: "red" },
          { id: "led-y", pin: "P1", color: "#eab308", label: "yellow" },
          { id: "led-g", pin: "P2", color: "#22c55e", label: "green" },
        ],
        steps: [
          { text: "RED LED: long leg through a resistor to P0 · short leg to GND", add: ["led-r"] },
          { text: "YELLOW LED: long leg through a resistor to P1 · short leg to GND", add: ["led-y"] },
          { text: "GREEN LED: long leg through a resistor to P2 · short leg to GND", add: ["led-g"] },
        ],
        program: {
          kind: "pin-cycle",
          steps: [
            { pin: "P2", ms: 5000 },
            { pin: "P1", ms: 2000 },
            { pin: "P0", ms: 5000 },
          ],
        },
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Traffic light photo",
        text: "Photo of your traffic light mid-cycle — real or simulated. Caption: which color was lit when you snapped it.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("How would you add a flashing-yellow night mode?"),
    ],
    criteria: [
      photoCriterion(0, "Traffic light photo", "The three-LED traffic light running its sequence — real or simulated."),
      wrapUpCriterion(1, "Written reflection on sequencing outputs."),
    ],
  },

  {
    topic: ELECTRONICS,
    board: "microbit",
    title: "Built-In Thermometer",
    summary: "The micro:bit's onboard temperature sensor + the MakeCode console: watch live data stream from your code, no wiring.",
    badgeName: "Data Logger",
    badgeIcon: "🌡️",
    badgeDescription: "Read the onboard temperature sensor, streamed live data over serial, and read it on a live-plotted graph.",
    blocks: [
      block("heading", { text: "🌡️ Be the experiment" }),
      block("text", {
        kind: "build",
        minutes: 5,
        text: "No sensor to wire this time — the micro:bit has a temperature sensor built into its chip. Read it with input.temperature(), stream it with serial.writeValue(), and watch it live in the Console.",
        actions: [
          'On makecode.microbit.org (or a real micro:bit): forever → serial write value "Temp" = temperature (°C) → pause 500',
          "Press ▶ in MakeCode's simulator and open its Console tab, or flash it to a real board",
          "Or skip straight to the simulator below — drag its temperature slider to test",
        ],
        tip: "Cup your hand around the real board (or, in the simulator, drag the temperature slider) and watch the number rise — you're the experiment!",
      }),
      block("code", {
        kind: "learn",
        text: 'basic.forever(function () {\n    serial.writeValue("Temp", input.temperature())\n    basic.pause(500)\n})',
        tip: "The exact MakeCode program for logging the temperature — the simulator below runs it.",
      }),
      block("microbit", {
        kind: "create",
        minutes: 5,
        text: "Press ▶ Run, then drag the temperature slider — that's you cupping the sensor. The readout below is exactly what you'll see in MakeCode's Console tab from a real board.",
        program: { kind: "temperature-log" },
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Sensor build photo",
        text: "Photo of your program with the Console graph showing readings — real or simulated. Caption: the temperature it read.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What was the highest temperature you measured, and how did you make it climb?"),
    ],
    criteria: [
      photoCriterion(0, "Sensor build photo", "The onboard sensor streaming readings to the Console — real or simulated."),
      wrapUpCriterion(1, "Written reflection on reading sensor data."),
    ],
  },

  {
    topic: ELECTRONICS,
    board: "microbit",
    title: "Police Flasher, Wired",
    summary: "Two LEDs taking turns at 150 ms — patterns and timing, wired to the edge connector.",
    badgeName: "Flash Master",
    badgeIcon: "🚨",
    badgeDescription: "Built an alternating two-LED flasher on the edge connector and tuned its timing pattern.",
    blocks: [
      block("heading", { text: "🚨 Red, blue, red, blue" }),
      block("text", {
        kind: "create",
        minutes: 8,
        text: "Two LEDs, two pins: red on P0, blue on P1 — same wiring recipe as the traffic light, just two colors taking turns every 150 ms.",
        actions: [
          "Red LED: long leg → resistor → P0 · short leg → GND",
          "Blue LED: long leg → resistor → P1 · short leg → GND",
        ],
      }),
      block("code", {
        kind: "learn",
        text: "basic.forever(function () {\n    pins.digitalWritePin(DigitalPin.P0, 1)\n    pins.digitalWritePin(DigitalPin.P1, 0)\n    basic.pause(150)\n    pins.digitalWritePin(DigitalPin.P0, 0)\n    pins.digitalWritePin(DigitalPin.P1, 1)\n    basic.pause(150)\n})",
        tip: "The exact MakeCode program for the two-LED flasher — this is what the wiring diagram below is running.",
      }),
      block("microbit", {
        kind: "create",
        minutes: 6,
        text: "Tap through the wiring, then press ▶ Run: red, blue, red, blue, every 150 ms. Challenge for your real build: make it strobe (two quick red flashes, then two quick blue).",
        parts: [
          { id: "led-r", pin: "P0", color: "#ef4444", label: "red" },
          { id: "led-b", pin: "P1", color: "#3b82f6", label: "blue" },
        ],
        steps: [
          { text: "RED LED: long leg through a resistor to P0 · short leg to GND", add: ["led-r"] },
          { text: "BLUE LED: long leg through a resistor to P1 · short leg to GND", add: ["led-b"] },
        ],
        program: {
          kind: "pin-cycle",
          steps: [
            { pin: "P0", ms: 150 },
            { pin: "P1", ms: 150 },
          ],
        },
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Flasher photo",
        text: "Photo of your flasher mid-flash — real or simulated. Caption: your pause numbers.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What pattern did you invent when you changed the pauses?"),
    ],
    criteria: [
      photoCriterion(0, "Flasher photo", "The alternating two-LED flasher running — real or simulated."),
      wrapUpCriterion(1, "Written reflection on timing patterns."),
    ],
  },

  {
    topic: ELECTRONICS,
    board: "microbit",
    title: "Toggle Light",
    summary: "Press B once, LED stays on. Press again, off. One variable that remembers — that's state.",
    badgeName: "Switch Wizard",
    badgeIcon: "🔦",
    badgeDescription: "Used a state variable and a button-press event to turn a momentary press into a real on/off switch.",
    blocks: [
      block("heading", { text: "🔦 Same button, brand-new brain" }),
      block("text", {
        kind: "create",
        minutes: 8,
        text: "No wiring — button B is already there. This time we react to the EVENT of a press, not whether it's currently held, and remember the light's state in a variable.",
        actions: [
          "On makecode.microbit.org (or a real micro:bit): variable lightOn = false, then on button B pressed → flip lightOn → show leds or clear screen",
          "Press ▶ in MakeCode's simulator, or flash it to a real board",
          "Or skip straight to the simulator below — click button B to test",
        ],
        tip: "Click the button once: light stays ON. Click again: off. The magic is one variable that remembers — how every light switch, TV remote, and power button works.",
      }),
      block("code", {
        kind: "learn",
        text: "let lightOn = false\ninput.onButtonPressed(Button.B, function () {\n    lightOn = !lightOn\n    if (lightOn) {\n        basic.showLeds(`\n            . . . . .\n            . . . . .\n            . # . . .\n            . . . . .\n            . . . . .\n            `)\n    } else {\n        basic.clearScreen()\n    }\n})",
        tip: "The exact MakeCode program for the toggle switch — the simulator below runs it.",
      }),
      block("microbit", {
        kind: "create",
        minutes: 6,
        text: "Press ▶ Run, then click button B: on, off, on, off. Notice we didn't need any debounce delay here — 'on button pressed' already fires exactly once per press.",
        program: { kind: "button-toggle-matrix", button: "B", cells: [[2, 2]] },
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Toggle light photo",
        text: "Photo of your toggle light ON with your finger OFF the button — that's the proof it remembers. Real or simulated.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("Explain lightOn = !lightOn to a friend who's never coded."),
    ],
    criteria: [
      photoCriterion(0, "Toggle light photo", "The toggle light holding its state — LED on with the button released."),
      wrapUpCriterion(1, "Written reflection on state and memory."),
    ],
  },

  {
    topic: ELECTRONICS,
    board: "microbit",
    title: "Onboard Heat Alarm",
    summary: "Onboard sensor + LED grid + a decision: flash the alarm when it gets too hot, no wiring.",
    badgeName: "Alarm Engineer",
    badgeIcon: "🔥",
    badgeDescription: "Combined the onboard temperature sensor with an output and a threshold decision — a complete sense → decide → act device.",
    blocks: [
      block("heading", { text: "🔥 Sense → decide → act" }),
      block("text", {
        kind: "create",
        minutes: 8,
        text: "Same sensor as the thermometer project, but this time it DECIDES: above 30°C, flash the whole grid as an alarm. Under 30, silence.",
        actions: [
          "Read input.temperature() every loop, log it with serial.writeValue like before",
          "If the reading is above 30: flash the full grid on/off every 200 ms",
          "Otherwise: keep the grid clear",
        ],
        tip: "Heads up: the onboard sensor reads the chip's own temperature, which runs a little warmer than the room — that's fine, we only care about the CHANGE when you cup your hand around the board (or drag the simulator's slider).",
      }),
      block("code", {
        kind: "learn",
        text: 'basic.forever(function () {\n    let tempC = input.temperature()\n    serial.writeValue("Temp", tempC)\n    if (tempC > 30) {\n        basic.showLeds(`\n            # # # # #\n            # # # # #\n            # # # # #\n            # # # # #\n            # # # # #\n            `)\n        basic.pause(200)\n        basic.clearScreen()\n        basic.pause(200)\n    } else {\n        basic.clearScreen()\n        basic.pause(200)\n    }\n})',
        tip: "The exact MakeCode program for the heat alarm — the simulator below runs it.",
      }),
      block("microbit", {
        kind: "create",
        minutes: 6,
        text: "Press ▶ Run, then drag the temperature slider past 30°C — the grid starts flashing. Challenge: change the danger line to 35.",
        program: { kind: "temperature-alarm", thresholdC: 30 },
      }),
      block("checkpoint", {
        capture: "photo",
        criterionLabel: "Heat alarm photo",
        text: "Photo of your alarm FLASHING with the temperature reading visible in the Console — real or simulated. Caption: your danger threshold.",
      }),
      block("heading", { text: "Reflect & share" }),
      wrapUpPrompt("What other alarms could this same sense → decide → act loop build?"),
    ],
    criteria: [
      photoCriterion(0, "Heat alarm photo", "The heat alarm triggering above the threshold — real or simulated."),
      wrapUpCriterion(1, "Written reflection on thresholds and decisions."),
    ],
  },
];

export async function electronicsModules({ boards = ["arduino", "microbit"], title = (t) => t } = {}) {
  const HEX = boards.includes("arduino") ? await compiledHex() : {};
  return projects(HEX)
    .map(({ board = "arduino", ...p }) => ({ ...p, board }))
    .filter((p) => boards.includes(p.board))
    .map(({ title: t, blocks, criteria, ...p }) => ({
      ...p,
      title: title(t),
      contentJson: JSON.stringify(blocks),
      criteria: { create: criteria },
    }));
}
