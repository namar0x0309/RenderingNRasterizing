# Rasterizer
Research/Study in Rendering and Rasterization.

Writeup/Notes: http://www.blog.namar0x0309.com/2012/04/3d-engine-and-2d-rasterization-study/

## Run locally
- Open `index.html` in a browser.
- The page loads the source files directly for readability.

## WordPress embed (no build tools)
WordPress often strips inline scripts in posts. The simplest path is an iframe.

Option A: iframe (recommended)
1. Upload this folder to a public location (same host as your blog or a static host).
2. In WordPress, add a Custom HTML block:

```html
<iframe
  src="https://your-site.example.com/RenderingNRasterizing/embed.html"
  width="100%"
  height="620"
  style="border:0"
  loading="lazy"
></iframe>
```

Option B: inline scripts (only if your WP allows it)
1. Copy the `index.html` contents into a Custom HTML block.
2. Ensure the `Source/` and `Assets/` files are reachable at the same paths.

## Build script (optional)
`compile.bat` concatenates sources into `Module.Rasterizer.js` and `Rasterizer.Assets.js`.
This is optional; `index.html` uses the source files directly.
