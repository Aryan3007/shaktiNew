"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { server } from "../../constants/config"

export default function MyWithdrawls() {
  const [withdrawalHistory, setWithdrawalHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch withdrawal history
  const fetchWithdrawalHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await axios.get(`${server}api/v1/payment/user-withdrawal-history`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        setWithdrawalHistory(response.data.history || [])
      } else {
        throw new Error(response.data.message || "Failed to fetch withdrawal history")
      }
    } catch (err) {
      console.error("Error fetching withdrawal history:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      toast.error("Failed to load withdrawal history")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWithdrawalHistory()
  }, [fetchWithdrawalHistory, refreshTrigger])

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Format amount
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Capitalize first letter
  const capitalize = (str) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  return (
    <div className="space-y-6">
      {/* Withdrawal History Section */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-[rgb(var(--color-border))]">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold leading-none tracking-tight text-[rgb(var(--color-text-primary))]">
            My Withdrawal History
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--color-primary))]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md m-4">
            <p>Error: {error}</p>
            <button
              onClick={() => {
                setError(null)
                setRefreshTrigger((prev) => prev + 1)
              }}
              className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800"
            >
              Try again
            </button>
          </div>
        ) : withdrawalHistory.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md m-4">
            <p>You haven&apos;t made any withdrawal requests yet.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Bank Details
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {withdrawalHistory.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.userName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      <p>
                        <span className="font-medium">Bank:</span> {item.bankName}
                      </p>
                      <p>
                        <span className="font-medium">Account:</span> {item.accountNumber}
                      </p>
                      <p>
                        <span className="font-medium">IFSC:</span> {item.ifscCode}
                      </p>
                      <p>
                        <span className="font-medium">Holder:</span> {item.accountHolderName}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatAmount(item.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        item.status,
                      )}`}
                    >
                      {capitalize(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

