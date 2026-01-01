/**
 * シミュレーションのメイン処理
 */
function calculateSimulation() {
    const partsDisplayName = {
        atk: "攻撃",
        crt: "会心",
        elm: "属性",
    };

    let parts = {
        atk: Number(document.getElementById("atk").value),
        crt: Number(document.getElementById("crt").value),
        elm: Number(document.getElementById("elm").value)
    };

    const hitsInput = document.getElementById("hits").value;
    const weaponsInput = document.getElementById("weapons").value; // 追加
    const outBody = document.getElementById("out-body");

    // --- 入力バリデーション ---

    if (!hitsInput.trim()) {
        showError(outBody, "当たり回数を入力してください。");
        return;
    }

    // 武器名のパース
    const weaponList = weaponsInput.split(",").map(w => w.trim()).filter(w => w !== "");

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

    // 回数と武器名の数が一致するかチェック
    if (tempHitList.length !== weaponList.length) {
        showError(outBody, `当たり回数(${tempHitList.length})と武器名(${weaponList.length})の数が一致しません。`);
        return;
    }

    // 回数と武器名をペアにして、回数順にソートする
    const combinedList = tempHitList.map((hit, i) => ({ hit, weapon: weaponList[i] }));
    combinedList.sort((a, b) => a.hit - b.hit);

    // ソート後のリストから再度配列を抽出
    const hitList = combinedList.map(item => item.hit);
    const sortedWeapons = combinedList.map(item => item.weapon);

    // --- 計算処理 ---
    outBody.innerHTML = "";
    const selectedTarget = document.querySelector('input[name="target"]:checked').value;
    let currentAdjustmentKey = getHighestPriorityKey(parts, selectedTarget);
    const intervalList = calculateIntervals(hitList);

    for (let i = 0; i < intervalList.length; i++) {
        const interval = intervalList[i];
        const hitCount = hitList[i];
        const weaponName = sortedWeapons[i]; // 現在の武器名
        let skipValue = (interval - 1) * 3;

        currentAdjustmentKey = determineAdjustmentKey(parts, selectedTarget, currentAdjustmentKey, skipValue);

        if (skipValue > 0) {
            consumeParts(parts, currentAdjustmentKey, skipValue);
            if (parts[currentAdjustmentKey] < 0) {
                showError(outBody, `調整中に「${partsDisplayName[currentAdjustmentKey]}」が不足しました。`);
                return;
            }
            addRow(outBody, parts, `${partsDisplayName[currentAdjustmentKey]} を ${skipValue} 消費 (調整)`);
        } else {
            addRow(outBody, parts, `(調整なし)`);
        }

        consumeParts(parts, selectedTarget, 3);
        if (parts[selectedTarget] < 0) {
            showError(outBody, `当たり時に「${partsDisplayName[selectedTarget]}」が不足しました。`);
            return;
        }
        // ここに武器名を表示
        addRow(outBody, parts, `<span class="hit-row">${partsDisplayName[selectedTarget]} を 3 消費 (${hitCount}回目：当たり [${weaponName}])</span>`);
    }
}

/**
 * 以下、showError, addRow, determineAdjustmentKey, calculateIntervals, 
 * getHighestPriorityKey, consumeParts の各関数は変更なし
 */

function showError(container, message) {
    alert(`エラー: ${message}`);
    container.innerHTML = "";
}

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

function determineAdjustmentKey(parts, target, currentKey, requiredValue) {
    if (parts[currentKey] >= requiredValue) {
        return currentKey;
    } else {
        return getHighestPriorityKey(parts, target);
    }
}

function calculateIntervals(list) {
    if (list.length === 0) return [];
    let intervals = [list[0]];
    for (let i = 1; i < list.length; i++) {
        intervals.push(list[i] - list[i - 1]);
    }
    return intervals;
}

function getHighestPriorityKey(parts, excludedTarget) {
    let keys = ["atk", "crt", "elm"].filter(k => k !== excludedTarget);
    return parts[keys[0]] > parts[keys[1]] ? keys[0] : keys[1];
}

function consumeParts(parts, key, value) {
    parts[key] -= value;
}