const items = [
    { id: "apple", name: "Apple", price: 50, history: [50], min: 30, max: 70, color: "#ef4444", emoji: "" },
    { id: "banana", name: "Banana", price: 30, history: [30], min: 15, max: 45, color: "#eab308", emoji: "" },
    { id: "carrot", name: "Carrot", price: 40, history: [40], min: 20, max: 60, color: "#f97316", emoji: "" },
    { id: "watermelon", name: "Watermelon", price: 100, history: [100], min: 60, max: 140, color: "#10b981", emoji: "" }
];

let participants = [
    player("You (Player)", true),
    player("Bot Alice"),
    player("Bot Bob"),
    player("Bot Charlie"),
    player("Bot Daisy")
];

let timeLeft = 120;
let timerInterval;
let gameInterval;
let chart;
let chartLabels = ["0s"];

function player(name, isPlayer = false) {
    return {
        name,
        isPlayer,
        coins: 1000,
        inventory: { apple: 0, banana: 0, carrot: 0, watermelon: 0 }
    };
}

function showgame() {
    document.getElementById("starter").classList.add("hidden");
    document.getElementById("game-container").classList.remove("hidden");
    initChart();
    renderMarket();
    renderLeaderboard();
    timerInterval = setInterval(updateTimer, 1000);
    gameInterval = setInterval(gameTick, 2000);
}

function updateTimer() {
    timeLeft--;
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");
    document.getElementById("timer").innerText = `${minutes}:${seconds}`;
    if (timeLeft <= 0) endGame();
}

function gameTick() {
    items.forEach(item => {
        let price = item.price + Math.floor(Math.random() * 17) - 8;
        if (price < item.min) price = item.min + Math.floor(Math.random() * 5);
        if (price > item.max) price = item.max - Math.floor(Math.random() * 5);

        item.price = Math.max(5, price);
        item.history.push(item.price);
        if (item.history.length > 20) item.history.shift();
    });

    runBots();
    chartLabels.push(`${120 - timeLeft}s`);
    if (chartLabels.length > 20) chartLabels.shift();
    updateChart();
    renderMarket();
    renderLeaderboard();
}

function runBots() {
    participants.filter(participant => !participant.isPlayer).forEach(bot => {
        const item = items[Math.floor(Math.random() * items.length)];
        if (Math.random() > 0.5) {
            const quantity = Math.floor(Math.random() * 3) + 1;
            const cost = item.price * quantity;
            if (bot.coins >= cost) {
                bot.coins -= cost;
                bot.inventory[item.id] += quantity;
                logActivity(`${bot.name} bought ${quantity}x ${item.name} for ${cost} coins`);
            }
        } else if (bot.inventory[item.id] > 0) {
            const quantity = Math.min(bot.inventory[item.id], Math.floor(Math.random() * 3) + 1);
            const revenue = item.price * quantity;
            bot.inventory[item.id] -= quantity;
            bot.coins += revenue;
            logActivity(`${bot.name} sold ${quantity}x ${item.name} for ${revenue} coins`);
        }
    });
}

function buyItem(itemId) {
    const item = items.find(entry => entry.id === itemId);
    const player = participants[0];

    if (player.coins < item.price) {
        alert("Not enough coins to buy this item!");
        return;
    }

    player.coins -= item.price;
    player.inventory[itemId]++;
    logActivity(`You bought 1x ${item.name} at ${item.price} coins.`);
    renderMarket();
    renderLeaderboard();
}

function sellItem(itemId) {
    const item = items.find(entry => entry.id === itemId);
    const player = participants[0];

    if (player.inventory[itemId] === 0) {
        alert("You don't have any of this item to sell!");
        return;
    }

    player.inventory[itemId]--;
    player.coins += item.price;
    logActivity(`You sold 1x ${item.name} at ${item.price} coins.`);
    renderMarket();
    renderLeaderboard();
}

function logActivity(message) {
    const log = document.getElementById("activity-log");
    const entry = document.createElement("div");
    entry.innerText = `> ${message}`;
    log.prepend(entry);
    if (log.children.length > 30) log.removeChild(log.lastChild);
}

function renderMarket() {
    const player = participants[0];
    document.getElementById("player-coins").innerText = player.coins;

    const grid = document.getElementById("items-grid");
    grid.innerHTML = items.map(item => {
        const owned = player.inventory[item.id] || 0;
        return `
            <div class="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-md flex flex-col justify-between border border-slate-200 hover:shadow-lg transition">
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold text-lg text-slate-800">${item.name}</h4>
                        <span class="text-s px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">Box: ${item.min}-${item.max}</span>
                    </div>
                    <div class="text-3xl font-black text-black-600 my-2">${item.price} <span class="text-sm font-semibold text-slate-500">coins</span></div>
                    <div class="text-xs text-slate-600 mb-3">You Own: <strong class="text-slate-900 text-sm">${owned}</strong></div>
                </div>
                <div class="grid grid-cols-2 gap-2 mt-2">
                    <button onclick="buyItem('${item.id}')" class="bg-emerald-300 hover:bg-emerald-600 active:scale-95 text-white font-bold py-2 px-3 rounded-xl text-sm transition">Buy</button>
                    <button onclick="sellItem('${item.id}')" class="bg-rose-300 hover:bg-rose-600 active:scale-95 text-white font-bold py-2 px-3 rounded-xl text-sm transition">Sell</button>
                </div>
            </div>
        `;
    }).join("");
}

function netWorth(participant) {
    const inventoryValue = items.reduce(
        (total, item) => total + (participant.inventory[item.id] || 0) * item.price,
        0
    );
    return participant.coins + inventoryValue;
}

function renderLeaderboard() {
    const leaderboard = document.getElementById("leaderboard");
    leaderboard.innerHTML = [...participants]
        .sort((a, b) => netWorth(b) - netWorth(a))
        .map((participant, index) => `
            <div class="flex justify-between items-center p-2 rounded-lg ${
                participant.isPlayer
                    ? "bg-gray-100 border border-gray-300 font-bold"
                    : "bg-slate-50"
            }">
                <div class="flex items-center gap-2">
                    <span class="w-5 text-center font-bold text-slate-500">#${index + 1}</span>
                    <span>${participant.name}</span>
                </div>
                <div class="text-right">
                    <span class="font-bold text-slate-800">${netWorth(participant)}</span>
                    <span class="text-xs text-slate-500 block">(${participant.coins} coins)</span>
                </div>
            </div>
        `).join("");
}

function initChart() {
    const context = document.getElementById("marketChart").getContext("2d");
    chart = new Chart(context, {
        type: "line",
        data: {
            labels: chartLabels,
            datasets: items.map(item => ({
                label: `${item.name} ${item.emoji}`,
                data: [...item.history],
                borderColor: item.color,
                backgroundColor: item.color,
                tension: 0.2,
                borderWidth: 2
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "top" } },
            scales: {
                y: { beginAtZero: false, grid: { color: "#f1f5f9" } },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateChart() {
    if (!chart) return;
    chart.data.labels = chartLabels;
    items.forEach((item, index) => {
        chart.data.datasets[index].data = [...item.history];
    });
    chart.update();
}

function endGame() {
    clearInterval(timerInterval);
    clearInterval(gameInterval);

    participants.forEach(participant => {
        items.forEach(item => {
            participant.coins += participant.inventory[item.id] * item.price;
            participant.inventory[item.id] = 0;
        });
    });

    const sorted = [...participants].sort((a, b) => b.coins - a.coins);
    const winner = sorted[0];
    const announce = document.getElementById("winner-announcement");
    announce.innerText = winner.isPlayer
        ? ` You Won with ${winner.coins} coins!`
        : ` ${winner.name} Won with ${winner.coins} coins!`;

    const results = document.getElementById("final-results");
    results.innerHTML = "<h4 class='font-bold mb-2 text-slate-700'>Final Standings:</h4>";
    sorted.forEach((participant, index) => {
        results.innerHTML += `
            <div class="flex justify-between py-1 border-b border-slate-200">
                <span>#${index + 1} ${participant.name}</span>
                <span class="font-bold">${participant.coins} coins</span>
            </div>
        `;
    });

    document.getElementById("game-over-modal").classList.remove("hidden");
}
