// コンポジションのワークエリア、デュレーションを指定した範囲にクロップできるスクリプト

// 選択レイヤーあり： 選択したレイヤーの中で一番後ろのタイミングに設定。
// 選択レイヤーなし： コンポジション内の全レイヤーを走査し、一番後ろのタイミングに設定。
// Altキー： 上記の基準位置でコンポジションのデュレーション自体をトリミング。

(function() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        return;
    }

    // Altキー判定
    var isAltPressed = false;
    try {
        isAltPressed = ScriptUI.environment.keyboardState.altKey;
    } catch(e) {}

    var undoName = isAltPressed ? "Trim Comp Duration to Last Layer" : "Set Work Area End to Last Layer";
    app.beginUndoGroup(undoName);

    var newEnd = 0;
    var selLayers = comp.selectedLayers;

    if (selLayers.length > 0) {
        // 【選択あり】選択レイヤーの中で最大のアウトポイントを探す
        for (var i = 0; i < selLayers.length; i++) {
            if (selLayers[i].outPoint > newEnd) {
                newEnd = selLayers[i].outPoint;
            }
        }
    } else {
        // 【選択なし】コンポ内の全レイヤーの中で最大のアウトポイントを探す
        if (comp.numLayers > 0) {
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                if (layer.outPoint > newEnd) {
                    newEnd = layer.outPoint;
                }
            }
        } else {
            // レイヤーが1つもない場合は、現在のコンポの長さのままにする（変更しない）
            newEnd = comp.duration;
        }
    }

    if (isAltPressed) {
        // --- Altモード: コンポジションのデュレーションを変更 ---
        
        // 0秒以下にならないように最低1フレームは確保
        if (newEnd < comp.frameDuration) newEnd = comp.frameDuration;
        
        comp.duration = newEnd;

    } else {
        // --- 通常モード: ワークエリアの終了位置を変更 ---
        
        // 終了位置が開始位置より手前にならないようにチェック
        if (newEnd > comp.workAreaStart) {
            comp.workAreaDuration = newEnd - comp.workAreaStart;
        } else {
            // 開始位置より手前の場合、最小単位（1フレーム）にする
            comp.workAreaDuration = comp.frameDuration;
        }
    }

    app.endUndoGroup();
})();