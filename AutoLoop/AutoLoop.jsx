// タイムリマップ可能なもののみに反応。今後はテキストなど時間情報を持たないものに対しても最後のレイヤーを引き伸ばすようにする修正もあり。

(function() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("コンポジションが選択されていないか、無効な項目です。");
        return;
    }

    var selLayers = comp.selectedLayers;
    if (selLayers.length === 0) {
        alert("レイヤーを選択してください。");
        return;
    }

    app.beginUndoGroup("Apply Loop Expression");

    for (var i = 0; i < selLayers.length; i++) {
        var layer = selLayers[i];

        // タイムリマップが可能かチェック
        if (layer.canSetTimeRemapEnabled) {
            layer.timeRemapEnabled = true;
            var tr = layer.property("Time Remap");

            if (tr.numKeys >= 2) {
                var lastKeyIndex = tr.numKeys;
                var lastKeyTime = tr.keyTime(lastKeyIndex);
                var firstKeyValue = tr.keyValue(1);

                // 最後のキーフレームの「1フレーム後」の時間
                var targetTime = lastKeyTime + comp.frameDuration;

                // 既にその時間にキーフレームがあるか確認して削除（二重適用防止）
                var existingKeyIndex = tr.nearestKeyIndex(targetTime);
                if (existingKeyIndex > 0 && existingKeyIndex <= tr.numKeys) {
                    // 浮動小数点の誤差を考慮して時間を比較
                    if (Math.abs(tr.keyTime(existingKeyIndex) - targetTime) < 0.0001) {
                         try { tr.removeKey(existingKeyIndex); } catch(e){}
                    }
                }

                // 1フレーム後に「0フレーム目」の画を入れることでループをつなぐ
                tr.setValueAtTime(targetTime, firstKeyValue);
                
                // 最後のキーフレーム（今打ったやつ）をリニア補間にする（念のため）
                tr.setInterpolationTypeAtKey(tr.numKeys, KeyframeInterpolationType.LINEAR);

                // エクスプレッション適用
                tr.expression = "loopOut('cycle');";
            } else {
                tr.expression = "value;";
            }

            // レイヤーのアウトポイントをコンポジションの最後まで伸ばす
            layer.outPoint = comp.duration;
            
        } else {
            // 平面やテキストなど、タイムリマップできないものはスキップ
            // alert(layer.name + " にはタイムリマップを適用できません。");
        }
    }

    app.endUndoGroup();
})();