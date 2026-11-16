// Chrome strings for French, German, Spanish, Portuguese, Italian and Russian. Keys are the English
// source text; see chrome-i18n.js for how a missing key falls back to English.

/** @type {Record<string, Record<string, string>>} */
export const EUROPEAN_STRINGS = {
  fr: {
    Conversation: "Conversation",
    "Show conversation": "Afficher la conversation",
    "Hide conversation": "Masquer la conversation",
    "Minimize conversation": "Réduire la conversation",
    Minimize: "Réduire",
    "New reply": "Nouvelle réponse",
    "{n} queued": "{n} en attente",
    " ({n} queued)": " ({n} en attente)",
    " (new reply)": " (nouvelle réponse)",
    "Session ended": "Session terminée",
    "Agent is working…": "L’agent travaille…",
    "External listener active": "Écoute externe active",
    "Agent listening": "Agent à l’écoute",
    "Agent not listening": "Agent hors ligne",
    More: "Plus",
    Revisions: "Révisions",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "L’agent indique ces révisions dans la page elle-même. « Afficher » mène au prochain passage marqué pour cette révision ; l’apparence de la page ne change pas.",
    Reveal: "Afficher",
    "Reveal {pos}/{total}": "Afficher {pos}/{total}",
    "Reveal the next block changed in {label}": "Afficher le prochain passage modifié dans « {label} »",
    "Ask about selected text": "Poser une question sur le texte sélectionné",
    "Toggle annotate/explore mode": "Activer/désactiver les questions sur sélection",
    Editing: "Fichier",
    "Copy path": "Copier le chemin",
    Copy: "Copier",
    Copied: "Copié",
    "Reload page": "Recharger la page",
    "End session": "Terminer la session",
    "Take over here": "Reprendre ici",
    "Check and reload": "Vérifier et recharger",
    Dismiss: "Fermer",
    Reload: "Recharger",
    "Message the agent, or select text on the page to ask about it":
      "Écrivez à l’agent, ou sélectionnez du texte dans la page pour poser une question",
    "Select any sentence on the page to ask about it, or write a message below.":
      "Sélectionnez une phrase de la page pour poser une question, ou écrivez un message ci-dessous.",
    "Attach images": "Joindre des images",
    "Send everything and end the session": "Tout envoyer et terminer la session",
    "Send & End": "Envoyer et terminer",
    "Send to Agent": "Envoyer",
    "Session ended.": "Session terminée.",
    "To talk here again, copy this and send it to any agent.":
      "Pour reprendre la conversation ici, copiez ce texte et envoyez-le à n'importe quel agent.",
    "Talk with me in this Textcast window:": "Discute avec moi dans cette fenêtre Textcast :",
    "Then follow the next_step it prints.": "Ensuite, suis le next_step qu'elle affiche.",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Cette page est ouverte dans un autre onglet. Les réponses non envoyées restent dans l’onglet où vous les avez saisies ; reprendre ici ne les transfère pas.",
    "The agent is offline for now. Messages you send are kept, and it gets them when it is back.":
      "L'agent est hors ligne pour le moment. Vos messages sont conservés et lui parviendront à son retour.",
    "Connecting to the agent\u2026": "Connexion à l'agent…",
    Agent: "Agent",
    You: "Vous",
    Queued: "En attente",
    "Sending…": "Envoi…",
    Cancel: "Annuler",
    Save: "Enregistrer",
    "Edit queued prompt": "Modifier le message en attente",
    "Remove queued prompt": "Supprimer le message en attente",
    "Image message": "Message image",
    "Image annotation": "Annotation d’image",
    "Image expired": "Image expirée",
    "{n} more image": "{n} image de plus",
    "{n} more images": "{n} images de plus",
    Seen: "Lu",
    Working: "En cours",
    Done: "Terminé",
    "Seen: not yet": "Pas encore lu",
    "Working: not yet": "Pas encore commencé",
    "Done: not yet": "Pas encore terminé",
    "No agent is listening": "Aucun agent à l’écoute",
    Delivering: "Envoi en cours",
    "Agent is busy; delivered on its next poll": "L’agent est occupé ; message transmis à sa prochaine écoute",
    "Unsent annotation": "Annotation non envoyée",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "Le passage auquel cette note était attachée a été supprimé ou remplacé dans la page, elle n’a donc pas pu rester ouverte. Votre texte est conservé ici :",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Les réponses non envoyées restent dans l’onglet où vous les avez saisies ; reprendre dans une autre fenêtre ne les transfère pas.",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Rien en attente dans cet onglet. Les réponses non envoyées restent dans l’onglet où vous les avez saisies ; reprendre dans une autre fenêtre ne les transfère pas.",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "Rien à envoyer. Pour terminer sans retour, choisissez « Terminer la session » dans le menu Plus (⋮).",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "Nouvel essai d’envoi en cours. Votre texte est enregistré dans cet onglet. Gardez-le ouvert et vérifiez que le serveur fonctionne.",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "Échec de l’envoi. Votre texte est toujours en attente. Vérifiez que Textcast Chat fonctionne, puis cliquez à nouveau sur « Envoyer ».",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "Échec de l’envoi. Votre texte est toujours en attente. Vérifiez que Textcast Chat fonctionne, puis cliquez à nouveau sur « Envoyer et terminer ».",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "Impossible de tout préparer en 5 secondes. La session reste ouverte et les messages en attente restent modifiables.",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "Envoi impossible : le contenu est trop volumineux. Il reste en attente. Retirez du texte ou des images, puis réessayez.",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "Non envoyé — {detail}. Supprimez ou remplacez l’image, puis renvoyez.",
    "more than {n} images on one prompt": "plus de {n} images dans un message",
    "too many images queued at once": "trop d’images en attente à la fois",
    "an image attachment was malformed": "une image est endommagée",
    "an image is no longer available": "une image n’est plus disponible",
    "some attachments could not be delivered": "certaines images n’ont pas pu être transmises",
    "Uploading…": "Téléversement…",
    "Upload failed": "Échec du téléversement",
    Retry: "Réessayer",
    Remove: "Supprimer",
    "Retry {name}": "Réessayer {name}",
    "Remove {name}": "Supprimer {name}",
    "Remove image": "Supprimer l’image",
    "Could not read image": "Impossible de lire l’image",
    "Waiting for an image to finish uploading…": "En attente de la fin du téléversement…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "Une image n’a pas pu être jointe. Réessayez ou supprimez-la avant d’envoyer.",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "Une image n’a pas pu être jointe. Réessayez ou supprimez-la avant de la mettre en attente.",
    "You can attach up to {n} image.": "Vous pouvez joindre {n} image au maximum.",
    "You can attach up to {n} images.": "Vous pouvez joindre {n} images au maximum.",
    "Image is larger than the {limit} limit": "L’image dépasse la limite de {limit}",
    "Unsupported file type. Use {types}.": "Type de fichier non pris en charge. Utilisez {types}.",
    "Too many uploads. Wait a moment and retry.": "Trop de téléversements. Patientez un instant puis réessayez.",
    "Upload limit reached for this session ({limit}).":
      "Limite de téléversement atteinte pour cette session ({limit}).",
    "Too many uploads in flight. Wait a moment and retry.":
      "Trop de téléversements en cours. Patientez un instant puis réessayez.",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat a été mis à jour. Cette page utilise encore l’ancienne version.",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat a redémarré avec une version locale. Cette page utilise encore l’ancienne version.",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat a redémarré. Cette page utilise encore l’ancienne version.",
    "Textcast Chat was stopped. Reload after you start it again.":
      "Textcast Chat est arrêté. Rechargez la page après l’avoir relancé.",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "Le serveur Textcast Chat de cette page ne fonctionne plus. Le rechargement marchera dès qu’il sera relancé.",
    "Textcast Chat did not answer.": "Textcast Chat ne répond pas.",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat n’a pas répondu à la vérification ; impossible de savoir s’il fonctionne. Réessayez dans un instant.",
    "Textcast Chat could not load this artifact.": "Impossible de charger la page.",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat n’a pas répondu au chargement, en général parce qu’il a redémarré pendant l’ouverture. Utilisez « Vérifier et recharger » pour vous reconnecter.",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat ne répond toujours pas. Demandez à votre agent de le relancer, puis utilisez « Vérifier et recharger ».",
    "This review is already open in another tab.": "Cette page est déjà ouverte dans un autre onglet.",
    "Textcast Chat is not running.": "Textcast Chat ne fonctionne pas.",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat a redémarré sans revenir. Demandez à votre agent de le relancer, puis vérifiez et rechargez la page.",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat ne fonctionne toujours pas. Demandez à votre agent de le relancer, puis utilisez « Vérifier et recharger ».",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat ne fonctionne toujours pas. Relancez-le, puis utilisez « Vérifier et recharger ».",
    "Textcast Chat could not finish loading.": "Le chargement n’a pas pu aboutir.",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "Le script de l’interface Textcast Chat ne s’est pas chargé, en général parce que le serveur a redémarré pendant l’ouverture. Utilisez « Vérifier et recharger » pour vous reconnecter.",
    "Now playing": "Lecture en cours",
    "Close player": "Fermer le lecteur",
    "Play the video when a line is clicked": "Lire la vidéo au clic sur une phrase",
    Ask: "Demander",
    "Ask about this, or say what to change...": "Posez une question, ou dites ce qu’il faut changer…",
    "Tell the agent what to change...": "Dites à l’agent ce qu’il faut changer…",
    "Attach image": "Joindre une image",
    "Enter to queue · {key}+Enter to send": "Entrée pour mettre en attente · {key}+Entrée pour envoyer",
    Queue: "Mettre en attente",
    Send: "Envoyer",
    "Annotate <{tag}>": "Annoter <{tag}>",
  },
  de: {
    Conversation: "Unterhaltung",
    "Show conversation": "Unterhaltung anzeigen",
    "Hide conversation": "Unterhaltung ausblenden",
    "Minimize conversation": "Unterhaltung minimieren",
    Minimize: "Minimieren",
    "New reply": "Neue Antwort",
    "{n} queued": "{n} wartend",
    " ({n} queued)": " ({n} wartend)",
    " (new reply)": " (neue Antwort)",
    "Session ended": "Sitzung beendet",
    "Agent is working…": "Agent arbeitet…",
    "External listener active": "Externer Listener aktiv",
    "Agent listening": "Agent hört zu",
    "Agent not listening": "Agent nicht verbunden",
    More: "Mehr",
    Revisions: "Überarbeitungen",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "Der Agent trägt diese Überarbeitungen in der Seite selbst ein. „Zeigen“ springt zur nächsten markierten Stelle; das Aussehen der Seite ändert sich nicht.",
    Reveal: "Zeigen",
    "Reveal {pos}/{total}": "Zeigen {pos}/{total}",
    "Reveal the next block changed in {label}": "Nächste in „{label}“ geänderte Stelle zeigen",
    "Ask about selected text": "Zu markiertem Text fragen",
    "Toggle annotate/explore mode": "Fragen per Markierung ein/aus",
    Editing: "Datei",
    "Copy path": "Pfad kopieren",
    Copy: "Kopieren",
    Copied: "Kopiert",
    "Reload page": "Seite neu laden",
    "End session": "Sitzung beenden",
    "Take over here": "Hier übernehmen",
    "Check and reload": "Prüfen und neu laden",
    Dismiss: "Schließen",
    Reload: "Neu laden",
    "Message the agent, or select text on the page to ask about it":
      "Schreiben Sie dem Agenten oder markieren Sie Text auf der Seite, um dazu zu fragen",
    "Select any sentence on the page to ask about it, or write a message below.":
      "Markieren Sie einen Satz auf der Seite, um dazu zu fragen, oder schreiben Sie unten eine Nachricht.",
    "Attach images": "Bilder anhängen",
    "Send everything and end the session": "Alles senden und Sitzung beenden",
    "Send & End": "Senden & beenden",
    "Send to Agent": "Senden",
    "Session ended.": "Sitzung beendet.",
    "To talk here again, copy this and send it to any agent.":
      "Um hier weiterzusprechen, kopiere diesen Text und sende ihn an einen beliebigen Agenten.",
    "Talk with me in this Textcast window:": "Sprich mit mir in diesem Textcast-Fenster:",
    "Then follow the next_step it prints.": "Folge danach dem next_step, den der Befehl ausgibt.",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Diese Seite ist in einem anderen Tab geöffnet. Nicht gesendete Antworten bleiben in dem Tab, in dem Sie sie eingegeben haben; das Übernehmen hier bringt sie nicht mit.",
    "The agent is offline for now. Messages you send are kept, and it gets them when it is back.":
      "Der Agent ist gerade offline. Deine Nachrichten werden gespeichert und erreichen ihn, sobald er zurück ist.",
    "Connecting to the agent\u2026": "Verbindung zum Agenten…",
    Agent: "Agent",
    You: "Sie",
    Queued: "Wartend",
    "Sending…": "Wird gesendet…",
    Cancel: "Abbrechen",
    Save: "Speichern",
    "Edit queued prompt": "Wartende Nachricht bearbeiten",
    "Remove queued prompt": "Wartende Nachricht entfernen",
    "Image message": "Bildnachricht",
    "Image annotation": "Bildanmerkung",
    "Image expired": "Bild abgelaufen",
    "{n} more image": "{n} weiteres Bild",
    "{n} more images": "{n} weitere Bilder",
    Seen: "Gelesen",
    Working: "In Arbeit",
    Done: "Erledigt",
    "Seen: not yet": "Noch nicht gelesen",
    "Working: not yet": "Noch nicht begonnen",
    "Done: not yet": "Noch nicht erledigt",
    "No agent is listening": "Kein Agent verbunden",
    Delivering: "Wird zugestellt",
    "Agent is busy; delivered on its next poll": "Agent ist beschäftigt; Zustellung beim nächsten Zuhören",
    "Unsent annotation": "Nicht gesendete Anmerkung",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "Die Stelle, an der diese Anmerkung hing, wurde auf der Seite entfernt oder ersetzt, daher konnte sie nicht offen bleiben. Ihr Text ist hier gesichert:",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Nicht gesendete Antworten bleiben in dem Tab, in dem Sie sie eingegeben haben; das Übernehmen in einem anderen Fenster bringt sie nicht mit.",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "In diesem Tab wartet nichts. Nicht gesendete Antworten bleiben in dem Tab, in dem Sie sie eingegeben haben; das Übernehmen in einem anderen Fenster bringt sie nicht mit.",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "Nichts zu senden. Um ohne Rückmeldung zu beenden, wählen Sie „Sitzung beenden“ im Menü „Mehr“ (⋮).",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "Senden wird weiter versucht. Ihr Text ist in diesem Tab gespeichert. Lassen Sie den Tab offen und prüfen Sie, ob der Server läuft.",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "Senden fehlgeschlagen. Ihr Text wartet weiterhin. Prüfen Sie, ob Textcast Chat läuft, und klicken Sie erneut auf „Senden“.",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "Senden fehlgeschlagen. Ihr Text wartet weiterhin. Prüfen Sie, ob Textcast Chat läuft, und klicken Sie erneut auf „Senden & beenden“.",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "Nicht alles konnte innerhalb von 5 Sekunden vorbereitet werden. Die Sitzung bleibt offen, wartende Nachrichten lassen sich weiter bearbeiten.",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "Senden nicht möglich, der Inhalt ist zu groß. Er wartet weiterhin. Entfernen Sie Text oder Bilder und versuchen Sie es erneut.",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "Nicht gesendet – {detail}. Entfernen oder ersetzen Sie das Bild und senden Sie erneut.",
    "more than {n} images on one prompt": "mehr als {n} Bilder in einer Nachricht",
    "too many images queued at once": "zu viele Bilder auf einmal in der Warteschlange",
    "an image attachment was malformed": "ein Bild ist beschädigt",
    "an image is no longer available": "ein Bild ist nicht mehr verfügbar",
    "some attachments could not be delivered": "einige Bilder konnten nicht zugestellt werden",
    "Uploading…": "Wird hochgeladen…",
    "Upload failed": "Hochladen fehlgeschlagen",
    Retry: "Erneut versuchen",
    Remove: "Entfernen",
    "Retry {name}": "{name} erneut versuchen",
    "Remove {name}": "{name} entfernen",
    "Remove image": "Bild entfernen",
    "Could not read image": "Bild konnte nicht gelesen werden",
    "Waiting for an image to finish uploading…": "Warte, bis das Bild hochgeladen ist…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "Ein Bild konnte nicht angehängt werden. Versuchen Sie es erneut oder entfernen Sie es vor dem Senden.",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "Ein Bild konnte nicht angehängt werden. Versuchen Sie es erneut oder entfernen Sie es, bevor Sie es einreihen.",
    "You can attach up to {n} image.": "Sie können bis zu {n} Bild anhängen.",
    "You can attach up to {n} images.": "Sie können bis zu {n} Bilder anhängen.",
    "Image is larger than the {limit} limit": "Das Bild überschreitet das Limit von {limit}",
    "Unsupported file type. Use {types}.": "Dateityp nicht unterstützt. Verwenden Sie {types}.",
    "Too many uploads. Wait a moment and retry.": "Zu viele Uploads. Warten Sie kurz und versuchen Sie es erneut.",
    "Upload limit reached for this session ({limit}).": "Upload-Limit für diese Sitzung erreicht ({limit}).",
    "Too many uploads in flight. Wait a moment and retry.":
      "Zu viele gleichzeitige Uploads. Warten Sie kurz und versuchen Sie es erneut.",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat wurde aktualisiert. Diese Seite läuft noch mit der vorherigen Version.",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat wurde mit einem lokalen Build neu gestartet. Diese Seite läuft noch mit der vorherigen Version.",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat wurde neu gestartet. Diese Seite läuft noch mit der vorherigen Version.",
    "Textcast Chat was stopped. Reload after you start it again.":
      "Textcast Chat wurde beendet. Laden Sie die Seite neu, nachdem Sie es wieder gestartet haben.",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "Der Textcast-Chat-Server dieser Seite läuft nicht mehr. Neu laden funktioniert, sobald er wieder läuft.",
    "Textcast Chat did not answer.": "Textcast Chat antwortet nicht.",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat hat auf die Prüfung nicht geantwortet, daher ist unklar, ob es läuft. Versuchen Sie es gleich noch einmal.",
    "Textcast Chat could not load this artifact.": "Die Seite konnte nicht geladen werden.",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat hat auf die Ladeanfrage nicht geantwortet, meist weil der Server beim Öffnen neu gestartet ist. Mit „Prüfen und neu laden“ verbinden Sie sich erneut.",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat antwortet immer noch nicht. Lassen Sie es von Ihrem Agenten neu starten und wählen Sie dann „Prüfen und neu laden“.",
    "This review is already open in another tab.": "Diese Seite ist bereits in einem anderen Tab geöffnet.",
    "Textcast Chat is not running.": "Textcast Chat läuft nicht.",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat ist nach dem Neustart nicht zurückgekommen. Lassen Sie es von Ihrem Agenten neu starten, dann prüfen und laden Sie die Seite neu.",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat läuft immer noch nicht. Lassen Sie es von Ihrem Agenten neu starten und wählen Sie dann „Prüfen und neu laden“.",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat läuft immer noch nicht. Starten Sie es neu und wählen Sie dann „Prüfen und neu laden“.",
    "Textcast Chat could not finish loading.": "Das Laden konnte nicht abgeschlossen werden.",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "Das Skript der Textcast-Chat-Oberfläche wurde nicht geladen, meist weil der Server beim Öffnen neu gestartet ist. Mit „Prüfen und neu laden“ verbinden Sie sich erneut.",
    "Now playing": "Wiedergabe",
    "Close player": "Player schließen",
    "Play the video when a line is clicked": "Video beim Klick auf einen Satz abspielen",
    Ask: "Fragen",
    "Ask about this, or say what to change...": "Stellen Sie eine Frage oder sagen Sie, was geändert werden soll…",
    "Tell the agent what to change...": "Sagen Sie dem Agenten, was geändert werden soll…",
    "Attach image": "Bild anhängen",
    "Enter to queue · {key}+Enter to send": "Enter zum Einreihen · {key}+Enter zum Senden",
    Queue: "Einreihen",
    Send: "Senden",
    "Annotate <{tag}>": "<{tag}> kommentieren",
  },
  es: {
    Conversation: "Conversación",
    "Show conversation": "Mostrar conversación",
    "Hide conversation": "Ocultar conversación",
    "Minimize conversation": "Minimizar conversación",
    Minimize: "Minimizar",
    "New reply": "Nueva respuesta",
    "{n} queued": "{n} en cola",
    " ({n} queued)": " ({n} en cola)",
    " (new reply)": " (nueva respuesta)",
    "Session ended": "Sesión terminada",
    "Agent is working…": "El agente está trabajando…",
    "External listener active": "Escucha externa activa",
    "Agent listening": "Agente escuchando",
    "Agent not listening": "Agente desconectado",
    More: "Más",
    Revisions: "Revisiones",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "El agente indica estas revisiones en la propia página. «Mostrar» lleva al siguiente fragmento marcado en esa revisión; el aspecto de la página no cambia.",
    Reveal: "Mostrar",
    "Reveal {pos}/{total}": "Mostrar {pos}/{total}",
    "Reveal the next block changed in {label}": "Mostrar el siguiente fragmento cambiado en «{label}»",
    "Ask about selected text": "Preguntar sobre el texto seleccionado",
    "Toggle annotate/explore mode": "Activar/desactivar preguntas por selección",
    Editing: "Archivo",
    "Copy path": "Copiar ruta",
    Copy: "Copiar",
    Copied: "Copiado",
    "Reload page": "Recargar página",
    "End session": "Terminar sesión",
    "Take over here": "Continuar aquí",
    "Check and reload": "Comprobar y recargar",
    Dismiss: "Cerrar",
    Reload: "Recargar",
    "Message the agent, or select text on the page to ask about it":
      "Escribe al agente, o selecciona texto de la página para preguntar",
    "Select any sentence on the page to ask about it, or write a message below.":
      "Selecciona cualquier frase de la página para preguntar, o escribe un mensaje abajo.",
    "Attach images": "Adjuntar imágenes",
    "Send everything and end the session": "Enviar todo y terminar la sesión",
    "Send & End": "Enviar y terminar",
    "Send to Agent": "Enviar",
    "Session ended.": "Sesión terminada.",
    "To talk here again, copy this and send it to any agent.":
      "Para volver a conversar aquí, copia esto y envíalo a cualquier agente.",
    "Talk with me in this Textcast window:": "Habla conmigo en esta ventana de Textcast:",
    "Then follow the next_step it prints.": "Después, sigue el next_step que muestre.",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Esta página está abierta en otra pestaña. Las respuestas sin enviar se quedan en la pestaña donde las escribiste; continuar aquí no las trae.",
    "The agent is offline for now. Messages you send are kept, and it gets them when it is back.":
      "El agente no está conectado por ahora. Tus mensajes se guardan y le llegarán cuando vuelva.",
    "Connecting to the agent\u2026": "Conectando con el agente…",
    Agent: "Agente",
    You: "Tú",
    Queued: "En cola",
    "Sending…": "Enviando…",
    Cancel: "Cancelar",
    Save: "Guardar",
    "Edit queued prompt": "Editar mensaje en cola",
    "Remove queued prompt": "Quitar mensaje en cola",
    "Image message": "Mensaje con imagen",
    "Image annotation": "Anotación de imagen",
    "Image expired": "Imagen caducada",
    "{n} more image": "{n} imagen más",
    "{n} more images": "{n} imágenes más",
    Seen: "Visto",
    Working: "En curso",
    Done: "Hecho",
    "Seen: not yet": "Aún no visto",
    "Working: not yet": "Aún no empezado",
    "Done: not yet": "Aún no terminado",
    "No agent is listening": "Ningún agente escuchando",
    Delivering: "Entregando",
    "Agent is busy; delivered on its next poll": "El agente está ocupado; se entregará cuando vuelva a escuchar",
    "Unsent annotation": "Anotación sin enviar",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "El fragmento al que estaba unida esta nota se eliminó o reemplazó en la página, así que no pudo quedarse abierta. Tu texto se guarda aquí:",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Las respuestas sin enviar se quedan en la pestaña donde las escribiste; continuar en otra ventana no las trae.",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "No hay nada en cola en esta pestaña. Las respuestas sin enviar se quedan en la pestaña donde las escribiste; continuar en otra ventana no las trae.",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "No hay nada que enviar. Para terminar sin comentarios, elige «Terminar sesión» en el menú Más (⋮).",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "Seguimos intentando enviar. Tu texto está guardado en esta pestaña. Mantenla abierta y comprueba que el servidor funciona.",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "No se pudo enviar. Tu texto sigue en cola. Comprueba que Textcast Chat funciona y vuelve a pulsar «Enviar».",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "No se pudo enviar. Tu texto sigue en cola. Comprueba que Textcast Chat funciona y vuelve a pulsar «Enviar y terminar».",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "No se pudo preparar todo en 5 segundos. La sesión sigue abierta y los mensajes en cola se pueden seguir editando.",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "No se pudo enviar porque el contenido es demasiado grande. Sigue en cola. Quita texto o imágenes y vuelve a intentarlo.",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "No enviado: {detail}. Quita o cambia la imagen y vuelve a enviar.",
    "more than {n} images on one prompt": "más de {n} imágenes en un mensaje",
    "too many images queued at once": "demasiadas imágenes en cola a la vez",
    "an image attachment was malformed": "una imagen está dañada",
    "an image is no longer available": "una imagen ya no está disponible",
    "some attachments could not be delivered": "algunas imágenes no se pudieron entregar",
    "Uploading…": "Subiendo…",
    "Upload failed": "Error al subir",
    Retry: "Reintentar",
    Remove: "Quitar",
    "Retry {name}": "Reintentar {name}",
    "Remove {name}": "Quitar {name}",
    "Remove image": "Quitar imagen",
    "Could not read image": "No se pudo leer la imagen",
    "Waiting for an image to finish uploading…": "Esperando a que termine de subir la imagen…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "No se pudo adjuntar una imagen. Reinténtalo o quítala antes de enviar.",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "No se pudo adjuntar una imagen. Reinténtalo o quítala antes de ponerla en cola.",
    "You can attach up to {n} image.": "Puedes adjuntar hasta {n} imagen.",
    "You can attach up to {n} images.": "Puedes adjuntar hasta {n} imágenes.",
    "Image is larger than the {limit} limit": "La imagen supera el límite de {limit}",
    "Unsupported file type. Use {types}.": "Tipo de archivo no admitido. Usa {types}.",
    "Too many uploads. Wait a moment and retry.": "Demasiadas subidas. Espera un momento y vuelve a intentarlo.",
    "Upload limit reached for this session ({limit}).": "Se alcanzó el límite de subidas de esta sesión ({limit}).",
    "Too many uploads in flight. Wait a moment and retry.":
      "Demasiadas subidas a la vez. Espera un momento y vuelve a intentarlo.",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat se actualizó. Esta página sigue con la versión anterior.",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat se reinició con una compilación local. Esta página sigue con la versión anterior.",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat se reinició. Esta página sigue con la versión anterior.",
    "Textcast Chat was stopped. Reload after you start it again.":
      "Textcast Chat se detuvo. Recarga la página después de volver a iniciarlo.",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "El servidor de Textcast Chat de esta página ya no funciona. Podrás recargar cuando vuelva a estar en marcha.",
    "Textcast Chat did not answer.": "Textcast Chat no responde.",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat no respondió a la comprobación, así que no se sabe si funciona. Inténtalo de nuevo en un momento.",
    "Textcast Chat could not load this artifact.": "No se pudo cargar la página.",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat no respondió a la carga; normalmente se reinició mientras se abría la página. Usa «Comprobar y recargar» para volver a conectar.",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat sigue sin responder. Pide a tu agente que lo reinicie y luego usa «Comprobar y recargar».",
    "This review is already open in another tab.": "Esta página ya está abierta en otra pestaña.",
    "Textcast Chat is not running.": "Textcast Chat no está en marcha.",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat se reinició y no volvió. Pide a tu agente que lo inicie de nuevo y luego comprueba y recarga la página.",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat sigue sin estar en marcha. Pide a tu agente que lo inicie de nuevo y luego usa «Comprobar y recargar».",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat sigue sin estar en marcha. Inícialo de nuevo y luego usa «Comprobar y recargar».",
    "Textcast Chat could not finish loading.": "No se pudo terminar de cargar.",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "El script de la interfaz de Textcast Chat no se cargó; normalmente el servidor se reinició mientras se abría la página. Usa «Comprobar y recargar» para volver a conectar.",
    "Now playing": "Reproduciendo",
    "Close player": "Cerrar reproductor",
    "Play the video when a line is clicked": "Reproducir el vídeo al hacer clic en una frase",
    Ask: "Preguntar",
    "Ask about this, or say what to change...": "Pregunta sobre esto, o di qué cambiar…",
    "Tell the agent what to change...": "Dile al agente qué cambiar…",
    "Attach image": "Adjuntar imagen",
    "Enter to queue · {key}+Enter to send": "Intro para poner en cola · {key}+Intro para enviar",
    Queue: "Poner en cola",
    Send: "Enviar",
    "Annotate <{tag}>": "Anotar <{tag}>",
  },
  pt: {
    Conversation: "Conversa",
    "Show conversation": "Mostrar conversa",
    "Hide conversation": "Ocultar conversa",
    "Minimize conversation": "Minimizar conversa",
    Minimize: "Minimizar",
    "New reply": "Nova resposta",
    "{n} queued": "{n} na fila",
    " ({n} queued)": " ({n} na fila)",
    " (new reply)": " (nova resposta)",
    "Session ended": "Sessão encerrada",
    "Agent is working…": "O agente está trabalhando…",
    "External listener active": "Escuta externa ativa",
    "Agent listening": "Agente ouvindo",
    "Agent not listening": "Agente desconectado",
    More: "Mais",
    Revisions: "Revisões",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "O agente registra estas revisões na própria página. “Mostrar” leva ao próximo trecho marcado nessa revisão; a aparência da página não muda.",
    Reveal: "Mostrar",
    "Reveal {pos}/{total}": "Mostrar {pos}/{total}",
    "Reveal the next block changed in {label}": "Mostrar o próximo trecho alterado em “{label}”",
    "Ask about selected text": "Perguntar sobre o texto selecionado",
    "Toggle annotate/explore mode": "Ativar/desativar perguntas por seleção",
    Editing: "Arquivo",
    "Copy path": "Copiar caminho",
    Copy: "Copiar",
    Copied: "Copiado",
    "Reload page": "Recarregar página",
    "End session": "Encerrar sessão",
    "Take over here": "Continuar aqui",
    "Check and reload": "Verificar e recarregar",
    Dismiss: "Fechar",
    Reload: "Recarregar",
    "Message the agent, or select text on the page to ask about it":
      "Escreva para o agente, ou selecione um texto da página para perguntar",
    "Select any sentence on the page to ask about it, or write a message below.":
      "Selecione qualquer frase da página para perguntar, ou escreva uma mensagem abaixo.",
    "Attach images": "Anexar imagens",
    "Send everything and end the session": "Enviar tudo e encerrar a sessão",
    "Send & End": "Enviar e encerrar",
    "Send to Agent": "Enviar",
    "Session ended.": "Sessão encerrada.",
    "To talk here again, copy this and send it to any agent.":
      "Para voltar a conversar aqui, copie isto e envie para qualquer agente.",
    "Talk with me in this Textcast window:": "Converse comigo nesta janela do Textcast:",
    "Then follow the next_step it prints.": "Depois, siga o next_step que ele mostrar.",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Esta página está aberta em outra aba. Respostas não enviadas ficam na aba onde foram digitadas; continuar aqui não as traz.",
    "The agent is offline for now. Messages you send are kept, and it gets them when it is back.":
      "O agente está offline no momento. Suas mensagens ficam guardadas e chegam a ele quando voltar.",
    "Connecting to the agent\u2026": "Conectando ao agente…",
    Agent: "Agente",
    You: "Você",
    Queued: "Na fila",
    "Sending…": "Enviando…",
    Cancel: "Cancelar",
    Save: "Salvar",
    "Edit queued prompt": "Editar mensagem na fila",
    "Remove queued prompt": "Remover mensagem da fila",
    "Image message": "Mensagem com imagem",
    "Image annotation": "Anotação de imagem",
    "Image expired": "Imagem expirada",
    "{n} more image": "mais {n} imagem",
    "{n} more images": "mais {n} imagens",
    Seen: "Visto",
    Working: "Em andamento",
    Done: "Concluído",
    "Seen: not yet": "Ainda não visto",
    "Working: not yet": "Ainda não iniciado",
    "Done: not yet": "Ainda não concluído",
    "No agent is listening": "Nenhum agente ouvindo",
    Delivering: "Entregando",
    "Agent is busy; delivered on its next poll": "O agente está ocupado; será entregue quando ele voltar a ouvir",
    "Unsent annotation": "Anotação não enviada",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "O trecho ao qual esta nota estava ligada foi removido ou substituído na página, por isso ela não pôde ficar aberta. Seu texto está guardado aqui:",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Respostas não enviadas ficam na aba onde foram digitadas; continuar em outra janela não as traz.",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Nada na fila nesta aba. Respostas não enviadas ficam na aba onde foram digitadas; continuar em outra janela não as traz.",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "Nada para enviar. Para encerrar sem comentários, escolha “Encerrar sessão” no menu Mais (⋮).",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "Ainda tentando enviar. Seu texto está salvo nesta aba. Mantenha-a aberta e verifique se o servidor está rodando.",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "Não foi possível enviar. Seu texto continua na fila. Verifique se o Textcast Chat está rodando e clique em “Enviar” de novo.",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "Não foi possível enviar. Seu texto continua na fila. Verifique se o Textcast Chat está rodando e clique em “Enviar e encerrar” de novo.",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "Não foi possível preparar tudo em 5 segundos. A sessão continua aberta e as mensagens na fila ainda podem ser editadas.",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "Não foi possível enviar porque o conteúdo é grande demais. Ele continua na fila. Remova texto ou imagens e tente de novo.",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "Não enviado — {detail}. Remova ou troque a imagem e envie de novo.",
    "more than {n} images on one prompt": "mais de {n} imagens em uma mensagem",
    "too many images queued at once": "imagens demais na fila de uma vez",
    "an image attachment was malformed": "uma imagem está corrompida",
    "an image is no longer available": "uma imagem não está mais disponível",
    "some attachments could not be delivered": "algumas imagens não puderam ser entregues",
    "Uploading…": "Enviando arquivo…",
    "Upload failed": "Falha no envio",
    Retry: "Tentar de novo",
    Remove: "Remover",
    "Retry {name}": "Tentar {name} de novo",
    "Remove {name}": "Remover {name}",
    "Remove image": "Remover imagem",
    "Could not read image": "Não foi possível ler a imagem",
    "Waiting for an image to finish uploading…": "Aguardando o envio da imagem terminar…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "Uma imagem não pôde ser anexada. Tente de novo ou remova-a antes de enviar.",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "Uma imagem não pôde ser anexada. Tente de novo ou remova-a antes de pôr na fila.",
    "You can attach up to {n} image.": "Você pode anexar até {n} imagem.",
    "You can attach up to {n} images.": "Você pode anexar até {n} imagens.",
    "Image is larger than the {limit} limit": "A imagem passa do limite de {limit}",
    "Unsupported file type. Use {types}.": "Tipo de arquivo não suportado. Use {types}.",
    "Too many uploads. Wait a moment and retry.": "Envios demais. Aguarde um momento e tente de novo.",
    "Upload limit reached for this session ({limit}).": "Limite de envios desta sessão atingido ({limit}).",
    "Too many uploads in flight. Wait a moment and retry.":
      "Envios simultâneos demais. Aguarde um momento e tente de novo.",
    "Textcast Chat was updated. This page is running the previous version.":
      "O Textcast Chat foi atualizado. Esta página ainda usa a versão anterior.",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "O Textcast Chat foi reiniciado com uma compilação local. Esta página ainda usa a versão anterior.",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "O Textcast Chat foi reiniciado. Esta página ainda usa a versão anterior.",
    "Textcast Chat was stopped. Reload after you start it again.":
      "O Textcast Chat foi parado. Recarregue a página depois de iniciá-lo de novo.",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "O servidor do Textcast Chat desta página não está mais rodando. Recarregar vai funcionar quando ele voltar.",
    "Textcast Chat did not answer.": "O Textcast Chat não respondeu.",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "O Textcast Chat não respondeu à verificação, então não dá para saber se está rodando. Tente de novo em instantes.",
    "Textcast Chat could not load this artifact.": "Não foi possível carregar a página.",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "O Textcast Chat não respondeu ao carregamento; geralmente ele reiniciou enquanto a página abria. Use “Verificar e recarregar” para reconectar.",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "O Textcast Chat ainda não responde. Peça ao seu agente para reiniciá-lo e use “Verificar e recarregar”.",
    "This review is already open in another tab.": "Esta página já está aberta em outra aba.",
    "Textcast Chat is not running.": "O Textcast Chat não está rodando.",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "O Textcast Chat reiniciou e não voltou. Peça ao seu agente para iniciá-lo de novo e depois verifique e recarregue a página.",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "O Textcast Chat ainda não está rodando. Peça ao seu agente para iniciá-lo de novo e use “Verificar e recarregar”.",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "O Textcast Chat ainda não está rodando. Inicie-o de novo e use “Verificar e recarregar”.",
    "Textcast Chat could not finish loading.": "Não foi possível concluir o carregamento.",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "O script da interface do Textcast Chat não carregou; geralmente o servidor reiniciou enquanto a página abria. Use “Verificar e recarregar” para reconectar.",
    "Now playing": "Reproduzindo",
    "Close player": "Fechar player",
    "Play the video when a line is clicked": "Reproduzir o vídeo ao clicar em uma frase",
    Ask: "Perguntar",
    "Ask about this, or say what to change...": "Pergunte sobre isto, ou diga o que mudar…",
    "Tell the agent what to change...": "Diga ao agente o que mudar…",
    "Attach image": "Anexar imagem",
    "Enter to queue · {key}+Enter to send": "Enter para pôr na fila · {key}+Enter para enviar",
    Queue: "Pôr na fila",
    Send: "Enviar",
    "Annotate <{tag}>": "Anotar <{tag}>",
  },
  it: {
    Conversation: "Conversazione",
    "Show conversation": "Mostra conversazione",
    "Hide conversation": "Nascondi conversazione",
    "Minimize conversation": "Riduci conversazione",
    Minimize: "Riduci",
    "New reply": "Nuova risposta",
    "{n} queued": "{n} in coda",
    " ({n} queued)": " ({n} in coda)",
    " (new reply)": " (nuova risposta)",
    "Session ended": "Sessione terminata",
    "Agent is working…": "L’agente sta lavorando…",
    "External listener active": "Ascolto esterno attivo",
    "Agent listening": "Agente in ascolto",
    "Agent not listening": "Agente non connesso",
    More: "Altro",
    Revisions: "Revisioni",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "L’agente indica queste revisioni nella pagina stessa. «Mostra» porta al prossimo punto segnato per quella revisione; l’aspetto della pagina non cambia.",
    Reveal: "Mostra",
    "Reveal {pos}/{total}": "Mostra {pos}/{total}",
    "Reveal the next block changed in {label}": "Mostra il prossimo punto modificato in «{label}»",
    "Ask about selected text": "Chiedi sul testo selezionato",
    "Toggle annotate/explore mode": "Attiva/disattiva domande sulla selezione",
    Editing: "File",
    "Copy path": "Copia percorso",
    Copy: "Copia",
    Copied: "Copiato",
    "Reload page": "Ricarica pagina",
    "End session": "Termina sessione",
    "Take over here": "Continua qui",
    "Check and reload": "Verifica e ricarica",
    Dismiss: "Chiudi",
    Reload: "Ricarica",
    "Message the agent, or select text on the page to ask about it":
      "Scrivi all’agente, oppure seleziona del testo nella pagina per fare una domanda",
    "Select any sentence on the page to ask about it, or write a message below.":
      "Seleziona una frase della pagina per fare una domanda, oppure scrivi un messaggio qui sotto.",
    "Attach images": "Allega immagini",
    "Send everything and end the session": "Invia tutto e termina la sessione",
    "Send & End": "Invia e termina",
    "Send to Agent": "Invia",
    "Session ended.": "Sessione terminata.",
    "To talk here again, copy this and send it to any agent.":
      "Per riprendere la conversazione qui, copia questo testo e invialo a un agente qualsiasi.",
    "Talk with me in this Textcast window:": "Parla con me in questa finestra di Textcast:",
    "Then follow the next_step it prints.": "Poi segui il next_step che stampa.",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Questa pagina è aperta in un’altra scheda. Le risposte non inviate restano nella scheda in cui le hai scritte; continuare qui non le porta con sé.",
    "The agent is offline for now. Messages you send are kept, and it gets them when it is back.":
      "L'agente al momento non è in linea. I messaggi vengono conservati e gli arriveranno al suo ritorno.",
    "Connecting to the agent\u2026": "Connessione all'agente…",
    Agent: "Agente",
    You: "Tu",
    Queued: "In coda",
    "Sending…": "Invio…",
    Cancel: "Annulla",
    Save: "Salva",
    "Edit queued prompt": "Modifica messaggio in coda",
    "Remove queued prompt": "Rimuovi messaggio in coda",
    "Image message": "Messaggio con immagine",
    "Image annotation": "Nota sull’immagine",
    "Image expired": "Immagine scaduta",
    "{n} more image": "altra {n} immagine",
    "{n} more images": "altre {n} immagini",
    Seen: "Letto",
    Working: "In corso",
    Done: "Fatto",
    "Seen: not yet": "Non ancora letto",
    "Working: not yet": "Non ancora iniziato",
    "Done: not yet": "Non ancora fatto",
    "No agent is listening": "Nessun agente in ascolto",
    Delivering: "Consegna in corso",
    "Agent is busy; delivered on its next poll": "L’agente è occupato; verrà consegnato al prossimo ascolto",
    "Unsent annotation": "Nota non inviata",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "Il punto a cui era collegata questa nota è stato rimosso o sostituito nella pagina, quindi non è potuta restare aperta. Il tuo testo è conservato qui:",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Le risposte non inviate restano nella scheda in cui le hai scritte; continuare in un’altra finestra non le porta con sé.",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Niente in coda in questa scheda. Le risposte non inviate restano nella scheda in cui le hai scritte; continuare in un’altra finestra non le porta con sé.",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "Niente da inviare. Per terminare senza commenti, scegli «Termina sessione» nel menu Altro (⋮).",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "Sto ancora provando a inviare. Il tuo testo è salvato in questa scheda. Tienila aperta e controlla che il server sia attivo.",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "Invio non riuscito. Il tuo testo è ancora in coda. Controlla che Textcast Chat sia attivo, poi premi di nuovo «Invia».",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "Invio non riuscito. Il tuo testo è ancora in coda. Controlla che Textcast Chat sia attivo, poi premi di nuovo «Invia e termina».",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "Non è stato possibile preparare tutto in 5 secondi. La sessione resta aperta e i messaggi in coda sono ancora modificabili.",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "Invio non riuscito perché il contenuto è troppo grande. È ancora in coda. Togli del testo o delle immagini e riprova.",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "Non inviato — {detail}. Rimuovi o sostituisci l’immagine, poi invia di nuovo.",
    "more than {n} images on one prompt": "più di {n} immagini in un messaggio",
    "too many images queued at once": "troppe immagini in coda insieme",
    "an image attachment was malformed": "un’immagine è danneggiata",
    "an image is no longer available": "un’immagine non è più disponibile",
    "some attachments could not be delivered": "alcune immagini non sono state consegnate",
    "Uploading…": "Caricamento…",
    "Upload failed": "Caricamento non riuscito",
    Retry: "Riprova",
    Remove: "Rimuovi",
    "Retry {name}": "Riprova {name}",
    "Remove {name}": "Rimuovi {name}",
    "Remove image": "Rimuovi immagine",
    "Could not read image": "Impossibile leggere l’immagine",
    "Waiting for an image to finish uploading…": "In attesa che l’immagine finisca di caricarsi…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "Non è stato possibile allegare un’immagine. Riprova o rimuovila prima di inviare.",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "Non è stato possibile allegare un’immagine. Riprova o rimuovila prima di metterla in coda.",
    "You can attach up to {n} image.": "Puoi allegare al massimo {n} immagine.",
    "You can attach up to {n} images.": "Puoi allegare al massimo {n} immagini.",
    "Image is larger than the {limit} limit": "L’immagine supera il limite di {limit}",
    "Unsupported file type. Use {types}.": "Tipo di file non supportato. Usa {types}.",
    "Too many uploads. Wait a moment and retry.": "Troppi caricamenti. Attendi un momento e riprova.",
    "Upload limit reached for this session ({limit}).":
      "Limite di caricamenti raggiunto per questa sessione ({limit}).",
    "Too many uploads in flight. Wait a moment and retry.":
      "Troppi caricamenti in corso. Attendi un momento e riprova.",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat è stato aggiornato. Questa pagina usa ancora la versione precedente.",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat è stato riavviato con una build locale. Questa pagina usa ancora la versione precedente.",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat è stato riavviato. Questa pagina usa ancora la versione precedente.",
    "Textcast Chat was stopped. Reload after you start it again.":
      "Textcast Chat è stato fermato. Ricarica la pagina dopo averlo riavviato.",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "Il server Textcast Chat di questa pagina non è più attivo. Potrai ricaricare quando sarà di nuovo in funzione.",
    "Textcast Chat did not answer.": "Textcast Chat non risponde.",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat non ha risposto alla verifica, quindi non si sa se è attivo. Riprova tra un momento.",
    "Textcast Chat could not load this artifact.": "Impossibile caricare la pagina.",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat non ha risposto al caricamento; di solito si è riavviato mentre la pagina si apriva. Usa «Verifica e ricarica» per riconnetterti.",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat continua a non rispondere. Chiedi al tuo agente di riavviarlo, poi usa «Verifica e ricarica».",
    "This review is already open in another tab.": "Questa pagina è già aperta in un’altra scheda.",
    "Textcast Chat is not running.": "Textcast Chat non è attivo.",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat si è riavviato e non è tornato. Chiedi al tuo agente di riavviarlo, poi verifica e ricarica la pagina.",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat non è ancora attivo. Chiedi al tuo agente di riavviarlo, poi usa «Verifica e ricarica».",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat non è ancora attivo. Riavvialo, poi usa «Verifica e ricarica».",
    "Textcast Chat could not finish loading.": "Impossibile completare il caricamento.",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "Lo script dell’interfaccia di Textcast Chat non si è caricato; di solito il server si è riavviato mentre la pagina si apriva. Usa «Verifica e ricarica» per riconnetterti.",
    "Now playing": "In riproduzione",
    "Close player": "Chiudi lettore",
    "Play the video when a line is clicked": "Riproduci il video al clic su una frase",
    Ask: "Chiedi",
    "Ask about this, or say what to change...": "Fai una domanda, oppure di’ cosa cambiare…",
    "Tell the agent what to change...": "Di’ all’agente cosa cambiare…",
    "Attach image": "Allega immagine",
    "Enter to queue · {key}+Enter to send": "Invio per mettere in coda · {key}+Invio per inviare",
    Queue: "Metti in coda",
    Send: "Invia",
    "Annotate <{tag}>": "Annota <{tag}>",
  },
  ru: {
    Conversation: "Диалог",
    "Show conversation": "Показать диалог",
    "Hide conversation": "Скрыть диалог",
    "Minimize conversation": "Свернуть диалог",
    Minimize: "Свернуть",
    "New reply": "Новый ответ",
    "{n} queued": "В очереди: {n}",
    " ({n} queued)": " (в очереди: {n})",
    " (new reply)": " (новый ответ)",
    "Session ended": "Сессия завершена",
    "Agent is working…": "Агент работает…",
    "External listener active": "Внешний слушатель подключён",
    "Agent listening": "Агент на связи",
    "Agent not listening": "Агент не на связи",
    More: "Ещё",
    Revisions: "Правки",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "Агент сам отмечает правки на странице. «Показать» переходит к следующему месту, отмеченному в этой правке; вид страницы не меняется.",
    Reveal: "Показать",
    "Reveal {pos}/{total}": "Показать {pos}/{total}",
    "Reveal the next block changed in {label}": "Показать следующее место, изменённое в «{label}»",
    "Ask about selected text": "Спросить о выделенном тексте",
    "Toggle annotate/explore mode": "Вкл./выкл. вопросы по выделению",
    Editing: "Файл",
    "Copy path": "Копировать путь",
    Copy: "Копировать",
    Copied: "Скопировано",
    "Reload page": "Перезагрузить страницу",
    "End session": "Завершить сессию",
    "Take over here": "Продолжить здесь",
    "Check and reload": "Проверить и перезагрузить",
    Dismiss: "Закрыть",
    Reload: "Перезагрузить",
    "Message the agent, or select text on the page to ask about it":
      "Напишите агенту или выделите текст на странице, чтобы задать вопрос",
    "Select any sentence on the page to ask about it, or write a message below.":
      "Выделите любое предложение на странице, чтобы задать вопрос, или напишите сообщение ниже.",
    "Attach images": "Прикрепить изображения",
    "Send everything and end the session": "Отправить всё и завершить сессию",
    "Send & End": "Отправить и завершить",
    "Send to Agent": "Отправить",
    "Session ended.": "Сессия завершена.",
    "To talk here again, copy this and send it to any agent.":
      "Чтобы снова поговорить здесь, скопируйте этот текст и отправьте любому агенту.",
    "Talk with me in this Textcast window:": "Поговори со мной в этом окне Textcast:",
    "Then follow the next_step it prints.": "Затем следуй next_step из его вывода.",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Эта страница открыта в другой вкладке. Неотправленные ответы остаются во вкладке, где вы их ввели; если продолжить здесь, они не перенесутся.",
    "The agent is offline for now. Messages you send are kept, and it gets them when it is back.":
      "Агент сейчас не в сети. Ваши сообщения сохранятся и дойдут до него, когда он вернётся.",
    "Connecting to the agent\u2026": "Подключение к агенту…",
    Agent: "Агент",
    You: "Вы",
    Queued: "В очереди",
    "Sending…": "Отправка…",
    Cancel: "Отмена",
    Save: "Сохранить",
    "Edit queued prompt": "Изменить сообщение в очереди",
    "Remove queued prompt": "Удалить сообщение из очереди",
    "Image message": "Сообщение с изображением",
    "Image annotation": "Заметка к изображению",
    "Image expired": "Срок изображения истёк",
    "{n} more image": "Ещё изображений: {n}",
    "{n} more images": "Ещё изображений: {n}",
    Seen: "Прочитано",
    Working: "В работе",
    Done: "Готово",
    "Seen: not yet": "Ещё не прочитано",
    "Working: not yet": "Ещё не начато",
    "Done: not yet": "Ещё не готово",
    "No agent is listening": "Агент не на связи",
    Delivering: "Доставка",
    "Agent is busy; delivered on its next poll": "Агент занят; сообщение придёт, когда он снова начнёт слушать",
    "Unsent annotation": "Неотправленная заметка",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "Фрагмент, к которому была привязана заметка, удалён или заменён на странице, поэтому её не удалось сохранить на месте. Ваш текст сохранён здесь:",
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "Неотправленные ответы остаются во вкладке, где вы их ввели; если продолжить в другом окне, они не перенесутся.",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "В этой вкладке очередь пуста. Неотправленные ответы остаются во вкладке, где вы их ввели; если продолжить в другом окне, они не перенесутся.",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "Нечего отправлять. Чтобы завершить без отзыва, выберите «Завершить сессию» в меню «Ещё» (⋮).",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "Продолжаем попытки отправки. Текст сохранён в этой вкладке. Не закрывайте её и проверьте, что сервер работает.",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "Не удалось отправить. Текст остаётся в очереди. Проверьте, что Textcast Chat запущен, и снова нажмите «Отправить».",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "Не удалось отправить. Текст остаётся в очереди. Проверьте, что Textcast Chat запущен, и снова нажмите «Отправить и завершить».",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "Не удалось подготовить всё за 5 секунд. Сессия открыта, сообщения в очереди по-прежнему можно изменить.",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "Не удалось отправить: слишком большой объём. Сообщение осталось в очереди. Удалите часть текста или изображений и попробуйте снова.",
    "Not sent — {detail}. Remove or fix the image, then send again.":
      "Не отправлено — {detail}. Удалите или замените изображение и отправьте снова.",
    "more than {n} images on one prompt": "в одном сообщении больше {n} изображений",
    "too many images queued at once": "слишком много изображений в очереди сразу",
    "an image attachment was malformed": "изображение повреждено",
    "an image is no longer available": "изображение больше недоступно",
    "some attachments could not be delivered": "некоторые изображения не удалось доставить",
    "Uploading…": "Загрузка…",
    "Upload failed": "Ошибка загрузки",
    Retry: "Повторить",
    Remove: "Удалить",
    "Retry {name}": "Повторить {name}",
    "Remove {name}": "Удалить {name}",
    "Remove image": "Удалить изображение",
    "Could not read image": "Не удалось прочитать изображение",
    "Waiting for an image to finish uploading…": "Ждём окончания загрузки изображения…",
    "An image couldn't be attached. Retry or remove it before sending.":
      "Не удалось прикрепить изображение. Повторите или удалите его перед отправкой.",
    "An image couldn't be attached. Retry or remove it before queuing.":
      "Не удалось прикрепить изображение. Повторите или удалите его, прежде чем ставить в очередь.",
    "You can attach up to {n} image.": "Можно прикрепить не больше {n} изображения.",
    "You can attach up to {n} images.": "Можно прикрепить не больше {n} изображений.",
    "Image is larger than the {limit} limit": "Изображение больше лимита {limit}",
    "Unsupported file type. Use {types}.": "Неподдерживаемый тип файла. Используйте {types}.",
    "Too many uploads. Wait a moment and retry.": "Слишком много загрузок. Подождите немного и повторите.",
    "Upload limit reached for this session ({limit}).": "Достигнут лимит загрузок для этой сессии ({limit}).",
    "Too many uploads in flight. Wait a moment and retry.":
      "Слишком много одновременных загрузок. Подождите немного и повторите.",
    "Textcast Chat was updated. This page is running the previous version.":
      "Textcast Chat обновлён. Эта страница работает на предыдущей версии.",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "Textcast Chat перезапущен с локальной сборкой. Эта страница работает на предыдущей версии.",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "Textcast Chat перезапущен. Эта страница работает на предыдущей версии.",
    "Textcast Chat was stopped. Reload after you start it again.":
      "Textcast Chat остановлен. Перезагрузите страницу после повторного запуска.",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "Сервер Textcast Chat этой страницы больше не работает. Перезагрузка сработает, когда он снова запустится.",
    "Textcast Chat did not answer.": "Textcast Chat не отвечает.",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "Textcast Chat не ответил на проверку, поэтому неясно, работает ли он. Попробуйте чуть позже.",
    "Textcast Chat could not load this artifact.": "Не удалось загрузить страницу.",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "Textcast Chat не ответил на запрос загрузки — обычно он перезапустился, пока открывалась страница. Нажмите «Проверить и перезагрузить», чтобы переподключиться.",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "Textcast Chat всё ещё не отвечает. Попросите агента запустить его снова, затем нажмите «Проверить и перезагрузить».",
    "This review is already open in another tab.": "Эта страница уже открыта в другой вкладке.",
    "Textcast Chat is not running.": "Textcast Chat не запущен.",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "Textcast Chat перезапустился и не вернулся. Попросите агента запустить его снова, затем проверьте и перезагрузите страницу.",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "Textcast Chat всё ещё не запущен. Попросите агента запустить его снова, затем нажмите «Проверить и перезагрузить».",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "Textcast Chat всё ещё не запущен. Запустите его снова, затем нажмите «Проверить и перезагрузить».",
    "Textcast Chat could not finish loading.": "Не удалось завершить загрузку.",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "Скрипт интерфейса Textcast Chat не загрузился — обычно сервер перезапустился, пока открывалась страница. Нажмите «Проверить и перезагрузить», чтобы переподключиться.",
    "Now playing": "Воспроизведение",
    "Close player": "Закрыть плеер",
    "Play the video when a line is clicked": "Воспроизводить видео по клику на фразу",
    Ask: "Спросить",
    "Ask about this, or say what to change...": "Задайте вопрос или напишите, что изменить…",
    "Tell the agent what to change...": "Напишите агенту, что изменить…",
    "Attach image": "Прикрепить изображение",
    "Enter to queue · {key}+Enter to send": "Enter — в очередь · {key}+Enter — отправить",
    Queue: "В очередь",
    Send: "Отправить",
    "Annotate <{tag}>": "Заметка к <{tag}>",
  },
};
