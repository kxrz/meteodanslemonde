const BASE = "https://www.cestchaud.fr"

export async function loadOgFonts() {
  const [regular, semibold] = await Promise.all([
    fetch(`${BASE}/fonts/DMSans-Regular.ttf`).then((r) => r.arrayBuffer()),
    fetch(`${BASE}/fonts/DMSans-SemiBold.ttf`).then((r) => r.arrayBuffer()),
  ])
  return { regular, semibold }
}
