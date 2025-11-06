"use client"

import { useEffect, useState } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { formatEther, parseEther } from "viem"
import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi"

import {
  AI_TOKEN_ABI,
  CONTRACT_ADDRESSES,
  HANZO_REGISTRY_ABI,
  NETWORK_NAMES,
} from "@/lib/contracts"
import { Alert, AlertDescription } from "@/registry/default/ui/alert"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import { Separator } from "@/registry/default/ui/separator"

export default function IdentityPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [identityName, setIdentityName] = useState("")
  const [referrer, setReferrer] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"input" | "approve" | "claim">("input")

  const contracts = CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[36963]
  const networkName = NETWORK_NAMES[chainId] || "hanzo"

  // Validate identity name
  const validateName = (name: string): boolean => {
    return /^[a-zA-Z0-9_\.]+$/.test(name)
  }

  // Calculate stake requirement
  const { data: stakeRequirement } = useReadContract({
    address: contracts.registry,
    abi: HANZO_REGISTRY_ABI,
    functionName: "identityStakeRequirement",
    args: [identityName, BigInt(chainId), referrer.length > 0],
    query: {
      enabled: identityName.length > 0 && validateName(identityName),
    },
  })

  // Check if identity is available
  const { data: isAvailable } = useReadContract({
    address: contracts.registry,
    abi: HANZO_REGISTRY_ABI,
    functionName: "identityAvailable",
    args: [identityName, BigInt(chainId)],
    query: {
      enabled: identityName.length > 0 && validateName(identityName),
    },
  })

  // Check AI token balance
  const { data: aiBalance } = useReadContract({
    address: contracts.token,
    abi: AI_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Check allowance
  const { data: allowance } = useReadContract({
    address: contracts.token,
    abi: AI_TOKEN_ABI,
    functionName: "allowance",
    args: address ? [address, contracts.registry] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Approve tokens
  const {
    data: approveHash,
    isPending: isApprovePending,
    writeContract: approve,
  } = useWriteContract()

  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Claim identity
  const {
    data: claimHash,
    isPending: isClaimPending,
    writeContract: claim,
  } = useWriteContract()

  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } =
    useWaitForTransactionReceipt({
      hash: claimHash,
    })

  // Handle approve
  const handleApprove = async () => {
    if (!stakeRequirement) return

    try {
      setError(null)
      approve({
        address: contracts.token,
        abi: AI_TOKEN_ABI,
        functionName: "approve",
        args: [contracts.registry, stakeRequirement],
      })
      setStep("claim")
    } catch (err: any) {
      setError(err.message || "Failed to approve tokens")
    }
  }

  // Handle claim identity
  const handleClaimIdentity = async () => {
    if (!address || !stakeRequirement) return

    try {
      setError(null)
      claim({
        address: contracts.registry,
        abi: HANZO_REGISTRY_ABI,
        functionName: "claimIdentity",
        args: [
          {
            name: identityName,
            namespace: BigInt(chainId),
            stakeAmount: stakeRequirement,
            owner: address,
            referrer: referrer,
          },
        ],
      })
    } catch (err: any) {
      setError(err.message || "Failed to claim identity")
    }
  }

  // Get pricing tier info
  const getPricingTier = () => {
    const length = identityName.length
    if (length === 1) return { price: "100,000 AI", tier: "Single Character" }
    if (length === 2) return { price: "10,000 AI", tier: "Two Characters" }
    if (length === 3) return { price: "1,000 AI", tier: "Three Characters" }
    if (length === 4) return { price: "100 AI", tier: "Four Characters" }
    return { price: "10 AI", tier: "Standard (5+ chars)" }
  }

  const pricingInfo = getPricingTier()
  const hasEnoughBalance =
    aiBalance && stakeRequirement ? aiBalance >= stakeRequirement : false
  const needsApproval =
    allowance && stakeRequirement ? allowance < stakeRequirement : true
  const canProceed =
    isConnected &&
    identityName.length > 0 &&
    validateName(identityName) &&
    isAvailable &&
    hasEnoughBalance

  // Reset on success
  useEffect(() => {
    if (isClaimSuccess) {
      setIdentityName("")
      setReferrer("")
      setStep("input")
    }
  }, [isClaimSuccess])

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Register Identity</h1>
        <p className="text-muted-foreground">
          Claim your unique identity across Hanzo, Lux, and Zoo networks
        </p>
      </div>

      <div className="grid gap-6">
        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to register an identity on {networkName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectButton />

            {isConnected && aiBalance !== undefined && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  AI Balance:{" "}
                  <span className="font-mono font-semibold">
                    {formatEther(aiBalance)} AI
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Identity Registration Form */}
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Identity Details</CardTitle>
              <CardDescription>
                Choose your unique identity name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="identity">Identity Name</Label>
                <div className="flex gap-2 items-center">
                  <span className="text-lg font-mono">@</span>
                  <Input
                    id="identity"
                    placeholder="username"
                    value={identityName}
                    onChange={(e) =>
                      setIdentityName(e.target.value.toLowerCase())
                    }
                    className="font-mono"
                  />
                  <span className="text-lg font-mono">.{networkName}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Letters, numbers, dots, and underscores only
                </p>

                {identityName.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {validateName(identityName) ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Valid format
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200"
                      >
                        Invalid format
                      </Badge>
                    )}

                    {isAvailable !== undefined &&
                      validateName(identityName) && (
                        <Badge
                          variant="outline"
                          className={
                            isAvailable
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {isAvailable ? "Available" : "Taken"}
                        </Badge>
                      )}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="referrer">Referrer (Optional)</Label>
                <Input
                  id="referrer"
                  placeholder="@referrer.hanzo"
                  value={referrer}
                  onChange={(e) => setReferrer(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Get 50% discount with a valid referrer
                </p>
              </div>

              <Separator />

              {/* Pricing Display */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Pricing Tier:
                  </span>
                  <span className="text-sm font-semibold">
                    {pricingInfo.tier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Base Price:
                  </span>
                  <span className="text-sm font-semibold">
                    {pricingInfo.price}
                  </span>
                </div>
                {referrer && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm">Referrer Discount:</span>
                    <span className="text-sm font-semibold">-50%</span>
                  </div>
                )}
                {stakeRequirement && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Stake:</span>
                      <span className="font-mono font-bold text-lg">
                        {formatEther(stakeRequirement)} AI
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Errors */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Insufficient balance warning */}
              {!hasEnoughBalance && stakeRequirement && (
                <Alert>
                  <AlertDescription>
                    Insufficient AI balance. You need{" "}
                    {formatEther(stakeRequirement)} AI but only have{" "}
                    {formatEther(aiBalance || 0n)} AI.
                    <br />
                    <a
                      href="/faucet"
                      className="underline font-semibold mt-1 inline-block"
                    >
                      Get AI tokens from the faucet
                    </a>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success message */}
              {isClaimSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-700">
                    Identity @{identityName}.{networkName} successfully
                    registered!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2">
              {needsApproval && canProceed && (
                <Button
                  onClick={handleApprove}
                  disabled={
                    !canProceed || isApprovePending || isApproveConfirming
                  }
                  className="w-full"
                >
                  {isApprovePending || isApproveConfirming
                    ? "Approving..."
                    : "Approve AI Tokens"}
                </Button>
              )}

              {!needsApproval && canProceed && (
                <Button
                  onClick={handleClaimIdentity}
                  disabled={!canProceed || isClaimPending || isClaimConfirming}
                  className="w-full"
                >
                  {isClaimPending || isClaimConfirming
                    ? "Claiming..."
                    : `Claim Identity (${formatEther(stakeRequirement || 0n)} AI)`}
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        {/* Pricing Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Tiers</CardTitle>
            <CardDescription>
              Identity registration pricing based on name length
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">
                  Single character (1)
                </span>
                <span className="font-mono font-semibold">100,000 AI</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">
                  Two characters (2)
                </span>
                <span className="font-mono font-semibold">10,000 AI</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">
                  Three characters (3)
                </span>
                <span className="font-mono font-semibold">1,000 AI</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">
                  Four characters (4)
                </span>
                <span className="font-mono font-semibold">100 AI</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Five or more (5+)</span>
                <span className="font-mono font-semibold">10 AI</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Referrer Bonus:</strong> Use a valid referrer to get
                50% off the registration price!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
