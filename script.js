// --- CONFIGURATION ---
// TODO: PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw3JDcgtD0Shl6QJOFHEMq_7l2sLeyIpIr9ZsusWxzxakSH3LafxlS85bqi_oPnX0mqQw/exec';

let state = {
    selectedTeam: null, // 'seahawks' or 'patriots'
    seahawksScore: 0,
    patriotsScore: 0,
    playerName: '',
    isDragging: false
};

const teams = {
    seahawks: { name: "Seahawks", color: "#002244" },
    patriots: { name: "Patriots", color: "#002244" }
};

// DOM Elements
const selectionScreen = document.getElementById('selection-screen');
const gameScreen = document.getElementById('game-screen');
const revealScreen = document.getElementById('reveal-screen');
const startBtn = document.getElementById('start-btn');
const teamCards = document.querySelectorAll('.team-card');
const football = document.getElementById('football');

// Inputs
const seahawksInput = document.getElementById('seahawks-score');
const patriotsInput = document.getElementById('patriots-score');
const playerInput = document.getElementById('player-name');

// 1. Selection Logic
function selectTeam(team) {
    state.selectedTeam = team;
    teamCards.forEach(card => card.classList.remove('selected'));
    document.querySelector(`[data-team="${team}"]`).classList.add('selected');
    checkStartValidity();
}

// Listen for score inputs
seahawksInput.addEventListener('input', checkStartValidity);
patriotsInput.addEventListener('input', checkStartValidity);
playerInput.addEventListener('input', checkStartValidity);

function checkStartValidity() {
    const sScore = seahawksInput.value;
    const pScore = patriotsInput.value;
    const pName = playerInput.value.trim();
    const errorMsg = document.getElementById('error-message');

    let isScoreValid = false;

    // 1. Score Validation (Only runs if Team + Both Scores are present)
    // This allows the error to show even if the Name is missing.
    if (state.selectedTeam && sScore !== '' && pScore !== '') {
        const sVal = parseInt(sScore);
        const pVal = parseInt(pScore);
        let mismatch = false;

        if (state.selectedTeam === 'seahawks' && sVal <= pVal) {
            mismatch = true;
        } else if (state.selectedTeam === 'patriots' && pVal <= sVal) {
            mismatch = true;
        }

        if (mismatch) {
            errorMsg.textContent = "Pick a side MATE!!";
            errorMsg.classList.remove('hidden');
            isScoreValid = false;
        } else {
            errorMsg.classList.add('hidden');
            isScoreValid = true;
        }
    } else {
        // Incomplete score data, hide error
        errorMsg.classList.add('hidden');
        isScoreValid = false;
    }

    // 2. Button Enablement (Requires EVERYTHING: Valid Scores + Name)
    if (isScoreValid && pName !== '') {
        startBtn.disabled = false;
        state.seahawksScore = parseInt(sScore);
        state.patriotsScore = parseInt(pScore);
        state.playerName = pName;
    } else {
        startBtn.disabled = true;
    }
}

function startGame() {
    // Button is only enabled if checkStartValidity passed
    selectionScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    setupGame();
}

// 2. Game Logic
function setupGame() {
    const team1Name = document.getElementById('game-team-name-1');
    const team2Name = document.getElementById('game-team-name-2');
    const score1 = document.getElementById('game-score-1');
    const score2 = document.getElementById('game-score-2');

    // Endzone Visibility Logic
    const seahawksEndzone = document.getElementById('endzone-seahawks');
    const patriotsEndzone = document.getElementById('endzone-patriots');

    if (state.selectedTeam === 'seahawks') {
        seahawksEndzone.style.display = 'flex'; // Ensure visible
        patriotsEndzone.style.display = 'none'; // Hide opponent
    } else {
        seahawksEndzone.style.display = 'none'; // Hide opponent
        patriotsEndzone.style.display = 'flex'; // Ensure visible
    }

    // Display logic:
    // If selected team is Seahawks, their score starts at Current - 6.
    // If selected team is Patriots, their score starts at Current - 6.

    let displaySeahawks = state.seahawksScore;
    let displayPatriots = state.patriotsScore;

    // Apply the "pre-touchdown" score logic
    if (state.selectedTeam === 'seahawks') {
        displaySeahawks = Math.max(0, state.seahawksScore - 6);
    } else {
        displayPatriots = Math.max(0, state.patriotsScore - 6);
    }

    score1.textContent = displaySeahawks;
    score2.textContent = displayPatriots;

    // Position football in center
    football.style.left = '50%';
    football.style.top = '50%';
    football.style.transform = 'translate(-50%, -50%)';
}

// Drag functionality
let isDragging = false;
let startX, startY;
let iconX, iconY;

football.addEventListener('mousedown', startDrag);
football.addEventListener('touchstart', startDrag, { passive: false });

function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    football.style.cursor = 'grabbing';

    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    // Get current position relative to viewport or parent
    const rect = football.getBoundingClientRect();

    // Calculate offset from the mouse to the top-left of the element
    startX = clientX - rect.left;
    startY = clientY - rect.top;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
}

function onDrag(e) {
    if (!isDragging) return;

    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    // We simply move the element following the mouse, correcting for the initial offset
    // Using fixed positioning for drag might be easier, but let's try direct style left/top relative to container
    // Actually, setting position absolute on container lets us just update left/top.

    const containerRect = document.querySelector('.field-container').getBoundingClientRect();

    let newLeft = clientX - containerRect.left - startX + (football.offsetWidth / 2); // Center adjustment if we used transform center
    let newTop = clientY - containerRect.top - startY + (football.offsetHeight / 2);

    // Simple implementation: Just follow mouse
    football.style.position = 'absolute';
    football.style.left = `${clientX - containerRect.left}px`;
    football.style.top = `${clientY - containerRect.top}px`;
    football.style.transform = 'translate(-50%, -50%)';
}

function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    football.style.cursor = 'grab';

    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', endDrag);

    checkDropZone();
}

function checkDropZone() {
    const footballRect = football.getBoundingClientRect();
    const targetEndzoneId = state.selectedTeam === 'seahawks' ? 'endzone-seahawks' : 'endzone-patriots';
    const targetEl = document.getElementById(targetEndzoneId);
    const targetRect = targetEl.getBoundingClientRect();

    // Check intersection
    const overlap = !(footballRect.right < targetRect.left ||
        footballRect.left > targetRect.right ||
        footballRect.bottom < targetRect.top ||
        footballRect.top > targetRect.bottom);

    if (overlap) {
        handleTouchdown();
    } else {
        // Reset position if missed (optional, or just leave it there)
        // football.style.left = '50%';
        // football.style.top = '50%';
    }
}

function handleTouchdown() {
    // 1. Send Data to Google Sheet (Fire and forget)
    sendDataToSheet();

    // 2. Animate Scoreboard
    updateScoreboardAnimated();

    // 2.5 Update Clock to 0:00
    document.querySelector('.game-clock').textContent = "Q4 0:00"; // Game Over

    // 3. Reveal Invitation after delay (and trigger ALL confetti)
    setTimeout(() => {
        gameScreen.classList.add('hidden');
        revealScreen.classList.remove('hidden');

        // Populate Winner
        const winName = document.getElementById('winning-team-name');
        winName.textContent = teams[state.selectedTeam].name;
        winName.style.color = teams[state.selectedTeam].name === 'Seahawks' ? '#69BE28' : '#C60C30';

        // Populate Invitee Name
        document.getElementById('invitee-name').textContent = state.playerName;

        // --- Side Confetti Loop (Starts now, lasts 7s) ---
        const loopDuration = 10 * 1000;
        const loopEnd = Date.now() + loopDuration;

        (function loopFrame() {
            confetti({
                particleCount: 15,
                angle: 60,
                spread: 55,
                startVelocity: 100, /* Shoot further */
                origin: { x: 0 },
                colors: state.selectedTeam === 'seahawks' ? ['#002244', '#69BE28'] : ['#002244', '#C60C30', '#FFFFFF']
            });
            confetti({
                particleCount: 12,
                angle: 120,
                spread: 55,
                startVelocity: 100, /* Shoot further */
                origin: { x: 1 },
                colors: state.selectedTeam === 'seahawks' ? ['#002244', '#69BE28'] : ['#002244', '#C60C30', '#FFFFFF']
            });

            if (Date.now() < loopEnd) {
                requestAnimationFrame(loopFrame);
            }
        }());

        // --- Massive particle burst over 7 seconds ---
        const burstDuration = 1.5 * 1000;
        const burstEnd = Date.now() + burstDuration;

        (function burstFrame() {
            // Tripled density: ~75 per frame
            confetti({
                particleCount: 75,
                spread: 160,
                startVelocity: 68, /* 1.5x default velocity (45 * 1.5) */
                origin: { y: 0.6 },
                colors: state.selectedTeam === 'seahawks' ? ['#002244', '#69BE28'] : ['#002244', '#C60C30', '#FFFFFF']
            });

            if (Date.now() < burstEnd) {
                requestAnimationFrame(burstFrame);
            }
        }());
    }, 2000);
}

function updateScoreboardAnimated() {
    // Determine which score to update
    const scoreId = state.selectedTeam === 'seahawks' ? 'game-score-1' : 'game-score-2';
    const finalScore = state.selectedTeam === 'seahawks' ? state.seahawksScore : state.patriotsScore;
    const startScore = Math.max(0, finalScore - 6);

    const element = document.getElementById(scoreId);

    // Simple counter animation
    let current = startScore;
    const interval = setInterval(() => {
        current++;
        element.textContent = current;
        if (current >= finalScore) {
            clearInterval(interval);
        }
    }, 100); // Speed of count up
}

// 4. Google Sheets Integration
function sendDataToSheet() {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('PASTE_YOUR_WEB_APP_URL_HERE')) {
        console.warn("Google Script URL not set. Data will not be saved.");
        return;
    }

    const payload = {
        playerName: state.playerName,
        selectedTeam: state.selectedTeam,
        seahawksScore: state.seahawksScore,
        patriotsScore: state.patriotsScore
    };

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // 'no-cors' is required for Google Apps Script Web App calls from client-side JS
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
        .then(response => console.log("Data sent to sheet"))
        .catch(error => console.error("Error sending data:", error));
}

// 5. Calendar Integration
function addToGoogleCalendar() {
    const mapsLink = "https://www.google.com/maps/search/?api=1&query=1108+Crossvine+Trail+Durham,+NC+27703";
    const event = {
        title: "Super Bowl LX Party",
        details: `Come watch the Super Bowl! Food, drinks, and massive confetti provided.\n\nMap: ${mapsLink}`,
        location: "1108 Crossvine Trail Durham, NC 27703",
        // 2026-02-08 17:30 EST (UTC-5) -> 22:30 UTC
        start: "20260208T223000Z",
        end: "20260209T030000Z"
    };

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&details=${encodeURIComponent(event.details)}&location=${encodeURIComponent(event.location)}`;

    window.open(url, '_blank');
}

function addToICal() {
    const mapsLink = "https://www.google.com/maps/search/?api=1&query=1108+Crossvine+Trail+Durham,+NC+27703";
    const event = {
        title: "Super Bowl LX Party",
        description: `Come watch the Super Bowl! Food, drinks, and massive confetti provided.\\n\\nMap: ${mapsLink}`,
        location: "1108 Crossvine Trail Durham, NC 27703",
        start: "20260208T173000",
        end: "20260208T220000"
    };

    // Construct .ics content
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Super Bowl Invite//EN",
        "BEGIN:VEVENT",
        `UID:${Date.now()}@superbowlinvite`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;TZID=America/New_York:${event.start}`,
        `DTEND;TZID=America/New_York:${event.end}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description}`,
        `LOCATION:${event.location}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'superbowl_party.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
