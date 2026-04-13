(function() {
    var comp = app.project.activeItem;

    if (!comp || !(comp instanceof CompItem)) {
        alert("コンポジションを開いてください。");
        return;
    }

    if (comp.selectedLayers.length !== 1) {
        alert("レイヤーを1つだけ選択してください。");
        return;
    }

    app.beginUndoGroup("Mirror Tile Surround");

    var originalLayer = comp.selectedLayers[0];
    var curTime = comp.time;

    // 現在のトランスフォーム値を取得
    var origPos = originalLayer.property("Position").value;
    var origScale = originalLayer.property("Scale").value;
    
    // レイヤーの見た目の矩形サイズ（バウンディングボックス）を取得
    // false = エフェクトやマスクを考慮しない（元の画像の矩形）
    // true = マスクなどを考慮する。今回は画像の端＝元の矩形として false で取得しますが、
    // マスクで切り抜いた形状に合わせたい場合はここを true にしてください。
    var rect = originalLayer.sourceRectAtTime(curTime, false);

    // スケールを考慮した「画面上での実寸幅・高さ」を計算
    // scaleは[x, y, z]の配列なので、パーセンテージ(100)で割る
    var realW = rect.width * (origScale[0] / 100);
    var realH = rect.height * (origScale[1] / 100);

    // 3x3ループ（x: -1(左), 0(中央), 1(右) / y: -1(上), 0(中央), 1(下)）
    for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
            
            // 中央（0, 0）はオリジナルなのでスキップ
            if (x === 0 && y === 0) continue;

            var dupLayer = originalLayer.duplicate();
            dupLayer.name = "Mirror_" + x + "_" + y;
            
            // 複製レイヤーはオリジナルの下に配置（整理のため）
            dupLayer.moveAfter(originalLayer);

            // 位置の計算
            // オリジナルの位置 + (方向 * 実寸サイズ)
            var newPosX = origPos[0] + (x * realW);
            var newPosY = origPos[1] + (y * realH);
            
            dupLayer.property("Position").setValue([newPosX, newPosY]);

            // スケール（ミラー）の計算
            var newScaleX = origScale[0];
            var newScaleY = origScale[1];

            // 左右（xが0以外）にあるものは、左右反転
            if (x !== 0) {
                newScaleX *= -1;
            }
            // 上下（yが0以外）にあるものは、上下反転
            if (y !== 0) {
                newScaleY *= -1;
            }

            dupLayer.property("Scale").setValue([newScaleX, newScaleY]);
        }
    }

    app.endUndoGroup();
})();