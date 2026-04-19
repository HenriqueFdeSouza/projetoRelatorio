import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const CURRENT_VERSION = "1.0.1"

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
      "Integração com banco Supabase",
    ],
  },
]

export default function UpdateModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const savedVersion = localStorage.getItem("app_version")

    if (savedVersion !== CURRENT_VERSION) {
      setOpen(true)
      localStorage.setItem("app_version", CURRENT_VERSION)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>🚀 Atualizações do sistema</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
          {updates.map((item) => (
            <div key={item.version} className="border rounded-lg p-3">
              <div className="font-semibold">
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

        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}