"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, useTransition } from "react";
import { pagarOnline, validarCupon } from "@/app/(tienda)/acciones";
import { cambiarCantidad, lugarLibre, subtotalRenglon, total, unidades, type EntregaPedido } from "@/lib/bolsita";
import { enlaceWhatsApp, PLAZO_TALLER, precio } from "@/lib/contacto";
import { PedirPorWhatsApp, PorCantidad, useAjustesCompra, useRenglones } from "./Bolsita";
import { destinoCorto, ElegirEnvio, textoCosto, textoDestino, useEnvio, type EleccionEnvio } from "./Envio";

/* La compra online, paso por paso: 1) confirmar lo que hay en la bolsita, 2) cómo lo recibe y cuánto sale el
   envío, 3) los datos de quien compra y el pago, con el total final. Lo que muestra (descuento, envío, total)
   es un adelanto: al pagar, el servidor lo vuelve a calcular con los precios de la base. */

type Paso = 1 | 2 | 3;
type Cupon = { codigo: string; descuento: number; texto: string };

// La bolsita vive en localStorage: hasta que el navegador la lee, la página no sabe qué hay.
const sinCambios = () => () => {};
const useMontado = () => useSyncExternalStore(sinCambios, () => true, () => false);

export function Compra() {
  const items = useRenglones();
  // Sin pago online, el último paso manda el pedido por WhatsApp y el pago se coordina por transferencia.
  const { envio, cotizaCorreo, pagoOnline } = useAjustesCompra();
  const montado = useMontado();

  const [paso, setPaso] = useState<Paso>(1);
  const [eleccion, setEleccion] = useState<EleccionEnvio>({ entrega: "retiro", cp: "", provincia: "" });
  const [direccion, setDireccion] = useState("");
  const [datos, setDatos] = useState({ nombre: "", email: "", telefono: "" });
  const [codigoCupon, setCodigoCupon] = useState("");
  const [cupon, setCupon] = useState<Cupon | null>(null);
  const [errorCupon, setErrorCupon] = useState("");
  const [revisando, revisar] = useTransition();
  const [error, setError] = useState("");
  const [yendo, empezar] = useTransition();
  const [enviado, setEnviado] = useState<{ codigo: string; href: string } | null>(null);

  const soloDigital = items.length > 0 && items.every((r) => r.producto.tipo === "descargable");
  const eleccionReal: EleccionEnvio = soloDigital ? { ...eleccion, entrega: "digital" } : eleccion;
  const renglones = items.map((r) => ({ id: r.producto.id, cantidad: r.cantidad }));
  const subtotal = total(items);
  const descuento = cupon ? Math.min(cupon.descuento, subtotal) : 0;
  const calculo = useEnvio({ items, envio, cotizaCorreo, eleccion: eleccionReal, descuento });
  const final = subtotal - descuento + (calculo.costo ?? 0);
  const conEnvio = eleccionReal.entrega === "envio";

  // Si la bolsita cambia después de aplicar el cupón, el descuento puede no ser el mismo: se vuelve a pedir.
  const [bolsitaDelCupon, setBolsitaDelCupon] = useState("");
  const firma = renglones.map((r) => `${r.id}x${r.cantidad}`).join(",");
  if (cupon && bolsitaDelCupon !== firma) {
    setCupon(null);
    setErrorCupon("Cambió tu pedido: volvé a aplicar el cupón.");
  }

  // El envío a domicilio se paga online solo si tiene precio (de la zona o del correo). Por WhatsApp, sin precio
  // queda "a coordinar".
  const envioSinPrecio = pagoOnline && conEnvio && calculo.destinoListo && !calculo.cotizando && calculo.costo === null;
  const precioALaVista = conEnvio && calculo.destinoListo && !envioSinPrecio;
  const entregaLista =
    !conEnvio ||
    (calculo.destinoListo && !calculo.cotizando && (typeof calculo.costo === "number" || !pagoOnline) && direccion.trim().length >= 6);

  if (!montado) return <p className="compra-pagina__cargando">Abriendo tu bolsita…</p>;

  if (enviado) {
    return (
      <div className="paso">
        <span className="nota-mano">¡pedido enviado!</span>
        <p>
          Te abrimos WhatsApp con tu pedido <strong>{enviado.codigo}</strong>. Si no se abrió,{" "}
          <a href={enviado.href} target="_blank" rel="noopener">
            tocá acá
          </a>
          .
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="paso">
        <span className="nota-mano">todavía vacía</span>
        <p>
          Tu bolsita está vacía. Sumá algo desde <Link href="/papeleria">la papelería</Link> o{" "}
          <Link href="/descargables">los descargables</Link>.
        </p>
      </div>
    );
  }

  const aplicarCupon = () => {
    if (!codigoCupon.trim()) return;
    revisar(async () => {
      setErrorCupon("");
      const r = await validarCupon(codigoCupon, renglones);
      if (r.codigo && r.descuento !== undefined) {
        setCupon({ codigo: r.codigo, descuento: r.descuento, texto: r.texto ?? "" });
        setBolsitaDelCupon(firma);
      } else setErrorCupon(r.error ?? "Ese cupón no sirve.");
    });
  };

  const pagar = () => {
    setError("");
    empezar(async () => {
      const resultado = await pagarOnline(renglones, {
        ...datos,
        entrega: eleccionReal.entrega,
        direccion,
        codigoPostal: eleccion.cp,
        provincia: eleccion.provincia,
        cupon: cupon?.codigo,
      });
      if (resultado.url) window.location.assign(resultado.url);
      else setError(resultado.error ?? "Algo salió mal. Probá de nuevo.");
    });
  };

  const textoEntrega = soloDigital
    ? "Solo descargables: te llegan por mail"
    : eleccion.entrega === "retiro"
      ? "Lo retirás en Crespo (coordinamos por WhatsApp)"
      : `${textoDestino(eleccion.cp, eleccion.provincia)} · ${direccion.trim()}`;

  // Para el mensaje de WhatsApp, lo que ya se eligió de la entrega.
  const entregaWhatsApp: EntregaPedido = soloDigital
    ? { tipo: "digital" }
    : eleccion.entrega === "retiro"
      ? { tipo: "retiro" }
      : {
          tipo: "envio",
          destino: calculo.destinoListo ? destinoCorto(eleccion.cp, eleccion.provincia) : undefined,
          costo: calculo.costo,
          direccion,
        };

  return (
    <div className="compra-pagina">
      <ol className="compra-pagina__pasos">
        {/* ---------- 1. Tu pedido ---------- */}
        <li className={`paso${paso === 1 ? " paso--actual" : " paso--hecho"}`}>
          <CabezaPaso numero={1} titulo="Tu pedido" hecho={paso > 1} cambiar={() => setPaso(1)} />
          {paso === 1 ? (
            <>
              <ul className="paso__items">
                {items.map((r) => {
                  const { producto: p, cantidad } = r;
                  return (
                  <li key={p.id}>
                    <strong>{p.nombre}</strong>
                    <span className="paso__precio">{precio(subtotalRenglon(r))}</span>
                    <PorCantidad renglon={r} />
                    <div className="bolsita__cantidad">
                      <button type="button" aria-label={`Quitar uno de ${p.nombre}`} onClick={() => cambiarCantidad(p.id, -1)}>
                        −
                      </button>
                      <span className="bolsita__numero">{cantidad}</span>
                      <button
                        type="button"
                        aria-label={`Sumar uno de ${p.nombre}`}
                        disabled={lugarLibre(p, cantidad) <= 0}
                        onClick={() => cambiarCantidad(p.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <button className="bolsita__quitar" type="button" onClick={() => cambiarCantidad(p.id, -cantidad)}>
                      Sacar
                    </button>
                  </li>
                  );
                })}
              </ul>
              <p className="bolsita__total">
                Subtotal <span>{precio(subtotal)}</span>
              </p>
              <button className="boton boton--ancho" type="button" onClick={() => setPaso(soloDigital ? 3 : 2)}>
                Confirmar pedido
              </button>
            </>
          ) : (
            <p className="paso__resumen">
              {unidades(items) === 1 ? "1 producto" : `${unidades(items)} productos`} · {precio(subtotal)}
            </p>
          )}
        </li>

        {/* ---------- 2. Entrega ---------- */}
        <li className={`paso${paso === 2 ? " paso--actual" : paso > 2 ? " paso--hecho" : " paso--despues"}`}>
          <CabezaPaso numero={2} titulo="Entrega" hecho={paso > 2 && !soloDigital} cambiar={() => setPaso(2)} />
          {paso === 2 && (
            <>
              {/* Con el destino puesto, el precio del envío va aparte y bien grande. */}
              <ElegirEnvio eleccion={eleccion} cambiar={setEleccion} texto={precioALaVista ? undefined : calculo.texto} />
              {precioALaVista && (
                <div className="envio-precio" role="status">
                  <span className="envio-precio__titulo">Costo del envío</span>
                  <strong className="envio-precio__monto">{calculo.costo === 0 ? "¡Gratis!" : textoCosto(calculo.costo, calculo.cotizando)}</strong>
                  {calculo.detalle && <span className="envio-precio__detalle">{calculo.detalle}</span>}
                </div>
              )}
              <p className="campo__ayuda paso__plazo">{PLAZO_TALLER}</p>
              {conEnvio && (
                <div className="campo">
                  <label htmlFor="compra-direccion">Dirección</label>
                  <textarea
                    id="compra-direccion"
                    rows={2}
                    autoComplete="street-address"
                    placeholder="Calle, número, piso y ciudad"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>
              )}
              {envioSinPrecio ? (
                <div className="seguimiento__aviso seguimiento__aviso--espera">
                  <p>No podemos cobrar online el envío a tu zona. Mandanos el pedido por WhatsApp y te pasamos el costo.</p>
                  <PedirPorWhatsApp items={items} nombre={datos.nombre} entrega={entregaWhatsApp} alEnviar={setEnviado} />
                </div>
              ) : (
                <button className="boton boton--ancho" type="button" disabled={!entregaLista} onClick={() => setPaso(3)}>
                  Continuar
                </button>
              )}
            </>
          )}
          {paso > 2 && <p className="paso__resumen">{textoEntrega}</p>}
        </li>

        {/* ---------- 3. Tus datos y pago (o el pedido por WhatsApp) ---------- */}
        <li className={`paso${paso === 3 ? " paso--actual" : " paso--despues"}`}>
          <CabezaPaso numero={3} titulo={pagoOnline ? "Tus datos y pago" : "Mandanos tu pedido"} />
          {paso === 3 && !pagoOnline && (
            <div>
              <div className="campo">
                <label htmlFor="compra-nombre">Tu nombre</label>
                <input
                  type="text"
                  id="compra-nombre"
                  autoComplete="name"
                  value={datos.nombre}
                  onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                />
              </div>
              <Cuentas subtotal={subtotal} descuento={0} conEnvio={conEnvio} envio={textoCosto(calculo.costo, calculo.cotizando)} final={final} />
              {!soloDigital && <AvisoPlazo antes="mandar el pedido" />}
              <PedirPorWhatsApp items={items} nombre={datos.nombre} entrega={entregaWhatsApp} alEnviar={setEnviado} />
              <p className="bolsita__aviso">
                Se abre WhatsApp con tu pedido escrito{conEnvio ? ", con el envío y la dirección" : ""}. Te respondemos con los datos para
                la transferencia: el pedido queda confirmado cuando se acredita el pago. Al mandarlo aceptás los{" "}
                <Link href="/terminos" target="_blank">
                  términos y condiciones
                </Link>
                .
              </p>
            </div>
          )}
          {paso === 3 && pagoOnline && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                pagar();
              }}
            >
              <div className="campo">
                <label htmlFor="compra-nombre">Nombre y apellido</label>
                <input
                  type="text"
                  id="compra-nombre"
                  autoComplete="name"
                  required
                  value={datos.nombre}
                  onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                />
              </div>
              <div className="campo">
                <label htmlFor="compra-email">Mail</label>
                <span className="campo__ayuda">
                  {items.some((r) => r.producto.tipo === "descargable") ? "Ahí te llegan los PDF y el detalle de tu compra." : "Ahí te llega el detalle de tu compra."}
                </span>
                <input
                  type="email"
                  id="compra-email"
                  autoComplete="email"
                  required
                  value={datos.email}
                  onChange={(e) => setDatos({ ...datos, email: e.target.value })}
                />
              </div>
              <div className="campo">
                <label htmlFor="compra-telefono">WhatsApp</label>
                <input
                  type="tel"
                  id="compra-telefono"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  placeholder="343 4123456"
                  value={datos.telefono}
                  onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
                />
              </div>

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

              <Cuentas subtotal={subtotal} descuento={descuento} conEnvio={conEnvio} envio={textoCosto(calculo.costo, calculo.cotizando)} final={final} />

              {!soloDigital && <AvisoPlazo antes="pagar" />}

              {error && (
                <p className="compra__error" role="alert">
                  {error}
                </p>
              )}
              <button className="boton boton--ancho" type="submit" disabled={yendo || calculo.cotizando}>
                {yendo ? "Abriendo Mercado Pago…" : `Pagar ${precio(final)} con Mercado Pago`}
              </button>
              <p className="bolsita__aviso">
                Pagás en Mercado Pago (tarjeta, débito o dinero en cuenta) y volvés acá con el link para seguir tu pedido. Al pagar
                aceptás los{" "}
                <Link href="/terminos" target="_blank">
                  términos y condiciones
                </Link>
                .
              </p>
            </form>
          )}
        </li>
      </ol>

      <aside className="compra-pagina__resumen" aria-label="Resumen de la compra">
        <h2>Resumen</h2>
        <ul className="paso__items paso__items--chico">
          {items.map((r) => (
            <li key={r.producto.id}>
              <span>
                {r.cantidad} × {r.producto.nombre}
              </span>
              <span className="paso__precio">{precio(subtotalRenglon(r))}</span>
            </li>
          ))}
        </ul>
        <Cuentas
          subtotal={subtotal}
          descuento={descuento}
          conEnvio={conEnvio}
          envio={paso > 1 || calculo.destinoListo ? textoCosto(calculo.costo, calculo.cotizando) : "en el paso 2"}
          final={final}
        />
        {pagoOnline && (
          <>
            <p className="bolsita__aviso">
              ¿Preferís coordinar por WhatsApp? Mandanos el pedido por ahí y arreglamos el pago y la entrega.
            </p>
            <PedirPorWhatsApp items={items} nombre={datos.nombre} entrega={paso > 1 ? entregaWhatsApp : undefined} claro alEnviar={setEnviado} />
          </>
        )}
      </aside>
    </div>
  );
}

/* Cuánto lleva prepararlo, justo antes del último botón. */
function AvisoPlazo({ antes }: { antes: string }) {
  return (
    <div className="seguimiento__aviso seguimiento__aviso--espera">
      <p>
        <strong>Antes de {antes}:</strong> {PLAZO_TALLER} Si lo necesitás para una fecha o tenés alguna duda,{" "}
        <a href={enlaceWhatsApp("¡Hola Alas de Ángel! Tengo una consulta sobre los tiempos de mi pedido.")} target="_blank" rel="noopener">
          escribinos por WhatsApp
        </a>
        .
      </p>
    </div>
  );
}

function CabezaPaso({ numero, titulo, hecho, cambiar }: { numero: Paso; titulo: string; hecho?: boolean; cambiar?: () => void }) {
  return (
    <div className="paso__cabeza">
      <span className="paso__numero" aria-hidden="true">
        {hecho ? "✓" : numero}
      </span>
      <h2>{titulo}</h2>
      {hecho && cambiar && (
        <button className="compra__volver" type="button" onClick={cambiar}>
          Cambiar
        </button>
      )}
    </div>
  );
}

function Cuentas({ subtotal, descuento, conEnvio, envio, final }: { subtotal: number; descuento: number; conEnvio: boolean; envio: string; final: number }) {
  return (
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
      {conEnvio && (
        <div className="compra__envio">
          <dt>Envío</dt>
          <dd>{envio}</dd>
        </div>
      )}
      <div className="compra__total">
        <dt>Total</dt>
        <dd>{precio(final)}</dd>
      </div>
    </dl>
  );
}
