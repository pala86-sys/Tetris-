export const GAME_RULES = {
  tetris: {
    title: '俄羅斯方塊 · 遊戲規則',
    html: `
      <section>
        <h3>目標</h3>
        <p>操控下落的方塊，排滿橫向一整行即可消除並得分。方塊堆到頂部無法生成新方塊時遊戲結束。</p>
      </section>
      <section>
        <h3>模式</h3>
        <ul>
          <li><strong>單人模式</strong>：挑戰高分，消除越多行難度越高。</li>
          <li><strong>雙人 PK</strong>：兩人同機對戰，先讓對手頂滿者勝。</li>
          <li><strong>對戰 AI</strong>：與電腦對戰，可選難度。</li>
          <li><strong>線上對戰</strong>：建立或加入房間，雙方準備後同步對戰。</li>
        </ul>
      </section>
      <section>
        <h3>操作</h3>
        <p><strong>玩家 1</strong>：← → 移動 · ↑ 旋轉 · ↓ 軟降 · 空白 硬降 · C 保留</p>
        <p><strong>玩家 2</strong>：A D 移動 · W 旋轉 · S 軟降 · F 硬降 · E 保留 · Q 逆旋轉</p>
        <p>遊戲中可按 P 或 Esc 暫停。</p>
      </section>
    `,
  },
  xiangqi: {
    title: '一般象棋 · 遊戲規則',
    html: `
      <section>
        <h3>目標</h3>
        <p>將死對方將（帥）即獲勝；若無法再移動則判負。</p>
      </section>
      <section>
        <h3>行棋</h3>
        <ul>
          <li>紅方先行，雙方輪流走一步。</li>
          <li>點選己方棋子，再點合法目標格移動；點錯可再點其他己方棋子重選。</li>
          <li>將（帥）不可離開九宮，且兩將不可在同一直線上無子相隔對望。</li>
        </ul>
      </section>
      <section>
        <h3>棋子走法（簡述）</h3>
        <ul>
          <li>車：直線任意格；炮：直線移動，吃子需隔一子跳過。</li>
          <li>馬：日字，別腳不可擋；象：田字，不可過河，中點不可塞。</li>
          <li>士：九宮內斜一步；兵／卒：過河前只能向前，過河後可加左右一步。</li>
        </ul>
      </section>
      <section>
        <h3>模式</h3>
        <p>支援雙人同機、單人對 AI、線上對戰（房主為紅方）。</p>
      </section>
    `,
  },
  dark: {
    title: '暗棋 · 遊戲規則',
    html: `
      <section>
        <h3>目標</h3>
        <p>吃掉對方所有棋子，或使對方無棋可動者勝。棋盤為 4×8，雙方各 16 枚暗棋。</p>
      </section>
      <section>
        <h3>回合</h3>
        <ul>
          <li>紅方先行。每回合可<strong>翻開</strong>一枚暗棋，或移動一枚已翻開的己方棋子。</li>
          <li>可翻開棋盤上任意面朝下的棋子（再按同一格確認翻開）。</li>
          <li>選中己方已翻開棋子後，再點目標格移動；若目標為對手暗棋，會先翻開再比大小。</li>
        </ul>
      </section>
      <section>
        <h3>移動與吃子</h3>
        <ul>
          <li>各棋子走法類似象棋簡化版（車直線、炮隔子、馬日字、象田字、士斜步、兵向前等）。</li>
          <li>吃子時依棋種大小比較（將＞士＞相＞車＞馬＞炮＞兵；兵可吃將）。</li>
          <li>較大者吃較小者；同級互吃則兩子皆移除。</li>
        </ul>
      </section>
      <section>
        <h3>模式</h3>
        <p>支援雙人同機、單人對 AI、線上對戰。</p>
      </section>
    `,
  },
  gomoku: {
    title: '五子棋 · 遊戲規則',
    html: `
      <section>
        <h3>目標</h3>
        <p>在 15×15 棋盤上，先讓己方棋子形成<strong>連續五子</strong>（橫、直、斜任一方向）者獲勝。</p>
      </section>
      <section>
        <h3>行棋</h3>
        <ul>
          <li>黑方先行，雙方輪流在空交叉點落一子。</li>
          <li>棋子落下後不可移動；先連五者勝，棋盤下滿無五連則和棋。</li>
        </ul>
      </section>
      <section>
        <h3>模式</h3>
        <p>支援雙人同機、單人對 AI（你執黑方）、線上對戰（房主為黑方、加入者為白方）。</p>
      </section>
    `,
  },
  othello: {
    title: '黑白棋 · 遊戲規則',
    html: `
      <section>
        <h3>目標</h3>
        <p>8×8 棋盤，終局時棋子較多的一方獲勝（含和棋）。</p>
      </section>
      <section>
        <h3>行棋</h3>
        <ul>
          <li>黑方先行。每手在可合法落子的空格下子（綠色提示格）。</li>
          <li>落子後必須能夾住對手至少一枚棋子，並將被夾住的一串棋子翻成己方顏色。</li>
          <li>若無合法步可下，該回合被跳過；若雙方皆無棋可下，對局結束。</li>
        </ul>
      </section>
      <section>
        <h3>計分</h3>
        <p>畫面上會顯示雙方棋子數。支援雙人同機、單人對 AI、線上對戰（房主為黑方）。</p>
      </section>
    `,
  },
};

let rulesOverlay = null;

export function showGameRules(key) {
  const data = GAME_RULES[key];
  if (!data || !rulesOverlay) return;

  const title = rulesOverlay.querySelector('#rules-title');
  const body = rulesOverlay.querySelector('#rules-body');
  if (title) title.textContent = data.title;
  if (body) body.innerHTML = data.html;
  rulesOverlay.classList.remove('hidden');
}

export function hideGameRules() {
  rulesOverlay?.classList.add('hidden');
}

export function initGameRules() {
  rulesOverlay = document.getElementById('rules-overlay');
  if (!rulesOverlay) return;

  document.querySelectorAll('[data-rules]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const key = btn.dataset.rules;
      if (key) showGameRules(key);
    });
  });

  const closeBtn = document.getElementById('rules-close-btn');
  closeBtn?.addEventListener('click', hideGameRules);

  rulesOverlay.addEventListener('click', (e) => {
    if (e.target === rulesOverlay) hideGameRules();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !rulesOverlay.classList.contains('hidden')) {
      hideGameRules();
    }
  });
}

/** 象棋模式面板：依目前選擇的棋種更新規則按鈕 */
export function updateChessRulesButton(variant) {
  const btn = document.getElementById('chess-rules-btn');
  if (btn && variant) btn.dataset.rules = variant;
}
