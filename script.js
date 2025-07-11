const light = document.getElementById('light');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const result = document.getElementById('result');
const startButton = document.getElementById('start-button');
const startContainer = document.getElementById('start-container');

const patterns = [
  { color: 'yellow', expected: 'right', text: '黄色 → 右を押す' },
  { color: 'green', expected: 'left', text: '緑 → 左を押す' },
  { color: 'blue', expected: 'none', text: '青 → 押さない' },
];

let startTime = 0;
let currentPattern = null;
let trialCount = 0;
const maxTrials = 3;
const results = [];

let allowPress = false;
let pressed = false;
let trialInProgress = false;

function clearLight() {
  light.classList.remove('yellow', 'green', 'blue');
}

function startTrial() {
  clearLight();
  result.textContent = `試行 ${trialCount + 1} / ${maxTrials}`;

  currentPattern = patterns[Math.floor(Math.random() * patterns.length)];
  const delay = Math.random() * 700 + 300;

  pressed = false;
  allowPress = false;
  trialInProgress = true;

  setTimeout(() => {
    light.classList.add(currentPattern.color);
    allowPress = true;
    startTime = Date.now();

    setTimeout(() => {
      clearLight();
      allowPress = false;
      if (!pressed) {
        checkAnswer(null);
      }
    }, 300);
  }, delay);
}

function checkAnswer(buttonPressed) {
  if (!trialInProgress) return;
  trialInProgress = false;
  pressed = true;
  const now = Date.now();
  const reactionTime = startTime ? now - startTime : null;

  let correct = false;
  let message = '';
  let judgedTime = reactionTime !== null && allowPress;

  if (currentPattern.expected === 'none') {
    correct = buttonPressed === null;
    message = correct ? '正解（押さなかった）' : '不正解（青は押さない）';
  } else {
    if (buttonPressed === currentPattern.expected && judgedTime) {
      correct = true;
      message = `正解（${reactionTime}ms）`;
    } else if (buttonPressed === null) {
      message = '不正解（押し遅れ）';
    } else {
      message = `不正解（${currentPattern.text} なのに ${buttonPressed} を押した）`;
    }
  }

  results.push({
    trial: trialCount + 1,
    pattern: currentPattern.text,
    correct,
    reactionTime: correct && reactionTime ? reactionTime : null,
    message,
  });

  trialCount++;

  if (trialCount < maxTrials) {
    result.textContent = `${message}\n次の試行まで少々お待ちください…`;
    setTimeout(startTrial, 1500);
  } else {
    const correctCount = results.filter(r => r.correct).length;
    const totalTime = results.filter(r => r.reactionTime !== null).reduce((sum, r) => sum + r.reactionTime, 0);
    const avgTime = correctCount > 0 ? Math.round(totalTime / correctCount) : null;
    showFinalResults(correctCount, avgTime, results, result, maxTrials);
    setTimeout(() => {
      trialCount = 0;
      results.length = 0;
      result.textContent = '';
      startButton.disabled = false;
      startContainer.style.display = 'block';
    }, 6000);
  }
}

function getBestScore() {
  return JSON.parse(localStorage.getItem('reactionGameBest')) || {};
}

function setBestScore(rank, avgTime) {
  const previous = getBestScore();
  const betterTime = !previous.avgTime || avgTime < previous.avgTime;
  const betterRank = !previous.rank || rankOrder(rank) < rankOrder(previous.rank);
  if (betterTime || betterRank) {
    localStorage.setItem('reactionGameBest', JSON.stringify({ rank, avgTime }));
  }
}

function rankOrder(rank) {
  const order = { S: 1, A: 2, B: 3, C: 4, D: 5, E: 6 };
  return order[rank] || 999;
}

function getFunnyComment(rank) {
  switch (rank) {
    case 'S': return '見えない速さ。もはや反応ではなく予知！🔮';
    case 'A': return '君なら高速で飛ぶ蚊もつぶせるよ！🦟💥';
    case 'B': return 'おぉ、いい線いってる！でもまだ猫には勝てないかも😼';
    case 'C': return 'のんびり反応。眠そうだった？😪';
    case 'D': return 'カメよりは速い…いや、カメの勝ちかも？🐢💨';
    default: return 'それはもう芸術的なスローモーションだったよ…🎥🕰️';
  }
}

function calculateRank(correctCount, avgTime) {
  if (correctCount === 3 && avgTime <= 200) return 'S';
  if (correctCount === 3 && avgTime <= 300) return 'A';
  if (correctCount >= 2 && avgTime <= 400) return 'B';
  if (correctCount >= 1) return 'C';
  if (correctCount === 0) return 'D';
  return 'E';
}

function showFinalResults(correctCount, avgTime, results, resultDiv, maxTrials) {
  const rank = calculateRank(correctCount, avgTime);
  const comment = getFunnyComment(rank);
  setBestScore(rank, avgTime);
  const best = getBestScore();

  let summary = `=== 結果 ===\n`;
  summary += `正解数: ${correctCount} / ${maxTrials}\n`;
  summary += `平均反応時間: ${avgTime || '-'} ms\n`;
  summary += `評価ランク: ${rank}\n`;
  summary += `コメント: ${comment}\n\n`;

  summary += `--- 自己ベスト ---\n`;
  summary += `最高ランク: ${best.rank || 'なし'}\n`;
  summary += `最速平均反応: ${best.avgTime || '-'} ms\n\n`;

  results.forEach(r => {
    summary += `試行${r.trial}: ${r.pattern}\n${r.message}\n\n`;
  });

  resultDiv.textContent = summary;
}

btnLeft.addEventListener('click', () => {
  checkAnswer('left');
});

btnRight.addEventListener('click', () => {
  checkAnswer('right');
});

startButton.addEventListener('click', () => {
  startButton.disabled = true;
  startContainer.style.display = 'none';
  trialCount = 0;
  results.length = 0;
  result.textContent = '';
  startTrial();
});
