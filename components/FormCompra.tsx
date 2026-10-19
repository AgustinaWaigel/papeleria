"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { pagarOnline, validarCupon } from "@/app/(tienda)/acciones";
import { total, type Renglon } from "@/lib/bolsita";
import { precio } from "@/lib/contacto";
import type { AjustesEnvio } from "@/lib/seguimiento";
import { nombreProvincia } from "@/lib/zonas";
import { textoCosto, useEnvio, type EleccionEnvio } from "./Envio";

type Cupon = { codigo: string; descuento: number; texto: string };

/* Los datos de quien compra antes de ir a Mercado Pago. La entrega ya se eligió en la bolsita.
   Lo que muestra (descuento, envío, total) es un adelanto: el servidor lo vuelve a calcular con los precios de la base. */
type Props = { items: Renglon[]; envio: AjustesEnvio; cotizaCorreo: boolean; eleccion: EleccionEnvio; volver: () => void };

export function FormCompra({ items, envio, cotizaCorreo, eleccion, volver }: Props) {
  const { entrega, cp, provincia } = eleccion;
  const [error, setError] = useState("");
  const [yendo, empezar] = useTransition();
  const renglones = items.map((r) => ({ id: r.producto.id, cantidad: r.cantidad }));

  // El cupón se revisa al tocar "Aplicar"; si cambia la bolsita, se vuelve a revisar al pagar.
  const [codigoCupon, setCodigoCupon] = useState("");
  const [cupon, setCupon] = useState<Cupon | null>(null);
  const [errorCupon, setErrorCupon] = useState("");
  const [revisando, revisar] = useTransition();

  const aplicarCupon = () => {
    if (!codigoCupon.trim()) return;
    revisar(async () => {
      setErrorCupon("");
      const r = await validarCupon(codigoCupon, renglones);
      if (r.codigo && r.descuento !== undefined) setCupon({ codigo: r.codigo, descuento: r.descuento, texto: r.texto ?? "" });
      else setErrorCupon(r.error ?? "Ese cupón no sirve.");
    });
  };

  const subtotal = total(items);
  const descuento = cupon ? Math.min(cupon.descuento, subtotal) : 0;
  // El envío se eligió en la bolsita; acá se vuelve a calcular con el descuento (puede cambiar el "gratis desde").
  const { costo: envioCosto } = useEnvio({ items, envio, cotizaCorreo, eleccion, descuento });
  const final = subtotal - descuento + (envioCosto ?? 0);

  const textoEntrega =
    entrega === "envio"
      ? `Envío a CP ${cp} (${nombreProvincia(provincia)})`
      : entrega === "retiro"
        ? "Lo retirás (coordinamos por WhatsApp)"
        : "Solo descargables: te llegan por mail";

  return (
    <form
      className="compra"
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        const campo = (nombre: string) => String(datos.get(nombre) ?? "");
        setError("");
        empezar(async () => {
          const resultado = await pagarOnline(renglones, {
            nombre: campo("nombre"),
            email: campo("email"),
            telefono: campo("telefono"),
            entrega,
            direccion: campo("direccion"),
            codigoPostal: cp,
            provincia,
            cupon: cupon?.codigo,
          });
          if (resultado.url) window.location.assign(resultado.url);
          else setError(resultado.error ?? "Algo salió mal. Probá de nuevo.");
        });
      }}
    >
      <button className="compra__volver" type="button" onClick={volver}>
        ← Volver
      </button>

      <div className="compra__entrega">
        <span>{textoEntrega}</span>
        {entrega !== "digital" && (
          <button className="compra__volver" type="button" onClick={volver}>
            Cambiar
          </button>
        )}
      </div>

      <div className="campo">
        <label htmlFor="compra-nombre">Nombre y apellido</label>
        <input type="text" id="compra-nombre" name="nombre" autoComplete="name" required />
      </div>
      <div className="campo">
        <label htmlFor="compra-email">Mail</label>
        <span className="campo__ayuda">
          {items.some((r) => r.producto.tipo === "descargable") ? "Ahí te llegan los PDF y el detalle de tu compra." : "Ahí te llega el detalle de tu compra."}
        </span>
        <input type="email" id="compra-email" name="email" autoComplete="email" required />
      </div>
      <div className="campo">
        <label htmlFor="compra-telefono">WhatsApp</label>
        <input type="tel" id="compra-telefono" name="telefono" autoComplete="tel" inputMode="tel" required placeholder="343 4123456" />
      </div>
      {entrega === "envio" && (
        <div className="campo">
          <label htmlFor="compra-direccion">Dirección</label>
          <textarea id="compra-direccion" name="direccion" rows={2} autoComplete="street-address" required placeholder="Calle, número, piso y ciudad" />
        </div>
      )}

      <div className="campo">
        <label htmlFor="compra-cupon">¿Tenés un cupón?</label>
        {cupon ? (
          <p className="compra__cupon">
            <strong>{cupon.codigo}</strong> · {cupon.texto}
            <button
              className="compra__volver"
              type="button"
              onClick={() => {
                setCupon(null);
                setCodigoCupon("");
              }}
            >
              Sacar
            </button>
          </p>
        ) : (
          <div className="compra__fila">
            <input
              type="text"
              id="compra-cupon"
              value={codigoCupon}
              autoComplete="off"
              autoCapitalize="characters"
              onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
              // Enter aplica el cupón en vez de mandar todo el formulario.
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  aplicarCupon();
                }
              }}
            />
            <button className="boton boton--claro boton--chico" type="button" disabled={revisando || !codigoCupon.trim()} onClick={aplicarCupon}>
              {revisando ? "Revisando…" : "Aplicar"}
            </button>
          </div>
        )}
        {errorCupon && (
          <span className="compra__error-chico" role="alert">
            {errorCupon}
          </span>
        )}
      </div>

      <dl className="compra__cuentas">
        <div>
          <dt>Productos</dt>
          <dd>{precio(subtotal)}</dd>
        </div>
        {descuento > 0 && (
          <div>
            <dt>Descuento</dt>
            <dd>−{precio(descuento)}</dd>
          </div>
        )}
        {entrega === "envio" && (
          <div>
            <dt>Envío</dt>
            <dd>{textoCosto(envioCosto)}</dd>
          </div>
        )}
        <div className="compra__total">
          <dt>Pagás</dt>
          <dd>{precio(final)}</dd>
        </div>
      </dl>

      {error && (
        <p className="compra__error" role="alert">
          {error}
        </p>
      )}
      <button className="boton boton--ancho" type="submit" disabled={yendo}>
        {yendo ? "Abriendo Mercado Pago…" : "Ir a pagar"}
      </button>
      <p className="bolsita__aviso">
        Pagás en Mercado Pago (tarjeta, débito o dinero en cuenta) y volvés acá con el link para seguir tu pedido. Al pagar aceptás los{" "}
        <Link href="/terminos" target="_blank">
          términos y condiciones
        </Link>
        .
      </p>
    </form>
  );
}
