"use client"

import { useState, useEffect } from "react"
import {
  useCurrentAccount,
  useIotaClient,
  useSignAndExecuteTransaction,
  useIotaClientQuery,
} from "@iota/dapp-kit"
import { Transaction } from "@iota/iota-sdk/transactions"
import type { IotaObjectData } from "@iota/iota-sdk/client"

// ============================================================================
// CONTRACT CONFIGURATION
// ============================================================================

// Package ID dari hasil publish kamu sebelumnya
const PACKAGE_ID = "0x8f412472693c878a83e21547fa9c37f0a8db8df11be1db6e265809d4d56ffd8c"
export const CONTRACT_MODULE = "umkm_reputation"
export const CONTRACT_METHODS = {
  REGISTER: "register",
  RECORD_REVENUE: "record_revenue",
} as const

// ============================================================================
// TYPES & DATA EXTRACTION
// ============================================================================

export interface BusinessData {
  id: string
  owner: string
  name: string
  category: string
  revenue: number
  tier: string
  imageUrl: string
}

function getObjectFields(data: IotaObjectData): BusinessData | null {
  if (data.content?.dataType !== "moveObject") {
    return null
  }

  const fields = data.content.fields as any
  
  if (!fields) {
    return null
  }

  // Helper untuk parsing Address
  const owner = data.owner && typeof data.owner === "object" && "AddressOwner" in data.owner
    ? String(data.owner.AddressOwner)
    : ""

  return {
    id: data.objectId,
    owner,
    name: fields.name || "Unknown",
    category: fields.category || "Uncategorized",
    // Revenue di Move adalah u64 (string di JSON), kita convert ke number/BigInt
    revenue: Number(fields.revenue || 0), 
    tier: fields.tier || "Bronze",
    imageUrl: fields.image_url || ""
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export interface ContractState {
  isLoading: boolean
  isPending: boolean // Sedang sign di wallet
  isConfirmed: boolean // Transaksi sukses
  hash: string | undefined // Digest transaksi
  error: Error | null
}

export interface ContractActions {
  register: (name: string, category: string) => Promise<void>
  recordRevenue: (amount: number) => Promise<void>
  resetState: () => void
}

export const useContract = () => {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const iotaClient = useIotaClient()
  
  // Hook untuk eksekusi transaksi
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()

  // State Lokal
  const [objectId, setObjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [transactionError, setTransactionError] = useState<Error | null>(null)

  // 1. Cek URL Hash untuk persistensi ID (agar kalau refresh data gak hilang)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Mengharapkan format #0xObjectId
      const hashId = window.location.hash.slice(1)
      if (hashId && hashId.startsWith("0x")) {
        setObjectId(hashId)
      }
    }
  }, [])

  // 2. Fetch Data dari Blockchain (Real-time update)
  const { data: objectData, isPending: isFetching, refetch } = useIotaClientQuery(
    "getObject",
    {
      id: objectId!,
      options: { showContent: true, showOwner: true },
    },
    {
      enabled: !!objectId, // Hanya fetch kalau punya ID
      refetchInterval: 5000, // Auto refresh tiap 5 detik (opsional)
    }
  )

  // Parsing data mentah dari blockchain ke format aplikasi kita
  const businessData = objectData?.data ? getObjectFields(objectData.data) : null
  const isOwner = businessData?.owner.toLowerCase() === address?.toLowerCase()

  // -------------------------------------------------------------------------
  // ACTION 1: REGISTER (MINT NFT)
  // -------------------------------------------------------------------------
  const register = async (name: string, category: string) => {
    try {
      setIsLoading(true)
      setTransactionError(null)
      setHash(undefined)

      const tx = new Transaction()
      tx.moveCall({
        target: `${PACKAGE_ID}::${CONTRACT_MODULE}::${CONTRACT_METHODS.REGISTER}`,
        arguments: [
          tx.pure.string(name),
          tx.pure.string(category)
        ],
      })

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            try {
              // Tunggu sampai transaksi dikonfirmasi oleh validator
              const { effects } = await iotaClient.waitForTransaction({
                digest,
                options: { showEffects: true },
              })

              // Cari ID object yang baru dibuat (Created)
              const createdObject = effects?.created?.[0]?.reference?.objectId
              
              if (createdObject) {
                setObjectId(createdObject)
                // Simpan ke URL agar tidak hilang saat refresh
                if (typeof window !== "undefined") {
                  window.location.hash = createdObject
                }
              }
            } catch (waitError) {
              console.error("Error waiting for transaction:", waitError)
            } finally {
              setIsLoading(false)
            }
          },
          onError: (err) => {
            setTransactionError(err instanceof Error ? err : new Error(String(err)))
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      setTransactionError(err instanceof Error ? err : new Error(String(err)))
      setIsLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // ACTION 2: RECORD REVENUE (UPDATE REPUTATION)
  // -------------------------------------------------------------------------
  const recordRevenue = async (amount: number) => {
    if (!objectId) {
      alert("Business ID not found! Please register first.")
      return
    }

    try {
      setIsLoading(true)
      setTransactionError(null)
      setHash(undefined)

      const tx = new Transaction()
      tx.moveCall({
        target: `${PACKAGE_ID}::${CONTRACT_MODULE}::${CONTRACT_METHODS.RECORD_REVENUE}`,
        arguments: [
          tx.object(objectId), // ID Object KredithScore
          tx.pure.u64(amount)  // Jumlah uang
        ],
      })

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async ({ digest }) => {
            setHash(digest)
            await iotaClient.waitForTransaction({ digest }) // Tunggu konfirmasi
            refetch() // Refresh data di layar
            setIsLoading(false)
          },
          onError: (err) => {
            setTransactionError(err instanceof Error ? err : new Error(String(err)))
            setIsLoading(false)
          },
        }
      )
    } catch (err) {
      setTransactionError(err instanceof Error ? err : new Error(String(err)))
      setIsLoading(false)
    }
  }

  const resetState = () => {
    setObjectId(null)
    setTransactionError(null)
    setHash(undefined)
    if (typeof window !== "undefined") {
      window.location.hash = ""
    }
  }

  // -------------------------------------------------------------------------
  // RETURN VALUES
  // -------------------------------------------------------------------------

  const contractState: ContractState = {
    isLoading: isPending || (isLoading && !hash),
    isPending,
    isConfirmed: !!hash && !isPending && !isLoading,
    hash,
    error: transactionError,
  }

  const actions: ContractActions = {
    register,
    recordRevenue,
    resetState
  }

  return {
    data: businessData, // Data struct KredithScore yang sudah diparsing
    actions,            // Fungsi register & recordRevenue
    state: contractState, // Status loading/error
    objectId,           // ID Object saat ini
    isOwner,
  }
}