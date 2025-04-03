/* eslint-disable react/prop-types */
"use client"

import axios from "axios"
import { lazy, memo, useCallback, useEffect, useRef, useState, Suspense } from "react"
import isEqual from "react-fast-compare"
import { server } from "../../constants/config"
import { betSelectionEvent } from "./bet-selection-event"

const BetSlip = lazy(() => import("../BetSlip"))

// Add a BetSlip placeholder to prevent layout shifts
const BetSlipPlaceholder = () => (
  <div className="lg:hidden w-full border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background-lighter))] h-[200px] flex items-center justify-center">
    <div className="animate-pulse text-[rgb(var(--color-text-muted))]">Loading bet slip...</div>
  </div>
)

const MarketComponent = ({ data, marginAgain, eventId, onBetSelect, title = "Market", betPlaced, setStake }) => {
  const [selectedBet, setSelectedBet] = useState(null)
  const [margin, setMargin] = useState(null)

  const prevDataRef = useRef()

  useEffect(() => {
    if (prevDataRef.current) {
      const newlySuspended = data.filter(
        (market) =>
          market.odds?.status === "SUSPENDED" &&
          prevDataRef.current.find(
            (prevMarket) => prevMarket.market.id === market.market.id && prevMarket.odds?.status !== "SUSPENDED",
          ),
      )
      if (newlySuspended.length > 0) {
        newlySuspended.forEach((market) => {
          market.lastUpdated = new Date().toISOString()
        })
      }
    }
    prevDataRef.current = data
  }, [data])

  // Listen for bet selection events from other components
  useEffect(() => {
    const cleanup = betSelectionEvent.listen((event) => {
      const { source } = event.detail
      if (source !== "market") {
        // Clear selection if another component selected a bet
        setSelectedBet(null)
      }
    })

    return cleanup
  }, [])

  const handleOddsClick = (market, odds, type, price, size) => {
    // Save current scroll position
    const scrollPosition = window.scrollY

    // If clicking on the same odd, toggle it off
    if (
      selectedBet &&
      selectedBet.marketId === market.market?.id &&
      selectedBet.fancyNumber === price &&
      selectedBet.type === type.toLowerCase()
    ) {
      setSelectedBet(null)
      onBetSelect(null)
      return
    }

    // Notify other components that a bet was selected here
    betSelectionEvent.dispatch("market")

    const betData = {
      home_team: market.eventDetails?.runners?.[0]?.name || "Fancy",
      away_team: market.eventDetails?.runners?.[1]?.name || "Fancy",
      eventId: market.eventId || "",
      marketId: market.market?.id || "",
      selectionId: odds?.selectionId || null,
      fancyNumber: price || 0,
      stake: 0,
      odds: size || 0,
      category: "fancy",
      type: type.toLowerCase(),
      gameId: market.market?.id || "",
      eventName: market.market?.name || "Unknown Market",
      selectedTeam: market.market?.name || "Unknown Market",
      betType: type,
      size: size,
    }
    setSelectedBet(betData)
    onBetSelect(betData)

    // Restore scroll position after a short delay to let the DOM update
    setTimeout(() => {
      window.scrollTo({
        top: scrollPosition,
        behavior: "auto",
      })
    }, 0)
  }

  const renderOddsBox = (odds, market, type) => {
    if (!odds) {
      return (
        <div
          className={`w-full sm:w-12 lg:min-w-[100px] min-w-[70px] md:w-16 h-10 ${
            type === "Back" ? "bg-[rgb(var(--back-odd))]" : "bg-[rgb(var(--lay-odd))]"
          } rounded flex items-center justify-center`}
        >
          <span className="text-[rgb(var(--color-text-muted))] text-xs">-</span>
        </div>
      )
    }
    const isActive = odds && odds.price > 0 && odds.size > 0

    // Check if this odd is selected
    const isSelected =
      selectedBet &&
      selectedBet.marketId === market.market?.id &&
      selectedBet.fancyNumber === odds.price &&
      selectedBet.type === type.toLowerCase()

    return (
      <button
        className={`w-full sm:w-12 lg:min-w-[100px] min-w-[70px] md:w-16 h-10 ${
          isSelected
            ? type === "Back"
              ? "bg-[#0077B3]"
              : "bg-[#FF4D55]"
            : type === "Back"
              ? isActive
                ? "bg-[rgb(var(--back-odd))] hover:bg-[rgb(var(--back-odd-hover))]"
                : "bg-[#00b3ff36]"
              : isActive
                ? "bg-[rgb(var(--lay-odd))] hover:bg-[rgb(var(--lay-odd-hover))]"
                : "bg-[#ff7a7e42]"
        } rounded flex flex-col items-center justify-center transition-colors`}
        onClick={() => isActive && handleOddsClick(market, odds, type, odds.price, odds.size)}
        disabled={!isActive}
      >
        {isActive ? (
          <>
            <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-black"}`}>
              {odds.price.toFixed(2)}
            </span>
            <span className={`text-xs ${isSelected ? "text-white" : "text-black"}`}>{Math.floor(odds.size)}</span>
          </>
        ) : (
          <span className="text-red-500 font-semibold text-xs">Suspended</span>
        )}
      </button>
    )
  }

  const sortMarkets = (markets) => {
    const activeMarkets = markets.filter((market) => market.odds?.status !== "SUSPENDED")
    const suspendedMarkets = markets
      .filter((market) => market.odds?.status === "SUSPENDED")
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    return [...activeMarkets, ...suspendedMarkets.slice(0, 5)]
  }

  const getMargins = useCallback(
    async (token) => {
      try {
        const response = await axios.get(`${server}api/v1/bet/fancy-exposure?eventId=${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.data.success) {
          setMargin(response.data.marketExposure)
        }
      } catch (error) {
        console.error("Error fetching margins:", error.response?.data || error.message)
      }
    },
    [eventId],
  )

  const getFancyMarketMargin = useCallback(
    (marketId) => {
      if (!margin || typeof margin !== "object") return null

      // Directly return the exposure value if it exists for this market
      return margin[marketId] || null
    },
    [margin],
  )
  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (token) {
      getMargins(token)
    }
  }, [getMargins, marginAgain])

  if (!Array.isArray(data)) {
    return <div className="text-[rgb(var(--color-text-primary))]">No {title.toLowerCase()} data available</div>
  }

  return (
    <div className="space-y-0 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg overflow-hidden mt-2">
      {/* Header remains the same */}
      <div className="flex flex-row sm:flex-nowrap justify-between items-center p-3 bg-[rgb(var(--color-background))] border-b border-[rgb(var(--color-border))]">
        <div>
          <h3 className="text-[rgb(var(--color-text-primary))] font-medium w-full sm:w-auto mb-2 sm:mb-0">{title}</h3>
        </div>
        <div className="flex flex-row sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end sm:justify-end">
          <span className="text-xs sm:text-sm bg-[rgb(var(--lay-odd))] w-full text-center max-w-[70px] lg:min-w-[100px] sm:w-20 text-[rgb(var(--color-text-primary))] py-1 rounded font-semibold">
            No
          </span>
          <span className="text-xs bg-[rgb(var(--back-odd))] sm:text-sm text-center w-full max-w-[70px] lg:min-w-[100px] sm:w-20 text-[rgb(var(--color-text-primary))] py-1 rounded font-semibold">
            Yes
          </span>
        </div>
      </div>
      {sortMarkets(data)?.map((market, index) => {
        return (
          <div key={`${market.market?.id || index}`} className="border-b border-[rgb(var(--color-border))]">
            <div className="flex items-center justify-between p-3">
              <div className="flex flex-col gap-1">
                <span className="text-[rgb(var(--color-text-primary))] text-sm">
                  {market.market?.name || "Unknown Market"}
                </span>
                {market.market?.id && (
                  <span className="text-xs text-red-500 font-medium">
                    {getFancyMarketMargin(market.market.id) !== null ? `${getFancyMarketMargin(market.market.id)}` : ""}
                  </span>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <div className="flex gap-2">
                  {renderOddsBox(market.odds?.lay?.[0], market, "Lay")}
                  {renderOddsBox(market.odds?.back?.[0], market, "Back")}
                </div>
              </div>
            </div>
            {selectedBet && selectedBet.marketId === market.market.id && (
              <div className="lg:hidden">
                <Suspense fallback={<BetSlipPlaceholder />}>
                  <BetSlip
                    match={selectedBet}
                    onClose={() => {
                      setSelectedBet(null)
                      onBetSelect(null)
                    }}
                    setStake={setStake}
                    betPlaced={betPlaced}
                  />
                </Suspense>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const arePropsEqual = (prevProps, nextProps) => {
  return (
    isEqual(prevProps.data, nextProps.data) &&
    prevProps.onBetSelect === nextProps.onBetSelect &&
    prevProps.title === nextProps.title &&
    prevProps.type === nextProps.type
  )
}

const Market = memo(MarketComponent, arePropsEqual)
Market.displayName = "Market"

export default Market

