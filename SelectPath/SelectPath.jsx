// パスを再帰的に検索して選択モードにするスクリプト
(function () {
    // --- パス探索（再帰） ---
    function findPaths(group, result) {
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);
            if (prop.matchName === "ADBE Vector Group") {
                // property(2) = グループ内の Contents
                findPaths(prop.property(2), result);
            } else if (prop.matchName === "ADBE Vector Shape - Group") {
                result.push(prop);
            }
        }
    }

    // --- バリデーション ---
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) return;

    var layers = comp.selectedLayers;
    if (layers.length !== 1) return;

    var layer = layers[0];
    if (layer.matchName !== "ADBE Vector Layer") return;

    // --- 実行 ---
    app.beginUndoGroup("Select Path");

    // 現在の選択プロパティを全解除
    var selProps = comp.selectedProperties;
    for (var i = 0; i < selProps.length; i++) {
        selProps[i].selected = false;
    }

    // 全パスプロパティを再帰収集して選択
    var paths = [];
    findPaths(layer.content, paths);
    for (var i = 0; i < paths.length; i++) {
        paths[i].selected = true;
    }

    app.endUndoGroup();
})();
