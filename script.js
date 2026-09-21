const MAX_WATERINGS = 5;
const WATERING_COOLDOWN = 850;

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
const messageText = document.getElementById("messageText");
const celebrationLayer = document.getElementById("celebrationLayer");

const envelope = document.getElementById("envelope");
const letterModal = document.getElementById("letterModal");
const letterText = document.getElementById("letterText");
const closeModal = document.getElementById("closeModal");

const resetButton = document.getElementById("resetButton");
const modalResetButton = document.getElementById("modalResetButton");

const grownCount = document.getElementById("grownCount");
const gameStatus = document.getElementById("gameStatus");

let progress = plants.map(() => 0);
let lastWateredAt = plants.map(() => 0);

let isDragging = false;
let activePointerId = null;

let grabOffsetX = 0;
let grabOffsetY = 0;

let hoveredPlant = -1;
let isGardenComplete = false;


/* =========================================================
   LETTER
   ========================================================= */

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


/* =========================================================
   PLANT STAGES
   ========================================================= */

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

  plant.style.setProperty(
    "--plant-progress",
    progress[index]
  );
}


/* =========================================================
   PROGRESS
   ========================================================= */

function updateProgressDisplay() {
  const finished = progress.filter(
    value => value >= MAX_WATERINGS
  ).length;

  if (grownCount) {
    grownCount.textContent = finished;
  }

  if (isGardenComplete) {
    if (gameStatus) {
      gameStatus.textContent =
        "The garden is complete.";
    }

    return;
  }

  if (gameStatus) {
    gameStatus.textContent =
      `${finished} of 4 flowers are in bloom.`;
  }
}


/* =========================================================
   WATERING
   ========================================================= */

function waterPlant(index) {
  if (isGardenComplete) return;
  if (index < 0 || index >= plants.length) return;

  if (progress[index] >= MAX_WATERINGS) {
    return;
  }

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
  updateProgressDisplay();

  const stage = getPlantStage(progress[index]);

  if (messageText) {
    messageText.textContent =
      `${PLANT_NAMES[index]}: ${STAGE_MESSAGES[stage]}`;
  }

  /*
   * THIS is the important completion check.
   *
   * Every single flower has to reach 5.
   */
  const allFlowersGrown = progress.every(
    value => value >= MAX_WATERINGS
  );

  if (allFlowersGrown) {
    completeGarden();
  }
}


/* =========================================================
   COMPLETE GARDEN
   ========================================================= */

function completeGarden() {
  if (isGardenComplete) return;

  isGardenComplete = true;

  /* Make absolutely sure every flower is at 5/5 */
  progress = progress.map(() => MAX_WATERINGS);

  plants.forEach((plant, index) => {
    updatePlantAppearance(index);
    plant.classList.remove("hovered");
  });

  /* Complete bouquet animation */
  if (gardenStage) {
    gardenStage.classList.add("bouquet-complete");
  }

  /* Stop dragging */
  isDragging = false;
  activePointerId = null;
  hoveredPlant = -1;

  wateringCan.classList.remove("is-dragging");
  wateringCan.classList.remove("is-pouring");

  /* Unlock envelope */
  if (envelope) {
    envelope.disabled = false;
    envelope.removeAttribute("disabled");

    envelope.classList.add("is-unlocked");

    envelope.setAttribute(
      "aria-disabled",
      "false"
    );

    envelope.setAttribute(
      "aria-label",
      "Open your letter"
    );
  }

  /* Celebration */
  createCelebration();

  updateProgressDisplay();

  if (gameStatus) {
    gameStatus.textContent =
      "The garden is complete. The envelope is unlocked.";
  }
}


/* =========================================================
   CAN POSITION
   ========================================================= */

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

  const halfWidth =
    canRect.width / 2;

  const halfHeight =
    canRect.height / 2;

  const minX = halfWidth;
  const maxX = stageRect.width - halfWidth;

  const minY = halfHeight;
  const maxY = stageRect.height - halfHeight;

  x = Math.max(
    minX,
    Math.min(maxX, x)
  );

  y = Math.max(
    minY,
    Math.min(maxY, y)
  );

  wateringCan.style.left = `${x}px`;
  wateringCan.style.top = `${y}px`;
}


/* =========================================================
   FIND PLANT
   ========================================================= */

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
        Math.min(
          canRect.right,
          rect.right
        ) -
        Math.max(
          canRect.left,
          rect.left
        )
      );

    const overlapHeight =
      Math.max(
        0,
        Math.min(
          canRect.bottom,
          rect.bottom
        ) -
        Math.max(
          canRect.top,
          rect.top
        )
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


/* =========================================================
   HANDLE CAN POSITION
   ========================================================= */

function handleCanPosition() {
  const newHoveredPlant =
    getHoveredPlant();

  if (
    newHoveredPlant !==
    hoveredPlant
  ) {
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
    wateringCan.classList.add(
      "is-pouring"
    );

    if (isDragging) {
      waterPlant(hoveredPlant);
    }
  } else {
    wateringCan.classList.remove(
      "is-pouring"
    );
  }
}


/* =========================================================
   DRAGGING
   ========================================================= */

function startDragging(event) {
  if (isGardenComplete) return;

  if (
    event.button !== undefined &&
    event.button !== 0
  ) {
    return;
  }

  event.preventDefault();

  isDragging = true;
  activePointerId = event.pointerId;

  const canRect =
    wateringCan.getBoundingClientRect();

  grabOffsetX =
    event.clientX -
    canRect.left -
    canRect.width / 2;

  grabOffsetY =
    event.clientY -
    canRect.top -
    canRect.height / 2;

  wateringCan.classList.add(
    "is-dragging"
  );

  try {
    wateringCan.setPointerCapture(
      event.pointerId
    );
  } catch (error) {}

  moveCanFromPointer(event);
  handleCanPosition();
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
  handleCanPosition();
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

  wateringCan.classList.remove(
    "is-dragging"
  );

  wateringCan.classList.remove(
    "is-pouring"
  );

  plants.forEach(plant => {
    plant.classList.remove("hovered");
  });

  try {
    if (
      event &&
      event.pointerId !== undefined &&
      wateringCan.hasPointerCapture(
        event.pointerId
      )
    ) {
      wateringCan.releasePointerCapture(
        event.pointerId
      );
    }
  } catch (error) {}
}


/* =========================================================
   POINTER EVENTS
   ========================================================= */

wateringCan.addEventListener(
  "pointerdown",
  startDragging
);

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
  event => {
    event.preventDefault();
  }
);


/* =========================================================
   KEYBOARD
   ========================================================= */

wateringCan.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      if (hoveredPlant >= 0) {
        waterPlant(hoveredPlant);
      }
    }
  }
);


/* =========================================================
   CELEBRATION
   ========================================================= */

function createCelebration() {
  if (!celebrationLayer) return;

  celebrationLayer.innerHTML = "";

  const colors = [
    "#ffdd6d",
    "#f8c94d",
    "#e9a83e",
    "#d98971",
    "#fff1a8"
  ];

  for (let i = 0; i < 28; i++) {
    const piece =
      document.createElement("span");

    piece.className = "confetti";

    piece.style.setProperty(
      "--left",
      `${Math.random() * 100}%`
    );

    piece.style.setProperty(
      "--size",
      `${6 + Math.random() * 8}px`
    );

    piece.style.setProperty(
      "--duration",
      `${2.5 + Math.random() * 2}s`
    );

    piece.style.setProperty(
      "--delay",
      `${Math.random() * 0.8}s`
    );

    piece.style.setProperty(
      "--rotation",
      `${Math.random() * 360}deg`
    );

    piece.style.setProperty(
      "--color",
      colors[
        Math.floor(
          Math.random() * colors.length
        )
      ]
    );

    celebrationLayer.appendChild(piece);
  }
}


/* =========================================================
   LETTER MODAL
   ========================================================= */

function openLetter() {
  if (!isGardenComplete) return;
  if (!letterModal) return;

  envelope.classList.add(
    "is-opening"
  );

  setTimeout(() => {
    letterModal.hidden = false;

    letterModal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "modal-open"
    );
  }, 520);
}


function closeLetterModal() {
  if (!letterModal) return;

  letterModal.hidden = true;

  letterModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "modal-open"
  );

  if (envelope) {
    envelope.classList.remove(
      "is-opening"
    );
  }
}


if (envelope) {
  envelope.addEventListener(
    "click",
    openLetter
  );
}


if (closeModal) {
  closeModal.addEventListener(
    "click",
    closeLetterModal
  );
}


if (letterModal) {
  letterModal.addEventListener(
    "click",
    event => {
      if (
        event.target === letterModal
      ) {
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
      letterModal &&
      !letterModal.hidden
    ) {
      closeLetterModal();
    }
  }
);


/* =========================================================
   RESET
   ========================================================= */

function resetGardenState() {
  progress = plants.map(() => 0);
  lastWateredAt = plants.map(() => 0);

  isDragging = false;
  activePointerId = null;
  hoveredPlant = -1;
  isGardenComplete = false;

  wateringCan.classList.remove(
    "is-dragging"
  );

  wateringCan.classList.remove(
    "is-pouring"
  );

  if (gardenStage) {
    gardenStage.classList.remove(
      "bouquet-complete"
    );
  }

  if (envelope) {
    envelope.disabled = true;

    envelope.setAttribute(
      "disabled",
      ""
    );

    envelope.classList.remove(
      "is-unlocked"
    );

    envelope.classList.remove(
      "is-opening"
    );

    envelope.setAttribute(
      "aria-disabled",
      "true"
    );

    envelope.setAttribute(
      "aria-label",
      "Locked envelope"
    );
  }

  plants.forEach(
    (plant, index) => {
      plant.classList.remove(
        "hovered"
      );

      updatePlantAppearance(index);
    }
  );

  if (celebrationLayer) {
    celebrationLayer.innerHTML = "";
  }

  closeLetterModal();

  updateProgressDisplay();

  if (messageText) {
    messageText.textContent =
      "Drag the little can over each plant";
  }

  if (gameStatus) {
    gameStatus.textContent =
      "The garden is ready. Drag the watering can over a plant.";
  }
}


if (resetButton) {
  resetButton.addEventListener(
    "click",
    resetGardenState
  );
}


if (modalResetButton) {
  modalResetButton.addEventListener(
    "click",
    resetGardenState
  );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

plants.forEach(
  (plant, index) => {
    progress[index] =
      Number(
        plant.dataset.progress
      ) || 0;

    updatePlantAppearance(index);
  }
);

updateProgressDisplay();

console.log(
  "Yellow Flower Garden loaded."
);