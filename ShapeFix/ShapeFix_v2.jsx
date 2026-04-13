// ShapeFix v2
// 従来のシェイプトランスフォームを整える機能はそのままに、シェイプが作られた位置を維持するように改良したバージョン

(function() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("コンポジションを選択してください。");
        return;
    }

    var originalSelectedLayers = [];
    for (var k = 0; k < comp.selectedLayers.length; k++) {
        originalSelectedLayers.push(comp.selectedLayers[k]);
    }

    if (originalSelectedLayers.length === 0) {
        alert("シェイプレイヤーを選択してください。");
        return;
    }

    app.beginUndoGroup("Fix Shape Layers (Keep Visual Position)");

    for (var i = 0; i < originalSelectedLayers.length; i++) {
        var layer = originalSelectedLayers[i];

        if (layer instanceof ShapeLayer) {
            // Step 1: コマンド実行のため、対象レイヤーのみを選択状態にする
            for (var k = 0; k < comp.layers.length; k++) {
                comp.layers[k + 1].selected = false;
            }
            layer.selected = true;

            // 変数準備
            var shapeOffset = [0, 0];
            var firstGroupFound = false;

            // Step 2: シェイプ内部の値を走査し、オフセット計算とリセットを行う
            var contents = layer.property("Contents");
            for (var j = 1; j <= contents.numProperties; j++) {
                var shapeGroup = contents.property(j);
                
                // "ADBE Vector Group" (グループ) のトランスフォームを探す
                if (shapeGroup.matchName === "ADBE Vector Group" && shapeGroup.property("Transform")) {
                    var transformGroup = shapeGroup.property("Transform");
                    
                    var gPos = [0, 0];
                    var gAnc = [0, 0];

                    if (transformGroup.property("Position")) {
                        gPos = transformGroup.property("Position").value;
                    }
                    if (transformGroup.property("Anchor Point")) {
                        gAnc = transformGroup.property("Anchor Point").value;
                    }

                    // 最初に見つかったグループの値を使って、レイヤー本体をずらす量を決定する
                    // (複数グループがある場合、すべて0にすると重なってしまうため、あくまで「描画直後の修正」として主グループを基準にする)
                    if (!firstGroupFound) {
                        // オフセット = グループの位置 - グループのアンカーポイント
                        shapeOffset = [gPos[0] - gAnc[0], gPos[1] - gAnc[1]];
                        firstGroupFound = true;
                    }

                    // 内部値をリセット (0,0)
                    if (transformGroup.property("Position")) {
                        transformGroup.property("Position").setValue([0, 0]);
                    }
                    if (transformGroup.property("Anchor Point")) {
                        transformGroup.property("Anchor Point").setValue([0, 0]);
                    }
                }
            }

            // Step 3: レイヤー本体の位置をオフセット分ずらして、見た目の位置を復元する
            if (firstGroupFound) {
                var layerPosProp = layer.transform.position;
                if (layerPosProp.dimensionsSeparated) {
                    // 次元分割されている場合
                    var currentX = layer.transform.xPosition.value;
                    var currentY = layer.transform.yPosition.value;
                    layer.transform.xPosition.setValue(currentX + shapeOffset[0]);
                    layer.transform.yPosition.setValue(currentY + shapeOffset[1]);
                } else {
                    // 次元分割されていない場合
                    var currentPos = layerPosProp.value;
                    var newPos = [currentPos[0] + shapeOffset[0], currentPos[1] + shapeOffset[1]];
                    // 3Dレイヤーの場合はZ値も保持
                    if (currentPos.length > 2) {
                        newPos.push(currentPos[2]);
                    }
                    layerPosProp.setValue(newPos);
                }
            }

            // Step 4: レイヤー自体のアンカーポイントを仮リセット
            // これをしておかないと、次のコマンド実行時に計算がズレることがあるため
            if (layer.threeDLayer) {
                layer.transform.anchorPoint.setValue([0, 0, 0]);
            } else {
                layer.transform.anchorPoint.setValue([0, 0]);
            }

            // Step 5: 「レイヤーコンテンツでアンカーポイントを中央に配置」コマンドを実行
            // これでアンカーポイントがシェイプの中心に来て、レイヤー位置もそれに合わせて微調整される
            try {
                app.executeCommand(2133); // Center Anchor Point in Layer Content
            } catch (e) {
                // 失敗時はスルー
            }
            
            // Step 6: 画面中央への強制移動 (960, 540) は行わない
            // これにより、ユーザーが描画した位置に留まる
        }
    }

    // Step 7: 元の選択状態に戻す
    for (var k = 0; k < comp.layers.length; k++) {
        comp.layers[k + 1].selected = false;
    }
    for (var k = 0; k < originalSelectedLayers.length; k++) {
        try {
            originalSelectedLayers[k].selected = true;
        } catch (e) {}
    }

    app.endUndoGroup();
})();