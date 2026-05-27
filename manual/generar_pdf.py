import asyncio
import os
from playwright.async_api import async_playwright


async def main():
    here = os.path.dirname(os.path.abspath(__file__))
    html = "file:///" + (here + "/manual.html").replace("\\", "/").replace(" ", "%20")
    salida = os.path.abspath(os.path.join(here, "..", "Manual de uso - UJCVx.pdf"))

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(html, wait_until="networkidle")
        await page.emulate_media(media="print")
        await page.pdf(
            path=salida,
            format="Letter",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            prefer_css_page_size=True,
        )
        await browser.close()

    size_kb = os.path.getsize(salida) // 1024
    print(f"OK: {salida}")
    print(f"Size: {size_kb} KB")


asyncio.run(main())
