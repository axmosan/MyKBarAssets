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

    app.beginUndoGroup("Fix and Center Shape Layers");

    var compCenterX = comp.width / 2;
    var compCenterY = comp.height / 2;

    for (var i = 0; i < originalSelectedLayers.length; i++) {
        var layer = originalSelectedLayers[i];

        if (layer instanceof ShapeLayer) {
            // Step 1: コマンド実行のため、対象レイヤーのみを選択状態にする
            for (var k = 0; k < comp.layers.length; k++) {
                if (comp.layers[k + 1].selected) {
                    comp.layers[k + 1].selected = false;
                }
            }
            layer.selected = true;

            // Step 2: シェイプ内部のグループトランスフォーム(位置・アンカーポイント)をリセット
            // これを行わないと、見た目の中心と実際のプロパティ値がズレて使いにくくなるため
            var contents = layer.property("Contents");
            for (var j = 1; j <= contents.numProperties; j++) {
                var shapeGroup = contents.property(j);
                if (shapeGroup.matchName === "ADBE Vector Group" && shapeGroup.property("Transform")) {
                    var transformGroup = shapeGroup.property("Transform");
                    if (transformGroup.property("Anchor Point")) {
                        transformGroup.property("Anchor Point").setValue([0, 0]);
                    }
                    if (transformGroup.property("Position")) {
                        transformGroup.property("Position").setValue([0, 0]);
                    }
                }
            }

            // Step 3: レイヤー自体のアンカーポイントを仮リセット
            if (layer.threeDLayer) {
                layer.transform.anchorPoint.setValue([0, 0, 0]);
            } else {
                layer.transform.anchorPoint.setValue([0, 0]);
            }

            // Step 4: 「レイヤーコンテンツでアンカーポイントを中央に配置」コマンドを実行
            // AE標準機能を使って正確なバウンディングボックスの中心を取得
            try {
                app.executeCommand(2133); // Center Anchor Point in Layer Content
            } catch (e) {
                // コマンド失敗時はスルー
            }

            // Step 5: レイヤーをコンポジションの中央に移動
            var currentPos = layer.transform.position.value;
            if (layer.threeDLayer) {
                layer.transform.position.setValue([compCenterX, compCenterY, currentPos[2]]);
            } else {
                layer.transform.position.setValue([compCenterX, compCenterY]);
            }
        }
    }

    // Step 6: 元の選択状態に戻す
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