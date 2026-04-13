(function() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("コンポジションを開いてください。");
        return;
    }

    var selLayers = comp.selectedLayers;
    if (selLayers.length === 0) {
        alert("レイヤーを選択してください。");
        return;
    }
    
    // Altキーが押されているか判定
    // true: 隙間なく埋める (Cover/Max)
    // false: 全体が見えるように収める (Contain/Min)
    var isAltPressed = false;
    try {
        isAltPressed = ScriptUI.environment.keyboardState.altKey;
    } catch(e) {
        // 環境によってはScriptUIが取得できない場合があるため、その場合は通常モード(false)とする
    }

    var undoName = isAltPressed ? "Just Raster Scale (Cover)" : "Just Raster Scale (Contain)";
    app.beginUndoGroup(undoName);

    var compCenter = [comp.width / 2, comp.height / 2];

    for (var i = 0; i < selLayers.length; i++) {
        var layer = selLayers[i];

        // ソースを持たないレイヤー（テキストやシェイプなど）やAVLayer以外はスキップ
        if (!layer.source || !(layer instanceof AVLayer)) continue;

        var srcW, srcH;

        // ソース（元画像・元コンポ）の本来のサイズを取得
        if (layer.source instanceof CompItem) {
            srcW = layer.source.width;
            srcH = layer.source.height;
        } else if (layer.source.mainSource && typeof layer.source.mainSource.width !== "undefined" && layer.source.mainSource.width > 0) {
            srcW = layer.source.mainSource.width;
            srcH = layer.source.mainSource.height;
        } else {
            // フォールバック: sourceRectAtTime や 現在のスケールからの逆算
            var rect = layer.sourceRectAtTime(Math.max(0, Math.min(layer.inPoint, comp.time)), false);
            if (rect.width > 0 && rect.height > 0) {
                srcW = rect.width;
                srcH = rect.height;
            } else if (layer.width > 0 && layer.height > 0 && layer.transform.scale.value[0] !== 0 && layer.transform.scale.value[1] !== 0) {
                srcW = layer.width / (layer.transform.scale.value[0] / 100);
                srcH = layer.height / (layer.transform.scale.value[1] / 100);
            } else {
                continue;
            }
        }

        if (!srcW || !srcH) continue;

        // スケール率を計算
        var scaleX = (comp.width / srcW) * 100;
        var scaleY = (comp.height / srcH) * 100;
        
        // Altキーが押されていたら「大きい方（埋める）」、そうでなければ「小さい方（収める）」を採用
        var scale = isAltPressed ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);

        // スケール適用
        layer.transform.scale.setValue([scale, scale]);

        // アンカーポイントをソースの中央に再設定
        var anchorVal = layer.transform.anchorPoint.value;
        var newAnchor = (anchorVal.length === 2) ? [srcW / 2, srcH / 2] : [srcW / 2, srcH / 2, anchorVal[2]];
        layer.transform.anchorPoint.setValue(newAnchor);

        // 位置をコンポジションの中央に再設定
        var posVal = layer.transform.position.value;
        var newPos = (posVal.length === 2) ? compCenter : [compCenter[0], compCenter[1], posVal[2]];
        layer.transform.position.setValue(newPos);
    }

    app.endUndoGroup();
})();