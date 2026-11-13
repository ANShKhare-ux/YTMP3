import asyncio
import edge_tts
import subprocess
import os

VOICE = "en-US-ChristopherNeural"  # Professional, natural, warm human voice
RATE = "+12%"  # Energetic creator video pacing

SCENES = [
    {
        "id": "vo-1",
        "text": "Still using sketchy websites with fake download buttons and malware just to grab an audio clip?"
    },
    {
        "id": "vo-2",
        "text": "Meet SonicWave. Sixteen-stream parallel turbo speed with zero ads and zero popups."
    },
    {
        "id": "vo-3",
        "text": "Extract true 320k MP3, lossless FLAC, and 1080p video from YouTube, TikTok, and Instagram."
    },
    {
        "id": "vo-4",
        "text": "Completely free, 1.3 megabyte portable Windows app. Try SonicWave today."
    }
]

out_dir = os.path.abspath("video/public/audio")
ffmpeg_path = os.path.abspath("server/bin/ffmpeg.exe")

async def main():
    print(f"Generating human neural voiceovers using {VOICE}...")
    for scene in SCENES:
        raw_path = os.path.join(out_dir, f"{scene['id']}-neural-raw.mp3")
        clean_path = os.path.join(out_dir, f"{scene['id']}.mp3")
        
        # Synthesize via Edge Neural TTS
        communicate = edge_tts.Communicate(scene["text"], VOICE, rate=RATE)
        await communicate.save(raw_path)
        
        # Audio enhancement filter: mild broadcast vocal EQ, warmth, compression, and loudness normalization
        filter_chain = "volume=1.2,highpass=f=75,equalizer=f=3000:width_type=h:width=1000:g=2,acompressor=threshold=-14dB:ratio=3:attack=5:release=50"
        
        cmd = [
            ffmpeg_path,
            "-i", raw_path,
            "-af", filter_chain,
            "-c:a", "libmp3lame",
            "-b:a", "192k",
            "-y", clean_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        if os.path.exists(raw_path):
            os.remove(raw_path)
            
        # Get duration
        probe = subprocess.run([ffmpeg_path, "-i", clean_path], capture_output=True, text=True)
        for line in probe.stderr.splitlines():
            if "Duration:" in line:
                dur = line.split("Duration:")[1].split(",")[0].strip()
                print(f"✓ {scene['id']}.mp3 -> Duration: {dur}")

if __name__ == "__main__":
    asyncio.run(main())
