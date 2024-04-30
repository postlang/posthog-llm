"""
Example upload of a dataset to posthog-llm.
"""
import os
from pathlib import Path
import json
import posthog
from datetime import datetime


posthog.api_key = os.environ.get("POSTHOG_API_KEY")
posthog.host = os.environ.get("POSTHOG_HOST")


def chunker(seq, size):
    return (seq[pos : pos + size] for pos in range(0, len(seq), size))


def task(distinct_id, input, output, event="llm-task", timestamp=None, session_id=None, properties=None):
    props = properties if properties else {}
    props["$llm_input"] = input
    props["$llm_output"] = output

    if session_id:
        props["$session_id"] = session_id

        posthog.capture(
            distinct_id=distinct_id, event=event, properties=props, timestamp=timestamp, disable_geoip=False
        )


with open(Path(__file__).parent / "demo_data_clean.json") as f:
    data = json.load(f)

counter = 0

for itm in data:
    for turns, metadata in zip(chunker(itm["turns"], 2), itm["metadata"]):
        human, ai = turns
        metadata = {k: v for k, v in metadata.items() if v}
        timestamp = datetime.fromisoformat(metadata.pop("timestamp"))

        task(
            distinct_id=itm["user_id"],
            input=human["content"],
            output=ai["content"],
            timestamp=timestamp,
            session_id=itm["session_id"],
            properties=metadata,
        )
        # check if client queue is full
        if counter % 10000 == 0 and counter != 0:
            posthog.default_client.flush()

        counter += 1


# Empty the queue in the end
posthog.default_client.flush()
