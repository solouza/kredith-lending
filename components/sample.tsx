"use client"

/**
 * ============================================================================
 * IOTA DAPP INTEGRATION COMPONENT
 * ============================================================================
 *
 * This is the main integration component for your IOTA dApp.
 *
 * All the contract logic is in hooks/useContract.ts
 *
 * To customize your dApp, modify this file.
 *
 * ============================================================================
 */

import { ConnectModal, useCurrentAccount, useCurrentWallet, useDisconnectWallet, useIotaClient } from "@iota/dapp-kit"
import { useContract } from "@/hooks/useContract"
import { Button, Text, TextField } from "@radix-ui/themes"
import ClipLoader from "react-spinners/ClipLoader"
import { useState, useMemo, useEffect } from "react"
import { TESTNET_PACKAGE_ID } from "@/lib/config"

interface PizzaData {
  pepperoni: number
  sausage: number
  cheese: number
  onion: number
  chives: number
}

interface PizzaBoxData {
  id: string
  pizzas: PizzaData[]
}

const SampleIntegration = () => {
  const currentAccount = useCurrentAccount()
  const { mutate: disconnectWallet } = useDisconnectWallet()
  const { data, actions, state, objectId, isOwner, objectExists, hasValidData } = useContract()
  const iotaClient = useIotaClient()

  // Pizza array state - each pizza is individually customizable
  interface Pizza {
    id: string
    pepperoni: string
    sausage: string
    cheese: string
    onion: string
    chives: string
  }

  const [pizzas, setPizzas] = useState<Pizza[]>([
    { id: crypto.randomUUID(), pepperoni: "", sausage: "", cheese: "", onion: "", chives: "" }
  ])
  const [selectedPizzaIndex, setSelectedPizzaIndex] = useState(0)
  const [pizzaboxId, setPizzaboxId] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [showMyPizzaBoxes, setShowMyPizzaBoxes] = useState(false)
  const [myPizzaBoxes, setMyPizzaBoxes] = useState<PizzaBoxData[]>([])
  const [loadingPizzaBoxes, setLoadingPizzaBoxes] = useState(false)
  const [selectedPizzaBox, setSelectedPizzaBox] = useState<PizzaBoxData | null>(null)
  const [recipientAddress, setRecipientAddress] = useState("")

  const isConnected = !!currentAccount

  // Fetch all pizza boxes owned by the user
  const fetchMyPizzaBoxes = async () => {
    if (!currentAccount?.address) return

    try {
      setLoadingPizzaBoxes(true)
      const objects = await iotaClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${TESTNET_PACKAGE_ID}::pizza::PizzaBox`,
        },
        options: {
          showContent: true,
        },
      })

      const pizzaBoxes: PizzaBoxData[] = []
      for (const obj of objects.data) {
        if (obj.data?.content?.dataType === "moveObject") {
          const fields = obj.data.content.fields as any
          const pizzas = fields.pizzas || []

          pizzaBoxes.push({
            id: obj.data.objectId,
            pizzas: pizzas.map((p: any) => ({
              pepperoni: p.fields?.pepperoni || 0,
              sausage: p.fields?.sausage || 0,
              cheese: p.fields?.cheese || 0,
              onion: p.fields?.onion || 0,
              chives: p.fields?.chives || 0,
            })),
          })
        }
      }

      setMyPizzaBoxes(pizzaBoxes)
    } catch (error) {
      console.error("Error fetching pizza boxes:", error)
    } finally {
      setLoadingPizzaBoxes(false)
    }
  }

  // Fetch pizza boxes when modal opens
  useEffect(() => {
    if (showMyPizzaBoxes && currentAccount?.address) {
      fetchMyPizzaBoxes()
    }
  }, [showMyPizzaBoxes, currentAccount?.address])

  // Generate random positions for toppings (seeded by count for consistency)
  const generateToppingPositions = (count: number, seed: number) => {
    const positions: { x: number; y: number; r: number }[] = []
    for (let i = 0; i < Math.min(count, 30); i++) {
      // Use seed + index to get consistent "random" positions
      const angle = ((seed * 137.5 + i * 47) % 360) * (Math.PI / 180)
      const radius = 20 + ((seed * 13 + i * 17) % 45)
      const x = 100 + Math.cos(angle) * radius
      const y = 100 + Math.sin(angle) * radius
      const r = 6 + (i % 3) * 2
      positions.push({ x, y, r })
    }
    return positions
  }

  // Get current pizza being edited
  const currentPizza = pizzas[selectedPizzaIndex]

  // Memoize topping positions based on current pizza values
  const toppingPositions = useMemo(() => ({
    pepperoni: generateToppingPositions(Number(currentPizza?.pepperoni) || 0, 1),
    sausage: generateToppingPositions(Number(currentPizza?.sausage) || 0, 2),
    cheese: generateToppingPositions(Number(currentPizza?.cheese) || 0, 3),
    onion: generateToppingPositions(Number(currentPizza?.onion) || 0, 4),
    chives: generateToppingPositions(Number(currentPizza?.chives) || 0, 5),
  }), [currentPizza])

  // Static Pizza SVG (no spinning) for displaying pizza boxes
  const StaticPizzaSVG = ({ pizza, size = 200 }: { pizza: PizzaData; size?: number }) => {
    const positions = {
      pepperoni: generateToppingPositions(pizza.pepperoni, 1),
      sausage: generateToppingPositions(pizza.sausage, 2),
      cheese: generateToppingPositions(pizza.cheese, 3),
      onion: generateToppingPositions(pizza.onion, 4),
      chives: generateToppingPositions(pizza.chives, 5),
    }

    return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        {/* Pizza base/crust */}
        <circle cx="100" cy="100" r="95" fill="#E8B86D" />
        {/* Sauce layer */}
        <circle cx="100" cy="100" r="78" fill="#E53935" />
        {/* Cheese base layer */}
        <circle cx="100" cy="100" r="72" fill="#FFCA28" />

        {/* Extra cheese blobs */}
        {positions.cheese.map((pos, i) => (
          <g key={`cheese-${i}`}>
            <circle cx={pos.x} cy={pos.y} r={pos.r + 2} fill="#FFE082" opacity="0.85" />
            <circle cx={pos.x + 2} cy={pos.y - 1} r={pos.r - 2} fill="#FFB74D" opacity="0.6" />
          </g>
        ))}

        {/* Pepperoni slices */}
        {positions.pepperoni.map((pos, i) => (
          <circle key={`pepperoni-${i}`} cx={pos.x} cy={pos.y} r={pos.r} fill="#C62828" />
        ))}

        {/* Sausage pieces */}
        {positions.sausage.map((pos, i) => (
          <g key={`sausage-${i}`} transform={`rotate(${i * 45} ${pos.x} ${pos.y})`}>
            <ellipse cx={pos.x} cy={pos.y} rx={pos.r + 1} ry={pos.r - 1} fill="#8D6E63" />
            <ellipse cx={pos.x - 1} cy={pos.y} rx={pos.r - 2} ry={pos.r - 3} fill="#A1887F" opacity="0.7" />
            <circle cx={pos.x + 2} cy={pos.y - 1} r="2" fill="#6D4C41" opacity="0.5" />
          </g>
        ))}

        {/* Onion rings */}
        {positions.onion.map((pos, i) => (
          <circle key={`onion-${i}`} cx={pos.x} cy={pos.y} r={pos.r - 1} fill="none" stroke="#E8E8E8" strokeWidth="2" />
        ))}

        {/* Chives */}
        {positions.chives.map((pos, i) => (
          <ellipse key={`chives-${i}`} cx={pos.x} cy={pos.y} rx="2" ry={pos.r} fill="#43A047" transform={`rotate(${i * 30} ${pos.x} ${pos.y})`} />
        ))}
      </svg>
    )
  }

  // Dynamic Pizza SVG that shows toppings based on input
  const DynamicPizzaSVG = () => (
    <svg width="320" height="320" viewBox="0 0 200 200" style={{
      animation: "spin 20s linear infinite"
    }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {/* Pizza base/crust */}
      <circle cx="100" cy="100" r="95" fill="#E8B86D" />
      {/* Sauce layer */}
      <circle cx="100" cy="100" r="78" fill="#E53935" />
      {/* Cheese base layer */}
      <circle cx="100" cy="100" r="72" fill="#FFCA28" />

      {/* Extra cheese blobs */}
      {toppingPositions.cheese.map((pos, i) => (
        <g key={`cheese-${i}`}>
          <circle cx={pos.x} cy={pos.y} r={pos.r + 2} fill="#FFE082" opacity="0.85" />
          {/* Orange hint detail */}
          <circle cx={pos.x + 2} cy={pos.y - 1} r={pos.r - 2} fill="#FFB74D" opacity="0.6" />
        </g>
      ))}

      {/* Pepperoni slices */}
      {toppingPositions.pepperoni.map((pos, i) => (
        <circle key={`pepperoni-${i}`} cx={pos.x} cy={pos.y} r={pos.r} fill="#C62828" />
      ))}

      {/* Sausage pieces */}
      {toppingPositions.sausage.map((pos, i) => (
        <g key={`sausage-${i}`} transform={`rotate(${i * 45} ${pos.x} ${pos.y})`}>
          {/* Base sausage */}
          <ellipse cx={pos.x} cy={pos.y} rx={pos.r + 1} ry={pos.r - 1} fill="#8D6E63" />
          {/* Reddish brown detail */}
          <ellipse cx={pos.x - 1} cy={pos.y} rx={pos.r - 2} ry={pos.r - 3} fill="#A1887F" opacity="0.7" />
          <circle cx={pos.x + 2} cy={pos.y - 1} r="2" fill="#6D4C41" opacity="0.5" />
        </g>
      ))}

      {/* Onion rings */}
      {toppingPositions.onion.map((pos, i) => (
        <circle key={`onion-${i}`} cx={pos.x} cy={pos.y} r={pos.r - 1} fill="none" stroke="#E8E8E8" strokeWidth="2" />
      ))}

      {/* Chives */}
      {toppingPositions.chives.map((pos, i) => (
        <ellipse key={`chives-${i}`} cx={pos.x} cy={pos.y} rx="2" ry={pos.r} fill="#43A047" transform={`rotate(${i * 30} ${pos.x} ${pos.y})`} />
      ))}
    </svg>
  )

  // Static Hero Pizza SVG
  const HeroPizzaSVG = () => (
    <svg width="280" height="280" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="95" fill="#E8B86D" />
      <circle cx="100" cy="100" r="78" fill="#E53935" />
      <circle cx="100" cy="100" r="72" fill="#FFCA28" />
      <circle cx="70" cy="65" r="14" fill="#C62828" />
      <circle cx="130" cy="75" r="14" fill="#C62828" />
      <circle cx="85" cy="120" r="14" fill="#C62828" />
      <circle cx="125" cy="130" r="14" fill="#C62828" />
      <circle cx="100" cy="90" r="11" fill="#C62828" />
      <ellipse cx="55" cy="100" rx="7" ry="12" fill="#43A047" transform="rotate(-30 55 100)" />
      <ellipse cx="145" cy="105" rx="7" ry="12" fill="#43A047" transform="rotate(25 145 105)" />
      <ellipse cx="105" cy="145" rx="7" ry="12" fill="#43A047" transform="rotate(10 105 145)" />
    </svg>
  )

  // Pizza Box SVG
  const PizzaBoxSVG = () => (
    <svg width="320" height="320" viewBox="0 0 200 200">
      {/* Box shadow */}
      <ellipse cx="100" cy="175" rx="70" ry="8" fill="#333" opacity="0.2" />

      {/* Box bottom part */}
      <rect x="30" y="100" width="140" height="70" fill="#D4A574" stroke="#8B5E3C" strokeWidth="1.5" />

      {/* Box front face - lighter */}
      <polygon points="30,100 170,100 165,95 35,95" fill="#E8B86D" stroke="#8B5E3C" strokeWidth="1.5" />

      {/* Box side details */}
      <line x1="30" y1="100" x2="30" y2="170" stroke="#8B5E3C" strokeWidth="1.5" />
      <line x1="170" y1="100" x2="170" y2="170" stroke="#8B5E3C" strokeWidth="1.5" />

      {/* Box lid - top */}
      <rect x="25" y="45" width="150" height="50" fill="#C89968" stroke="#8B5E3C" strokeWidth="1.5" />

      {/* Box lid - front edge (slightly open) */}
      <polygon points="25,95 175,95 170,100 30,100" fill="#E8B86D" stroke="#8B5E3C" strokeWidth="1.5" />

      {/* Box lid - side shading */}
      <polygon points="175,45 175,95 170,100 165,95 165,50" fill="#B8845A" stroke="#8B5E3C" strokeWidth="1.5" />

      {/* Steam coming out */}
      <g opacity="0.6">
        <path d="M 80 85 Q 75 70 78 55" stroke="#E0E0E0" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M 100 85 Q 100 65 105 45" stroke="#E0E0E0" strokeWidth="3" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
        </path>
        <path d="M 120 85 Q 125 70 122 55" stroke="#E0E0E0" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.2s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Logo/Text on box */}
      <text x="100" y="70" textAnchor="middle" fill="#E53935" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">
        PIZZA
      </text>
      <text x="100" y="85" textAnchor="middle" fill="#43A047" fontSize="10" fontWeight="600" fontFamily="Arial, sans-serif">
        Fresh & Hot
      </text>

      {/* Box details/lines */}
      <line x1="35" y1="110" x2="165" y2="110" stroke="#8B5E3C" strokeWidth="0.5" opacity="0.5" />
      <line x1="35" y1="130" x2="165" y2="130" stroke="#8B5E3C" strokeWidth="0.5" opacity="0.5" />
      <line x1="35" y1="150" x2="165" y2="150" stroke="#8B5E3C" strokeWidth="0.5" opacity="0.5" />
    </svg>
  )

  // Disconnected state - Hero landing page
  if (!isConnected) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#FFF8E1",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "8%", left: "5%", width: "80px", height: "80px", borderRadius: "50%", background: "#FFCA28", opacity: 0.4 }} />
        <div style={{ position: "absolute", top: "20%", right: "8%", width: "50px", height: "50px", borderRadius: "50%", background: "#43A047", opacity: 0.3 }} />
        <div style={{ position: "absolute", bottom: "25%", left: "10%", width: "40px", height: "40px", borderRadius: "50%", background: "#E53935", opacity: 0.25 }} />
        <div style={{ position: "absolute", bottom: "15%", right: "12%", width: "60px", height: "60px", borderRadius: "50%", background: "#FFCA28", opacity: 0.35 }} />

        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          position: "relative",
          zIndex: 1
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: "800px",
            width: "100%",
            gap: "1.5rem"
          }}>
            <div style={{ textAlign: "center" }}>
              <h1 style={{
                fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
                fontWeight: "800",
                color: "#E53935",
                margin: 0,
                lineHeight: 1.1
              }}>
                Pack a Pizza
              </h1>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "4px"
              }}>
                <span style={{
                  color: "#43A047",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  letterSpacing: "1px"
                }}>
                  POWERED BY IOTA
                </span>
              </div>
            </div>

            <div style={{ margin: "0.5rem 0" }}>
              <HeroPizzaSVG />
            </div>

            <div style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0.75rem"
            }}>
              {[
                { text: "Cook Pizzas", bg: "#E53935" },
                { text: "Pack & Store", bg: "#43A047" },
                { text: "Earn Rewards", bg: "#E8B86D" }
              ].map((item, i) => (
                <div key={i} style={{
                  background: item.bg,
                  padding: "0.5rem 1rem",
                  borderRadius: "30px"
                }}>
                  <span style={{ fontWeight: "600", color: "white", fontSize: "0.9rem" }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div style={{
              padding: "0.5rem 0.5rem",
              borderRadius: "8px",
              textAlign: "center",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem"
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#43A047" }} />
                <span style={{ color: "#43A047", fontWeight: "600", fontSize: "0.85rem" }}>Ready to cook?</span>
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    background: "#43A047",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "30px",
                    border: "none",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Connect Wallet
                </button>
                <ConnectModal
                  open={modalOpen}
                  onOpenChange={(isOpen) => setModalOpen(isOpen)}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", height: "20px" }}>
          <div style={{ flex: 1, background: "#43A047" }} />
          <div style={{ flex: 1, background: "#E53935" }} />
          <div style={{ flex: 1, background: "#43A047" }} />
        </div>
      </div>
    )
  }

  const handleCook = () => {
    // Validate all pizzas have complete data
    const allPizzasValid = pizzas.every(pizza => {
      const values = [pizza.pepperoni, pizza.sausage, pizza.cheese, pizza.onion, pizza.chives]
      return values.every(v => v !== "" && !isNaN(Number(v)))
    })

    if (allPizzasValid && pizzas.length > 0 && currentAccount?.address) {
      // Create arrays for each topping from all pizzas
      const pepperoniAmounts = pizzas.map(p => Number(p.pepperoni))
      const sausageAmounts = pizzas.map(p => Number(p.sausage))
      const cheeseAmounts = pizzas.map(p => Number(p.cheese))
      const onionAmounts = pizzas.map(p => Number(p.onion))
      const chivesAmounts = pizzas.map(p => Number(p.chives))

      // Use recipientAddress if provided, otherwise use current account address
      const recipient = recipientAddress.trim() || currentAccount.address

      actions.cook(
        recipient,
        pepperoniAmounts,
        sausageAmounts,
        cheeseAmounts,
        onionAmounts,
        chivesAmounts
      )
    }
  }

  // Add a new pizza to the list
  const addPizza = () => {
    setPizzas([...pizzas, { id: crypto.randomUUID(), pepperoni: "", sausage: "", cheese: "", onion: "", chives: "" }])
    setSelectedPizzaIndex(pizzas.length) // Select the newly added pizza
  }

  // Remove a pizza from the list
  const removePizza = (index: number) => {
    if (pizzas.length === 1) return // Don't remove the last pizza
    const newPizzas = pizzas.filter((_, i) => i !== index)
    setPizzas(newPizzas)
    // Adjust selected index if needed
    if (selectedPizzaIndex >= newPizzas.length) {
      setSelectedPizzaIndex(newPizzas.length - 1)
    }
  }

  // Update a specific pizza's topping
  const updatePizzaTopping = (index: number, topping: keyof Omit<Pizza, 'id'>, value: string) => {
    const newPizzas = [...pizzas]
    newPizzas[index] = { ...newPizzas[index], [topping]: value }
    setPizzas(newPizzas)
  }

  // Connected state - Pizza builder
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#FFF8E1",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative shapes */}
      <div style={{ position: "absolute", top: "8%", left: "5%", width: "80px", height: "80px", borderRadius: "50%", background: "#FFCA28", opacity: 0.4 }} />
      <div style={{ position: "absolute", top: "20%", right: "8%", width: "50px", height: "50px", borderRadius: "50%", background: "#43A047", opacity: 0.3 }} />
      <div style={{ position: "absolute", bottom: "25%", left: "10%", width: "40px", height: "40px", borderRadius: "50%", background: "#E53935", opacity: 0.25 }} />
      <div style={{ position: "absolute", bottom: "15%", right: "12%", width: "60px", height: "60px", borderRadius: "50%", background: "#FFCA28", opacity: 0.35 }} />

      {/* Header */}
      <div style={{
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        zIndex: 1
      }}>
        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: "800",
          color: "#E53935",
          margin: 0
        }}>
          Pack a Pizza
        </h1>
        <span style={{
          color: "#43A047",
          fontSize: "0.75rem",
          fontWeight: "600",
          letterSpacing: "1px"
        }}>
          POWERED BY IOTA
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={() => setShowMyPizzaBoxes(true)}
            style={{
              background: "#E8B86D",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "30px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            My Pizza Box
          </button>
          <button
            onClick={() => disconnectWallet()}
            style={{
              background: "#43A047",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "30px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {`Disconnect (${currentAccount?.address.slice(0, 6)}...${currentAccount?.address.slice(-4)})`}
          </button>
        </div>
        <ConnectModal
          open={modalOpen}
          onOpenChange={(isOpen) => setModalOpen(isOpen)}
        />
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem 2rem",
        position: "relative",
        zIndex: 1
      }}>
        {!objectId ? (
          // Pizza Builder - 2 Column Layout
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
            maxWidth: "900px",
            width: "100%",
            alignItems: "center"
          }}>
            {/* Left Column - Form */}
            <div style={{
              background: "white",
              padding: "2rem",
              borderRadius: "16px",
              border: "2px solid #E53935"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem"
              }}>
                <h2 style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  color: "#333",
                  margin: 0
                }}>
                  Build Your Pizzas
                </h2>
                <div style={{
                  background: "#E8B86D",
                  color: "white",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: "600"
                }}>
                  {pizzas.length} Pizza{pizzas.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Pizza Tabs */}
              <div style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
                maxHeight: "120px",
                overflowY: "auto",
                padding: "0.25rem"
              }}>
                {pizzas.map((pizza, index) => (
                  <div key={pizza.id} style={{ position: "relative" }}>
                    <button
                      onClick={() => setSelectedPizzaIndex(index)}
                      style={{
                        background: selectedPizzaIndex === index ? "#E53935" : "#F5F5F5",
                        color: selectedPizzaIndex === index ? "white" : "#333",
                        border: selectedPizzaIndex === index ? "2px solid #E53935" : "2px solid #E0E0E0",
                        padding: "0.5rem 2rem 0.5rem 0.75rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        transition: "all 0.2s"
                      }}
                    >
                      #{index + 1}
                    </button>
                    {pizzas.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removePizza(index)
                        }}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          background: selectedPizzaIndex === index ? "rgba(255,255,255,0.3)" : "#E53935",
                          color: selectedPizzaIndex === index ? "white" : "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addPizza}
                  style={{
                    background: "#43A047",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem"
                  }}
                >
                  + Add Pizza
                </button>
              </div>

              {/* Topping Inputs for Selected Pizza */}
              <div style={{
                background: "#FAFAFA",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem"
              }}>
                <div style={{
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#E53935",
                  marginBottom: "0.75rem"
                }}>
                  Customize Pizza #{selectedPizzaIndex + 1}
                </div>
                {[
                  { label: "Pepperoni", key: "pepperoni" as const, color: "#C62828" },
                  { label: "Sausage", key: "sausage" as const, color: "#8D6E63" },
                  { label: "Cheese", key: "cheese" as const, color: "#FFCA28" },
                  { label: "Onion", key: "onion" as const, color: "#9E9E9E" },
                  { label: "Chives", key: "chives" as const, color: "#43A047" }
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: "0.75rem" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem"
                    }}>
                      <div style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: item.color
                      }} />
                      <Text size="2" style={{ fontWeight: "600", color: "#333" }}>{item.label}</Text>
                      <Text size="1" style={{ color: "#999" }}>(0-30)</Text>
                    </div>
                    <TextField.Root
                      value={currentPizza[item.key]}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === "") {
                          updatePizzaTopping(selectedPizzaIndex, item.key, "")
                          return
                        }
                        const num = parseInt(value)
                        if (!isNaN(num) && num >= 0 && num <= 30) {
                          updatePizzaTopping(selectedPizzaIndex, item.key, value)
                        }
                      }}
                      placeholder="0"
                      type="number"
                      min="0"
                      max="30"
                      style={{ width: "100%" }}
                    />
                  </div>
                ))}
              </div>

              {/* Recipient Address Input */}
              <div style={{
                background: "#FAFAFA",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem"
              }}>
                <div style={{
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  color: "#43A047",
                  marginBottom: "0.75rem"
                }}>
                  Recipient Address (Optional)
                </div>
                <Text size="1" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                  Leave empty to send to yourself
                </Text>
                <TextField.Root
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder={currentAccount?.address || "Enter IOTA address"}
                  style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem" }}
                />
              </div>

              <button
                onClick={handleCook}
                disabled={state.isPending || !pizzas.every(p => {
                  const values = [p.pepperoni, p.sausage, p.cheese, p.onion, p.chives]
                  return values.every(v => v !== "" && !isNaN(Number(v)))
                })}
                style={{
                  width: "100%",
                  background: state.isPending ? "#999" : "#E53935",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "30px",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "1rem",
                  cursor: state.isPending ? "not-allowed" : "pointer",
                  marginTop: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                {state.isPending ? (
                  <>
                    <ClipLoader size={16} color="white" />
                    Cooking...
                  </>
                ) : (
                  "Cook & Pack"
                )}
              </button>

              {state.error && (
                <div style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  background: "#FFEBEE",
                  borderRadius: "8px",
                  border: "1px solid #E53935"
                }}>
                  <Text size="2" style={{ color: "#C62828" }}>
                    {(state.error as Error)?.message || String(state.error)}
                  </Text>
                </div>
              )}
            </div>

            {/* Right Column - Pizza Preview */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "420px",
              position: "relative"
            }}>
              {/* Pizza container - fixed position */}
              <div style={{
                position: "absolute",
                top: "42%",
                left: "50%",
                transform: "translate(-50%, -50%)"
              }}>
                <DynamicPizzaSVG />
              </div>
              {/* Topping pills - fixed at bottom */}
              <div style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                right: "0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                minHeight: "50px"
              }}>
                <div style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#E53935"
                }}>
                  Pizza #{selectedPizzaIndex + 1}
                </div>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}>
                  {[
                    { label: "Pepperoni", count: currentPizza?.pepperoni, color: "#C62828" },
                    { label: "Sausage", count: currentPizza?.sausage, color: "#8D6E63" },
                    { label: "Cheese", count: currentPizza?.cheese, color: "#FFCA28" },
                    { label: "Onion", count: currentPizza?.onion, color: "#9E9E9E" },
                    { label: "Chives", count: currentPizza?.chives, color: "#43A047" }
                  ].filter(item => Number(item.count) > 0).map((item, i) => (
                    <div key={i} style={{
                      background: item.color,
                      padding: "0.25rem 0.75rem",
                      borderRadius: "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}>
                      <span style={{ color: "white", fontSize: "0.75rem", fontWeight: "600" }}>
                        {item.label}: {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Pizza Box Created View
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
            maxWidth: "900px",
            width: "100%",
            alignItems: "center"
          }}>
            {/* Left Column - Info */}
            <div style={{
              background: "white",
              padding: "2rem",
              borderRadius: "16px",
              border: "2px solid #43A047"
            }}>
              {state.isLoading && !data ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <ClipLoader size={32} color="#43A047" />
                  <Text style={{ display: "block", marginTop: "1rem", color: "#666" }}>Loading PizzaBox...</Text>
                </div>
              ) : state.error ? (
                <div>
                  <h2 style={{ color: "#C62828", margin: "0 0 1rem 0" }}>Error Loading PizzaBox</h2>
                  <Text size="2" style={{ color: "#666", display: "block", marginBottom: "1rem" }}>
                    {state.error.message || "Object not found or invalid"}
                  </Text>
                  <Text size="1" style={{ color: "#999", display: "block", marginBottom: "1rem", wordBreak: "break-all" }}>
                    ID: {objectId}
                  </Text>
                  <button
                    onClick={() => {
                      actions.clearObject()
                      // Reset all state
                      setPizzas([
                        { id: crypto.randomUUID(), pepperoni: "", sausage: "", cheese: "", onion: "", chives: "" }
                      ])
                      setSelectedPizzaIndex(0)
                      setPizzaboxId("")
                      setShowMyPizzaBoxes(false)
                      setMyPizzaBoxes([])
                      setSelectedPizzaBox(null)
                      setRecipientAddress("")
                    }}
                    style={{
                      background: "#E53935",
                      color: "white",
                      padding: "0.5rem 1rem",
                      borderRadius: "30px",
                      border: "none",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Cook New Pizza
                  </button>
                </div>
              ) : data ? (
                <div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem"
                  }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#43A047" }} />
                    <h2 style={{ margin: 0, color: "#43A047", fontSize: "1.25rem", fontWeight: "600" }}>Pizza delivered!</h2>
                  </div>

                  <div style={{
                    background: "#F5F5F5",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginBottom: "1rem"
                  }}>
                    <Text size="1" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>Object ID</Text>
                    <Text size="2" style={{ color: "#333", wordBreak: "break-all", fontFamily: "monospace" }}>{objectId}</Text>
                  </div>

                  <div style={{
                    background: "#F5F5F5",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginBottom: "1rem"
                  }}>
                    <Text size="1" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>Owner</Text>
                    <Text size="2" style={{ color: "#333", wordBreak: "break-all", fontFamily: "monospace" }}>{data.owner}</Text>
                  </div>

                  {isOwner && (
                    <div style={{ marginTop: "1.5rem" }}>
                      <button
                        onClick={() => {
                          actions.clearObject()
                          // Reset all state
                          setPizzas([
                            { id: crypto.randomUUID(), pepperoni: "", sausage: "", cheese: "", onion: "", chives: "" }
                          ])
                          setSelectedPizzaIndex(0)
                          setPizzaboxId("")
                          setShowMyPizzaBoxes(false)
                          setMyPizzaBoxes([])
                          setSelectedPizzaBox(null)
                        }}
                        style={{
                          background: "transparent",
                          color: "#E53935",
                          padding: "0.5rem 1rem",
                          borderRadius: "30px",
                          border: "2px solid #E53935",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Cook New
                      </button>
                    </div>
                  )}

                  {state.hash && (
                    <div style={{
                      marginTop: "1rem",
                      padding: "1rem",
                      background: state.isConfirmed ? "#E8F5E9" : "#FFF8E1",
                      borderRadius: "8px",
                      border: `1px solid ${state.isConfirmed ? "#43A047" : "#FFCA28"}`
                    }}>
                      <Text size="1" style={{ display: "block", marginBottom: "0.5rem", color: "#666" }}>Transaction Hash</Text>
                      <Text size="2" style={{ fontFamily: "monospace", wordBreak: "break-all", color: "#333" }}>{state.hash}</Text>
                      {state.isConfirmed && (
                        <Text size="2" style={{ color: "#43A047", marginTop: "0.5rem", display: "block", fontWeight: "600" }}>
                          Confirmed!
                        </Text>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h2 style={{ color: "#F9A825", margin: "0 0 1rem 0" }}>PizzaBox Not Found</h2>
                  <Text size="1" style={{ color: "#999", display: "block", marginBottom: "1rem", wordBreak: "break-all" }}>
                    ID: {objectId}
                  </Text>
                  <button
                    onClick={() => {
                      actions.clearObject()
                      // Reset all state
                      setPizzas([
                        { id: crypto.randomUUID(), pepperoni: "", sausage: "", cheese: "", onion: "", chives: "" }
                      ])
                      setSelectedPizzaIndex(0)
                      setPizzaboxId("")
                      setShowMyPizzaBoxes(false)
                      setMyPizzaBoxes([])
                      setSelectedPizzaBox(null)
                      setRecipientAddress("")
                    }}
                    style={{
                      background: "#E53935",
                      color: "white",
                      padding: "0.5rem 1rem",
                      borderRadius: "30px",
                      border: "none",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Cook New Pizza
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Pizza Box Visual */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem"
            }}>
              <PizzaBoxSVG />
              <div style={{
                background: "#43A047",
                padding: "0.5rem 1.5rem",
                borderRadius: "30px"
              }}>
                <span style={{ color: "white", fontWeight: "600" }}>Packed & Ready!</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer stripe */}
      <div style={{ display: "flex", height: "20px" }}>
        <div style={{ flex: 1, background: "#43A047" }} />
        <div style={{ flex: 1, background: "#E53935" }} />
        <div style={{ flex: 1, background: "#43A047" }} />
      </div>

      {/* My Pizza Box Modal */}
      {showMyPizzaBoxes && (
        <div
          onClick={() => {
            setShowMyPizzaBoxes(false)
            setSelectedPizzaBox(null)
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "16px",
              maxWidth: "1000px",
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              padding: "2rem",
              position: "relative"
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowMyPizzaBoxes(false)
                setSelectedPizzaBox(null)
              }}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "#E53935",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                fontSize: "1.2rem",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ×
            </button>

            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#E53935",
              marginBottom: "1.5rem",
              marginTop: 0
            }}>
              {selectedPizzaBox ? "Pizza Box Details" : "My Pizza Boxes"}
            </h2>

            {selectedPizzaBox ? (
              // Show selected pizza box details
              <div>
                <button
                  onClick={() => setSelectedPizzaBox(null)}
                  style={{
                    background: "#43A047",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "30px",
                    border: "none",
                    fontWeight: "600",
                    cursor: "pointer",
                    marginBottom: "1rem"
                  }}
                >
                  ← Back to List
                </button>

                <div style={{
                  background: "#F5F5F5",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1.5rem"
                }}>
                  <Text size="1" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                    Pizza Box ID
                  </Text>
                  <Text size="2" style={{ color: "#333", wordBreak: "break-all", fontFamily: "monospace" }}>
                    {selectedPizzaBox.id}
                  </Text>
                </div>

                <h3 style={{ color: "#333", marginBottom: "1rem" }}>
                  Pizzas ({selectedPizzaBox.pizzas.length})
                </h3>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "1rem"
                }}>
                  {selectedPizzaBox.pizzas.map((pizza, idx) => {
                    console.log(`Pizza #${idx + 1}:`, selectedPizzaBox)
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "#FFF8E1",
                          padding: "1rem",
                          borderRadius: "12px",
                          border: "2px solid #E8B86D",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}
                      >
                        <div style={{ fontWeight: "600", color: "#E53935" }}>
                          Pizza #{idx + 1}
                        </div>
                        <StaticPizzaSVG pizza={pizza} size={150} />
                        <div style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.25rem",
                          justifyContent: "center"
                        }}>

                          {[
                            { label: "Pepperoni", count: pizza.pepperoni, color: "#C62828" },
                            { label: "Sausage", count: pizza.sausage, color: "#8D6E63" },
                            { label: "Cheese", count: pizza.cheese, color: "#FFCA28" },
                            { label: "Onion", count: pizza.onion, color: "#9E9E9E" },
                            { label: "Chives", count: pizza.chives, color: "#43A047" }
                          ]
                            .filter(item => item.count > 0)
                            .map((item, i) => (
                              <div
                                key={i}
                                style={{
                                  background: item.color,
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "12px",
                                  fontSize: "0.65rem",
                                  fontWeight: "600",
                                  color: "white"
                                }}
                              >
                                {item.label}: {item.count}
                              </div>
                            ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              // Show list of pizza boxes
              <div>
                {loadingPizzaBoxes ? (
                  <div style={{ textAlign: "center", padding: "2rem" }}>
                    <ClipLoader size={32} color="#43A047" />
                    <Text style={{ display: "block", marginTop: "1rem", color: "#666" }}>
                      Loading your pizza boxes...
                    </Text>
                  </div>
                ) : myPizzaBoxes.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "3rem",
                    color: "#999"
                  }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
                    <Text size="3" style={{ display: "block", marginBottom: "0.5rem" }}>
                      No pizza boxes yet
                    </Text>
                    <Text size="2" style={{ color: "#999" }}>
                      Cook your first pizza to get started!
                    </Text>
                  </div>
                ) : (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                    gap: "1rem"
                  }}>
                    {myPizzaBoxes.map((box, idx) => (
                      <div
                        key={box.id}
                        onClick={() => setSelectedPizzaBox(box)}
                        style={{
                          background: "#FFF8E1",
                          padding: "1.5rem",
                          borderRadius: "12px",
                          border: "2px solid #E8B86D",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.75rem"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)"
                          e.currentTarget.style.borderColor = "#E53935"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)"
                          e.currentTarget.style.borderColor = "#E8B86D"
                        }}
                      >
                        <div style={{
                          fontWeight: "700",
                          color: "#E53935",
                          fontSize: "1.1rem"
                        }}>
                          Pizza Box #{idx + 1}
                        </div>
                        <PizzaBoxSVG />
                        <div style={{
                          background: "#43A047",
                          color: "white",
                          padding: "0.5rem 1rem",
                          borderRadius: "20px",
                          fontSize: "0.9rem",
                          fontWeight: "600"
                        }}>
                          {box.pizzas.length} Pizza{box.pizzas.length !== 1 ? "s" : ""}
                        </div>
                        <Text
                          size="1"
                          style={{
                            color: "#999",
                            wordBreak: "break-all",
                            fontFamily: "monospace",
                            textAlign: "center"
                          }}
                        >
                          {box.id.slice(0, 8)}...{box.id.slice(-6)}
                        </Text>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SampleIntegration
