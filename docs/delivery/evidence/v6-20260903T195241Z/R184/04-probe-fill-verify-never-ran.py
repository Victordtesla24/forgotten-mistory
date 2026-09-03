import base64, os, sys, tempfile, traceback
sys.path.insert(0, "/var/tmp/v6-r184/repo/apps/api")
os.environ["AETHER_LLM_MODE"] = "replay"
from app.services import apply_executor as ax

WIPING = """
<title>wipe</title>
<form>
  <label for="name">Name</label><input id="name" type="text">
  <button type="submit" onclick="return false;">Submit Application</button>
</form>
<script>
  const n = document.getElementById('name');
  n.addEventListener('input', () => setTimeout(() => { n.value = ''; }, 30));
</script>
"""
url = "data:text/html;base64," + base64.b64encode(WIPING.encode()).decode()

orig_cs = ax._commit_state
def traced(page, field, value, documents):
    r = orig_cs(page, field, value, documents)
    print("  _commit_state", field.get("name"), "->", r, flush=True)
    return r
ax._commit_state = traced

orig_fv = ax._fill_value
def traced_fv(page, field, value, documents):
    r = orig_fv(page, field, value, documents)
    print("  _fill_value", field.get("name"), value, "->", r, flush=True)
    return r
ax._fill_value = traced_fv

print("launch kwargs:", ax._chromium_launch_kwargs(live=False))
try:
    out = ax.playwright_form_submitter(
        application_id="probe", channel="generic", page_html="",
        apply_url=url,
        plan={"fields": [{"name":"name","label":"Name","kind":"text","required":True,"scope":"","value":"JordanBlake","options":[]}]},
        resume_pdf_bytes=b"%PDF-1.4 fake", cover_letter_text="Dear Hiring Manager,",
        evidence_dir=tempfile.mkdtemp(),
    )
    print("OUTCOME:", out)
except Exception as e:
    print("RAISED:", type(e).__name__, getattr(e, "reason", None), e)
