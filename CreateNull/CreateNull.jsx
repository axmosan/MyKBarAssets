(function() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("コンポジションを選択してください。");
        return;
    }

    var selectedLayers = comp.selectedLayers;
    app.beginUndoGroup("Create Shape Null Layer");

    // シェイプヌルを作成
    var shapeNullLayer = comp.layers.addShape();

    // 命名
    if (selectedLayers.length > 0) {
        shapeNullLayer.name = "null_" + selectedLayers[0].name;
    } else {
        shapeNullLayer.name = "null_empty";
    }
    shapeNullLayer.label = 16; // Orange

    // シェイプのコンテンツ設定（100x100の矩形パスのみ）
    var rootGroup = shapeNullLayer.property("ADBE Root Vectors Group");
    var rectShape = rootGroup.addProperty("ADBE Vector Shape - Rect");
    rectShape.property("ADBE Vector Rect Size").setValue([100, 100]);

    if (selectedLayers.length > 0) {
        var avgPos = [0, 0, 0];
        var count = 0;
        var is3D = false;

        // 選択レイヤーの位置と3D状態を取得
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            try {
                var pVal = [0, 0, 0];
                var layerIs3D = layer.threeDLayer;

                // 次元分割に対応した位置取得
                if (layer.transform.position.dimensionsSeparated) {
                    pVal[0] = layer.transform.xPosition.value;
                    pVal[1] = layer.transform.yPosition.value;
                    if (layerIs3D) {
                        pVal[2] = layer.transform.zPosition.value;
                    }
                } else {
                    var val = layer.transform.position.value;
                    pVal[0] = val[0];
                    pVal[1] = val[1];
                    if (layerIs3D) pVal[2] = val[2];
                }

                if (layerIs3D) is3D = true;

                avgPos[0] += pVal[0];
                avgPos[1] += pVal[1];
                if (layerIs3D) avgPos[2] += pVal[2];
                
                count++;
            } catch(e) {
                // エラー時はスキップして処理を続行
            }
        }

        // 平均位置の算出
        if (count > 0) {
            avgPos[0] /= count;
            avgPos[1] /= count;
            avgPos[2] /= count;
        } else {
            avgPos = [comp.width / 2, comp.height / 2, 0];
        }

        // ヌルの3D化と位置設定
        if (is3D) {
            shapeNullLayer.threeDLayer = true;
            shapeNullLayer.transform.position.setValue(avgPos);
        } else {
            shapeNullLayer.threeDLayer = false;
            shapeNullLayer.transform.position.setValue([avgPos[0], avgPos[1]]);
        }

        // レイヤー順序とデュレーション設定
        var targetLayer = selectedLayers[0];
        shapeNullLayer.moveBefore(targetLayer);
        shapeNullLayer.inPoint = targetLayer.inPoint;
        shapeNullLayer.outPoint = targetLayer.outPoint;

        // 親子付け
        for (var i = 0; i < selectedLayers.length; i++) {
            try {
                if (selectedLayers[i] !== shapeNullLayer) {
                    selectedLayers[i].parent = shapeNullLayer;
                }
            } catch(e) {
                // 親子付け失敗時も停止させない
            }
        }
    } else {
        // 選択なし時は中央配置
        shapeNullLayer.transform.position.setValue([comp.width / 2, comp.height / 2]);
    }

    // スケールリセット
    shapeNullLayer.transform.scale.setValue([100, 100]);

    app.endUndoGroup();
})();