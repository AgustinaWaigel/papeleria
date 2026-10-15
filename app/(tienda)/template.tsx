/* El template se vuelve a montar en cada navegación: así cada página entra con un fundido suave. */
export default function TemplateTienda({ children }: { children: React.ReactNode }) {
  return <div className="entrada-pagina">{children}</div>;
}
