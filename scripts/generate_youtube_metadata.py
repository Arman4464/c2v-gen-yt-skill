"""
YouTube Shorts SEO & Metadata Package Generator.
Generates high-CTR titles, algorithmic descriptions, timestamps,
hashtags, and the engagement-driving Pinned Comment Hook for YouTube Studio.
"""

import os
import json
import argparse

METADATA_DATABASE = {
    "demo": {
        "title": "The Bridge That Fell for a Song",
        "slug": "demo",
        "historical_event": "Broughton Suspension Bridge Collapse of 1831",
        "titles": [
            "The Bridge That Fell For A Song 🌉",
            "Why Armies Aren't Allowed To March Across Bridges",
            "74 Soldiers Accidental Bridge Disaster (1831)",
        ],
        "hook": "74 soldiers knocked down an iron bridge just by walking across it in 1831.",
        "twist": "Every bridge has a natural resonant frequency—marching in step pushed it until a bolt snapped.",
        "new_rule": "Military columns must break step when crossing any bridge.",
        "chapters": [
            ("0:00", "The Marching Column"),
            ("0:14", "The Bridge Begins To Bounce"),
            ("0:28", "A Single Bolt Snaps"),
            ("0:42", "The Physics of Resonance"),
            ("0:55", "The Strict New Army Rule"),
        ],
        "tags": [
            "history", "animation", "cartoon", "science", "physics", "mechanical resonance",
            "broughton bridge", "1831", "military history", "shorts", "educational"
        ],
        "pinned_comment": "If you felt the bridge bouncing under your feet, would you stop marching or stomp harder? 👇 Let me know!",
    },
    "emu": {
        "title": "The Great Australian Emu War",
        "slug": "emu",
        "historical_event": "The Great Emu War of 1932 (Western Australia)",
        "titles": [
            "The Time Australia Lost A War To Birds 🐦",
            "Why 20,000 Emus Defeated The Australian Military",
            "The Funniest Military Defeat In History (1932)",
        ],
        "hook": "In 1932, the Australian military deployed heavy machine guns against an army of twenty thousand giant birds—and lost.",
        "twist": "Emus don't have military discipline; they scattered in every direction like chaos itself.",
        "new_rule": "Australia withdrew troops and let farmers build stronger fences instead.",
        "chapters": [
            ("0:00", "20,000 Emus Invade"),
            ("0:12", "The Military Deploys Lewis Guns"),
            ("0:25", "Emu Guerrilla Tactics"),
            ("0:38", "The Truck Ambush Disaster"),
            ("0:48", "Total Emu Victory"),
        ],
        "tags": [
            "history", "emu war", "australia", "animation", "military history",
            "fun facts", "cartoon", "1932", "shorts", "viral history"
        ],
        "pinned_comment": "Name one animal you think could defeat an entire military platoon. Best answer gets pinned! 🪖👇",
    },
    "molasses": {
        "title": "The Great Molasses Flood",
        "slug": "molasses",
        "historical_event": "The Boston Molasses Disaster of 1919",
        "titles": [
            "The 35 MPH Tsunami Made Of Pure Syrup 🍯",
            "The Deadliest Sweet Disaster In American History",
            "Why Boston Smelled Like Molasses For Decades",
        ],
        "hook": "In 1919, a two-story tidal wave swept through Boston at thirty-five miles an hour—and it was made of warm molasses.",
        "twist": "The company painted the steel tank brown beforehand just to hide leaks from every rivet.",
        "new_rule": "Cities mandated strict engineering oversight and structural pressure testing.",
        "chapters": [
            ("0:00", "A Two-Story Wave of Syrup"),
            ("0:13", "The Fermenting 2-Million Gallon Tank"),
            ("0:26", "Rivet Shrapnel Explosion"),
            ("0:39", "The Molasses Tsunami Hits Boston"),
            ("0:51", "The Brown Paint Coverup"),
        ],
        "tags": [
            "history", "boston", "disaster", "molasses flood", "1919",
            "science", "animation", "cartoon", "shorts", "weird history"
        ],
        "pinned_comment": "Could you outrun a 35 MPH tidal wave of warm syrup? Tell me your escape plan! 🏃‍♂️💨",
    },
    "monalisa": {
        "title": "The Plumber Who Stole the Mona Lisa",
        "slug": "monalisa",
        "historical_event": "The 1911 Theft of the Mona Lisa by Vincenzo Peruggia",
        "titles": [
            "The Man Who Walked Out With The Mona Lisa 🖼️",
            "Why The Louvre Didn't Notice The Mona Lisa Was Missing",
            "The Easiest Art Heist In History (1911)",
        ],
        "hook": "The Mona Lisa wasn't the most famous painting in the world until a man walked out of the Louvre with it under his apron.",
        "twist": "Guards didn't even notice it was missing for 24 hours because they thought the museum photographer borrowed it.",
        "new_rule": "Museums instituted visitor logs, alarmed frames, and permanent gallery checkpoints.",
        "chapters": [
            ("0:00", "Walking Out With A Masterpiece"),
            ("0:13", "Hiding in the Louvre Broom Closet"),
            ("0:26", "The Broken Doorknob Dilemma"),
            ("0:39", "The 24-Hour Delayed Alarm"),
            ("0:52", "How A Heist Made It World Famous"),
        ],
        "tags": [
            "history", "mona lisa", "louvre", "art heist", "paris", "1911",
            "animation", "cartoon", "shorts", "mystery", "crime"
        ],
        "pinned_comment": "If you walked past an empty picture frame in a museum, how long before you'd suspect a heist? 🕵️‍♂️👇",
    },
}

def generate_package(slug: str, out_dir: str = None) -> dict:
    data = METADATA_DATABASE.get(slug)
    if not data:
        data = {
            "title": f"The Story of {slug.capitalize()}",
            "slug": slug,
            "historical_event": f"Historical Event: {slug}",
            "titles": [
                f"The Untold Story of {slug.capitalize()} 🎬",
                f"What Really Happened During {slug.capitalize()}?",
                f"The Most Absurd Event In History: {slug.capitalize()}",
            ],
            "hook": f"An unbelievable true story animated in 2.5D cel-shaded style.",
            "twist": "History is stranger than fiction.",
            "new_rule": "Rules were rewritten after this happened.",
            "chapters": [
                ("0:00", "The Hook"),
                ("0:15", "The Escalation"),
                ("0:30", "The Turning Point"),
                ("0:45", "The True Meaning"),
            ],
            "tags": ["history", "animation", "cartoon", "shorts", "facts", "educational"],
            "pinned_comment": "What historical event should we animate next? Drop your favorite story below! 👇",
        }

    chapters_text = "\n".join([f"{ts} - {name}" for ts, name in data["chapters"]])
    tags_string = " ".join([f"#{t}" for t in data["tags"][:6]])
    hashtags = "#shorts #history #animation #facts #storytime #cartoon"

    description = f"""{data['titles'][0]}

{data['hook']} {data['twist']}

TIMESTAMPS:
{chapters_text}

Historical Reference: {data['historical_event']}
Animated with the custom 2.5D Cel-Shaded Cartoon Engine.

{hashtags}
{tags_string}
"""

    package = {
        "slug": slug,
        "recommended_title": data["titles"][0],
        "title_options": data["titles"],
        "description": description.strip(),
        "tags_csv": ", ".join(data["tags"]),
        "pinned_comment": data["pinned_comment"],
        "historical_event": data["historical_event"],
    }

    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
        json_path = os.path.join(out_dir, "youtube-package.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(package, f, indent=2)

        txt_path = os.path.join(out_dir, "youtube-metadata.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write("=== YOUTUBE STUDIO PACKAGING ===\n\n")
            f.write("--- RECOMMENDED TITLE (Pick 1 of 3) ---\n")
            for i, t in enumerate(data["titles"], 1):
                f.write(f"Option {i}: {t}\n")
            f.write("\n--- DESCRIPTION ---\n")
            f.write(description)
            f.write("\n\n--- PINNED COMMENT HOOK ---\n")
            f.write(data["pinned_comment"])
            f.write("\n\n--- TAGS (Copy & Paste) ---\n")
            f.write(", ".join(data["tags"]))
            f.write("\n")

        print(f"Generated YouTube packaging:\n- {json_path}\n- {txt_path}")

    return package

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate YouTube Studio SEO metadata package.")
    parser.add_argument("--slug", type=str, default="demo", help="Video slug (demo, emu, molasses, monalisa, etc.)")
    parser.add_argument("--out", type=str, default=None, help="Output directory")
    args = parser.parse_args()

    out_directory = args.out or os.path.join("out", args.slug)
    pkg = generate_package(args.slug, out_directory)
    print(f"Package ready for '{args.slug}' with title: {pkg['recommended_title']}")
