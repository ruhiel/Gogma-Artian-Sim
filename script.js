/**
 * シミュレーションのメイン処理
 */
function calculateSimulation() {
    const partsDisplayName = { atk: "攻撃", crt: "会心", elm: "属性" };

    const atkVal = document.getElementById("atk").value;
    const crtVal = document.getElementById("crt").value;
    const elmVal = document.getElementById("elm").value;
    // --- 最低残す数の取得 ---
    const minReserve = Number(document.getElementById("min-reserve").value) || 0;

    const outBody = document.getElementById("out-body");

    // --- 遺装置の入力チェック ---
    if (atkVal === "" || crtVal === "" || elmVal === "") {
        showError(outBody, "遺装置の数をすべて入力してください。");
        return;
    }

    let parts = {
        atk: Number(atkVal),
        crt: Number(crtVal),
        elm: Number(elmVal)
    };

    if (parts.atk === 0 && parts.crt === 0 && parts.elm === 0) {
        showError(outBody, "遺装置がすべて0です。厳選を開始できません。");
        return;
    }

    // --- 当たり回数の入力チェック ---
    const hitsInput = document.getElementById("hits").value;
    if (!hitsInput.trim()) {
        showError(outBody, "当たり回数を入力してください。");
        return;
    }

    const weaponsInput = document.getElementById("weapons").value;
    const weaponList = weaponsInput.split(",").map(w => w.trim());
    const rawHits = hitsInput.split(",");
    const tempHitList = [];
    const seenHits = new Set();

    for (let v of rawHits) {
        let num = Number(v.trim());
        if (v.trim() === "" || isNaN(num)) {
            showError(outBody, "当たり回数は数値をカンマ区切りで入力してください。");
            return;
        }
        if (num === 0) {
            showError(outBody, "当たり回数に 0 を含めることはできません。");
            return;
        }
        if (seenHits.has(num)) {
            showError(outBody, `当たり回数「${num}」が重複しています。`);
            return;
        }
        seenHits.add(num);
        tempHitList.push(num);
    }

    // 回数と武器名をペアにしてソート
    const combinedList = tempHitList.map((hit, i) => ({
        hit,
        weapon: weaponList[i] !== undefined ? weaponList[i] : ""
    }));
    combinedList.sort((a, b) => a.hit - b.hit);

    const hitList = combinedList.map(item => item.hit);
    const sortedWeapons = combinedList.map(item => item.weapon);

    // --- 計算処理 ---
    outBody.innerHTML = "";
    const selectedTarget = document.querySelector('input[name="target"]:checked').value;
    const intervalList = calculateIntervals(hitList);

    for (let i = 0; i < intervalList.length; i++) {
        const interval = intervalList[i];
        const hitCount = hitList[i];
        const weaponName = sortedWeapons[i];
        let skipValue = (interval - 1) * 3;

        // --- 1. 調整（スキップ）分の消費判定 ---
        if (skipValue > 0) {
            // 【変更】全パーツの中から最も所持数が多いキーを毎回判定
            let currentAdjustmentKey = getHighestPriorityKey(parts);

            // 選定した「一番多いパーツ」でも最低残数を下回る場合はエラー中断
            if (parts[currentAdjustmentKey] - skipValue < minReserve) {
                showError(outBody, `調整中に「${partsDisplayName[currentAdjustmentKey]}」が最低残数(${minReserve})を下回るため中断しました。`);
                return;
            }

            consumeParts(parts, currentAdjustmentKey, skipValue);
            addRow(outBody, parts, `${partsDisplayName[currentAdjustmentKey]} を ${skipValue} 消費 (調整)`);
        } else {
            addRow(outBody, parts, `(調整なし)`);
        }

        // --- 2. 当たり分の消費判定 ---
        if (parts[selectedTarget] - 3 < minReserve) {
            showError(outBody, `当たり時に「${partsDisplayName[selectedTarget]}」が最低残数(${minReserve})を下回るため中断しました。`);
            return;
        }

        consumeParts(parts, selectedTarget, 3);
        const weaponLabel = weaponName ? ` [${weaponName}]` : "";
        addRow(outBody, parts, `<span class="hit-row">${partsDisplayName[selectedTarget]} を 3 消費 (${hitCount}回目：当たり${weaponLabel})</span>`);
    }
}

/**
 * エラー表示
 */
function showError(container, message) {
    alert(`エラー: ${message}`);
    container.innerHTML = "";
}

/**
 * テーブル 行追加
 */
function addRow(container, parts, actionHtml) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${parts.atk}</td>
        <td>${parts.crt}</td>
        <td>${parts.elm}</td>
        <td class="target-cell">${actionHtml}</td>
      `;
    container.appendChild(row);
}

/**
 * インターバル（前回の当たりからの差分）を計算
 */
function calculateIntervals(list) {
    if (list.length === 0) return [];
    let intervals = [list[0]];
    for (let i = 1; i < list.length; i++) {
        intervals.push(list[i] - list[i - 1]);
    }
    return intervals;
}

/**
 * 【変更】全パーツの中で、最も所持数が多いキーを取得する（引き数なし）
 */
function getHighestPriorityKey(parts) {
    let maxKey = "atk";
    if (parts.crt > parts[maxKey]) maxKey = "crt";
    if (parts.elm > parts[maxKey]) maxKey = "elm";
    return maxKey;
}

/**
 * パーツを消費
 */
function consumeParts(parts, key, value) {
    parts[key] -= value;
}