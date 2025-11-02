import { QRCode } from "@/registry/default/ui/qr-code"

export default function QrCodeDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <QRCode value="https://ui.hanzo.ai" size={200} />
    </div>
  )
}
