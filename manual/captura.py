import asyncio
import os
from playwright.async_api import async_playwright

BASE = "https://ujc-vx.vercel.app"
IMG_DIR = os.path.dirname(os.path.abspath(__file__)) + "/img"
os.makedirs(IMG_DIR, exist_ok=True)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1280, "height": 800}, device_scale_factor=2, ignore_https_errors=True)
        page = await ctx.new_page()

        # Signin
        await page.goto(f"{BASE}/signin", wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_load_state("networkidle", timeout=30000)
        await page.screenshot(path=f"{IMG_DIR}/signin.png", full_page=False)
        print("signin")

        # Login
        await page.locator("input[type='email']").fill("miguelitchampion7@gmail.com")
        await page.locator("input[type='password']").fill("Champion_2007")
        await page.locator("button[type='submit']:not([disabled])").wait_for(timeout=10000)
        await page.locator("button[type='submit']").click()
        await page.wait_for_url(f"{BASE}/", timeout=15000)

        # Capturas de cada pantalla
        paginas = [
            ("/", "panel"),
            ("/cargar", "cargar"),
            ("/importaciones", "importaciones"),
            ("/validacion", "validacion"),
            ("/eficiencia", "eficiencia"),
            ("/catedraticos", "catedraticos"),
            ("/aulas", "aulas"),
            ("/pagos", "pagos"),
        ]

        for path, nombre in paginas:
            await page.goto(f"{BASE}{path}", wait_until="domcontentloaded", timeout=60000)
            try:
                await page.wait_for_load_state("networkidle", timeout=20000)
            except Exception:
                pass
            await page.screenshot(path=f"{IMG_DIR}/{nombre}.png", full_page=False)
            print(nombre)

        # Detalles
        for path, nombre in [
            ("/catedraticos/ALDO%20JOSUE%20CARBALLO%20CANALES", "catedratico_detalle"),
            ("/aulas/101", "aula_detalle"),
        ]:
            await page.goto(f"{BASE}{path}", wait_until="domcontentloaded", timeout=60000)
            try:
                await page.wait_for_load_state("networkidle", timeout=20000)
            except Exception:
                pass
            await page.screenshot(path=f"{IMG_DIR}/{nombre}.png", full_page=True)
            print(nombre)

        await browser.close()


asyncio.run(main())
