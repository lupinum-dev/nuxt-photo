# Mobile feel: what "smooth" means and how we prove it

Goal: the lightbox feels right on a phone. Swiping between photos, dragging down
to close, opening and closing follow the finger and continue naturally after
the finger leaves.

"Smooth" is not a check. This file turns it into claims with numbers and names
the check for each. The owner accepted the feel on an iPhone on 2026-11-16
(build `ccf947f6`): swipe and drag, open and close, and the glow. From then on
the claims guard that feel: a change that turns one red is a regression.

The reasons behind the claims are decisions D31 to D37 in
`internals/decisions.md`.

## Commands

```sh
pnpm build:playground                       # the lab runs the built playground
pnpm --dir playground test:gesture          # the whole lab, about five minutes
GESTURE_ONLY='released|flick' pnpm --dir playground test:gesture  # matching scenarios only
GESTURE_OUT=dir pnpm --dir playground test:gesture  # write the evidence to dir
```

Evidence goes to `playground/test-results/gesture-trace/` (ignored by git):
per browser `summary.json`, `transitions.json` and `glow.json` with one entry
per scenario (its numbers and its failed claims), and the frame traces beside
them. Playwright empties `playground/test-results` at the start of a run; pass
`--output <elsewhere>` to keep an evidence folder there.

## The gesture lab

`playground/tests/perf/gesture-trace.spec.ts` opens the lightbox in two
headless phone profiles: Chromium (Pixel 7), which gets finger paths as real
touch events through CDP, and WebKit (iPhone 13), which gets the same paths as
mouse moves because Playwright's WebKit cannot send touch moves. It records in
the page, after the page's own frame callbacks, where each part is drawn on
every frame and when each pointer event arrived. A test fails when a claim
does not hold and lists each failed claim.

Three tests:

- `gesture traces`: slow drag and settle back, slow drag to the next photo,
  flick, late flick (far drag, then a fast last part), drag down and settle
  back, a fast flick with little distance left, catching a settling photo, a
  swipe whose photo change blocks the main thread for 40 ms, two drag-down
  closes (short and far), and a flick released 0, 1, 6, 11 and 15 ms after a
  frame's time stamp (the page holds the real release and dispatches a copy
  then).
- `transition traces`: open by tap, close by tap, the two drag-down closes,
  open and close with the main thread blocked 60 ms in the first frame after
  the start, open blocked 60 ms between the tap and the start, and an open from
  a thumbnail partly under the nav (`/?covered=1`). The script computes where
  the flight's own keyframes put the ghost on each drawn frame.
- `glow traces`: slow drag to the next photo, flick, slow drag and settle back,
  the right arrow key, a swipe blocked 60 ms in the frame after the settle's
  first, open by tap and close by tap. A glow's weight is its opacity times
  what the layers above it let through; the track's share is
  `1 − |photo centre − media centre| / one photo's travel`.

## Claims

Every claim here caught a real defect: "Caught" is its value on the code
before the fix, Chromium / WebKit where both were measured. Thresholds were
never loosened.

| #   | Claim                                                          | Check                                | Threshold          | Caught                             |
| --- | -------------------------------------------------------------- | ------------------------------------ | ------------------ | ---------------------------------- |
| 1   | A drag starts with the finger: no jump when the photo moves    | `startJumpPx`                        | ≤ 2 px             | 11.1 to 14.5 px                    |
| 2   | The photo stays under the finger while it is down              | `followGapMaxPx`                     | ≤ 1 px             | 1.8 px on the close drag           |
| 3   | No frame without movement once the page has the release        | `deadFramesAfterDelivery`            | 0                  | 2 frames after a rest              |
| 4   | The settle starts at the speed the finger left with (Chromium) | `speedKept`                          | 0.8 to 1.25        | 0.70 late flick                    |
| 5   | The settle is quick                                            | `halfWayMs`, `ninetyMs`, `settledMs` | ≤ 100, 250, 400 ms | 185, 352, 500 ms                   |
| 8   | A swipe's move: no Vue update and one track write              | e2e `slide-track.spec.ts`            | 0 and 1            | (guard of the slide track)         |
| 9   | Catching a settling photo causes no jump                       | `catchJumpPx`, catch scenario        | ≤ 1 px             | 1.3 px with the old settle         |
| 17  | The release never leaps                                        | `releaseLeapPx`, every scenario      | ≤ 6 px             | 79.8 / 59.2 (slow change)          |
| 19  | A slow photo change does not stop the photo                    | `blockBeforeMotion`, slow change     | 0                  | 1 / 1                              |
| 21  | The caption stays with its own photo frame                     | `captionDriftPx`, swipes and catch   | ≤ 1 px             | 55.7 to 412 / 61.3 to 390          |
| 22  | No caption overlaps another photo                              | `captionOverlapPx`                   | 0 px               | 38.2 / 13.6 (catch)                |
| 23  | The new caption is fully shown when the settle ends            | `captionLateMs`                      | 0 ms               | 133 to 250 / 150 to 330            |
| 24  | No frame without a caption                                     | `captionGapFrames`                   | 0                  | up to 3 / up to 3                  |
| 27  | The first frame of a settle shows at most one frame            | `firstShownMs`, every settle         | ≤ 17 ms            | – / up to 32.7 (released 15 ms in) |
| 28  | An open's or close's first moving frame covers little of it    | `flightFirstShare`                   | ≤ 0.1              | 0.376 / 0.718                      |
| 32  | The backdrop changes evenly over an open or close              | `backdropStepMax` (per 1/60 s)       | ≤ 0.12             | 0.242 / 0.246                      |
| 33  | Controls and captions change evenly                            | `chromeStepMax` (per 1/60 s)         | ≤ 0.34             | 1 / 1                              |
| 35  | Blocked after the start: a frame showed motion before it       | `flightBlockBeforeMotion`            | 0                  | 0 / 1                              |
| 37  | A thumbnail under the nav: no ghost flies, the fade runs       | `ghostShownFrames`                   | 0                  | 29 / 28                            |
| 38  | The incoming glow weighs what the track shows of its photo     | `glowFollowMax`                      | ≤ 0.06             | 0.917 / 0.953                      |
| 39  | The glow starts in the frame the photo starts moving           | `glowStartLagFrames`                 | 0                  | 67 / 49                            |
| 40  | The glow ends at most a frame after the photo                  | `glowEndLagFrames`                   | ≤ 1                | 17 / 18                            |
| 41  | No glow step beyond the track's own step                       | `glowExtraStepMax`                   | ≤ 0.12             | 0.228 / 0.265                      |
| 42  | A blocked main thread: an opacity animation moves the glow     | `glowStillInBlock`                   | 0                  | 1 / 1                              |
| 43  | Open: the glow is whole in the flight's first frame            | `glowMissingAtStart`                 | ≤ 0.01             | 0.78 / 0.749                       |
| 46  | A swipe's move writes the glow at most once                    | e2e `slide-track.spec.ts`            | ≤ 1                | (guard of the glow)                |

A unit test, not the lab, holds the ghost back until its image is decoded: the
lab's thumbnails are always loaded, so a blank ghost cannot happen there.

**Dropped in the consolidation pass (D37)**, each because it never failed on any build before the
fix it was added for, or measured the same frame as a kept claim:
`backwardStepPx` (6), `frameP95Ms` and `longTasks` at 4× CPU (7, timing only),
`openStepRatio` (20), `neighboursMissing` and `neighbourDecodeMs` (26),
`flightHitchRatio` (30), `flightSpeedTurns` (31), `flightOverPlannedPx` (34),
`ghostBlankFrames` (36, cannot fail in the lab), `glowDip` (44),
`glowFadesEarly` (45), `flightFirstBackdrop` (29, the same values as
`flightFirstShare`: the backdrop follows the flight's progress) and
`backdropStepMax` on the drag-down close in the gesture traces (25, it passed
on the old code; the transition copy is the one that caught the defect).

## How the trickier checks measure

- **`releaseLeapPx`** compares each step in the first 150 ms after the release
  with the speed before and after it and the finger's last speed; the first
  step may also cover what the photo had not yet drawn of the finger. Steps
  over 25 ms are frame pacing, not motion, and are skipped, except a step
  across a blocked photo change when no frame showed the settle before the
  block.
- **The caption claims.** Each caption is read between two reads of its own
  photo frame, up to three times, and a sample counts only when the two frame
  reads agree: WebKit samples a running animation when it is read.
  `captionDriftPx` is the range, over every frame where a caption is shown, of
  its offset from its own frame. A caption outside the slides belongs to the
  photo that was active when its text appeared. `captionOverlapPx` is the
  largest overlap of a shown caption with another slide's frame.
  `captionLateMs` is how long after the settle ends the new caption becomes
  fully shown inside the media area; `captionGapFrames` counts frames after the
  touch with no shown caption.
- **The cover check uses positions.** The open lightbox is a modal dialog: the
  page is inert, and inert elements take no part in hit testing, so
  `elementsFromPoint` sees only the lightbox. The check looks for fixed and
  sticky elements outside the lightbox that overlap the thumbnail; those that
  let pointers through (decoration) do not count.

## Limits of the checks we have

- **Headless engines on a Mac are not a phone.** The lab proves the shape of
  the motion, which is the same code on every device. It does not prove frame
  times on a phone GPU, 120 Hz screens, image decoding cost, or Mobile
  Safari's touch path and compositor. The owner's phone is the judge of those.
- **Touch through CDP is Chromium only.** Playwright's WebKit cannot send touch
  moves and there is no iOS Simulator here. The WebKit project drives a mouse:
  its moves arrive about 11 ms apart and its frames 2 to 57 ms apart, so
  `speedKept` is judged in Chromium only.
- **The recorder samples on the main thread.** It cannot see what the
  compositor drew while the main thread was blocked. After a block, Chromium
  runs the owed callbacks back to back with old time stamps; the lab keeps only
  the last of such a burst.
- **Machine load changes timings.** Under load (an average over 8), these reds
  come and go on unchanged code and are not regressions by themselves:
  WebKit `releaseLeapPx` between 6 and 11 on the flicks (WebKit reports frame
  times in whole ms and its drawn place can lead the read time by 1 to 3 ms),
  WebKit `flightFirstShare` and `backdropStepMax` just over their limits on the
  drag-down close and on `close by tap, blocked after the start`, and the
  settle times of claim 5. Judge a change against two baseline runs of the
  code before it, taken at a similar load.
- **Not covered:** two-finger pinch and pan, right-to-left layouts, and a
  reference page for the settle times.

## Phone recordings

```sh
python3 -I playground/tests/perf/recording.py <screen-recording.mp4> [out-dir]
```

`playground/tests/perf/recording.py` reads a phone screen recording frame by
frame: how far the picture moved and how much of the screen changed between
each pair of frames. It lists every animation with its frame rate, late frames,
frames that stood still in the middle of the motion and the largest step in one
frame, and writes frame strips of the flagged ones. It needs ffprobe, numpy and
opencv-python, and takes about a minute for 30 seconds of video. A recording
has no finger in it, so it shows what the screen did, not how well it followed
the hand; the judge of a strip is a person or Opus.
