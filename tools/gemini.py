"""Shared Gemini API call for the grader and the probe. Needs GEMINI_API_KEY."""
import json
import os
import time
import urllib.error
import urllib.request

MODEL = "gemini-2.5-flash"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"


def generate(payload, attempts=4):
    body = json.dumps(payload).encode()
    req = urllib.request.Request(URL, body, {"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
    for attempt in range(attempts):
        try:
            return json.load(urllib.request.urlopen(req, timeout=180))
        except urllib.error.HTTPError as err:
            if err.code not in (429, 500, 503) or attempt == attempts - 1:
                raise
            time.sleep(2 ** attempt * 5)
