import os
import sys
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def verify_files():
    print("--- Verifying Project Files ---")
    required = ["index.html", "style.css", "app.js", "gifts.json", "agent.py", ".github/workflows/run_agent.yml"]
    all_ok = True
    for f in required:
        if os.path.exists(f):
            print(f"[OK] File exists: {f}")
        else:
            print(f"[FAIL] Missing file: {f}")
            all_ok = False
    return all_ok

def run_agent_test():
    print("\n--- Running agent.py Local Dry Run ---")
    import agent
    
    # Read initial JSON
    try:
        with open("gifts.json", "r", encoding="utf-8") as f:
            old_data = json.load(f)
        print(f"[OK] Read initial gifts.json. Current count: {len(old_data['gifts'])}")
    except Exception as e:
        print(f"[FAIL] Could not read gifts.json: {e}")
        return False
        
    # Run agent loop
    try:
        agent.run_agent()
        print("[OK] agent.run_agent() finished execution loop.")
    except Exception as e:
        print(f"[FAIL] Exception running agent: {e}")
        return False
        
    # Verify new JSON contents
    try:
        with open("gifts.json", "r", encoding="utf-8") as f:
            new_data = json.load(f)
        
        if "gifts" in new_data:
            print("[OK] gifts.json structure is valid.")
            print(f"New Gifts count: {len(new_data['gifts'])}")
            for idx, gift in enumerate(new_data['gifts'][:3]):
                print(f"  Gift {idx+1}: {gift['title']} - {gift['price']} (For: {gift['recipient']}, Budget: {gift['budget']})")
            return True
        else:
            print(f"[FAIL] gifts.json missing 'gifts' key: {new_data.keys()}")
            return False
    except Exception as e:
        print(f"[FAIL] Could not read updated gifts.json: {e}")
        return False

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    files_ok = verify_files()
    if not files_ok:
        sys.exit(1)
        
    agent_ok = run_agent_test()
    if agent_ok:
        print("\nALL TESTS PASSED! GiftAura Agent is verified.")
        sys.exit(0)
    else:
        print("\nTESTS FAILED. Check API key and configuration.")
        sys.exit(1)
