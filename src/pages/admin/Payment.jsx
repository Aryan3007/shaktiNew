"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { server } from "../../constants/config";

export default function PaymentManagement() {
  const [activeTab, setActiveTab] = useState("bank");
  const [bankDetails, setBankDetails] = useState([]);
  const [upiDetails, setUpiDetails] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Update the state variable for UPI IDs
  const [upiIds, setUpiIds] = useState([]);
  // Add a new state for QR codes after the upiIds state
  const [qrCodes, setQrCodes] = useState([]);
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [qrCodeTitle, setQrCodeTitle] = useState("");
  const [qrCodePreview, setQrCodePreview] = useState(null);

  // Form data for adding new payment methods
  const [formData, setFormData] = useState({
    // Bank details
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankName: "",
    // UPI details
    upiId: "",
    // QR Code details
    qrCodeTitle: "",
  });

  // Fetch bank details
  const fetchBankDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.get(
        `${server}api/v1/payment-details/bank-details`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setBankDetails(response.data.bankDetails || []);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch bank details"
        );
      }
    } catch (err) {
      console.error("Error fetching bank details:", err);
      toast.error("Failed to load bank details");
    }
  }, []);

  // Fetch UPI details
  const fetchUpiDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.get(`${server}api/v1/payment-details/upi`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUpiIds(response.data.upiIds || []);
      } else {
        throw new Error(response.data.message || "Failed to fetch UPI details");
      }
    } catch (err) {
      console.error("Error fetching UPI details:", err);
      toast.error("Failed to load UPI IDs");
    }
  }, []);

  // Add fetchQrCodes function after fetchUpiDetails
  const fetchQrCodes = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.get(
        `${server}api/v1/payment-details/qrcode`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setQrCodes(response.data.qrCodes || []);
      } else {
        throw new Error(response.data.message || "Failed to fetch QR codes");
      }
    } catch (err) {
      console.error("Error fetching QR codes:", err);
      toast.error("Failed to load QR codes");
    }
  }, []);

  // Update fetchAllPaymentDetails to include QR codes
  const fetchAllPaymentDetails = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchBankDetails(), fetchUpiDetails(), fetchQrCodes()]);
    setIsLoading(false);
  }, [fetchBankDetails, fetchUpiDetails, fetchQrCodes]);

  useEffect(() => {
    fetchAllPaymentDetails();
  }, [fetchAllPaymentDetails, refreshTrigger]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Validate bank details form
  const validateBankForm = () => {
    if (!formData.accountHolderName.trim()) {
      toast.error("Account holder name is required");
      return false;
    }
    if (!formData.accountNumber.trim()) {
      toast.error("Account number is required");
      return false;
    }
    if (!formData.confirmAccountNumber.trim()) {
      toast.error("Please confirm account number");
      return false;
    }
    if (formData.accountNumber !== formData.confirmAccountNumber) {
      toast.error("Account numbers do not match");
      return false;
    }
    if (!formData.ifscCode.trim()) {
      toast.error("IFSC code is required");
      return false;
    }
    if (!formData.bankName.trim()) {
      toast.error("Bank name is required");
      return false;
    }
    return true;
  };

  // Validate UPI form
  const validateUpiForm = () => {
    if (!formData.upiId.trim()) {
      toast.error("UPI ID is required");
      return false;
    }
    // Basic UPI ID validation
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(formData.upiId)) {
      toast.error("Please enter a valid UPI ID (e.g., name@bank)");
      return false;
    }
    return true;
  };

  // Add new bank details
  const addBankDetails = async () => {
    if (!validateBankForm()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${server}api/v1/payment-details/bank-details`,
        {
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Bank details added successfully");
        setShowAddModal(false);
        resetForm();
        setRefreshTrigger((prev) => prev + 1);
      } else {
        toast.error(response.data.message || "Failed to add bank details");
      }
    } catch (err) {
      console.error("Error adding bank details:", err);
      toast.error(err.response?.data?.message || "Failed to add bank details");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add new UPI ID
  const addUpiDetails = async () => {
    if (!validateUpiForm()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${server}api/v1/payment-details/upi`,
        {
          upiId: formData.upiId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("UPI ID added successfully");
        setShowAddModal(false);
        resetForm();
        setRefreshTrigger((prev) => prev + 1);
      } else {
        toast.error(response.data.message || "Failed to add UPI ID");
      }
    } catch (err) {
      console.error("Error adding UPI ID:", err);
      toast.error(err.response?.data?.message || "Failed to add UPI ID");
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadQrCode = async () => {
    if (!qrCodeTitle.trim()) {
      toast.error("QR Code title is required");
      return;
    }

    if (!qrCodeFile) {
      toast.error("Please select a QR Code image");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("title", qrCodeTitle.trim()); // Ensure non-empty title
      formData.append("image", qrCodeFile); // Ensure file is present

      // Debugging: Check what’s being sent
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await axios.post(
        `${server}api/v1/payment-details/qrcode`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("QR Code uploaded successfully");
        setShowAddModal(false);
        setQrCodeTitle("");
        setQrCodeFile(null);
        setQrCodePreview(null);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        toast.error(response.data.message || "Failed to upload QR Code");
      }
    } catch (err) {
      console.error("Error uploading QR Code:", err);
      toast.error(
        err.response?.data?.message || "Something went wrong. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete bank details
  const deleteBankDetails = async (accountNumber) => {
    if (!confirm("Are you sure you want to delete this bank account?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.delete(
        `${server}api/v1/payment-details/bank-details`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { accountNumber },
        }
      );

      if (response.data.success) {
        toast.success("Bank details deleted successfully");
        setRefreshTrigger((prev) => prev + 1);
      } else {
        toast.error(response.data.message || "Failed to delete bank details");
      }
    } catch (err) {
      console.error("Error deleting bank details:", err);
      toast.error(
        err.response?.data?.message || "Failed to delete bank details"
      );
    }
  };

  // Delete UPI ID
  const deleteUpiDetails = async (upiId) => {
    if (!confirm("Are you sure you want to delete this UPI ID?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.delete(
        `${server}api/v1/payment-details/upi`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { upiId },
        }
      );

      if (response.data.success) {
        toast.success("UPI ID deleted successfully");
        setRefreshTrigger((prev) => prev + 1);
      } else {
        toast.error(response.data.message || "Failed to delete UPI ID");
      }
    } catch (err) {
      console.error("Error deleting UPI ID:", err);
      toast.error(err.response?.data?.message || "Failed to delete UPI ID");
    }
  };

  // Add deleteQrCode function after deleteUpiDetails
  const deleteQrCode = async (qrCodeId) => {
    if (!confirm("Are you sure you want to delete this QR Code?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.delete(
        `${server}api/v1/payment-details/qrcode`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { qrCodeId },
        }
      );

      if (response.data.success) {
        toast.success("QR Code deleted successfully");
        setRefreshTrigger((prev) => prev + 1);
      } else {
        toast.error(response.data.message || "Failed to delete QR Code");
      }
    } catch (err) {
      console.error("Error deleting QR Code:", err);
      toast.error(err.response?.data?.message || "Failed to delete QR Code");
    }
  };

  // Handle form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "bank") {
      addBankDetails();
    } else if (activeTab === "upi") {
      addUpiDetails();
    } else if (activeTab === "qrcode") {
      uploadQrCode();
    }
  };

  // Add handleQrCodeFileChange function after resetForm
  const handleQrCodeFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrCodeFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      accountNumber: "",
      confirmAccountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      bankName: "",
      upiId: "",
      qrCodeTitle: "",
    });
    setQrCodeFile(null);
    setQrCodePreview(null);
    setQrCodeTitle("");
  };

  // Open add modal with specific tab
  const openAddModal = (tab) => {
    setActiveTab(tab);
    resetForm();
    setShowAddModal(true);
  };

  // Mask account number for display
  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return "";
    const length = accountNumber.length;
    if (length <= 4) return accountNumber;
    return "XXXX" + accountNumber.substring(length - 4);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Payment Options</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border border-[rgb(var(--color-border))]">
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "bank"
                ? "text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("bank")}
          >
            Bank Accounts
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "upi"
                ? "text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("upi")}
          >
            UPI IDs
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "qrcode"
                ? "text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("qrcode")}
          >
            QR Codes
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--color-primary))]"></div>
            </div>
          ) : (
            <>
              {/* Bank Accounts Tab */}
              {activeTab === "bank" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Your Bank Accounts</h3>
                    <button
                      onClick={() => openAddModal("bank")}
                      className="inline-flex items-center justify-center rounded-md bg-[rgb(var(--color-primary))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[rgb(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
                    >
                      Add Bank Account
                    </button>
                  </div>

                  {bankDetails.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
                      <p>
                        You haven&apos;t added any bank accounts yet. Click the
                        &quot;Add Bank Account&quot; button to add one.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Account Holder
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Account Number
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Bank Name
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              IFSC Code
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Added On
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {bankDetails.map((bank) => (
                            <tr key={bank._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {bank.accountHolderName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {maskAccountNumber(bank.accountNumber)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {bank.bankName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {bank.ifscCode}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(bank.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() =>
                                    deleteBankDetails(bank.accountNumber)
                                  }
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* UPI IDs Tab */}
              {activeTab === "upi" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Your UPI IDs</h3>
                    <button
                      onClick={() => openAddModal("upi")}
                      className="inline-flex items-center justify-center rounded-md bg-[rgb(var(--color-primary))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[rgb(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
                    >
                      Add UPI ID
                    </button>
                  </div>

                  {upiIds.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
                      <p>
                        You haven&apos;t added any UPI IDs yet. Click the
                        &quot;Add UPI ID&quot; button to add one.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              UPI ID
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Added On
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {upiIds.map((upi) => (
                            <tr key={upi._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {upi.upiId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(upi.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => deleteUpiDetails(upi.upiId)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* QR Codes Tab */}
              {activeTab === "qrcode" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Your QR Codes</h3>
                    <button
                      onClick={() => openAddModal("qrcode")}
                      className="inline-flex items-center justify-center rounded-md bg-[rgb(var(--color-primary))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[rgb(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
                    >
                      Upload QR Code
                    </button>
                  </div>

                  {qrCodes.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
                      <p>
                        You haven&apos;t added any QR Codes yet. Click the
                        &quot;Upload QR Code&quot; button to add one.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {qrCodes.map((qrCode) => (
                        <div
                          key={qrCode._id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">
                              {qrCode.title}
                            </h4>
                            <button
                              onClick={() => deleteQrCode(qrCode._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="aspect-square bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                            <img
                              src={qrCode.qrCode.url || "/placeholder.svg"}
                              alt={qrCode.title}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Added on{" "}
                            {new Date(qrCode.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {activeTab === "bank"
                  ? "Add Bank Account"
                  : activeTab === "upi"
                  ? "Add UPI ID"
                  : "Upload QR Code"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-4">
                {/* Bank Account Form */}
                {activeTab === "bank" && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="accountHolderName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Account Holder Name*
                      </label>
                      <input
                        type="text"
                        id="accountHolderName"
                        name="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="accountNumber"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Account Number*
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="confirmAccountNumber"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Confirm Account Number*
                      </label>
                      <input
                        type="text"
                        id="confirmAccountNumber"
                        name="confirmAccountNumber"
                        value={formData.confirmAccountNumber}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ifscCode"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        IFSC Code*
                      </label>
                      <input
                        type="text"
                        id="ifscCode"
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="bankName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Bank Name*
                      </label>
                      <input
                        type="text"
                        id="bankName"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* UPI Form */}
                {activeTab === "upi" && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="upiId"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
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
                  </div>
                )}

                {/* QR Code Form */}
                {activeTab === "qrcode" && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="qrCodeTitle"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        QR Code Title*
                      </label>
                      <input
                        type="text"
                        id="qrCodeTitle"
                        value={qrCodeTitle}
                        onChange={(e) => setQrCodeTitle(e.target.value)}
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                        placeholder="Payment QR Code"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="qrCodeFile"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        QR Code Image*
                      </label>
                      <input
                        type="file"
                        id="qrCodeFile"
                        onChange={handleQrCodeFileChange}
                        accept="image/*"
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                        required
                      />
                      {qrCodePreview && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-1">Preview:</p>
                          <div className="w-32 h-32 border rounded-md overflow-hidden">
                            <img
                              src={qrCodePreview || "/placeholder.svg"}
                              alt="QR Code Preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[rgb(var(--color-primary))] rounded-md text-white hover:bg-opacity-90 transition-colors flex items-center"
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
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
