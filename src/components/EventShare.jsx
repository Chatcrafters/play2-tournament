import { useState } from 'react'
import { Share2, Copy, CheckCircle, QrCode, ExternalLink } from 'lucide-react'
import QRCode from 'qrcode'

export const EventShare = ({ event }) => {
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  
  // Generiere die öffentliche URL
  const baseUrl = window.location.origin
  const eventUrl = `${baseUrl}/event/${event.id}`
  
  // Generiere QR Code
  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(eventUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(url)
    } catch (err) {
      console.error('QR Code Fehler:', err)
    }
  }
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleShare = async () => {
    setShowShareDialog(true)
    await generateQRCode()
  }
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Melde dich an für: ${event.title}`,
          url: eventUrl
        })
      } catch (err) {
        console.log('Share cancelled:', err)
      }
    }
  }
  
  return (
    <>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Event teilen
      </button>
      
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Event teilen</h3>
              <button
                onClick={() => setShowShareDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* QR Code */}
            <div className="text-center mb-6">
              {qrCodeUrl ? (
                <div>
                  <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    QR-Code scannen für direkten Zugang zur Anmeldung
                  </p>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            {/* Link Copy */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Direkter Link zur Anmeldung:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eventUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    copied 
                      ? 'bg-green-600 text-white' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* Share Options */}
            <div className="space-y-2">
              <button
                onClick={() => window.open(eventUrl, '_blank')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4" />
                Im Browser öffnen
              </button>
              
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Share2 className="w-4 h-4" />
                  Über System teilen
                </button>
              )}
              
              <button
                onClick={() => {
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
                    `Melde dich an für: ${event.title}\n${eventUrl}`
                  )}`
                  window.open(whatsappUrl, '_blank')
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                📱 Per WhatsApp teilen
              </button>
            </div>
            
            {/* Event Info */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
              <p className="font-medium">{event.title}</p>
              <p className="text-gray-600">
                {new Date(event.date).toLocaleDateString('de-DE')} • {event.startTime} Uhr
              </p>
              <p className="text-gray-600">
                {event.players.length}/{event.maxPlayers} Plätze belegt
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}