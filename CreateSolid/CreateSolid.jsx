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

    app.beginUndoGroup("Create Solid Layer");

    var selLayers = comp.selectedLayers;
    var targetLayer = selLayers.length > 0 ? selLayers[0] : null;

    var layerName = "Solid_" + comp.width + "x" + comp.height;
    var existingSolidItem = findSolidSourceItemByName(layerName, comp);
    
    var newLayer = existingSolidItem ? comp.layers.add(existingSolidItem) : comp.layers.addSolid([1, 1, 1], layerName, comp.width, comp.height, comp.pixelAspect, comp.duration);
    
    newLayer.adjustmentLayer = false;
    newLayer.label = 1; // Red
    
    setupNewLayer(newLayer, targetLayer, comp);
    
    app.endUndoGroup();
})();