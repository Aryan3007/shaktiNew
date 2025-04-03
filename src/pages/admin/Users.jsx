"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { server } from "../../constants/config";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export default function Users() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "ascending",
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const { user } = useSelector((state) => state.userReducer);

  // State for add money dialog
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isReducmoney, setIsReducmoney] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState("");

  // State for ban/unban confirmation
  const [isBanConfirmOpen, setIsBanConfirmOpen] = useState(false);
  const [userToModify, setUserToModify] = useState(null);
  const [actionType, setActionType] = useState(""); // "ban" or "unban"
  const [isDelConfirmOpen, setIsDelConfirmOpen] = useState(false);

  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    currency: user?.currency,
    role: "user", // Fixed as user
    gender: "male",
    amount: "",
  });

  // Fetch all users
  const fetchUsers = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await axios.get(`${server}api/v1/user/allusers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUsers(response.data.users);
        handleSubmit();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to fetch users. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUserData({
      ...newUserData,
      [name]: value,
    });
  };

  // Validate form data
  const validateNewUser = () => {
    if (!newUserData.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!newUserData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!newUserData.password.trim()) {
      toast.error("Password is required");
      return false;
    }
    if (!newUserData.gender) {
      toast.error("Gender selection is required");
      return false;
    }
 
    return true;
  };

  // Submit new user
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");

    if (!validateNewUser()) return;

    try {
      const response = await axios.post(
        `${server}api/v1/user/new`,
        newUserData,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success("User added successfully");
        setIsModalOpen(false);
        fetchUsers(); // Refresh the list

        // Reset form
        setNewUserData({
          name: "",
          email: "",
          password: "",
          currency: user?.currency || "",
          role: "user",
          gender: "male",
          amount: "",
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to add user. Please try again later."
      );
    }
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Open add money dialog
  const openAddMoneyDialog = (user) => {
    setSelectedUser(user);
    setAmount("");
    setIsAddMoneyOpen(true);
  };

  // Close add money dialog
  const closeAddMoneyDialog = () => {
    setIsAddMoneyOpen(false);
    setSelectedUser(null);
    setAmount("");
  };

  // Open add money dialog
  const openReduceMoneyDialog = (user) => {
    setSelectedUser(user);
    setAmount("");
    setIsReducmoney(true);
  };

  // Close add money dialog
  const closereduceMoneyDialog = () => {
    setIsReducmoney(false);
    setSelectedUser(null);
    setAmount("");
  };

  // Handle adding money
  const handleAddMoney = async () => {
    if (!amount || isNaN(amount) || Number.parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    const token = localStorage.getItem("authToken");

    try {
      const response = await axios.put(
        `${server}api/v1/user/addamount/${selectedUser._id}`,
        { amount: Number.parseFloat(amount) },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data?.message || "Amount added successfully");
      closeAddMoneyDialog();
      fetchUsers(); // Refresh the data
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update amount. Please try again later."
      );
      console.error("Error updating amount:", error);
    }
  };

  // Handle adding money
  const handleReduceMoney = async () => {
    if (!amount || isNaN(amount) || Number.parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    const token = localStorage.getItem("authToken");

    try {
      const response = await axios.put(
        `${server}api/v1/user/reduceamount/${selectedUser._id}`,
        { amount: Number.parseFloat(amount) },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data?.message || "Amount Reduced successfully");
      closereduceMoneyDialog();
      fetchUsers(); // Refresh the data
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update amount. Please try again later."
      );
      console.error("Error updating amount:", error);
    }
  };

  // Open ban/unban confirmation dialog
  const openBanConfirmDialog = (user) => {
    setUserToModify(user);
    setActionType(user.status === "active" ? "ban" : "unban");
    setIsBanConfirmOpen(true);
  };

  // Close ban/unban confirmation dialog
  const closeBanConfirmDialog = () => {
    setIsBanConfirmOpen(false);
    setUserToModify(null);
  };

  const handleDeleteUser = async () => {
    if (!userToModify?._id) {
      toast.error("Invalid user selected for deletion.");
      return;
    }

    const token = localStorage.getItem("authToken");

    try {
      const response = await axios.post(
        `${server}api/v1/user/deleteuser/${userToModify._id}`, // ✅ Use `userToModify` instead of `selectedUser`
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data?.message || "User deleted successfully");
      fetchUsers();
      closeDelConfirmDialog();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete User. Please try again later."
      );
      console.error("Error deleting user:", error);
    }
  };

  // ✅ Ensure `userToModify` is properly set when opening the confirmation modal
  const openDelConfirmDialog = (user, isAdmin = false) => {
    if (!user) {
      toast.error("User data is missing.");
      return;
    }

    setUserToModify({ ...user, isAdmin });
    setIsDelConfirmOpen(true);
  };

  // ✅ Make sure to reset `userToModify` when closing the modal
  const closeDelConfirmDialog = () => {
    setIsDelConfirmOpen(false);
    setUserToModify(null);
  };

  // Handle user status change (ban/unban)
  const handleUserStatusChange = async () => {
    const token = localStorage.getItem("authToken");
    const newStatus = userToModify.status === "active" ? "banned" : "active";

    try {
      const { data } = await axios.post(
        `${server}api/v1/user/userstatus/${userToModify._id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(
        data.message ||
          `User ${newStatus === "active" ? "unbanned" : "banned"} successfully`
      );

      // Update the local state to reflect the change
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userToModify._id ? { ...user, status: newStatus } : user
        )
      );

      closeBanConfirmDialog();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${
            newStatus === "active" ? "unban" : "ban"
          } the user. Please try again later.`
      );
      console.error("Error updating user status:", error);
    }
  };

  // Filter and sort users
  const getFilteredAndSortedUsers = () => {
    let filteredUsers = [...users];

    // Apply status filter
    if (statusFilter !== "all") {
      filteredUsers = filteredUsers.filter(
        (user) => user.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredUsers.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredUsers;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const filteredAndSortedUsers = getFilteredAndSortedUsers();
  const currentUsers = filteredAndSortedUsers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Capitalize first letter
  const capitalize = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--color-border))] bg-white shadow-sm">
        <div className="flex flex-col space-y-1.5 p-2 pb-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold leading-none tracking-tight text-[rgb(var(--color-text-primary))]">
              Users
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md bg-[rgb(var(--color-primary))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[rgb(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Add New User
            </button>
          </div>
          <p className="text-sm text-[rgb(var(--color-text-muted))]">
            Manage user accounts from here
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="px-6 py-2 flex flex-wrap gap-4 items-center border-b border-[rgb(var(--color-border))]">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-[rgb(var(--color-border))] px-3 py-2 text-sm focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-[rgb(var(--color-border))] px-3 py-2 text-sm focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
              className="rounded-md border border-[rgb(var(--color-border))] px-3 py-2 text-sm focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="p-6 pt-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="border-b border-[rgb(var(--color-border))]">
                  <tr>
                    <th className="h-12 px-4 text-left align-middle font-medium text-[rgb(var(--color-text-muted))]">
                      <button
                        className="flex items-center gap-1 hover:text-[rgb(var(--color-primary))]"
                        onClick={() => requestSort("name")}
                      >
                        Name
                        {sortConfig.key === "name" && (
                          <span>
                            {sortConfig.direction === "ascending" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-[rgb(var(--color-text-muted))]">
                      <button
                        className="flex items-center gap-1 hover:text-[rgb(var(--color-primary))]"
                        onClick={() => requestSort("email")}
                      >
                        Email
                        {sortConfig.key === "email" && (
                          <span>
                            {sortConfig.direction === "ascending" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-[rgb(var(--color-text-muted))]">
                      <button
                        className="flex items-center gap-1 hover:text-[rgb(var(--color-primary))]"
                        onClick={() => requestSort("currency")}
                      >
                        Currency
                        {sortConfig.key === "currency" && (
                          <span>
                            {sortConfig.direction === "ascending" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-[rgb(var(--color-text-muted))]">
                      <button
                        className="flex items-center gap-1 hover:text-[rgb(var(--color-primary))]"
                        onClick={() => requestSort("amount")}
                      >
                        Amount
                        {sortConfig.key === "amount" && (
                          <span>
                            {sortConfig.direction === "ascending" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-[rgb(var(--color-text-muted))]">
                      <button
                        className="flex items-center gap-1 hover:text-[rgb(var(--color-primary))]"
                        onClick={() => requestSort("status")}
                      >
                        Status
                        {sortConfig.key === "status" && (
                          <span>
                            {sortConfig.direction === "ascending" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-[rgb(var(--color-text-muted))]">
                      <button
                        className="flex items-center gap-1 hover:text-[rgb(var(--color-primary))]"
                        onClick={() => requestSort("createdAt")}
                      >
                        Created
                        {sortConfig.key === "createdAt" && (
                          <span>
                            {sortConfig.direction === "ascending" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-[rgb(var(--color-text-muted))]">
                    Exposure
                  </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-[rgb(var(--color-text-muted))]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-4 text-center text-[rgb(var(--color-text-muted))]"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="border-b border-[rgb(var(--color-border))] transition-colors hover:bg-[rgb(var(--color-primary-lighter))]"
                      >
                        <td className="p-4 align-middle font-medium">
                          {capitalize(user.name)}
                        </td>
                        <td className="p-4 align-middle">{user.email}</td>
                        <td className="p-4 align-middle">
                          {user.currency.toUpperCase()}
                        </td>
                        <td className="p-4 align-middle">
                          {user.amount.toLocaleString()}
                        </td>
                        <td className="p-4 align-middle">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              user.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {capitalize(user.status)}
                          </span>
                        </td>
                        <td className="p-4 align-middle">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="p-4 align-middle">
                          {user.exposure.toLocaleString()}
                        </td>
                        <td className="p-4 flex justify-end items-center align-middle text-right">
                          <Link to={`/admin/master-bets-page/${user._id}/${user.name}`}>
                          <button
                            className="mr-2 leading-none inline-flex h-8 items-center justify-center rounded-md border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-xs font-medium transition-colors hover:bg-[rgb(var(--color-primary-lighter))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                            
                            >
                            View Bets
                          </button> 
                            </Link>
                          <button
                            className="mr-2 leading-none inline-flex h-8 items-center justify-center rounded-md border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-xs font-medium transition-colors hover:bg-[rgb(var(--color-primary-lighter))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                            onClick={() => openReduceMoneyDialog(user)}
                          >
                            Reduce Money
                          </button>

                          <button
                            className="mr-2 leading-none inline-flex h-8 items-center justify-center rounded-md border border-[rgb(var(--color-border))] bg-transparent px-3 py-2 text-xs font-medium transition-colors hover:bg-[rgb(var(--color-primary-lighter))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                            onClick={() => openAddMoneyDialog(user)}
                          >
                            Add Money
                          </button>
                          <button
                            className={`inline-flex mr-2 h-8 leading-none items-center justify-center rounded-md border px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                              user.status === "active"
                                ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                            onClick={() => openBanConfirmDialog(user)}
                          >
                            {user.status === "active"
                              ? "Ban User"
                              : "Unban User"}
                          </button>
                          <button
                            className="bg-red-500 leading-none inline-flex h-8 items-center justify-center rounded-md border border-[rgb(var(--color-border))] text-white px-3 py-2 text-xs font-medium transition-colors  focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                            onClick={() => openDelConfirmDialog(user)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredAndSortedUsers.length > 0 && (
            <div className="flex items-center justify-between border-t border-[rgb(var(--color-border))] px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-[rgb(var(--color-border))] bg-white px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-primary-lighter))] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-[rgb(var(--color-border))] bg-white px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-primary-lighter))] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[rgb(var(--color-text-muted))]">
                    Showing{" "}
                    <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredAndSortedUsers.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredAndSortedUsers.length}
                    </span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md border border-[rgb(var(--color-border))] bg-white px-2 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-primary-lighter))] disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                            currentPage === pageNum
                              ? "z-10 border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary-lighter))] text-[rgb(var(--color-primary))]"
                              : "border-[rgb(var(--color-border))] bg-white text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-primary-lighter))]"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md border border-[rgb(var(--color-border))] bg-white px-2 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-primary-lighter))] disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[rgb(var(--color-text-primary))]">
                Add New User
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary-lighter))] hover:text-[rgb(var(--color-primary-dark))]"
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

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-[rgb(var(--color-text-primary))]"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newUserData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-[rgb(var(--color-border))] px-3 py-2 text-sm focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[rgb(var(--color-text-primary))]"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newUserData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-[rgb(var(--color-border))] px-3 py-2 text-sm focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[rgb(var(--color-text-primary))]"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={newUserData.password}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-[rgb(var(--color-border))] px-3 py-2 text-sm focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="currency"
                    className="block text-sm font-medium text-[rgb(var(--color-text-primary))]"
                  >
                    Currency
                  </label>
                  <input
                    type="text"
                    id="currency"
                    name="currency"
                    value={newUserData.currency.toUpperCase()}
                    className="w-full rounded-md border border-[rgb(var(--color-border))] bg-gray-100 px-3 py-2 text-sm"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-[rgb(var(--color-text-primary))]"
                  >
                    Role
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={capitalize(newUserData.role)}
                    className="w-full rounded-md border border-[rgb(var(--color-border))] bg-gray-100 px-3 py-2 text-sm"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-[rgb(var(--color-text-primary))]"
                  >
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={newUserData.gender}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-[rgb(var(--color-border))] px-3 py-2 text-sm focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-[rgb(var(--color-text-primary))]"
                  >
                    Amount{" "}
                    <span className="text-xs text-red-500">
                      (money will be deducted from your balance)
                    </span>
                  </label>

                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={newUserData.amount}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-[rgb(var(--color-border))] px-3 py-2 text-sm focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-md border border-[rgb(var(--color-border))] bg-white px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] transition-colors hover:bg-[rgb(var(--color-primary-lighter))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-[rgb(var(--color-primary))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[rgb(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Money Dialog */}
      {isAddMoneyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[rgb(var(--color-text-primary))]">
                Add Money to User Wallet
              </h3>
              <button
                onClick={closeAddMoneyDialog}
                className="rounded-full p-1 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary-lighter))] hover:text-[rgb(var(--color-primary-dark))]"
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

            <div className="mb-4">
              <p className="mb-2 text-sm text-[rgb(var(--color-text-muted))]">
                Adding money to:{" "}
                <span className="font-medium text-[rgb(var(--color-text-primary))]">
                  {selectedUser?.name}
                </span>
              </p>
              <p className="mb-4 text-sm text-[rgb(var(--color-text-muted))]">
                Current balance:{" "}
                <span className="font-medium text-[rgb(var(--color-text-primary))]">
                  {selectedUser?.amount.toLocaleString()}{" "}
                  {selectedUser?.currency.toUpperCase()}
                </span>
              </p>

              <div className="space-y-2">
                <label
                  htmlFor="add-amount"
                  className="block text-sm font-medium text-[rgb(var(--color-text-primary))]"
                >
                  Amount to Add
                </label>
                <span className="text-xs text-red-500">
                  {" "}
                  (money will be deducted from your account)
                </span>

                <input
                  type="number"
                  id="add-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-md border border-[rgb(var(--color-border))] px-3 py-2 text-sm focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                  placeholder={`Enter amount in ${selectedUser?.currency.toUpperCase()}`}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeAddMoneyDialog}
                className="inline-flex items-center justify-center rounded-md border border-[rgb(var(--color-border))] bg-white px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] transition-colors hover:bg-[rgb(var(--color-primary-lighter))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMoney}
                className="inline-flex items-center justify-center rounded-md bg-[rgb(var(--color-primary))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[rgb(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
              >
                Add Money
              </button>
            </div>
          </div>
        </div>
      )}

      {/* reduce Money Dialog */}
      {isReducmoney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[rgb(var(--color-text-primary))]">
                Reduce Money from User Wallet
              </h3>
              <button
                onClick={closereduceMoneyDialog}
                className="rounded-full p-1 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary-lighter))] hover:text-[rgb(var(--color-primary-dark))]"
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

            <div className="mb-4">
              <p className="mb-2 text-sm text-[rgb(var(--color-text-muted))]">
                Deducting money to:{" "}
                <span className="font-medium text-[rgb(var(--color-text-primary))]">
                  {selectedUser?.name}
                </span>
              </p>
              <p className="mb-4 text-sm text-[rgb(var(--color-text-muted))]">
                Current balance:{" "}
                <span className="font-medium text-[rgb(var(--color-text-primary))]">
                  {selectedUser?.amount.toLocaleString()}{" "}
                  {selectedUser?.currency.toUpperCase()}
                </span>
              </p>

              <div className="space-y-2">
                <label
                  htmlFor="add-amount"
                  className="block text-sm font-medium text-[rgb(var(--color-text-primary))]"
                >
                  Amount to Deduct
                </label>
                <span className="text-xs text-red-500">
                  {" "}
                  (money will be deducted from users account)
                </span>

                <input
                  type="number"
                  id="add-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-md border border-[rgb(var(--color-border))] px-3 py-2 text-sm focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                  placeholder={`Enter amount in ${selectedUser?.currency.toUpperCase()}`}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closereduceMoneyDialog}
                className="inline-flex items-center justify-center rounded-md border border-[rgb(var(--color-border))] bg-white px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] transition-colors hover:bg-[rgb(var(--color-primary-lighter))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReduceMoney}
                className="inline-flex items-center justify-center rounded-md bg-[rgb(var(--color-primary))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[rgb(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
              >
                Deduct Money
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban/Unban Confirmation Dialog */}
      {isBanConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[rgb(var(--color-text-primary))]">
                {actionType === "ban" ? "Ban" : "Unban"} Confirmation
              </h3>
              <button
                onClick={closeBanConfirmDialog}
                className="rounded-full p-1 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary-lighter))] hover:text-[rgb(var(--color-primary-dark))]"
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

            <div className="mb-6">
              <p className="mb-4 text-[rgb(var(--color-text-primary))]">
                Are you sure you want to{" "}
                {actionType === "ban" ? "ban" : "unban"} user:{" "}
                <span className="font-medium">{userToModify?.name}</span>?
              </p>

              {actionType === "ban" ? (
                <p className="text-sm text-red-600">
                  This will prevent the user from accessing the system until
                  they are unbanned.
                </p>
              ) : (
                <p className="text-sm text-green-600">
                  This will restore the user&apos;s access to the system.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeBanConfirmDialog}
                className="inline-flex items-center justify-center rounded-md border border-[rgb(var(--color-border))] bg-white px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] transition-colors hover:bg-[rgb(var(--color-primary-lighter))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUserStatusChange}
                className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  actionType === "ban"
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                }`}
              >
                {actionType === "ban" ? "Ban" : "Unban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDelConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[rgb(var(--color-text-primary))]">
                Delete Confirmation
              </h3>
              <button
                onClick={closeDelConfirmDialog} // ✅ Fixed function call
                className="rounded-full p-1 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary-lighter))] hover:text-[rgb(var(--color-primary-dark))]"
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

            <div className="mb-6">
              <p className="mb-4 text-[rgb(var(--color-text-primary))]">
                Are you sure you want to delete{" "}
                <span className="font-medium">{userToModify?.name}</span>?
              </p>

              <p className="text-sm text-red-600">
                This action will permanently delete the user from the
                application.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeDelConfirmDialog}
                className="inline-flex items-center justify-center rounded-md border border-[rgb(var(--color-border))] bg-white px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] transition-colors hover:bg-[rgb(var(--color-primary-lighter))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
