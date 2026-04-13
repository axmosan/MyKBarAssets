(function () {
    app.beginUndoGroup("Purge All Caches");

    try {
        // メモリキャッシュとディスクキャッシュの両方をパージ（標準の確認ダイアログを表示）
        app.purge(PurgeTarget.ALL_CACHES);
    } catch (e) {
        alert("キャッシュの消去に失敗しました。\n" + e.toString());
    }

    app.endUndoGroup();
})();