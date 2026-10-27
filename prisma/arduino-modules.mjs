// The Arduino track of Programmable Electronics: eight small projects (First
// Blink → Heat Alarm), each with real wiring, a real sketch, and an in-page
// simulator. Shared by IgniteHer (prisma/seed-igniteher.mjs) and KCSB Years
// 5–8 (prisma/seed-kcsb.mjs); seed-abaco.mjs still carries its own copy.
// `projectModule` writes one module (see the seeds); returns [e1 … e8].
// Titles are the upsert keys — keep them stable.
import { block, wrapUpPrompt, wrapUpCriterion, photoCriterion, audioCriterion } from "./seed-lib.mjs";

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

export async function createArduinoModules(projectModule) {
  // The exact sketches the tutorial teaches, compiled to hex once here so the
  // in-page simulator (circuit blocks) can run them instantly in the browser.
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
  console.log("Compiling Module 3 Arduino sketches via hexi.wokwi.com…");
  const HEX = Object.fromEntries(
    await Promise.all(
      Object.entries(SKETCH).map(async ([name, src]) => [name, await compileHex(src)]),
    ),
  );


  const ELECTRONICS = "Programmable Electronics";

  const e1 = await projectModule({
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
  });

  const e2 = await projectModule({
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
  });

  const e3 = await projectModule({
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
  });

  const e4 = await projectModule({
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
  });

  const e5 = await projectModule({
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
  });

  const e6 = await projectModule({
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
  });

  const e7 = await projectModule({
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
  });

  const e8 = await projectModule({
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
  });

  return [e1, e2, e3, e4, e5, e6, e7, e8];
}
