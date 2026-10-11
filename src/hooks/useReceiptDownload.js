import { useState } from 'react'
import { supabase } from '../services/supabase' // Adjust path if needed

export function useReceiptDownload() {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)

  const downloadReceipt = async (teamId, verificationVal) => {
    setDownloading(true)
    setError(null)
    
    try {
      // 1. Request signed URL from edge function
      const { data, error: fnError } = await supabase.functions.invoke('get-receipt-url', {
        body: { team_id: teamId, verification_val: verificationVal }
      })

      if (fnError) {
        throw new Error(fnError.message || 'Failed to request receipt')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      if (!data?.url) {
        throw new Error('No URL returned from server')
      }

      // 2. Fetch the file via the signed URL
      const response = await fetch(data.url)
      if (!response.ok) {
        throw new Error('Failed to download file from server')
      }

      // 3. Create blob and trigger download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `SuccessSquad-Receipt-${teamId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      return true
    } catch (err) {
      console.error(err)
      setError(err.message || 'An unexpected error occurred')
      return false
    } finally {
      setDownloading(false)
    }
  }

  return { downloadReceipt, downloading, error }
}
