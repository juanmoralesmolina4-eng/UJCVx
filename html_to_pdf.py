import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    html_path = os.path.abspath("propuesta.html")
    pdf_path = os.path.abspath("Propuesta - Sistema de Programacion Academica UJCV.pdf")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(f"file:///{html_path.replace(os.sep, '/')}")
        await page.emulate_media(media="print")
        await page.pdf(
            path=pdf_path,
            format="Letter",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            prefer_css_page_size=True,
        )
        await browser.close()

    print(f"OK: {pdf_path}")
    print(f"Size: {os.path.getsize(pdf_path)} bytes")

asyncio.run(main())
