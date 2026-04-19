export default function Updates() {
  const updates = [
    {
      version: "1.0.1",
      date: "18/04/2026",
      changes: [
        "Nova área de estatísticas com gráficos",
        "Melhoria na organização dos relatórios",
        "Correção de bugs no PDF",
      ],
    },
    {
      version: "1.0.0",
      date: "15/04/2026",
      changes: [
        "Sistema inicial de relatórios",
        "Integração com Supabase",
      ],
    },
  ]

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header rounded-lg">
        <h1 className="text-2xl font-bold">Atualizações</h1>
        <p className="text-sm opacity-80">
          Veja o que mudou no sistema ao longo do tempo.
        </p>
      </div>

      {updates.map((item) => (
        <div key={item.version} className="bg-card border rounded-lg p-4">
          <div className="font-semibold text-lg">
            Versão {item.version} • {item.date}
          </div>

          <ul className="list-disc ml-5 mt-2 text-sm space-y-1">
            {item.changes.map((change, i) => (
              <li key={i}>{change}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}