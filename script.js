const MAX_WATERINGS = 5;
const WATERING_COOLDOWN = 850;

const STAGE_THRESHOLDS = [0, 1, 3, 5];

const PLANT_NAMES = [
  "Sunbeam",
  "Honeydrop",
  "Marigold",
  "Buttercup"
];

const STAGE_LABELS = [
  "seed",
  "sprout",
  "small plant",
  "flower"
];

const STAGE_MESSAGES = [
  "A tiny seed... 💛",
  "A little sprout!",
  "It's growing!",
  "Look at her bloom! 🌼"
];

const gardenStage = document.getElementById("gardenStage");
const wateringCan = document.getElementById("wateringCan");
const plants = Array.from(document.querySelectorAll(".plant"));
const gardenMessage = document.getElementById("gardenMessage");
const celebrationLayer = document.getElementById("celebrationLayer");
const envelope = document.getElementById("envelope");
const letterModal = document.getElementById("letterModal");
const letterText = document.getElementById("letterText");
const closeLetter = document.getElementById("closeLetter");
const resetGarden = document.getElementById("resetGarden");

let progress = plants.map(() => 0);
let lastWateredAt = plants.map(() => 0);

let isDragging = false;
let activePointerId = null;
let grabOffsetX = 0;
let grabOffsetY = 0;
let hoveredPlant = -1;
let isGardenComplete = false;


/* ------------------------------
   LETTER
-------------------------------- */

const LETTER_TEXT = `Okay so… you know Yellow Flower Day and how you’re supposed to give yellow flowers to someone you love?

Well… obviously I had to get you some :3

And I know I think I did this last year too, but honestly… it feels really different this time.

Because last year, we were… us, but not this us, yk? And now I get to look at you and actually say that you’re my girlfriend. And I don’t think I’ll ever get tired of that.

I just wanted to give you these because I love you so, so much. And because I’m really grateful for you. For everything we’ve been through, everything we’ve figured out, everything we’ve learned about each other, and especially for how much we’ve grown together lately.

I really love what we’re building. Even the complicated parts, because I know we’re both trying, and I know we’re choosing each other and trying to understand each other better.

So… yellow flowers :3

For you and you always, luv u tons 💛`;

if (letterText) {
  letterText.textContent = LETTER_TEXT;
}


/* ------------------------------
   PLANTS
-------------------------------- */

function getPlantStage(value) {
  if (value >= 5) return 3;
  if (value >= 3) return 2;
  if (value >= 1) return 1;
  return 0;
}

function updatePlantAppearance(index) {
  const plant = plants[index];

  if (!plant) return;

  const stage = getPlantStage(progress[index]);

  plant.dataset.progress = String(progress[index]);
  plant.dataset.stage = String(stage);

  plant.setAttribute(
    "aria-label",
    `${PLANT_NAMES[index]}: ${STAGE_LABELS[stage]}, ${progress[index]} of ${MAX_WATERINGS} waterings`
  );

  plant.style.setProperty("--plant-progress", progress[index]);

  const count = plant.querySelector(".water-count");

  if (count) {
    count.textContent = `${progress[index]}/${MAX_WATERINGS}`;
  }
}


/* ------------------------------
   STATUS / MESSAGE
-------------------------------- */

function updateProgressDisplay() {
  const finished = progress.filter(
    value => value >= MAX_WATERINGS
  ).length;

  if (isGardenComplete) {
    if (gardenMessage) {
      gardenMessage.textContent =
        "You grew all four flowers! 💛";
    }
    return;
  }

  if (gardenMessage) {
    gardenMessage.textContent =
      `${finished}/4 flowers fully grown`;
  }
}


/* ------------------------------
   COMPLETE GARDEN
-------------------------------- */

function completeGarden() {
  if (isGardenComplete) return;

  isGardenComplete = true;

  wateringCan.classList.remove("dragging");
  wateringCan.classList.remove("pouring");

  if (envelope) {
    envelope.disabled = false;
    envelope.removeAttribute("disabled");
    envelope.classList.add("unlocked");
    envelope.setAttribute(
      "aria-label",
      "Open your letter"
    );
  }

  if (celebrationLayer) {
    celebrationLayer.classList.add("active");
  }

  if (gardenMessage) {
    gardenMessage.textContent =
      "All your flowers bloomed! Now there's something waiting for you... 💛";
  }
}


/* ------------------------------
   WATER PLANT
-------------------------------- */

function waterPlant(index) {
  if (isGardenComplete) return;
  if (index < 0 || index >= plants.length) return;
  if (progress[index] >= MAX_WATERINGS) return;

  const now = Date.now();

  if (
    now - lastWateredAt[index] <
    WATERING_COOLDOWN
  ) {
    return;
  }

  lastWateredAt[index] = now;

  progress[index]++;

  updatePlantAppearance(index);

  const stage = getPlantStage(progress[index]);

  if (gardenMessage) {
    gardenMessage.textContent =
      `${PLANT_NAMES[index]}: ${STAGE_MESSAGES[stage]}`;
  }

  if (
    progress.every(value => value >= MAX_WATERINGS)
  ) {
    completeGarden();
  }

  updateProgressDisplay();
}


/* ------------------------------
   CAN POSITION
-------------------------------- */

function moveCanFromPointer(event) {
  if (!gardenStage || !wateringCan) return;

  const stageRect =
    gardenStage.getBoundingClientRect();

  const canRect =
    wateringCan.getBoundingClientRect();

  let x =
    event.clientX -
    stageRect.left -
    grabOffsetX;

  let y =
    event.clientY -
    stageRect.top -
    grabOffsetY;

  const halfWidth = canRect.width / 2;
  const halfHeight = canRect.height / 2;

  const minX = halfWidth;
  const maxX = stageRect.width - halfWidth;

  const minY = halfHeight;
  const maxY = stageRect.height - halfHeight;

  x = Math.max(minX, Math.min(maxX, x));
  y = Math.max(minY, Math.min(maxY, y));

  wateringCan.style.left = `${x}px`;
  wateringCan.style.top = `${y}px`;
}


/* ------------------------------
   FIND PLANT UNDER CAN
-------------------------------- */

function getHoveredPlant() {
  if (!wateringCan) return -1;

  const canRect =
    wateringCan.getBoundingClientRect();

  let bestIndex = -1;
  let bestOverlap = 80;

  plants.forEach((plant, index) => {
    if (progress[index] >= MAX_WATERINGS) {
      return;
    }

    const rect =
      plant.getBoundingClientRect();

    const overlapWidth =
      Math.max(
        0,
        Math.min(canRect.right, rect.right) -
        Math.max(canRect.left, rect.left)
      );

    const overlapHeight =
      Math.max(
        0,
        Math.min(canRect.bottom, rect.bottom) -
        Math.max(canRect.top, rect.top)
      );

    const overlap =
      overlapWidth * overlapHeight;

    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestIndex = index;
    }
  });

  return bestIndex;
}


/* ------------------------------
   DRAGGING
-------------------------------- */

function startDragging(event) {
  if (isGardenComplete) return;
  if (!wateringCan) return;
  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  event.preventDefault();

  isDragging = true;
  activePointerId = event.pointerId;

  const canRect =
    wateringCan.getBoundingClientRect();

  grabOffsetX =
    event.clientX - canRect.left;

  grabOffsetY =
    event.clientY - canRect.top;

  wateringCan.classList.add("dragging");

  try {
    wateringCan.setPointerCapture(
      event.pointerId
    );
  } catch (error) {
    // Some browsers don't support pointer capture.
  }

  moveCanFromPointer(event);

  handleCanPosition(event);
}


function dragCan(event) {
  if (!isDragging) return;

  if (
    activePointerId !== null &&
    event.pointerId !== activePointerId
  ) {
    return;
  }

  event.preventDefault();

  moveCanFromPointer(event);
  handleCanPosition(event);
}


function stopDragging(event) {
  if (!isDragging) return;

  if (
    event &&
    activePointerId !== null &&
    event.pointerId !== activePointerId
  ) {
    return;
  }

  isDragging = false;
  activePointerId = null;

  hoveredPlant = -1;

  wateringCan.classList.remove("dragging");
  wateringCan.classList.remove("pouring");

  plants.forEach(plant => {
    plant.classList.remove("hovered");
  });

  try {
    if (
      event &&
      event.pointerId !== undefined &&
      wateringCan.hasPointerCapture(event.pointerId)
    ) {
      wateringCan.releasePointerCapture(
        event.pointerId
      );
    }
  } catch (error) {
    // Ignore pointer-capture errors.
  }
}


/* ------------------------------
   HANDLE CAN POSITION
-------------------------------- */

function handleCanPosition(event) {
  const newHoveredPlant =
    getHoveredPlant();

  if (newHoveredPlant !== hoveredPlant) {
    plants.forEach(plant => {
      plant.classList.remove("hovered");
    });

    hoveredPlant = newHoveredPlant;

    if (hoveredPlant >= 0) {
      plants[hoveredPlant].classList.add(
        "hovered"
      );
    }
  }

  if (hoveredPlant >= 0) {
    wateringCan.classList.add("pouring");

    if (isDragging) {
      waterPlant(hoveredPlant);
    }
  } else {
    wateringCan.classList.remove("pouring");
  }
}


/* ------------------------------
   POINTER EVENTS
-------------------------------- */

wateringCan.addEventListener(
  "pointerdown",
  startDragging
);

/*
   IMPORTANT FIX:
   Listen on document instead of only the
   watering can. This means the drag continues
   even when the pointer moves away from it.
*/

document.addEventListener(
  "pointermove",
  dragCan,
  { passive: false }
);

document.addEventListener(
  "pointerup",
  stopDragging
);

document.addEventListener(
  "pointercancel",
  stopDragging
);

wateringCan.addEventListener(
  "lostpointercapture",
  () => {
    if (isDragging) {
      stopDragging();
    }
  }
);

wateringCan.addEventListener(
  "dragstart",
  event => event.preventDefault()
);


/* ------------------------------
   KEYBOARD
-------------------------------- */

wateringCan.addEventListener(
  "keydown",
  event => {
    if (event.key === "Enter" ||
        event.key === " ") {

      event.preventDefault();

      if (hoveredPlant >= 0) {
        waterPlant(hoveredPlant);
      }
    }
  }
);


/* ------------------------------
   ENVELOPE / LETTER
-------------------------------- */

function openLetter() {
  if (!isGardenComplete) return;

  if (!letterModal) return;

  letterModal.classList.add("open");
  letterModal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");
}

function closeLetterModal() {
  if (!letterModal) return;

  letterModal.classList.remove("open");
  letterModal.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");
}

if (envelope) {
  envelope.addEventListener(
    "click",
    openLetter
  );
}

if (closeLetter) {
  closeLetter.addEventListener(
    "click",
    closeLetterModal
  );
}

if (letterModal) {
  letterModal.addEventListener(
    "click",
    event => {
      if (event.target === letterModal) {
        closeLetterModal();
      }
    }
  );
}

document.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Escape" &&
      letterModal?.classList.contains("open")
    ) {
      closeLetterModal();
    }
  }
);


/* ------------------------------
   RESET
-------------------------------- */

function resetGardenState() {
  progress = plants.map(() => 0);
  lastWateredAt = plants.map(() => 0);

  isDragging = false;
  activePointerId = null;
  hoveredPlant = -1;
  isGardenComplete = false;

  wateringCan.classList.remove("dragging");
  wateringCan.classList.remove("pouring");

  plants.forEach((plant, index) => {
    plant.classList.remove("hovered");
    updatePlantAppearance(index);
  });

  if (envelope) {
    envelope.disabled = true;
    envelope.setAttribute("disabled", "");
    envelope.classList.remove("unlocked");
  }

  if (celebrationLayer) {
    celebrationLayer.classList.remove("active");
  }

  closeLetterModal();

  updateProgressDisplay();

  if (gardenMessage) {
    gardenMessage.textContent =
      "Drag the watering can to your flowers 💛";
  }
}

if (resetGarden) {
  resetGarden.addEventListener(
    "click",
    resetGardenState
  );
}


/* ------------------------------
   INITIALIZE
-------------------------------- */

plants.forEach((plant, index) => {
  progress[index] =
    Number(plant.dataset.progress) || 0;

  updatePlantAppearance(index);
});

updateProgressDisplay();

console.log("🌼 Yellow Flower Garden loaded!");