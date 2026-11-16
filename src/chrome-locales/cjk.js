// Chrome strings for Traditional Chinese, Japanese and Korean. Keys are the English source text;
// see chrome-i18n.js for how a missing key falls back to English.

/** @type {Record<string, Record<string, string>>} */
export const CJK_STRINGS = {
  "zh-Hant": {
    Conversation: "對話",
    "Show conversation": "打開對話",
    "Hide conversation": "收起對話",
    "Minimize conversation": "收起對話",
    Minimize: "收起",
    "New reply": "新回覆",
    "{n} queued": "{n} 則待傳送",
    " ({n} queued)": "（{n} 則待傳送）",
    " (new reply)": "（有新回覆）",
    "Session ended": "對話已結束",
    "Agent is working…": "智慧體正在處理…",
    "External listener active": "外部監聽已連線",
    "Agent listening": "智慧體在線",
    "Agent not listening": "智慧體未在線",
    More: "更多",
    Revisions: "修訂紀錄",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "修訂紀錄由智慧體寫在頁面裡。點「定位」會指向該次修訂標記的下一處內容，不會改動頁面樣式。",
    Reveal: "定位",
    "Reveal {pos}/{total}": "定位 {pos}/{total}",
    "Reveal the next block changed in {label}": "定位「{label}」修改的下一處內容",
    "Ask about selected text": "選取文字提問",
    "Toggle annotate/explore mode": "開關選字提問",
    Editing: "正在編輯",
    "Copy path": "複製路徑",
    Copy: "複製",
    Copied: "已複製",
    "Reload page": "重新載入頁面",
    "End session": "結束對話",
    "Take over here": "在這裡接手",
    "Check and reload": "檢查並重新載入",
    Dismiss: "關閉",
    Reload: "重新載入",
    "Message the agent, or select text on the page to ask about it": "傳訊息給智慧體，或在頁面上選取文字提問",
    "Select any sentence on the page to ask about it, or write a message below.":
      "在頁面上選取任意一句話就能提問，也可以在下方直接傳訊息給智慧體。",
    "Attach images": "加入圖片",
    "Send everything and end the session": "全部傳送並結束對話",
    "Send & End": "傳送並結束",
    "Send to Agent": "傳送",
    "Session ended.": "對話已結束。",
    "To talk here again, copy this and send it to any agent.": "想在這裡繼續對話，複製下面這段傳給任意一個智慧體。",
    "Talk with me in this Textcast window:": "用這個 Textcast 視窗和我對話：",
    "Then follow the next_step it prints.": "執行後依照它輸出的 next_step 繼續。",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "這個頁面已在另一個分頁開啟。未傳送的內容只保存在輸入它的分頁裡，在這裡接手不會帶過來。",
    "Your agent is not listening. If this persists, ask your agent to poll for updates from textcast.":
      "智慧體目前沒有在等待訊息。如果一直這樣，請讓智慧體重新開始監聽（poll）。",
    Agent: "智慧體",
    You: "我",
    Queued: "待傳送",
    "Sending…": "傳送中…",
    Cancel: "取消",
    Save: "儲存",
    "Edit queued prompt": "編輯待傳送內容",
    "Remove queued prompt": "刪除待傳送內容",
    "Image message": "圖片訊息",
    "Image annotation": "圖片註記",
    "Image expired": "圖片已過期",
    "{n} more image": "還有 {n} 張圖片",
    "{n} more images": "還有 {n} 張圖片",
    Seen: "已讀",
    Working: "處理中",
    Done: "完成",
    "Seen: not yet": "尚未讀取",
    "Working: not yet": "尚未開始處理",
    "Done: not yet": "尚未完成",
    "No agent is listening": "智慧體未在線",
    Delivering: "正在送達",
    "Agent is busy; delivered on its next poll": "智慧體正忙，下次監聽時送達",
    "The agent is still working. Your message is queued and sends when it is ready.":
      "智慧體還在處理，訊息已排隊，等它處理完會自動傳送。",
    "Unsent annotation": "未傳送的註記",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "頁面裡這則註記對應的內容被刪除或替換了，註記無法保留在原處。你寫的內容保存在這裡：",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "未傳送的內容只保存在輸入它的分頁裡，在別的視窗接手不會帶過去。",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "這個分頁裡沒有待傳送的內容。未傳送的內容只保存在輸入它的分頁裡，在別的視窗接手不會帶過去。",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "沒有可傳送的內容。如果想直接結束，請在「更多」選單（⋮）裡選「結束對話」。",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "仍在嘗試傳送。內容已保存在這個分頁，請保持頁面開啟，並確認服務仍在執行。",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "傳送失敗，內容仍在待傳送清單裡。請確認服務在執行，然後再點「傳送」。",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "傳送失敗，內容仍在待傳送清單裡。請確認服務在執行，然後再點「傳送並結束」。",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "5 秒內沒能準備好全部內容。對話仍然開著，待傳送的內容還可以編輯。",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "內容太大，傳送失敗，仍在待傳送清單裡。請刪掉一些內容或圖片後再試。",
    "Not sent — {detail}. Remove or fix the image, then send again.": "未傳送：{detail}。請刪除或更換圖片後再傳送。",
    "more than {n} images on one prompt": "一則訊息超過 {n} 張圖片",
    "too many images queued at once": "一次排入的圖片太多",
    "an image attachment was malformed": "有圖片格式損壞",
    "an image is no longer available": "有圖片已失效",
    "some attachments could not be delivered": "部分圖片無法送達",
    "Uploading…": "上傳中…",
    "Upload failed": "上傳失敗",
    Retry: "重試",
    Remove: "刪除",
    "Retry {name}": "重試 {name}",
    "Remove {name}": "刪除 {name}",
    "Remove image": "刪除圖片",
    "Could not read image": "無法讀取圖片",
    "Waiting for an image to finish uploading…": "正在等待圖片上傳完成…",
    "An image couldn't be attached. Retry or remove it before sending.": "有圖片沒能加入，請重試或刪掉後再傳送。",
    "An image couldn't be attached. Retry or remove it before queuing.": "有圖片沒能加入，請重試或刪掉後再加入待傳送。",
    "You can attach up to {n} image.": "最多可以加入 {n} 張圖片。",
    "You can attach up to {n} images.": "最多可以加入 {n} 張圖片。",
    "Image is larger than the {limit} limit": "圖片超過 {limit} 的大小限制",
    "Unsupported file type. Use {types}.": "不支援這種檔案，請使用 {types}。",
    "Too many uploads. Wait a moment and retry.": "上傳太頻繁，請稍後再試。",
    "Upload limit reached for this session ({limit}).": "本次對話的上傳額度已用完（{limit}）。",
    "Too many uploads in flight. Wait a moment and retry.": "同時上傳的圖片太多，請稍後再試。",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat 已更新，這個頁面還是舊版本。",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat 已重新啟動並換成本機建置，這個頁面還是之前的版本。",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat 已重新啟動，這個頁面還是之前的版本。",
    "Textcast Chat was stopped. Reload after you start it again.": "Textcast Chat 已停止，重新啟動後再重新整理頁面。",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "這個頁面連線的 Textcast Chat 服務已不在執行，等它重新執行後重新整理即可。",
    "Textcast Chat did not answer.": "Textcast Chat 沒有回應。",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat 沒有回應檢查，無法確定它是否在執行。請稍後再試。",
    "Textcast Chat could not load this artifact.": "頁面沒能載入。",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat 沒有回應載入請求，通常是頁面開啟時服務剛好重新啟動了。點「檢查並重新載入」重新連線。",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat 仍然沒有回應。請讓智慧體重新啟動它，然後點「檢查並重新載入」。",
    "This review is already open in another tab.": "這個頁面已在另一個分頁開啟。",
    "Textcast Chat is not running.": "Textcast Chat 沒有執行。",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat 重新啟動後沒有恢復。請讓智慧體重新啟動它，然後檢查並重新載入頁面。",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat 仍然沒有執行。請讓智慧體重新啟動它，然後點「檢查並重新載入」。",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat 仍然沒有執行。請重新啟動它，然後點「檢查並重新載入」。",
    "Textcast Chat could not finish loading.": "頁面沒能載入完成。",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat 介面的腳本沒有載入，通常是頁面開啟時服務剛好重新啟動了。點「檢查並重新載入」重新連線。",
    "Now playing": "正在播放原片",
    "Close player": "關閉播放器",
    "Play the video when a line is clicked": "點擊文字時播放影片",
    Ask: "提問",
    "Ask about this, or say what to change...": "針對這段提問，或說說要怎麼改…",
    "Tell the agent what to change...": "告訴智慧體要怎麼改…",
    "Attach image": "加入圖片",
    "Enter to queue · {key}+Enter to send": "Enter 加入待傳送 · {key}+Enter 直接傳送",
    Queue: "待傳送",
    Send: "傳送",
    "Annotate <{tag}>": "註記 <{tag}>",
  },
  ja: {
    Conversation: "会話",
    "Show conversation": "会話を開く",
    "Hide conversation": "会話を閉じる",
    "Minimize conversation": "会話を最小化",
    Minimize: "最小化",
    "New reply": "新しい返信",
    "{n} queued": "送信待ち {n} 件",
    " ({n} queued)": "（送信待ち {n} 件）",
    " (new reply)": "（新しい返信）",
    "Session ended": "セッション終了",
    "Agent is working…": "エージェントが処理中…",
    "External listener active": "外部リスナー接続中",
    "Agent listening": "エージェント待機中",
    "Agent not listening": "エージェント未接続",
    More: "その他",
    Revisions: "変更履歴",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "変更履歴はエージェントがページ内に記載したものです。「表示」でその変更が入った次の箇所に移動します。ページの見た目は変わりません。",
    Reveal: "表示",
    "Reveal {pos}/{total}": "表示 {pos}/{total}",
    "Reveal the next block changed in {label}": "「{label}」で変更された次の箇所を表示",
    "Ask about selected text": "選択したテキストについて質問",
    "Toggle annotate/explore mode": "選択して質問のオン/オフ",
    Editing: "編集中",
    "Copy path": "パスをコピー",
    Copy: "コピー",
    Copied: "コピーしました",
    "Reload page": "ページを再読み込み",
    "End session": "セッションを終了",
    "Take over here": "ここで引き継ぐ",
    "Check and reload": "確認して再読み込み",
    Dismiss: "閉じる",
    Reload: "再読み込み",
    "Message the agent, or select text on the page to ask about it":
      "エージェントにメッセージを送るか、ページの文を選択して質問",
    "Select any sentence on the page to ask about it, or write a message below.":
      "ページの文を選択すると質問できます。下の欄からエージェントにメッセージを送ることもできます。",
    "Attach images": "画像を添付",
    "Send everything and end the session": "すべて送信してセッションを終了",
    "Send & End": "送信して終了",
    "Send to Agent": "送信",
    "Session ended.": "セッションは終了しました。",
    "To talk here again, copy this and send it to any agent.":
      "ここで会話を続けるには、下の文をコピーして任意のエージェントに送ってください。",
    "Talk with me in this Textcast window:": "この Textcast ウィンドウで私と会話してください：",
    "Then follow the next_step it prints.": "実行後は、出力される next_step に従ってください。",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "このページは別のタブでも開かれています。未送信の内容は入力したタブにだけ保存され、ここで引き継いでも移りません。",
    "Your agent is not listening. If this persists, ask your agent to poll for updates from textcast.":
      "エージェントがメッセージを待っていません。続く場合は、エージェントに再び待機（poll）するよう頼んでください。",
    Agent: "エージェント",
    You: "あなた",
    Queued: "送信待ち",
    "Sending…": "送信中…",
    Cancel: "キャンセル",
    Save: "保存",
    "Edit queued prompt": "送信待ちの内容を編集",
    "Remove queued prompt": "送信待ちの内容を削除",
    "Image message": "画像メッセージ",
    "Image annotation": "画像の注釈",
    "Image expired": "画像の有効期限切れ",
    "{n} more image": "ほか {n} 枚の画像",
    "{n} more images": "ほか {n} 枚の画像",
    Seen: "既読",
    Working: "処理中",
    Done: "完了",
    "Seen: not yet": "未読",
    "Working: not yet": "未着手",
    "Done: not yet": "未完了",
    "No agent is listening": "エージェント未接続",
    Delivering: "送信中",
    "Agent is busy; delivered on its next poll": "エージェントが処理中です。次の待機時に届きます",
    "The agent is still working. Your message is queued and sends when it is ready.":
      "エージェントはまだ処理中です。メッセージは待機列に入り、準備ができ次第送信されます。",
    "Unsent annotation": "未送信の注釈",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "この注釈を付けた箇所がページから削除または置き換えられたため、元の位置に残せませんでした。入力した内容はここに保存されています：",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "未送信の内容は入力したタブにだけ保存され、別のウィンドウで引き継いでも移りません。",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "このタブに送信待ちの内容はありません。未送信の内容は入力したタブにだけ保存され、別のウィンドウで引き継いでも移りません。",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "送信する内容がありません。そのまま終了するには「その他」メニュー（⋮）の「セッションを終了」を選んでください。",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "送信を再試行しています。内容はこのタブに保存されています。タブを開いたままにし、サーバーが動いているか確認してください。",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "送信できませんでした。内容は送信待ちのままです。Textcast Chat が動いているか確認してから、もう一度「送信」を押してください。",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "送信できませんでした。内容は送信待ちのままです。Textcast Chat が動いているか確認してから、もう一度「送信して終了」を押してください。",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "5 秒以内にすべての内容を準備できませんでした。セッションは開いたままで、送信待ちの内容は引き続き編集できます。",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "内容が大きすぎて送信できませんでした。送信待ちのままです。内容や画像を減らしてから再試行してください。",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "未送信：{detail}。画像を削除または差し替えてから再送信してください。",
    "more than {n} images on one prompt": "1 件のメッセージに画像が {n} 枚を超えています",
    "too many images queued at once": "一度に送信待ちにした画像が多すぎます",
    "an image attachment was malformed": "画像の形式が壊れています",
    "an image is no longer available": "画像が利用できなくなりました",
    "some attachments could not be delivered": "一部の画像を届けられませんでした",
    "Uploading…": "アップロード中…",
    "Upload failed": "アップロード失敗",
    Retry: "再試行",
    Remove: "削除",
    "Retry {name}": "{name} を再試行",
    "Remove {name}": "{name} を削除",
    "Remove image": "画像を削除",
    "Could not read image": "画像を読み込めません",
    "Waiting for an image to finish uploading…": "画像のアップロード完了を待っています…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "添付できなかった画像があります。送信前に再試行するか削除してください。",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "添付できなかった画像があります。送信待ちにする前に再試行するか削除してください。",
    "You can attach up to {n} image.": "画像は {n} 枚まで添付できます。",
    "You can attach up to {n} images.": "画像は {n} 枚まで添付できます。",
    "Image is larger than the {limit} limit": "画像が上限の {limit} を超えています",
    "Unsupported file type. Use {types}.": "対応していないファイル形式です。{types} を使ってください。",
    "Too many uploads. Wait a moment and retry.": "アップロードが多すぎます。少し待ってから再試行してください。",
    "Upload limit reached for this session ({limit}).": "このセッションのアップロード上限に達しました（{limit}）。",
    "Too many uploads in flight. Wait a moment and retry.":
      "同時にアップロード中の画像が多すぎます。少し待ってから再試行してください。",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat が更新されました。このページは以前のバージョンのままです。",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat がローカルビルドで再起動しました。このページは以前のバージョンのままです。",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat が再起動しました。このページは以前のバージョンのままです。",
    "Textcast Chat was stopped. Reload after you start it again.":
      "Textcast Chat が停止しました。再起動してからページを再読み込みしてください。",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "このページが接続していた Textcast Chat は停止しています。再び起動すれば再読み込みできます。",
    "Textcast Chat did not answer.": "Textcast Chat から応答がありません。",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat が確認に応答しないため、動いているか判断できません。少し待ってから再試行してください。",
    "Textcast Chat could not load this artifact.": "ページを読み込めませんでした。",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat が読み込み要求に応答しませんでした。ページを開く途中で再起動したことが多い原因です。「確認して再読み込み」で再接続してください。",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat がまだ応答しません。エージェントに再起動してもらい、「確認して再読み込み」を押してください。",
    "This review is already open in another tab.": "このページはすでに別のタブで開かれています。",
    "Textcast Chat is not running.": "Textcast Chat は起動していません。",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat が再起動後に復帰しませんでした。エージェントに再起動してもらい、ページを確認して再読み込みしてください。",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat はまだ起動していません。エージェントに再起動してもらい、「確認して再読み込み」を押してください。",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat はまだ起動していません。再起動してから「確認して再読み込み」を押してください。",
    "Textcast Chat could not finish loading.": "ページの読み込みを完了できませんでした。",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat の画面スクリプトが読み込まれませんでした。ページを開く途中でサーバーが再起動したことが多い原因です。「確認して再読み込み」で再接続してください。",
    "Now playing": "再生中",
    "Close player": "プレーヤーを閉じる",
    "Play the video when a line is clicked": "文をクリックしたら動画を再生",
    Ask: "質問",
    "Ask about this, or say what to change...": "ここについて質問するか、直したい点を書いてください…",
    "Tell the agent what to change...": "エージェントに直したい点を伝える…",
    "Attach image": "画像を添付",
    "Enter to queue · {key}+Enter to send": "Enter で送信待ちに追加 · {key}+Enter ですぐ送信",
    Queue: "送信待ちに追加",
    Send: "送信",
    "Annotate <{tag}>": "<{tag}> に注釈",
  },
  ko: {
    Conversation: "대화",
    "Show conversation": "대화 열기",
    "Hide conversation": "대화 닫기",
    "Minimize conversation": "대화 최소화",
    Minimize: "최소화",
    "New reply": "새 답장",
    "{n} queued": "전송 대기 {n}건",
    " ({n} queued)": " (전송 대기 {n}건)",
    " (new reply)": " (새 답장)",
    "Session ended": "세션 종료됨",
    "Agent is working…": "에이전트가 처리 중…",
    "External listener active": "외부 리스너 연결됨",
    "Agent listening": "에이전트 대기 중",
    "Agent not listening": "에이전트 연결 안 됨",
    More: "더보기",
    Revisions: "수정 기록",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "수정 기록은 에이전트가 페이지 안에 적어 둔 것입니다. '보기'를 누르면 해당 수정이 표시된 다음 위치로 이동하며, 페이지 모양은 바뀌지 않습니다.",
    Reveal: "보기",
    "Reveal {pos}/{total}": "보기 {pos}/{total}",
    "Reveal the next block changed in {label}": "'{label}'에서 바뀐 다음 위치 보기",
    "Ask about selected text": "선택한 텍스트로 질문",
    "Toggle annotate/explore mode": "선택해서 질문 켜기/끄기",
    Editing: "편집 중",
    "Copy path": "경로 복사",
    Copy: "복사",
    Copied: "복사됨",
    "Reload page": "페이지 새로고침",
    "End session": "세션 종료",
    "Take over here": "여기서 이어받기",
    "Check and reload": "확인 후 새로고침",
    Dismiss: "닫기",
    Reload: "새로고침",
    "Message the agent, or select text on the page to ask about it":
      "에이전트에게 메시지를 보내거나 페이지의 문장을 선택해 질문하세요",
    "Select any sentence on the page to ask about it, or write a message below.":
      "페이지의 문장을 선택하면 질문할 수 있고, 아래에서 에이전트에게 바로 메시지를 보낼 수도 있습니다.",
    "Attach images": "이미지 첨부",
    "Send everything and end the session": "모두 보내고 세션 종료",
    "Send & End": "보내고 종료",
    "Send to Agent": "보내기",
    "Session ended.": "세션이 종료되었습니다.",
    "To talk here again, copy this and send it to any agent.":
      "여기서 대화를 이어가려면 아래 내용을 복사해 아무 에이전트에게나 보내세요.",
    "Talk with me in this Textcast window:": "이 Textcast 창에서 나와 대화해 주세요:",
    "Then follow the next_step it prints.": "실행한 뒤 출력되는 next_step을 따르세요.",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "이 페이지가 다른 탭에서도 열려 있습니다. 보내지 않은 내용은 입력한 탭에만 저장되며, 여기서 이어받아도 옮겨지지 않습니다.",
    "Your agent is not listening. If this persists, ask your agent to poll for updates from textcast.":
      "에이전트가 메시지를 기다리고 있지 않습니다. 계속되면 에이전트에게 다시 대기(poll)하라고 요청하세요.",
    Agent: "에이전트",
    You: "나",
    Queued: "전송 대기",
    "Sending…": "보내는 중…",
    Cancel: "취소",
    Save: "저장",
    "Edit queued prompt": "전송 대기 내용 편집",
    "Remove queued prompt": "전송 대기 내용 삭제",
    "Image message": "이미지 메시지",
    "Image annotation": "이미지 메모",
    "Image expired": "이미지 만료됨",
    "{n} more image": "이미지 {n}장 더",
    "{n} more images": "이미지 {n}장 더",
    Seen: "읽음",
    Working: "처리 중",
    Done: "완료",
    "Seen: not yet": "아직 읽지 않음",
    "Working: not yet": "아직 시작 안 함",
    "Done: not yet": "아직 완료 안 됨",
    "No agent is listening": "에이전트 연결 안 됨",
    Delivering: "전달 중",
    "Agent is busy; delivered on its next poll": "에이전트가 바쁩니다. 다음 대기 때 전달됩니다",
    "The agent is still working. Your message is queued and sends when it is ready.":
      "에이전트가 아직 처리 중입니다. 메시지는 대기열에 들어가며 준비되면 자동으로 전송됩니다.",
    "Unsent annotation": "보내지 않은 메모",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "이 메모가 달린 내용이 페이지에서 삭제되거나 바뀌어 원래 자리에 둘 수 없었습니다. 작성한 내용은 여기에 보관됩니다:",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "보내지 않은 내용은 입력한 탭에만 저장되며, 다른 창에서 이어받아도 옮겨지지 않습니다.",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "이 탭에는 전송 대기 내용이 없습니다. 보내지 않은 내용은 입력한 탭에만 저장되며, 다른 창에서 이어받아도 옮겨지지 않습니다.",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "보낼 내용이 없습니다. 그냥 끝내려면 '더보기' 메뉴(⋮)에서 '세션 종료'를 선택하세요.",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "계속 보내는 중입니다. 내용은 이 탭에 저장되어 있습니다. 탭을 열어 두고 서버가 실행 중인지 확인하세요.",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "보내지 못했습니다. 내용은 전송 대기 중입니다. Textcast Chat이 실행 중인지 확인한 뒤 '보내기'를 다시 누르세요.",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "보내지 못했습니다. 내용은 전송 대기 중입니다. Textcast Chat이 실행 중인지 확인한 뒤 '보내고 종료'를 다시 누르세요.",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "5초 안에 모든 내용을 준비하지 못했습니다. 세션은 열려 있고 전송 대기 내용은 계속 편집할 수 있습니다.",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "내용이 너무 커서 보내지 못했습니다. 전송 대기 중이니 내용이나 이미지를 줄인 뒤 다시 시도하세요.",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "보내지 않음: {detail}. 이미지를 삭제하거나 바꾼 뒤 다시 보내세요.",
    "more than {n} images on one prompt": "메시지 하나에 이미지가 {n}장을 넘습니다",
    "too many images queued at once": "한 번에 대기시킨 이미지가 너무 많습니다",
    "an image attachment was malformed": "이미지 형식이 손상되었습니다",
    "an image is no longer available": "이미지를 더 이상 사용할 수 없습니다",
    "some attachments could not be delivered": "일부 이미지를 전달하지 못했습니다",
    "Uploading…": "업로드 중…",
    "Upload failed": "업로드 실패",
    Retry: "다시 시도",
    Remove: "삭제",
    "Retry {name}": "{name} 다시 시도",
    "Remove {name}": "{name} 삭제",
    "Remove image": "이미지 삭제",
    "Could not read image": "이미지를 읽을 수 없습니다",
    "Waiting for an image to finish uploading…": "이미지 업로드가 끝나기를 기다리는 중…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "첨부하지 못한 이미지가 있습니다. 보내기 전에 다시 시도하거나 삭제하세요.",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "첨부하지 못한 이미지가 있습니다. 대기시키기 전에 다시 시도하거나 삭제하세요.",
    "You can attach up to {n} image.": "이미지는 최대 {n}장까지 첨부할 수 있습니다.",
    "You can attach up to {n} images.": "이미지는 최대 {n}장까지 첨부할 수 있습니다.",
    "Image is larger than the {limit} limit": "이미지가 {limit} 제한보다 큽니다",
    "Unsupported file type. Use {types}.": "지원하지 않는 파일 형식입니다. {types}을(를) 사용하세요.",
    "Too many uploads. Wait a moment and retry.": "업로드가 너무 많습니다. 잠시 후 다시 시도하세요.",
    "Upload limit reached for this session ({limit}).": "이 세션의 업로드 한도에 도달했습니다 ({limit}).",
    "Too many uploads in flight. Wait a moment and retry.":
      "동시에 업로드 중인 이미지가 너무 많습니다. 잠시 후 다시 시도하세요.",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat이 업데이트되었습니다. 이 페이지는 이전 버전입니다.",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat이 로컬 빌드로 다시 시작되었습니다. 이 페이지는 이전 버전입니다.",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat이 다시 시작되었습니다. 이 페이지는 이전 버전입니다.",
    "Textcast Chat was stopped. Reload after you start it again.":
      "Textcast Chat이 중지되었습니다. 다시 시작한 뒤 새로고침하세요.",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "이 페이지가 연결된 Textcast Chat이 더 이상 실행되지 않습니다. 다시 실행되면 새로고침할 수 있습니다.",
    "Textcast Chat did not answer.": "Textcast Chat이 응답하지 않습니다.",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat이 확인 요청에 응답하지 않아 실행 여부를 알 수 없습니다. 잠시 후 다시 시도하세요.",
    "Textcast Chat could not load this artifact.": "페이지를 불러오지 못했습니다.",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat이 불러오기 요청에 응답하지 않았습니다. 보통 페이지를 여는 중에 서버가 다시 시작된 경우입니다. '확인 후 새로고침'으로 다시 연결하세요.",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat이 아직 응답하지 않습니다. 에이전트에게 다시 시작해 달라고 한 뒤 '확인 후 새로고침'을 누르세요.",
    "This review is already open in another tab.": "이 페이지는 이미 다른 탭에서 열려 있습니다.",
    "Textcast Chat is not running.": "Textcast Chat이 실행되고 있지 않습니다.",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat이 다시 시작된 뒤 복구되지 않았습니다. 에이전트에게 다시 시작해 달라고 한 뒤 페이지를 확인하고 새로고침하세요.",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat이 아직 실행되고 있지 않습니다. 에이전트에게 다시 시작해 달라고 한 뒤 '확인 후 새로고침'을 누르세요.",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat이 아직 실행되고 있지 않습니다. 다시 시작한 뒤 '확인 후 새로고침'을 누르세요.",
    "Textcast Chat could not finish loading.": "페이지를 끝까지 불러오지 못했습니다.",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat 화면 스크립트를 불러오지 못했습니다. 보통 페이지를 여는 중에 서버가 다시 시작된 경우입니다. '확인 후 새로고침'으로 다시 연결하세요.",
    "Now playing": "재생 중",
    "Close player": "플레이어 닫기",
    "Play the video when a line is clicked": "문장을 클릭하면 영상 재생",
    Ask: "질문",
    "Ask about this, or say what to change...": "이 부분에 대해 질문하거나 고칠 점을 적어 주세요…",
    "Tell the agent what to change...": "에이전트에게 고칠 점을 알려 주세요…",
    "Attach image": "이미지 첨부",
    "Enter to queue · {key}+Enter to send": "Enter로 대기열에 추가 · {key}+Enter로 바로 보내기",
    Queue: "대기열에 추가",
    Send: "보내기",
    "Annotate <{tag}>": "<{tag}>에 메모",
  },
};
