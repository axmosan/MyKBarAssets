(function() {
    function findSolidSourceItemByName(itemName, comp) {
        var items = app.project.items;
        for (var i = 1; i <= items.length; i++) {
            var item = items[i];
            if (item.name === itemName && item instanceof FootageItem && item.mainSource instanceof SolidSource) {
                if (item.width === comp.width && item.height === comp.height && item.pixelAspect === comp.pixelAspect) {
                    return item;
                }
            }
        }
        return null;
    }

    function setupNewLayer(newLayer, referenceLayer, comp) {
        if (referenceLayer) {
            newLayer.moveBefore(referenceLayer);
            newLayer.inPoint = referenceLayer.inPoint;
            newLayer.outPoint = referenceLayer.outPoint;
        } else {
            newLayer.startTime = comp.displayStartTime;
            newLayer.inPoint = comp.displayStartTime;
            newLayer.outPoint = comp.displayStartTime + comp.duration;
        }
    }

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("コンポジションを選択してください。");
        return;
    }

    app.beginUndoGroup("Create Adjustment Layer");

    // レイヤーを作成する前に、現在選択されているレイヤーを記憶する
    var selLayers = comp.selectedLayers;
    var targetLayer = selLayers.length > 0 ? selLayers[0] : null;

    var layerName = "Adjustment_" + comp.width + "x" + comp.height;
    var existingSolidItem = findSolidSourceItemByName(layerName, comp);
    
    // 平面を作成（調整レイヤー用）
    var newLayer = existingSolidItem ? comp.layers.add(existingSolidItem) : comp.layers.addSolid([0.5, 0.5, 0.5], layerName, comp.width, comp.height, comp.pixelAspect, comp.duration);
    
    newLayer.adjustmentLayer = true; // 調整レイヤー・スイッチをON
    newLayer.label = 5; // Cyan
    
    // 記憶しておいたレイヤーを基準に移動やデュレーション設定を行う
    setupNewLayer(newLayer, targetLayer, comp);
    
    app.endUndoGroup();
})();