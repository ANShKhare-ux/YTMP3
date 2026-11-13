import asyncio
import edge_tts
import subprocess
import os

VOICE = "en-US-ChristopherNeural"
RATE = "+16%"

VO_TRACKS = [
    {
        "id": "vo-hook",
        "text": "Video editors, stop gatekeeping this."
    },
    {
        "id": "vo-paste",
        "text": "Just paste any link into SonicWave."
    },
    {
        "id": "vo-speed",
        "text": "Sixteen stream speed, true 320k, zero ads."
    },
    {
        "id": "vo-timeline",
        "text": "Drag it straight into your timeline. Link in bio."
    }
]

out_dir = os.path.abspath("video/public/audio")
ffmpeg_path = os.path.abspath("server/bin/ffmpeg.exe")

async def main():
    print("Generating ultra-compact 15-second neural voiceover...")
    for item in VO_TRACKS:
        raw_path = os.path.join(out_dir, f"{item['id']}-raw.mp3")
        clean_path = os.path.join(out_dir, f"{item['id']}.mp3")
        
        communicate = edge_tts.Communicate(item["text"], VOICE, rate=RATE)
        await communicate.save(raw_path)
        
        filter_chain = "volume=1.3,highpass=f=80,equalizer=f=3200:width_type=h:width=1200:g=2.5,acompressor=threshold=-12dB:ratio=3.5:attack=5:release=40"
        
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
            
        probe = subprocess.run([ffmpeg_path, "-i", clean_path], capture_output=True, text=True)
        for line in probe.stderr.splitlines():
            if "Duration:" in line:
                dur = line.split("Duration:")[1].split(",")[0].strip()
                print(f"✓ {item['id']}.mp3 -> {dur}")

if __name__ == "__main__":
    asyncio.run(main())
