/* Lleva la foto a 1600 px de lado como máximo, en JPG: de varios MB a unos cientos de KB.
   Si el navegador no la puede abrir (por ejemplo, una HEIC en Chrome), la deja como está.
   Se usa en el panel antes de mandar fotos: Vercel corta los envíos de más de 4,5 MB. */
const LADO_MAXIMO = 1600;

export async function achicarFoto(archivo: File): Promise<File> {
  try {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    const ctx = lienzo.getContext("2d");
    if (!ctx) return archivo;
    ctx.fillStyle = "#fff"; // las partes transparentes de un PNG quedan blancas y no negras
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    imagen.close();
    const blob = await new Promise<Blob | null>((listo) => lienzo.toBlob(listo, "image/jpeg", 0.85));
    if (!blob || blob.size >= archivo.size) return archivo;
    return new File([blob], archivo.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}

/* Achica en el lugar todas las fotos de esos campos del formulario. */
export async function achicarFotosDe(datos: FormData, campos: string[]) {
  for (const campo of campos) {
    const archivos = datos.getAll(campo).filter((f): f is File => f instanceof File && f.size > 0);
    datos.delete(campo);
    for (const archivo of archivos) datos.append(campo, await achicarFoto(archivo));
  }
}
