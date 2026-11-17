"""Analyse a phone screen recording of the lightbox, frame by frame.

    python3 -I playground/tests/perf/recording.py <video> [out-dir]

Needs ffprobe (ffmpeg), numpy and opencv-python. For every pair of frames it measures how far the
picture moved (phase correlation) and how much of the screen changed. It then lists each
animation with its frame rate, frames that came late, frames that stood still in the middle of
the motion, and the largest step in one frame. A smooth animation has no still frame and no step
that is far larger than its neighbours. Flagged animations are written as frame strips to look at.

Limits: there is no finger in a recording, so it shows what the screen did, not how well it
followed the hand. A step of more than half the screen width wraps around and is reported with
the wrong sign and size; look at the strip. An idle screen is recorded at 20 frames per second,
so the first frame of an animation can arrive up to 50 ms late without a fault of the page.
"""

import csv
import os
import subprocess
import sys

import cv2
import numpy as np

WIDTH = 390  # one tracked pixel is about one CSS pixel on a phone
ACTIVE = 0.5  # mean brightness change that counts as motion
STILL = 0.3
LATE_MS = 25


def frame_times(video):
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', video],
        check=True, capture_output=True, text=True,
    ).stdout
    return [float(line.strip().rstrip(',')) for line in out.splitlines() if line.strip()]


def track(video, times):
    capture = cv2.VideoCapture(video)
    rows, previous, window, index = [], None, None, 0
    while True:
        ok, frame = capture.read()
        if not ok or index >= len(times):
            break
        height = round(frame.shape[0] * WIDTH / frame.shape[1])
        gray = cv2.cvtColor(cv2.resize(frame, (WIDTH, height), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
        # Leave out the status bar and the browser bar.
        band = gray[height // 12 : height - height // 10]
        if previous is not None:
            if window is None:
                window = cv2.createHanningWindow((band.shape[1], band.shape[0]), cv2.CV_32F)
            (dx, dy), _ = cv2.phaseCorrelate(previous[0], band, window)
            rows.append({
                'i': index, 't': times[index], 'dt': (times[index] - times[index - 1]) * 1000,
                'change': float(np.mean(np.abs(gray - previous[1]))), 'dx': dx, 'dy': dy,
            })
        previous = (band, gray)
        index += 1
    return rows


def animations(rows):
    found, current = [], None
    for position, row in enumerate(rows):
        if row['change'] <= ACTIVE:
            continue
        if current and row['t'] - rows[current[1]]['t'] < 0.25:
            current[1] = position
        else:
            current = [position, position]
            found.append(current)
    return [(a, b) for a, b in found if rows[b]['t'] - rows[a]['t'] >= 0.1]


def strip(video, times, start, end, path):
    capture = cv2.VideoCapture(video)
    tiles, index = [], 0
    while True:
        ok, frame = capture.read()
        if not ok or index >= len(times) or times[index] > end:
            break
        if times[index] >= start:
            small = cv2.resize(frame, (156, round(frame.shape[0] * 156 / frame.shape[1])), interpolation=cv2.INTER_AREA)
            late = index and (times[index] - times[index - 1]) * 1000 > LATE_MS
            cv2.rectangle(small, (0, 0), (156, 16), (0, 0, 0), -1)
            label = '%.3f +%d' % (times[index], round((times[index] - times[index - 1]) * 1000) if index else 0)
            cv2.putText(small, label, (3, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 0, 255) if late else (0, 255, 255), 1)
            tiles.append(small)
        index += 1
    if not tiles:
        return
    columns = 12
    blank = np.zeros_like(tiles[0])
    lines = [np.hstack((tiles[k : k + columns] + [blank] * columns)[:columns]) for k in range(0, len(tiles), columns)]
    cv2.imwrite(path, np.vstack(lines))


def main():
    video = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else 'recording-analysis'
    os.makedirs(out, exist_ok=True)
    times = frame_times(video)
    rows = track(video, times)
    with open(os.path.join(out, 'frames.csv'), 'w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=['i', 't', 'dt', 'change', 'dx', 'dy'])
        writer.writeheader()
        for row in rows:
            writer.writerow({key: round(value, 3) for key, value in row.items()})

    print('%d frames, %.1f s' % (len(times), times[-1]))
    print(' start    end    ms  fps  late  still  largest step  direction   flag')
    for number, (a, b) in enumerate(animations(rows)):
        part = rows[a : b + 1]
        duration = (part[-1]['t'] - part[0]['t']) * 1000
        late = sum(1 for row in part[1:] if row['dt'] > LATE_MS)
        still = sum(1 for row in part[1:-1] if row['change'] < STILL)
        sum_x, sum_y = sum(row['dx'] for row in part), sum(row['dy'] for row in part)
        sideways = abs(sum_x) > abs(sum_y)
        steps = [abs(row['dx'] if sideways else row['dy']) for row in part]
        largest = max(steps)
        typical = float(np.median([step for step in steps if step > 1] or [0]))
        # A leap: one frame moves several times as far as the frames around it.
        leap = largest > 60 and largest > 3 * max(typical, 1)
        flag = ' '.join(name for name, on in (('leap', leap), ('still', still > 0 and largest > 20), ('late', late > 1)) if on)
        print('%6.2f %6.2f %5.0f %4.0f %5d %6d %10.0f px  %-10s  %s' % (
            part[0]['t'], part[-1]['t'], duration, (len(part) - 1) / duration * 1000, late, still, largest,
            'sideways' if sideways else 'vertical', flag,
        ))
        if flag:
            strip(video, times, part[0]['t'] - 0.05, min(part[-1]['t'], part[0]['t'] + 0.45), os.path.join(out, 'strip-%02d-%.2fs.jpg' % (number, part[0]['t'])))
    print('frames.csv and the strips of flagged animations are in', out)


if __name__ == '__main__':
    main()
