# Static snapshot of the running site for GitHub Pages (no editor). Usage: snapshot.py <origin> <dist/client> <out> <base>
import hashlib, html, os, re, shutil, sys, urllib.request
origin, client, out, base = sys.argv[1:5]
shutil.rmtree(out, ignore_errors=True); os.makedirs(out + '/img')
get = lambda u: urllib.request.urlopen(origin + u).read()
saved = {}
def asset(u):
    raw = html.unescape(u)
    if raw not in saved:
        data = get(raw)
        ext = 'webp' if 'f=webp' in raw else 'jpg'
        name = f"img/{hashlib.sha1(raw.encode()).hexdigest()[:16]}.{ext}"
        open(f"{out}/{name}", 'wb').write(data); saved[raw] = f"{base}/{name}"
    return saved[raw]
def page(path, dest):
    try: body = get(path).decode()
    except urllib.error.HTTPError as e: body = e.read().decode()
    body = re.sub(r'(?:https?://[^"\s,]+)?/(?:_image\?[^"\s,]+|_emdash/api/media/file/[^"\s,]+)', lambda m: asset(m.group(0).replace(origin, '')), body)
    body = re.sub(r'(["\s])/(_astro/|favicon\.svg)', rf'\1{base}/\2', body)
    body = body.replace('href="/"', f'href="{base}/"')
    left = [x for x in re.findall(r'"/(?!/)[^"]*"', body) if not x.startswith('"' + base + '/')]
    assert not left, left[:5]
    open(f"{out}/{dest}", 'w').write(body)
page('/', 'index.html'); page('/this-page-does-not-exist', '404.html')
shutil.copytree(client + '/_astro', out + '/_astro'); shutil.copy(client + '/favicon.svg', out)
for f in os.listdir(out + '/_astro'):
    if f.endswith('.css'):
        p = f"{out}/_astro/{f}"; s = open(p).read(); open(p, 'w').write(s.replace('url(/_astro/', f'url({base}/_astro/'))
open(out + '/.nojekyll', 'w').close()
print(len(saved), 'images')
