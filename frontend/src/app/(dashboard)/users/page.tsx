"use client";

import React, { useState, useEffect } from "react";
import { Users, DollarSign, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { userService } from "@/services/user.service";
import { CustomerUser } from "@/types/order.types";
import { formatCurrency } from "@/lib/utils";

export default function UsersPage() {
  const [users, setUsers] = useState<CustomerUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<CustomerUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("Admin Manual Top-up");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAdjustModal = (user: CustomerUser) => {
    setSelectedUser(user);
    setAdjustAmount("");
    setIsModalOpen(true);
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !adjustAmount) return;

    setSubmitting(true);
    try {
      await userService.adjustBalance(selectedUser.id, Number(adjustAmount), adjustReason);
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert("Failed to adjust user balance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] dark:text-white">👥 Telegram Customer Base</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registered Telegram bot users, balance auditing, and manual balance adjustment console.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Users
        </Button>
      </div>

      {/* Users Data Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/90 dark:bg-slate-900/90 hover:bg-gray-50/90 dark:hover:bg-slate-900/90 hover:shadow-none">
            <TableHead>User ID</TableHead>
            <TableHead>Telegram ID</TableHead>
            <TableHead>Name / Handle</TableHead>
            <TableHead>Account Balance</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                {loading ? "Loading customer list..." : "No Telegram users registered yet."}
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">#{u.id}</TableCell>
                <TableCell className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">{u.telegram_id}</TableCell>
                <TableCell className="font-semibold text-[#0f172a] dark:text-white">
                  {u.first_name} {u.last_name || ""} {u.username ? `(@${u.username})` : ""}
                </TableCell>
                <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(u.balance)}
                </TableCell>
                <TableCell>
                  <Badge variant={u.role === "admin" ? "purple" : "neutral"}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.is_blocked ? "danger" : "success"}>
                    {u.is_blocked ? "Suspended" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAdjustModal(u)}
                    className="gap-1.5 text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 shadow-2xs font-semibold cursor-pointer"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Adjust Balance
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Manual Balance Adjustment Modal */}
      {isModalOpen && selectedUser && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`💰 Adjust Balance for ${selectedUser.first_name}`}
        >
          <form onSubmit={handleAdjustBalance} className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 mb-2">
                Current Balance: <b className="text-emerald-400">{formatCurrency(selectedUser.balance)}</b>
              </p>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Adjustment Amount ($ USD)
              </label>
              <Input
                type="number"
                step="0.01"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Use +10 to add $10, or -5 to deduct $5"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Enter positive value to credit balance, negative value to deduct.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Note</label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Manual KHQR Top-up correction"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Updating..." : "Save Adjustment"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
