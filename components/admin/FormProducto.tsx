"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState, type CSSProperties } from "react";
import { guardarProducto } from "@/app/admin/acciones";
import { Precio } from "@/components/Precio";
import { COLORES, Dibujo, NOMBRES_DIBUJO, TIPOS, type Categorias, type Producto, type TipoProducto } from "@/lib/productos";

type Props = { producto?: Producto & { activo: boolean; orden: number }; categorias: Categorias };

/* "Cuaderno Pluma A5" → "cuaderno-pluma-a5" */
const aIdentificador = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* Lleva la foto a 1600 px de lado como máximo, en JPG: de varios MB a unos cientos de KB.
   Si el navegador no la puede abrir (por ejemplo, una HEIC en Chrome), la deja como está. */
const LADO_MAXIMO = 1600;
async function achicarFoto(archivo: File): Promise<File> {
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

export function FormProducto({ producto: p, categorias: todasLasCategorias }: Props) {
  const [estado, accion, enviando] = useActionState(guardarProducto, undefined);
  const editando = Boolean(p);

  // Lo que alimenta la vista previa.
  const [nombre, setNombre] = useState(p?.nombre ?? "");
  const [id, setId] = useState(p?.id ?? "");
  const [tipo, setTipo] = useState<TipoProducto>(p?.tipo ?? "fisico");
  const [precio, setPrecio] = useState(p ? String(p.precio) : "");
  const [anterior, setAnterior] = useState(p?.precioAnterior ? String(p.precioAnterior) : "");
  const [stock, setStock] = useState(p?.stock !== undefined ? String(p.stock) : "");
  const [resumen, setResumen] = useState(p?.desc ?? "");
  const [detalle, setDetalle] = useState(p?.detalle ?? "");
  const [dibujo, setDibujo] = useState(p?.dibujo ?? "cuaderno");
  const [color, setColor] = useState(p?.color ?? "lavanda");
  const [fotos, setFotos] = useState(p?.fotos ?? []);
  const [nuevas, setNuevas] = useState<string[]>([]);
  const [achicando, setAchicando] = useState(false);

  const categorias = todasLasCategorias[tipo] ?? [];
  const portada = fotos[0] ?? nuevas[0];

  // Las vistas previas de archivos locales son URLs temporales: se liberan al cambiar.
  useEffect(() => () => nuevas.forEach((url) => URL.revokeObjectURL(url)), [nuevas]);

  const mover = (desde: number) =>
    setFotos((lista) => {
      const copia = [...lista];
      const [foto] = copia.splice(desde, 1);
      return [foto, ...copia];
    });

  return (
    <form
      className="editor"
      // Con onSubmit y no con action: así React no vacía el formulario si vuelve un error.
      onSubmit={async (e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        // Las fotos del celular pesan varios MB y Vercel corta los envíos de más de 4,5 MB:
        // se achican acá antes de mandarlas.
        const archivos = datos.getAll("fotos_nuevas").filter((f): f is File => f instanceof File && f.size > 0);
        if (archivos.length > 0) {
          setAchicando(true);
          datos.delete("fotos_nuevas");
          for (const archivo of archivos) datos.append("fotos_nuevas", await achicarFoto(archivo));
          setAchicando(false);
        }
        startTransition(() => accion(datos));
      }}
    >
      <div className="editor__campos">
        <input type="hidden" name="original" value={p?.id ?? ""} />

        <fieldset className="admin__grupo">
          <legend>Lo básico</legend>
          <div className="campo">
            <label htmlFor="f-nombre">Nombre</label>
            <input
              type="text"
              id="f-nombre"
              name="nombre"
              required
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (!editando) setId(aIdentificador(e.target.value));
              }}
            />
          </div>
          {/* La dirección del producto se arma sola con el nombre y no cambia al editar (rompería los enlaces). */}
          <input type="hidden" name="id" value={id} />
          <div className="editor__par">
            <div className="campo">
              <label htmlFor="f-tipo">Sección</label>
              <select id="f-tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoProducto)}>
                {TIPOS.map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </div>
            {categorias.length > 0 && (
              <div className="campo">
                <label htmlFor="f-cat">Categoría</label>
                <select id="f-cat" name="cat" defaultValue={p?.cat ?? categorias[0][0]} key={tipo}>
                  {categorias.map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="editor__par">
            <div className="campo">
              <label htmlFor="f-precio">Precio en pesos</label>
              <input
                type="text"
                inputMode="numeric"
                id="f-precio"
                name="precio"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="campo">
              <label htmlFor="f-anterior">Precio anterior (para oferta)</label>
              <input
                type="text"
                inputMode="numeric"
                id="f-anterior"
                name="precio_anterior"
                aria-describedby="f-anterior-ayuda"
                value={anterior}
                onChange={(e) => setAnterior(e.target.value.replace(/\D/g, ""))}
              />
              <span className="campo__ayuda" id="f-anterior-ayuda">
                Si es mayor que el precio, se muestra tachado con el descuento.
              </span>
            </div>
          </div>
          <div className="editor__par">
            <div className="campo">
              <label htmlFor="f-stock">Stock</label>
              <input
                type="text"
                inputMode="numeric"
                id="f-stock"
                name="stock"
                aria-describedby="f-stock-ayuda"
                value={stock}
                onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
              />
              <span className="campo__ayuda" id="f-stock-ayuda">
                Vacío: no se controla. Con 0 aparece «Sin stock». Baja solo cuando confirmás una venta.
              </span>
            </div>
            <div className="campo">
              <label htmlFor="f-orden">Orden en la lista</label>
              <input type="text" inputMode="numeric" id="f-orden" name="orden" defaultValue={p?.orden ?? 0} aria-describedby="f-orden-ayuda" />
              <span className="campo__ayuda" id="f-orden-ayuda">
                Más chico, más arriba.
              </span>
            </div>
          </div>
          <div className="editor__marcas">
            <label className="tilde">
              <input type="checkbox" name="activo" defaultChecked={p?.activo ?? true} />
              <span>Se ve en la tienda</span>
            </label>
            <label className="tilde">
              <input type="checkbox" name="destacado" defaultChecked={p?.destacado ?? false} />
              <span>Destacado en Inicio</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="admin__grupo">
          <legend>Textos</legend>
          <div className="campo">
            <label htmlFor="f-resumen">Descripción corta (la de la ficha)</label>
            <textarea id="f-resumen" name="resumen" rows={3} value={resumen} onChange={(e) => setResumen(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="f-detalle">Detalle</label>
            <input
              type="text"
              id="f-detalle"
              name="detalle"
              placeholder="A5 · 80 hojas · rayado"
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
            />
          </div>
          {tipo === "pack" && (
            <div className="campo">
              <label htmlFor="f-contenido">Qué trae (uno por renglón)</label>
              <textarea id="f-contenido" name="contenido" rows={4} defaultValue={p?.contenido?.join("\n")} />
            </div>
          )}
          <div className="campo">
            <label htmlFor="f-descripcion">Texto largo de la página (dejá un renglón en blanco entre párrafos)</label>
            <textarea id="f-descripcion" name="descripcion" rows={5} defaultValue={p?.descripcion?.join("\n\n")} />
          </div>
          <div className="campo">
            <label htmlFor="f-caracteristicas">Características (una por renglón)</label>
            <textarea
              id="f-caracteristicas"
              name="caracteristicas"
              rows={4}
              aria-describedby="f-caracteristicas-ayuda"
              defaultValue={p?.caracteristicas?.join("\n")}
            />
            <span className="campo__ayuda" id="f-caracteristicas-ayuda">
              Si la dejás vacía, se arma sola a partir del detalle.
            </span>
          </div>
        </fieldset>

        <fieldset className="admin__grupo">
          <legend>Imagen</legend>
          <div className="campo">
            <span className="campo__titulo">Fotos</span>
            {fotos.length > 0 && (
              <ul className="editor__fotos">
                {fotos.map((foto, n) => (
                  <li key={foto}>
                    <input type="hidden" name="fotos" value={foto} />
                    {/* eslint-disable-next-line @next/next/no-img-element -- vista previa del panel */}
                    <img src={foto} alt={`Foto ${n + 1}`} />
                    {n === 0 ? (
                      <span className="editor__portada">Portada</span>
                    ) : (
                      <button type="button" onClick={() => mover(n)}>
                        Usar de portada
                      </button>
                    )}
                    <button type="button" onClick={() => setFotos((lista) => lista.filter((f) => f !== foto))}>
                      Sacar
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label htmlFor="f-fotos-nuevas" className="campo__ayuda">
              Sumar fotos (JPG, PNG o WebP). Se achican solas al guardar y se agregan después de las que ya están.
            </label>
            <input
              type="file"
              id="f-fotos-nuevas"
              name="fotos_nuevas"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={(e) => setNuevas(Array.from(e.target.files ?? [], (f) => URL.createObjectURL(f)))}
            />
            {nuevas.length > 0 && (
              <ul className="editor__fotos editor__fotos--nuevas">
                {nuevas.map((url) => (
                  <li key={url}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}
                    <img src={url} alt="Foto nueva" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="campo">
            <label htmlFor="f-dibujo">Dibujo (se muestra si no hay fotos)</label>
            <select id="f-dibujo" name="dibujo" value={dibujo} onChange={(e) => setDibujo(e.target.value as typeof dibujo)}>
              {NOMBRES_DIBUJO.map((d) => (
                <option key={d} value={d}>
                  {d.replace("-", " ")}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="campo">
            <legend>Color</legend>
            <div className="opciones">
              {COLORES.map(([valor, etiqueta]) => (
                <label key={valor} className="opcion opcion--color" style={{ "--c": `var(--color-${valor})` } as CSSProperties}>
                  <input type="radio" name="color" value={valor} checked={color === valor} onChange={() => setColor(valor)} />
                  <span>{etiqueta}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </fieldset>
      </div>

      <aside className="editor__vista" aria-label="Vista previa">
        <span className="nota-mano">así se ve en la tienda</span>
        <article className="ficha">
          <div className="ficha__dibujo" style={{ "--fondo": `var(--color-${color}-suave)` } as CSSProperties}>
            {portada ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa del panel
              <img src={portada} alt="" className="editor__foto-ficha" />
            ) : (
              <Dibujo nombre={dibujo} color={color} />
            )}
          </div>
          {tipo === "descargable" && <span className="ficha__etiqueta">Llega por mail</span>}
          <h3>{nombre || "Nombre del producto"}</h3>
          {detalle && <p className="ficha__detalle">{detalle}</p>}
          <p className="ficha__desc">{resumen || "La descripción corta aparece acá."}</p>
          <div className="ficha__pie">
            <Precio producto={{ precio: Number(precio) || 0, precioAnterior: Number(anterior) || undefined }} className="ficha__precio" />
            <span className="boton boton--chico" aria-hidden="true">
              Sumar
            </span>
          </div>
        </article>

        {estado?.error && (
          <p className="admin__error" role="alert">
            {estado.error}
          </p>
        )}
        <div className="editor__botones">
          <button className="boton boton--ancho" type="submit" disabled={enviando || achicando}>
            {achicando ? "Preparando las fotos…" : enviando ? "Guardando…" : editando ? "Guardar cambios" : "Crear producto"}
          </button>
          <Link className="boton boton--claro boton--ancho" href="/admin">
            Volver sin guardar
          </Link>
        </div>
      </aside>
    </form>
  );
}
