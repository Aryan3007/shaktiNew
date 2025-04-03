"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { server } from "../constants/config"

export default function DepositWithdrawal() {
  const [activeTab, setActiveTab] = useState("withdrawal")
  const [activePaymentOption, setActivePaymentOption] = useState("bank")
  const [activewithdrawloption, setactivewithdrawloption] = useState("bank")
  const [bankDetails, setBankDetails] = useState([])
  const [upiIds, setUpiIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    referenceNumber: "",
    // Withdrawal fields
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
    contact: "", // Add contact field
  })

  // Add a new state for QR code URL
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [qrCodes, setQrCodes] = useState([])

  const [upiid, setUpiId] = useState("")
  const [qrCodeAmount, setQrCodeAmount] = useState("")
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Fetch bank details
  const fetchBankDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await axios.get(`${server}api/v1/payment-details/bank-details`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        setBankDetails(response.data.bankDetails || [])
      } else {
        throw new Error(response.data.message || "Failed to fetch bank details")
      }
    } catch (err) {
      console.error("Error fetching bank details:", err)
      toast.error("Failed to load bank details")
    }
  }, [])

  // Fetch UPI details
  const fetchUpiDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await axios.get(`${server}api/v1/payment-details/upi`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        setUpiIds(response.data.upiIds || [])
      } else {
        throw new Error(response.data.message || "Failed to fetch UPI details")
      }
    } catch (err) {
      console.error("Error fetching UPI details:", err)
      toast.error("Failed to load UPI IDs")
    }
  }, [])

  const fetchQrCodes = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await axios.get(`${server}api/v1/payment-details/qrcode`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        setQrCodes(response.data.qrCodes || [])
      } else {
        throw new Error(response.data.message || "Failed to fetch QR codes")
      }
    } catch (err) {
      console.error("Error fetching QR codes:", err)
      toast.error("Failed to load QR codes")
    }
  }, [])
  // Fetch payment details on page load
  useEffect(() => {
    setIsLoading(true)
    Promise.all([fetchBankDetails(), fetchUpiDetails(), fetchQrCodes()]).finally(() => setIsLoading(false))
  }, [fetchBankDetails, fetchQrCodes, fetchUpiDetails])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handle image file upload
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Add a function to generate QR code
  const generateQRCode = async (amount) => {
    if (!amount || isNaN(amount) || Number.parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsGeneratingQR(true)
    try {
      const token = localStorage.getItem("authToken")
      const response = await axios.post(
        `${server}api/v1/payment/create`,
        { amount: Number.parseFloat(amount) },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (response.data.success) {
        setQrCodeUrl(response.data.url)
        setUpiId(response.data.upiId)
        setQrCodeAmount(amount)
        toast.success("QR code generated successfully")
      } else {
        toast.error(response.data.message || "Failed to generate QR code")
      }
    } catch (err) {
      console.error("Error generating QR code:", err)
      toast.error(err.response?.data?.message || "Failed to generate QR code")
    } finally {
      setIsGeneratingQR(false)
    }
  }

  // Handle deposit request submission
  const handleDepositSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    const amountToUse = activePaymentOption === "qr" && qrCodeUrl ? qrCodeAmount : formData.amount

    if (!amountToUse || isNaN(amountToUse) || Number.parseFloat(amountToUse) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!formData.referenceNumber.trim()) {
      toast.error("Please enter a reference number")
      return
    }

    if (!imageFile) {
      toast.error("Please upload a transaction screenshot")
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("authToken")

      // Create FormData to send file
      const formDataToSend = new FormData()
      formDataToSend.append("amount", Number.parseFloat(amountToUse))
      formDataToSend.append("referenceNumber", formData.referenceNumber)
      formDataToSend.append("image", imageFile)

      const response = await axios.post(`${server}api/v1/payment/deposit-request`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data.success) {
        toast.success("Deposit request submitted successfully")
        setFormData({
          amount: "",
          referenceNumber: "",
          accountHolderName: "",
          accountNumber: "",
          ifscCode: "",
          bankName: "",
          upiId: "",
          contact: "",
        })
        setQrCodeUrl("")
        setQrCodeAmount("")
        setImageFile(null)
        setImagePreview(null)
      } else {
        toast.error(response.data.message || "Failed to submit deposit request")
      }
    } catch (err) {
      console.error("Error submitting deposit request:", err)
      toast.error(err.response?.data?.message || "Failed to submit deposit request")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Failed to copy"))
  }

  // Validate withdrawal form based on active payment option
  const validateWithdrawalForm = () => {
    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount")
      return false
    }

    if (!formData.contact) {
      toast.error("Contact number is required")
      return false
    }

    if (activePaymentOption === "bank") {
      if (!formData.accountHolderName) {
        toast.error("Account holder name is required")
        return false
      }
      if (!formData.accountNumber) {
        toast.error("Account number is required")
        return false
      }
      if (!formData.ifscCode) {
        toast.error("IFSC code is required")
        return false
      }
      if (!formData.bankName) {
        toast.error("Bank name is required")
        return false
      }
    } else if (activePaymentOption === "upi") {
      if (!formData.upiId) {
        toast.error("UPI ID is required")
        return false
      }
      // Basic UPI ID validation
      const upiRegex = /^[\w.-]+@[\w.-]+$/
      if (!upiRegex.test(formData.upiId)) {
        toast.error("Please enter a valid UPI ID (e.g., name@bank)")
        return false
      }
    }

    return true
  }

  // Handle withdrawal request form submission
  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault()

    if (!validateWithdrawalForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("authToken")

      // Prepare data based on selected payment method
      const requestData = {
        amount: Number.parseFloat(formData.amount),
        contact: formData.contact,
        ...(activePaymentOption === "bank"
          ? {
              accountHolderName: formData.accountHolderName,
              accountNumber: formData.accountNumber,
              ifscCode: formData.ifscCode,
              bankName: formData.bankName,
            }
          : {
              upiId: formData.upiId,
            }),
      }

      const response = await axios.post(`${server}api/v1/payment/withdrawal-request`, requestData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        toast.success("Withdrawal request submitted successfully!")
        // Reset form
        setFormData({
          amount: "",
          referenceNumber: "",
          accountHolderName: "",
          accountNumber: "",
          ifscCode: "",
          bankName: "",
          upiId: "",
          contact: "",
        })
      } else {
        toast.error(response.data.message || "Failed to submit withdrawal request")
      }
    } catch (err) {
      console.error("Error submitting withdrawal request:", err)
      toast.error(err.response?.data?.message || "Failed to submit withdrawal request")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset QR code state when changing payment option
  useEffect(() => {
    setQrCodeUrl("")
    setQrCodeAmount("")
  }, [activePaymentOption])

  return (
    <div className="pt-24  p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Deposit & Withdrawal</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border border-[rgb(var(--color-border))]">
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "deposit"
                ? "text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("deposit")}
          >
            Deposit
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "withdrawal"
                ? "text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("withdrawal")}
          >
            Withdrawal
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--color-primary))]"></div>
            </div>
          ) : (
            <>
              {/* Deposit Tab */}
              {activeTab === "deposit" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-medium mb-2">Select Payment Method</h4>
                    <div className="flex flex-wrap border-b mb-4">
                      <button
                        className={`py-2 px-4 text-sm font-medium ${
                          activePaymentOption === "bank"
                            ? "text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))]"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setActivePaymentOption("bank")}
                      >
                        Bank Transfer
                      </button>
                      <button
                        className={`py-2 px-4 text-sm font-medium ${
                          activePaymentOption === "upi"
                            ? "text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))]"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setActivePaymentOption("upi")}
                      >
                        UPI
                      </button>
                      <button
                        className={`py-2 px-4 text-sm font-medium ${
                          activePaymentOption === "marchant_qr"
                            ? "text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))]"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setActivePaymentOption("marchant_qr")}
                      >
                        Merchant QR
                      </button>
                      <button
                        className={`py-2 px-4 text-sm font-medium ${
                          activePaymentOption === "qr"
                            ? "text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))]"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setActivePaymentOption("qr")}
                      >
                        QR Code
                      </button>
                    </div>

                    {/* Bank Transfer Option */}
                    {activePaymentOption === "bank" && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        {bankDetails.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No bank details available</p>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600 mb-2">
                              Please transfer the amount to the following bank account and enter the reference number
                              below:
                            </p>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {bankDetails.map((bank, index) => (
                                <div key={bank._id} className="border rounded-md p-4 bg-white">
                                  <h5 className="font-medium mb-2">Bank Account {index + 1}</h5>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Account Holder:</span>
                                      <div className="flex items-center">
                                        <span className="font-medium">{bank.accountHolderName}</span>
                                        <button
                                          onClick={() => copyToClipboard(bank.accountHolderName)}
                                          className="ml-2 text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))]"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Account Number:</span>
                                      <div className="flex items-center">
                                        <span className="font-medium">{bank.accountNumber}</span>
                                        <button
                                          onClick={() => copyToClipboard(bank.accountNumber)}
                                          className="ml-2 text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))]"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">IFSC Code:</span>
                                      <div className="flex items-center">
                                        <span className="font-medium">{bank.ifscCode}</span>
                                        <button
                                          onClick={() => copyToClipboard(bank.ifscCode)}
                                          className="ml-2 text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))]"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Bank Name:</span>
                                      <div className="flex items-center">
                                        <span className="font-medium">{bank.bankName}</span>
                                        <button
                                          onClick={() => copyToClipboard(bank.bankName)}
                                          className="ml-2 text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))]"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* UPI Option */}
                    {activePaymentOption === "upi" && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        {upiIds.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No UPI IDs available</p>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600 mb-2">
                              Please transfer the amount to any of the following UPI IDs and enter the reference number
                              below:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {upiIds.map((upi) => (
                                <div key={upi._id} className="border rounded-md p-4 bg-white">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{upi.upiId}</span>
                                    <button
                                      onClick={() => copyToClipboard(upi.upiId)}
                                      className="text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))]"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* QR Code Option */}
                    {activePaymentOption === "qr" && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="space-y-4">
                          <div className="mb-4">
                            <label htmlFor="qr-amount" className="block text-sm font-medium text-gray-700 mb-1">
                              Amount*
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="number"
                                id="qr-amount"
                                value={qrCodeAmount}
                                onChange={(e) => setQrCodeAmount(e.target.value)}
                                className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                                placeholder="Enter amount"
                                min="1"
                                step="0.01"
                              />
                              <button
                                type="button"
                                onClick={() => generateQRCode(qrCodeAmount)}
                                className="inline-flex items-center justify-center rounded-md bg-[rgb(var(--color-primary))] px-4 py-2 text-sm font-medium text-white hover:bg-[rgb(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isGeneratingQR}
                              >
                                {isGeneratingQR ? (
                                  <>
                                    <svg
                                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                    Generating...
                                  </>
                                ) : (
                                  "Generate QR Code"
                                )}
                              </button>
                            </div>
                          </div>

                          {qrCodeUrl ? (
                            <div className="flex flex-col md:flex-row items-center gap-6">
                              <div className="border rounded-md p-4 bg-white max-w-xs">
                                <img
                                  src={qrCodeUrl || "/placeholder.svg"}
                                  alt="Payment QR Code"
                                  className="max-w-full h-auto"
                                />
                              </div>
                              <div className="text-center md:text-left">
                                <p className="text-sm font-medium text-gray-700">
                                  Scan this QR code to pay {qrCodeAmount} or send directly to{" "}
                                </p>
                                <p className="text-lg font-semibold mt-1 mb-2">{upiid}</p>
                                <button
                                  onClick={() => copyToClipboard(upiid)}
                                  className="inline-flex items-center text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))]"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Copy UPI ID
                                </button>
                                <p className="text-xs text-gray-500 mt-3">
                                  After payment, enter the reference number below and submit the deposit request
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-center text-gray-500 py-4">
                              Enter an amount and click "Generate QR Code" to get a payment QR code
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {activePaymentOption === "marchant_qr" && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div>
                          {qrCodes.length === 0 ? (
                            <></>
                          ) : (
                            <>
                              <h1 className="text-xl font-bold pb-2">
                                Pay on any of the QR and submit Deposite Request{" "}
                              </h1>
                              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {qrCodes.map((qrCode) => (
                                  <div key={qrCode._id} className="">
                                    {/* <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{qrCode.title}</h4>
                           
                          </div> */}
                                    <div className="">
                                      <img
                                        src={qrCode.qrCode.url || "/placeholder.svg" || "/placeholder.svg"}
                                        alt={qrCode.title}
                                        className="max-w-44 max-h-44 object-contain"
                                      />
                                    </div>
                                    {/* <p className="text-xs text-gray-500 mt-2">
                            Added on{" "}
                            {new Date(qrCode.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p> */}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Deposit Form */}
                  <div className="bg-white p-6 rounded-lg border border-[rgb(var(--color-border))] shadow-sm">
                    <h4 className="text-lg font-medium mb-4">Submit Deposit Request</h4>
                    <form onSubmit={handleDepositSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                          Amount*
                        </label>
                        <input
                          type="number"
                          id="amount"
                          name="amount"
                          value={activePaymentOption === "qr" && qrCodeUrl ? qrCodeAmount : formData.amount}
                          onChange={(e) => {
                            if (activePaymentOption === "qr" && qrCodeUrl) {
                              // If QR code is already generated, don't allow changing the amount
                              toast.info("Please generate a new QR code to change the amount")
                              return
                            }
                            handleInputChange(e)
                          }}
                          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                          placeholder="Enter amount"
                          required
                          min="1"
                          step="0.01"
                          disabled={activePaymentOption === "qr" && qrCodeUrl}
                        />
                        {activePaymentOption === "qr" && qrCodeUrl && (
                          <p className="mt-1 text-xs text-gray-500">Amount is locked to match the generated QR code</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Transaction ID*
                        </label>
                        <input
                          type="text"
                          id="referenceNumber"
                          name="referenceNumber"
                          value={formData.referenceNumber}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                          placeholder="Enter reference number from your payment"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Enter the reference/transaction ID from your payment for verification
                        </p>
                      </div>
                      <div>
                        <label htmlFor="transactionScreenshot" className="block text-sm font-medium text-gray-700 mb-1">
                          Transaction Screenshot*
                        </label>
                        <input
                          type="file"
                          id="transactionScreenshot"
                          name="transactionScreenshot"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                          required
                        />
                        {imagePreview && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Preview:</p>
                            <div className="border rounded-md overflow-hidden max-w-xs">
                              <img
                                src={imagePreview || "/placeholder.svg"}
                                alt="Transaction Screenshot"
                                className="max-w-full h-auto"
                              />
                            </div>
                          </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Upload a screenshot of your transaction for verification
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center items-center rounded-md bg-[rgb(var(--color-primary))] px-4 py-2 text-sm font-medium text-white hover:bg-[rgb(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            "Submit Deposit Request"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Withdrawal Tab */}
              {activeTab === "withdrawal" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-medium mb-2">Select Payment Method</h4>
                    <div className="flex flex-wrap border-b mb-4">
                      <button
                        className={`py-2 px-4 text-sm font-medium ${
                          activewithdrawloption === "bank"
                            ? "text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))]"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setActivePaymentOption("bank")}
                        type="button"
                      >
                        Bank Transfer
                      </button>
                    </div>
                  </div>

                  {/* Withdrawal Form */}
                  <div className="bg-white p-6 rounded-lg border border-[rgb(var(--color-border))] shadow-sm">
                    <h4 className="text-lg font-medium mb-4">Submit Withdrawal Request</h4>
                    <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                          Amount*
                        </label>
                        <input
                          type="number"
                          id="amount"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                          placeholder="Enter amount"
                          required
                          min="1"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Number*
                        </label>
                        <input
                          type="text"
                          id="contact"
                          name="contact"
                          value={formData.contact}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                          placeholder="Enter your contact number"
                          required
                        />
                      </div>

                      {activewithdrawloption === "bank" && (
                        <>
                          <div>
                            <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-1">
                              Account Holder Name*
                            </label>
                            <input
                              type="text"
                              id="accountHolderName"
                              name="accountHolderName"
                              value={formData.accountHolderName}
                              onChange={handleInputChange}
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                              placeholder="Enter account holder name"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                              Account Number*
                            </label>
                            <input
                              type="text"
                              id="accountNumber"
                              name="accountNumber"
                              value={formData.accountNumber}
                              onChange={handleInputChange}
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                              placeholder="Enter account number"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 mb-1">
                              IFSC Code*
                            </label>
                            <input
                              type="text"
                              id="ifscCode"
                              name="ifscCode"
                              value={formData.ifscCode}
                              onChange={handleInputChange}
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                              placeholder="Enter IFSC code"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                              Bank Name*
                            </label>
                            <input
                              type="text"
                              id="bankName"
                              name="bankName"
                              value={formData.bankName}
                              onChange={handleInputChange}
                              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                              placeholder="Enter bank name"
                              required
                            />
                          </div>
                        </>
                      )}

                      {activePaymentOption === "upi" && (
                        <div>
                          <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
                            UPI ID*
                          </label>
                          <input
                            type="text"
                            id="upiId"
                            name="upiId"
                            value={formData.upiId}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                            placeholder="example@bank"
                            required
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Enter your UPI ID in the format: username@bankname
                          </p>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center items-center rounded-md bg-[rgb(var(--color-primary))] px-4 py-2 text-sm font-medium text-white hover:bg-[rgb(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            "Submit Withdrawal Request"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

