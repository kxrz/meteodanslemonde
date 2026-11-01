"use client"

import Button from "@/components/ui/Button"

export default function PrintButton() {
  return <Button variant="ghost" onClick={() => window.print()}>Imprimer le glossaire</Button>
}
