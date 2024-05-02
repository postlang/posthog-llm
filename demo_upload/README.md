# Uploading demo data to PostHog-LLM

Install the python package:

```bash
pip install -r requirements.txt
```


After setting up your project, grab your API_KEY and Host in the settings page and export the variables:

```bash
export POSTHOG_HOST='http://localhost'
export POSTHOG_API_KEY='phc_msCYJBNCmXfJd2sIPgCxuOLFOlTxfHYUD04GybrdkAc'
```

Upload the data:

```python
python upload_data.py
```

