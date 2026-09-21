/* =========================================================
   Yellow Flower Day — garden game logic
   No libraries, no backend, just Pointer Events and a little sunshine.
   ========================================================= */

/*
 * PERSONAL LETTER TEXT
 * Replace only the text between the quotes below with your own letter.
 */
const LETTER_TEXT = "Okay so… you know Yellow Flower Day and how you’re supposed to give yellow flowers to someone you love?

Well… obviously I had to get you some :3

And I know I think I did this last year too, but honestly… it feels really different this time.

Because last year, we were… us, but not this us, yk? And now I get to look at you and actually say that you’re my girlfriend. And I don’t think I’ll ever get tired of that.

I just wanted to give you these because I love you so, so much. And because I’m really grateful for you. For everything we’ve been through, everything we’ve figured out, everything we’ve learned about each other, and especially for how much we’ve grown together lately.

I really love what we’re building. Even the complicated parts, because I know we’re both trying, and I know we’re choosing each other and trying to understand each other better.

So… yellow flowers :3

For you and you always, luv u tons 💛";

const MAX_WATERINGS = 5;
const STAGE_THRESHOLDS = [0, 1, 3, 5];
const PLANT_NAMES = ["Sunbeam", "Honeydrop", "Marigold", "Buttercup"];
const STAGE_NAMES = ["seed and sprout", "small green plant", "plant with a bud", "fully grown yellow flower"];

const gardenStage = document.getElementById("gardenStage");
const wateringCan = document.getElementById("wateringCan");
const plants = [...document.querySelectorAll(".plant")];
const grownCount = document.getElementById("grownCount");
const messageText = document.getElementById("messageText");
const gardenMessage = document.getElementById("gardenMessage");
const gameStatus = document.getElementById("gameStatus");
const envelope = document.getElementById("envelope");
const letterHint = document.getElementById("letterHint");
const unlockedHint = document.getElementById("unlockedHint");
const resetButton = document.getElementById("resetButton");
const modalResetButton = document.getElementById("modalResetButton");
const letterModal = document.getElementById("letterModal");
const letterText = document.getElementById("letterText");
const closeModalButton = document.getElementById("closeModal");
const celebrationLayer = document.getElementById("celebrationLayer");

let progress = plants.map(() => 0);
let lastWateredAt = plants.map(() => 0);
let isGardenComplete = false;
let isDragging = false;
let activePointerId = null;
let grabOffsetX = 0;
let grabOffsetY = 0;
let hoveredPlantIndex = -1;
let letterOpenTimer = null;
let lastFocusedElement = null;

/* Keep a can position inside the visible garden stage. The can uses its
   center for left/top because its CSS transform is translate(-50%, -50%). */
function moveCanFromPointer(event) {
  const stageRect = gardenStage.getBoundingClientRect();
  const canRect = wateringCan.getBoundingClientRect();
  const canWidth = canRect.width;
  const canHeight = canRect.height;

  const desiredCenterX = event.clientX - stageRect.left - grabOffsetX + canWidth / 2;
  const desiredCenterY = event.clientY - stageRect.top - grabOffsetY + canHeight / 2;
  const minX = canWidth / 2;
  const maxX = Math.max(minX, stageRect.width - canWidth / 2);
  const minY = canHeight / 2;
  const maxY = Math.max(minY, stageRect.height - canHeight / 2);

  const boundedX = Math.min(maxX, Math.max(minX, desiredCenterX));
  const boundedY = Math.min(maxY, Math.max(minY, desiredCenterY));

  wateringCan.style.left = `${boundedX}px`;
  wateringCan.style.top = `${boundedY}px`;
}

function getHoveredPlant() {
  const canRect = wateringCan.getBoundingClientRect();
  let bestIndex = -1;
  let largestOverlap = 0;

  plants.forEach((plant, index) => {
    if (progress[index] >= MAX_WATERINGS) return;

    const plantRect = plant.getBoundingClientRect();
    const overlapWidth = Math.max(0, Math.min(canRect.right, plantRect.right) - Math.max(canRect.left, plantRect.left));
    const overlapHeight = Math.max(0, Math.min(canRect.bottom, plantRect.bottom) - Math.max(canRect.top, plantRect.top));
    const overlapArea = overlapWidth * overlapHeight;

    if (overlapArea > largestOverlap && overlapArea > 80) {
      largestOverlap = overlapArea;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function setPouringState(index) {
  hoveredPlantIndex = index;
  wateringCan.classList.toggle("is-pouring", isDragging && index !== -1);
}

function stageForProgress(amount) {
  let stage = 0;
  STAGE_THRESHOLDS.forEach((threshold, index) => {
    if (amount >= threshold) stage = index;
  });
  return stage;
}

function updatePlantAppearance(index, shouldAnimate = false) {
  const plant = plants[index];
  const currentStage = stageForProgress(progress[index]);
  const previousStage = Number(plant.dataset.stage);

  plant.dataset.progress = String(progress[index]);
  plant.dataset.stage = String(currentStage);
  plant.setAttribute(
    "aria-label",
    `${PLANT_NAMES[index]}, ${STAGE_NAMES[currentStage]}. ${progress[index]} of ${MAX_WATERINGS} watering interactions.`
  );

  if (shouldAnimate && currentStage !== previousStage) {
    plant.classList.remove("is-growing");
    // Force a reflow so a plant can play the same grow animation more than once.
    void plant.offsetWidth;
    plant.classList.add("is-growing");
    window.setTimeout(() => plant.classList.remove("is-growing"), 900);
  }
}

function updateProgressDisplay() {
  const finishedPlants = progress.filter((amount) => amount >= MAX_WATERINGS).length;
  grownCount.textContent = String(finishedPlants);
}

function waterPlant(index) {
  if (index < 0 || isGardenComplete || progress[index] >= MAX_WATERINGS) return;

  const now = performance.now();
  // A can held in place still gives distinct, gentle drinks rather than
  // instantly filling the plant. Moving away and back also creates a drink.
  if (now - lastWateredAt[index] < 850) return;

  lastWateredAt[index] = now;
  const oldStage = stageForProgress(progress[index]);
  progress[index] += 1;
  const newStage = stageForProgress(progress[index]);
  updatePlantAppearance(index, true);
  updateProgressDisplay();

  if (progress[index] >= MAX_WATERINGS) {
    messageText.textContent = `${PLANT_NAMES[index]} is glowing in the sunshine ✦`;
    gameStatus.textContent = `${PLANT_NAMES[index]} is a fully grown yellow flower.`;
  } else if (newStage !== oldStage) {
    messageText.textContent = `${PLANT_NAMES[index]} grew a little taller ✦`;
    gameStatus.textContent = `${PLANT_NAMES[index]} grew into a ${STAGE_NAMES[newStage]}.`;
  } else {
    const drinksLeft = MAX_WATERINGS - progress[index];
    messageText.textContent = `${PLANT_NAMES[index]} had a little drink · ${drinksLeft} more to bloom`;
    gameStatus.textContent = `${PLANT_NAMES[index]} had a drink. ${drinksLeft} more watering interactions until it blooms.`;
  }

  if (progress.every((amount) => amount >= MAX_WATERINGS)) {
    completeGarden();
  }
}

function handleCanPosition(event) {
  moveCanFromPointer(event);
  const nextHoveredIndex = getHoveredPlant();
  setPouringState(nextHoveredIndex);

  if (nextHoveredIndex !== -1) {
    waterPlant(nextHoveredIndex);
  }
}

function startDragging(event) {
  if (isGardenComplete || isDragging) return;
  if (event.button !== undefined && event.button !== 0) return;
  if (event.isPrimary === false) return;

  event.preventDefault();
  isDragging = true;
  activePointerId = event.pointerId;
  const canRect = wateringCan.getBoundingClientRect();
  grabOffsetX = event.clientX - canRect.left;
  grabOffsetY = event.clientY - canRect.top;
  wateringCan.classList.add("is-dragging");
  wateringCan.setPointerCapture?.(event.pointerId);
  handleCanPosition(event);
}

function dragCan(event) {
  if (!isDragging || event.pointerId !== activePointerId) return;
  event.preventDefault();
  handleCanPosition(event);
}

function stopDragging(event) {
  if (!isDragging) return;
  if (event && event.pointerId !== undefined && activePointerId !== null && event.pointerId !== activePointerId) return;

  isDragging = false;
  activePointerId = null;
  hoveredPlantIndex = -1;
  wateringCan.classList.remove("is-dragging", "is-pouring");
  wateringCan.releasePointerCapture?.(event?.pointerId);
}

function addCelebration() {
  celebrationLayer.replaceChildren();
  const colors = ["#ffe27b", "#fff6ba", "#edb24b", "#e8a17c", "#9cc47c", "#ffffff"];

  for (let i = 0; i < 30; i += 1) {
    const petal = document.createElement("span");
    petal.className = "confetti";
    petal.style.setProperty("--left", `${3 + Math.random() * 94}%`);
    petal.style.setProperty("--size", `${5 + Math.random() * 7}px`);
    petal.style.setProperty("--duration", `${3.8 + Math.random() * 3.2}s`);
    petal.style.setProperty("--delay", `${Math.random() * 1.5}s`);
    petal.style.setProperty("--rotation", `${Math.round(Math.random() * 180)}deg`);
    petal.style.setProperty("--color", colors[i % colors.length]);
    celebrationLayer.appendChild(petal);
  }
}

function completeGarden() {
  if (isGardenComplete) return;
  isGardenComplete = true;
  gardenStage.classList.add("bouquet-complete");
  gardenMessage.classList.add("is-complete");
  messageText.textContent = "Look what you grew ✦";
  gameStatus.textContent = "All four flowers are blooming. Look what you grew. The letter is unlocked.";
  addCelebration();

  envelope.disabled = false;
  envelope.setAttribute("aria-disabled", "false");
  envelope.setAttribute("aria-label", "Open the unlocked letter");
  envelope.classList.add("is-unlocked");
  letterHint.hidden = true;
  unlockedHint.hidden = false;
  resetButton.hidden = false;
}

function openLetter() {
  if (!isGardenComplete || envelope.disabled) return;
  lastFocusedElement = document.activeElement;
  envelope.classList.add("is-opening");
  window.clearTimeout(letterOpenTimer);
  letterOpenTimer = window.setTimeout(() => {
    letterText.textContent = LETTER_TEXT;
    letterModal.hidden = false;
    closeModalButton.focus();
  }, 520);
}

function closeLetter() {
  window.clearTimeout(letterOpenTimer);
  letterModal.hidden = true;
  envelope.classList.remove("is-opening");
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  } else if (!envelope.disabled) {
    envelope.focus();
  }
}

function resetGarden() {
  closeLetter();
  progress = plants.map(() => 0);
  lastWateredAt = plants.map(() => 0);
  isGardenComplete = false;
  isDragging = false;
  activePointerId = null;
  hoveredPlantIndex = -1;

  gardenStage.classList.remove("bouquet-complete");
  gardenMessage.classList.remove("is-complete");
  messageText.textContent = "Drag the little can over each plant";
  gameStatus.textContent = "The garden is ready again. Drag the watering can over a plant.";
  celebrationLayer.replaceChildren();

  wateringCan.style.left = "";
  wateringCan.style.top = "";
  wateringCan.classList.remove("is-dragging", "is-pouring");

  plants.forEach((plant, index) => {
    plant.classList.remove("is-growing");
    plant.dataset.progress = "0";
    plant.dataset.stage = "0";
    plant.setAttribute("aria-label", `${PLANT_NAMES[index]}, ${STAGE_NAMES[0]}. 0 of ${MAX_WATERINGS} watering interactions.`);
  });

  updateProgressDisplay();
  envelope.disabled = true;
  envelope.setAttribute("aria-disabled", "true");
  envelope.setAttribute("aria-label", "Locked envelope");
  envelope.classList.remove("is-unlocked", "is-opening");
  letterHint.hidden = false;
  unlockedHint.hidden = true;
  resetButton.hidden = true;
}

/* Pointer Events make the same can interaction work for mouse, pen, and touch. */
wateringCan.addEventListener("pointerdown", startDragging);
wateringCan.addEventListener("pointermove", dragCan);
wateringCan.addEventListener("pointerup", stopDragging);
wateringCan.addEventListener("pointercancel", stopDragging);
wateringCan.addEventListener("lostpointercapture", stopDragging);
wateringCan.addEventListener("dragstart", (event) => event.preventDefault());

wateringCan.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    gameStatus.textContent = "Drag the watering can with your pointer or finger to water the plants.";
  }
});

envelope.addEventListener("click", openLetter);
closeModalButton.addEventListener("click", closeLetter);
resetButton.addEventListener("click", resetGarden);
modalResetButton.addEventListener("click", () => {
  resetGarden();
  wateringCan.focus();
});

letterModal.addEventListener("click", (event) => {
  if (event.target === letterModal) closeLetter();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !letterModal.hidden) closeLetter();
});

/* Initial state is explicit so the file also behaves correctly after a reset. */
plants.forEach((plant, index) => updatePlantAppearance(index));
updateProgressDisplay();
