"""
Synthesizes subtle cartoon audio assets for the 2.5D Cel-Shaded Story Video Engine.
Assets:
- public/audio/pizzicato_bed.wav (curious, sneaky, comedic pizzicato bed - seamless 8s loop at 120 BPM)
- public/audio/whoosh.wav (subtle camera cut / whip-pan whoosh)
- public/audio/pop.wav (subtle cartoon cork pop / active word emphasis)
- public/audio/clang.wav (subtle cartoon metallic chime)
- public/audio/thud.wav (subtle soft cartoon stomp / impact)
- public/audio/boing.wav (subtle comedic cartoon spring boing)
"""

import os
import wave
import struct
import math
import random

SAMPLE_RATE = 44100
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
os.makedirs(OUT_DIR, exist_ok=True)

def write_wav(filename, samples):
    filepath = os.path.join(OUT_DIR, filename)
    with wave.open(filepath, "w") as wf:
        wf.setnchannels(1)        # mono
        wf.setsampwidth(2)        # 16-bit
        wf.setframerate(SAMPLE_RATE)
        # clamp to [-1.0, 1.0] and convert to 16-bit signed int
        raw = bytearray()
        for s in samples:
            s_clamped = max(-0.98, min(0.98, s))
            val = int(s_clamped * 32767.0)
            raw.extend(struct.pack("<h", val))
        wf.writeframes(raw)
    print(f"Generated: {filepath} ({len(samples)} samples, {len(samples)/SAMPLE_RATE:.2f}s)")

def pluck(t, freq, decay=0.2, amp=0.5):
    """Simulates an acoustic pizzicato string pluck."""
    if t < 0:
        return 0.0
    # Quick attack (2ms), exponential decay
    env = (1.0 - math.exp(-t / 0.002)) * math.exp(-t / decay)
    # Fundamental + warm overtones
    y = math.sin(2 * math.pi * freq * t)
    y += 0.45 * math.sin(2 * math.pi * 2 * freq * t) * math.exp(-t / (decay * 0.7))
    y += 0.20 * math.sin(2 * math.pi * 3 * freq * t) * math.exp(-t / (decay * 0.4))
    y += 0.08 * math.sin(2 * math.pi * 4 * freq * t) * math.exp(-t / (decay * 0.25))
    return y * env * amp

def wood_click(t, amp=0.25):
    """Subtle woodblock / marimba mechanical clock tap."""
    if t < 0:
        return 0.0
    env = math.exp(-t / 0.015)
    f = 1200 + 400 * math.exp(-t / 0.005)
    return math.sin(2 * math.pi * f * t) * env * amp

def generate_pizzicato_bed():
    """Generates an 8-second seamless comedic pizzicato loop (16 beats @ 120 BPM)."""
    duration = 8.0  # seconds
    total_samples = int(duration * SAMPLE_RATE)
    samples = [0.0] * total_samples
    
    # 120 BPM: beat = 0.5s, 16th note = 0.125s
    # Chord progression: Cm -> Fm -> G7 -> Cm (2 seconds each)
    # Bass notes (Hz): C2=65.4, Eb2=77.8, F2=87.3, G2=98.0, Ab2=103.8, Bb2=116.5
    bass_pattern = [
        # Bar 1: Cm (0..2s)
        (0.0, 65.4), (0.5, 77.8), (1.0, 98.0), (1.5, 77.8),
        # Bar 2: Fm (2..4s)
        (2.0, 87.3), (2.5, 103.8), (3.0, 87.3), (3.5, 98.0),
        # Bar 3: G7 (4..6s)
        (4.0, 98.0), (4.5, 123.5), (5.0, 146.8), (5.5, 98.0),
        # Bar 4: Cm (6..8s)
        (6.0, 65.4), (6.5, 98.0), (7.0, 77.8), (7.5, 65.4),
    ]
    
    # Melody / Pizzicato violin counterpoint (Hz):
    # C4=261.6, D4=293.7, Eb4=311.1, F4=349.2, G4=392.0, Ab4=415.3, B4=493.9
    melody_pattern = [
        # Bar 1
        (0.25, 261.6), (0.75, 311.1), (1.25, 392.0), (1.75, 311.1),
        # Bar 2
        (2.25, 349.2), (2.75, 415.3), (3.25, 349.2), (3.75, 392.0),
        # Bar 3
        (4.25, 392.0), (4.75, 493.9), (5.25, 293.7), (5.75, 392.0),
        # Bar 4
        (6.25, 311.1), (6.75, 261.6), (7.25, 196.0), (7.75, 261.6),
    ]
    
    # Woodblock clicks on backbeats (beats 2 & 4 of each bar)
    clicks = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5]
    
    # Render bass
    for start_t, freq in bass_pattern:
        decay = 0.28
        note_samples = int(decay * 3.5 * SAMPLE_RATE)
        for i in range(note_samples):
            idx = (int(start_t * SAMPLE_RATE) + i) % total_samples
            t = i / SAMPLE_RATE
            samples[idx] += pluck(t, freq, decay=decay, amp=0.35)
            
    # Render melody
    for start_t, freq in melody_pattern:
        decay = 0.18
        note_samples = int(decay * 3.5 * SAMPLE_RATE)
        for i in range(note_samples):
            idx = (int(start_t * SAMPLE_RATE) + i) % total_samples
            t = i / SAMPLE_RATE
            samples[idx] += pluck(t, freq, decay=decay, amp=0.25)
            
    # Render clicks
    for start_t in clicks:
        click_samples = int(0.04 * SAMPLE_RATE)
        for i in range(click_samples):
            idx = (int(start_t * SAMPLE_RATE) + i) % total_samples
            t = i / SAMPLE_RATE
            samples[idx] += wood_click(t, amp=0.18)

    # Master subtle level (peak at ~0.4 to ensure it remains a gentle background bed)
    max_val = max(abs(s) for s in samples) or 1.0
    gain = 0.42 / max_val
    samples = [s * gain for s in samples]
    
    write_wav("pizzicato_bed.wav", samples)

def generate_whoosh():
    """Subtle airy whip-pan whoosh (0.28s)."""
    duration = 0.28
    n = int(duration * SAMPLE_RATE)
    samples = [0.0] * n
    random.seed(42)
    # Bandpass swept filtered noise
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.sin(math.pi * (t / duration)) ** 2  # Bell envelope
        # Swept pitch tone + noise
        freq = 280 + 1200 * math.sin(math.pi * (t / duration))
        carrier = math.sin(2 * math.pi * freq * t)
        noise = (random.random() * 2.0 - 1.0)
        samples[i] = (carrier * 0.4 + noise * 0.6) * env * 0.35
    write_wav("whoosh.wav", samples)

def generate_pop():
    """Subtle cartoon cork pop / bubble pop (0.07s)."""
    duration = 0.07
    n = int(duration * SAMPLE_RATE)
    samples = [0.0] * n
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t / 0.015)
        # Fast exponential pitch drop 750 -> 180 Hz
        freq = 180 + 570 * math.exp(-t / 0.012)
        samples[i] = math.sin(2 * math.pi * freq * t) * env * 0.40
    write_wav("pop.wav", samples)

def generate_clang():
    """Subtle comedic cartoon chime / metallic ding (0.35s)."""
    duration = 0.35
    n = int(duration * SAMPLE_RATE)
    samples = [0.0] * n
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t / 0.08)
        # Inharmonic spectrum of small metal bell
        y = math.sin(2 * math.pi * 920 * t) * 0.5
        y += math.sin(2 * math.pi * 1480 * t) * 0.3
        y += math.sin(2 * math.pi * 2310 * t) * 0.2
        samples[i] = y * env * 0.35
    write_wav("clang.wav", samples)

def generate_thud():
    """Subtle soft cartoon footstep / body impact (0.16s)."""
    duration = 0.16
    n = int(duration * SAMPLE_RATE)
    samples = [0.0] * n
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t / 0.035)
        freq = 55 + 95 * math.exp(-t / 0.02)
        samples[i] = math.sin(2 * math.pi * freq * t) * env * 0.45
    write_wav("thud.wav", samples)

def generate_boing():
    """Subtle cartoon comedic spring boing (0.42s)."""
    duration = 0.42
    n = int(duration * SAMPLE_RATE)
    samples = [0.0] * n
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t / 0.12)
        # Rising fundamental with rapid vibrato
        base_f = 220 + 160 * (1.0 - math.exp(-t / 0.15))
        vibrato = 22 * math.sin(2 * math.pi * 20 * t)
        freq = base_f + vibrato
        samples[i] = math.sin(2 * math.pi * freq * t) * env * 0.32
    write_wav("boing.wav", samples)

if __name__ == "__main__":
    print("Synthesizing cartoon sound library...")
    generate_pizzicato_bed()
    generate_whoosh()
    generate_pop()
    generate_clang()
    generate_thud()
    generate_boing()
    print("Cartoon sound library synthesis complete!")
