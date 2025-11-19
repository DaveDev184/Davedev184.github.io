async function drawFromJson(jsonUrl) {
  const canvas = document.getElementById("rosasCanvas");
  const ctx = canvas.getContext("2d");

  // Cargar el JSON
  const response = await fetch(jsonUrl);
  const regions = await response.json();

  // Limpiar y fondo negro
  const W = canvas.width;
  const H = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, W, H);

  // Calcular límites para centrar el dibujo
  const allPoints = regions.flatMap(r => r.contour);

  const xs = allPoints.map(p => p[0]);
  const ys = allPoints.map(p => p[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = maxX - minX;
  const height = maxY - minY;

  const scale = Math.min(600 / width, 600 / height);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Origen al centro del canvas
  ctx.translate(W / 2, H / 2);

  // Dibujar cada región
  for (const region of regions) {
    // Si quieres respetar el color del JSON:
    // const [r, g, b] = region.color;

    // Si quieres que todas se vean rosadas:
    const [r, g, b] = [255, 120, 160];

    const color = `rgb(${r}, ${g}, ${b})`;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    const points = region.contour;
    ctx.beginPath();

    let x = (points[0][0] - centerX) * scale;
    let y = (centerY - points[0][1]) * scale;
    ctx.moveTo(x, y);

    for (let i = 1; i < points.length; i++) {
      x = (points[i][0] - centerX) * scale;
      y = (centerY - points[i][1]) * scale;
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
  }
}

// Solo se dibuja cuando presionas el botón
document.getElementById("btnGenerar").addEventListener("click", () => {
  drawFromJson("rosas.json");
});
