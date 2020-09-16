// Copyright (C) 2019 by Shigeru Chiba.

// the following code depends on scriptorium.js

Scriptorium.Msg = {}

// for scriptorium.js
Scriptorium.Msg.run = '実行'
Scriptorium.Msg.stop = '停止'
Scriptorium.Msg.alert = (line, e) => `エラー：プログラムを実行できません（${line} 行目）\n${e}`
Scriptorium.Msg.save = '今編集中のプログラムを保存しますか？\n' +
                       '以前保存したプログラムは消去されます。'
Scriptorium.Msg.load = '保存済みのプログラムを開きますか？\n' +
                       '今編集中のプログラムは消去されます。'
Scriptorium.Msg.zoomIn = '文字拡大'
Scriptorium.Msg.zoomOut = '文字縮小'

// for turtle.js

Scriptorium.Msg.assertNum = name => `${name} への引数が数値ではありません。`
