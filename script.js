function handleModelInput(gesture) {
  const mapping = {
    left: 0,
    middle: 1,
    up: 2,
    right: 3
  };

  const laneIndex = mapping[gesture];
  if (laneIndex === undefined) return;

  // Simulate a key press visually
  const key = laneKeys[laneIndex];
  if (keyEls[key]) {
    keyEls[key].classList.add("active");
    setTimeout(() => keyEls[key].classList.remove("active"), 120);
  }

  // Same hit detection logic as keyboard
  const hitLineY = getHitLineY();

  let bestNote = null;
  let bestDist = Infinity;

  notes.forEach(note => {
    if (note.lane !== laneIndex) return;
    const dist = Math.abs(note.y - hitLineY);
    if (dist < bestDist) {
      bestDist = dist;
      bestNote = note;
    }
  });

  if (bestNote && bestDist <= hitWindow) {
    const quality = bestDist < hitWindow / 2 ? "GOOD" : "OK";
    const type = quality === "GOOD" ? "good" : "ok";

    showHitFeedback(quality, type);

    const base = quality === "GOOD" ? 150 : 80;
    combo += 1;
    score += base + combo * 5;

    scoreEl.textContent = score;
    comboEl.textContent = combo;

    bestNote.el.remove();
    notes = notes.filter(n => n !== bestNote);
  } else {
    showHitFeedback("MISS", "miss");
    combo = 0;
    comboEl.textContent = combo;
  }
}
