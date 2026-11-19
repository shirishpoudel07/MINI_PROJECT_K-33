# VirtuHeal Local Video Directory

Place your offline or clinical `.mp4` video files here (e.g. `heel-slides.mp4`, `quad-sets.mp4`, `shoulder-rotation.mp4`).

Vite serves files in this directory directly at:
`/videos/<filename>.mp4`

By default, the active clinical tele-rehab routines stream via responsive YouTube `<iframe>` embeds defined in `src/data/mockData.js`. If you add local files here, the video players in `PatientPortal.jsx` and `VideoAssignment.jsx` will automatically support playback of them as well.
