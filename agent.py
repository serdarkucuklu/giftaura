import os
import sys
import json
import datetime
import subprocess
import requests
from dotenv import load_dotenv

# Reconfigure console encoding to UTF-8 to prevent Windows Unicode errors
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Load environment variables
load_dotenv()
load_dotenv("d:/AI/Playground/02-auto-poster-agent/.env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Import notifier if available
sys.path.append("d:/AI/Playground/02-auto-poster-agent")
try:
    from notifier import trigger_milestone_alert
except ImportError:
    def trigger_milestone_alert(title, value):
        print(f"[Notifier Mock] Alert: {title} - {value}")

def call_gemini(prompt: str, use_search: bool = False):
    """Calls Gemini API with model fallback and search grounding."""
    if not GEMINI_API_KEY:
        print("Error: Gemini API Key is missing in .env")
        return None

    models = ["gemini-2.5-flash", "gemini-2.0-flash"]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    if use_search:
        payload["tools"] = [{"googleSearch": {}}]

    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        try:
            response = requests.post(url, json=payload, timeout=60)
            if response.status_code == 200:
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                print(f"Gemini API Error ({model}): {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error calling Gemini ({model}): {e}")
            
    print("All Gemini models failed.")
    return None

def run_agent():
    print("=" * 60)
    print("  GiftAura Autonomous Agent: Curating Trending Gifts")
    print("=" * 60)

    # 1. Search trends for hot gift items in Turkey
    print("Searching Google for trending gift items in Turkey...")
    search_prompt = (
        "What are the most popular, aesthetic, and trending products bought as gifts in Turkey "
        "on Amazon.com.tr and Trendyol for partners, tech enthusiasts, coffee lovers, parents, and friends?"
    )
    
    search_results = "No search results available."
    try:
        raw_res = call_gemini(search_prompt, use_search=True)
        if raw_res:
            search_results = raw_res
            print("[OK] Trends searched successfully.")
    except Exception as e:
        print(f"Warning: Search grounding failed: {e}")

    # 2. Ask Gemini to generate new gifts.json content
    print("Curating filtered gift suggestions via Gemini...")
    generator_prompt = f"""
    You are an expert gift curator and affiliate marketer for GiftAura, a premium minimalist gift recommendation portal for Turkish youth.
    Analyze the following search trends and curate a list of exactly 10-15 high-quality, aesthetic, and trending gift items sold on Amazon.com.tr.
    For each gift, you MUST assign a matching:
    - recipient: must be exactly one of: "sevgili", "arkadas", "aile", "teknoloji", "kahve"
    - budget: must be exactly one of: "cuzi" (under 500 TL), "orta" (500 to 1500 TL), "luks" (over 1500 TL)
    
    Make sure to distribute gifts across different recipient/budget combinations.
    
    For each gift:
       - title: Catchy, clear product name in Turkish (e.g. "Termo-Dinamik Akıllı Çelik Termos").
       - desc: Warm, friendly, and persuasive 1-2 sentence description in Turkish explaining why this is a perfect, meaningful gift.
       - price: Estimated price in TL (e.g., "349 TL", "1.299 TL").
       - image_url: A high-quality relevant Unsplash image URL. Pick from these generic query patterns:
         - Tech/Gadgets: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300" (Smartwatch), "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300" (Keyboard), "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300" (Headphones)
         - Coffee: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=300" (Termos/Coffee), "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300" (Mug/Kupa)
         - Office/Desk: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=300" (Desk pad), "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300" (Lamp)
         - Lifestyle/Accessories: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300" (Defter/Notebook), "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300" (Bag)
         - Home/Aesthetic: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300" (Decor), "https://images.unsplash.com/photo-1606744824163-985d376605aa?w=300" (Scented Candle)
       - affiliate_link: Amazon.com.tr search link for this item using the tracking ID 'aurafocus-21', e.g., "https://www.amazon.com.tr/s?k=akilli+celik+termos&tag=aurafocus-21" (use URL-encoded terms, replace spaces with +).

    SEARCH TRENDS:
    {search_results}

    Respond in STRICT JSON format (no markdown blocks, just raw JSON matching the schema below):
    {{
      "gifts": [
        {{
          "title": "Gift title",
          "desc": "Gift description in Turkish",
          "price": "Price in TL",
          "image_url": "Unsplash URL",
          "affiliate_link": "Amazon search link with tag=aurafocus-21",
          "recipient": "sevgili|arkadas|aile|teknoloji|kahve",
          "budget": "cuzi|orta|luks"
        }},
        ...
      ]
    }}
    """
    
    raw_json = call_gemini(generator_prompt, use_search=False)
    if not raw_json:
        print("[FAIL] Gemini returned empty response. Aborting.")
        return

    # 3. Parse and update gifts.json
    try:
        clean_json = raw_json.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        data["last_updated"] = datetime.datetime.utcnow().isoformat() + "Z"
        
        # Save to file
        with open("gifts.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print("[OK] gifts.json updated successfully.")
        print(f"Curated {len(data['gifts'])} gifts.")
        
    except Exception as e:
        print(f"[FAIL] Error parsing Gemini JSON: {e}")
        print("Raw response was:", raw_json[:300])
        return

    # 4. Trigger Notification
    try:
        trigger_milestone_alert("GiftAura Guncellendi", f"Toplam {len(data['gifts'])} hediye onerisi otonom hazirlandi.")
        print("[OK] SMS/Email notification sent.")
    except Exception as e:
        print(f"Warning: Failed to trigger notification: {e}")

    # 5. Git Commit and Push (Only in Git repo)
    if os.path.exists(".git"):
        print("Staging and committing gifts.json to git...")
        try:
            subprocess.run(["git", "config", "user.name", "GiftAura Agent"], check=True)
            subprocess.run(["git", "config", "user.email", "agent@giftaura.com"], check=True)
            subprocess.run(["git", "add", "gifts.json"], check=True)
            
            # Check if there are changes to commit
            status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
            if status.stdout.strip():
                subprocess.run(["git", "commit", "-m", "Otonom Guncelleme: Hediye listesi veritabani yenilendi [skip ci]"], check=True)
                subprocess.run(["git", "push", "origin", "main"], check=True)
                print("[OK] Git push completed. Website auto-deployed!")
            else:
                print("[INFO] No changes in gifts.json. Skipping commit.")
        except Exception as e:
            print(f"Warning: Git commit/push failed: {e}")
    else:
        print("[INFO] No Git repository detected. Skipping git push.")

if __name__ == "__main__":
    # Change working directory to script location
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    run_agent()
