"use client";

import { bulkDeleteTransactions } from "@/actions/account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { categoryColors } from "@/data/categories";
import useFetch from "@/hooks/useFetch";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Trash,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
  WEEKLY: "Weekly",
};

const TransactionTable = ({ transactions }) => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchTransaction, setSearchTransaction] = useState("");
  const {
    data: deleted,
    loading: deleting,
    fn: deleteFunc,
  } = useFetch(bulkDeleteTransactions);

  useEffect(() => {
    if (!deleting && deleted?.success) {
      toast.success("Transactions deleted successfully");
      setSelectedId([]);
    }
  }, [deleting, deleted]);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((trans) =>
        trans.description?.toLowerCase().includes(searchLower)
      );
    }

    if (searchType) {
      result = result.filter((trans) => trans.type === searchType);
    }

    if (searchTransaction) {
      result = result.filter((trans) => {
        if (searchTransaction === "recurring") return trans.isRecurring;
        return !trans.isRecurring;
      });
    }

    result.sort((a, b) => {
      let comparision = 0;

      switch (sortConfig.field) {
        case "date":
          comparision = new Date(a.date) - new Date(b.data);
          break;

        case "category":
          comparision = a.category.localeCompare(b.category);
          break;

        case "amount":
          comparision = a.amount - b.amount;
          break;

        default:
          comparision = 0;
      }

      return sortConfig.direction === "asc" ? comparision : -comparision;
    });

    setPage(1);
    return result;
  }, [transactions, searchTerm, searchType, searchTransaction, sortConfig]);

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelect = (id) => {
    setSelectedId((prev) =>
      prev?.includes(id) ? prev?.filter((item) => item != id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedId((prev) =>
      prev.length === filteredAndSortedTransactions.length
        ? []
        : filteredAndSortedTransactions.map((item) => item.id)
    );
  };

  const handleBulkDel = async () => {
    console.log(selectedId);
    if (
      !window.confirm(
        `Are you sure to deleted ${selectedId.length} transactions`
      )
    ) {
      return;
    } else {
      deleteFunc(selectedId);
    }
  };

  const handleClearFilter = () => {
    setSearchTerm("");
    setSearchType("");
    setSearchTransaction("");
    setSelectedId([]);
  };

  const handlePages = (type) => {
    if (
      type === "next" &&
      page < Math.round(filteredAndSortedTransactions.length / 10)
    ) {
      setPage((prev) => prev + 1);
    }

    if (type === "prev" && page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-4">
      {deleting && (
        <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
      )}
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onInput={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions..."
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={searchType}
            onValueChange={(val) => setSearchType(val)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={searchTransaction}
            onValueChange={(val) => setSearchTransaction(val)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring Only</SelectItem>
              <SelectItem value="non-recurring">Non-recurring Only</SelectItem>
            </SelectContent>
          </Select>

          {selectedId.length > 0 && (
            <div>
              <Button variant="destructive" size="sm" onClick={handleBulkDel}>
                <Trash className="h-4 w-4 mr-2" />
                Delete Selected ({selectedId.length})
              </Button>
            </div>
          )}

          {(searchTerm || searchType || searchTransaction) && (
            <Button variant="outline" size="icon" onClick={handleClearFilter}>
              <X className="h-4 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Table contents */}
      <div className="rounded-md border mt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    selectedId.length === filteredAndSortedTransactions.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center">
                  Date{" "}
                  {sortConfig.field === "date" &&
                    (sortConfig?.direction === "asc" ? (
                      <ChevronUp />
                    ) : (
                      <ChevronDown />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer">
                <div className="flex items-center">Description</div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center">
                  Category{" "}
                  {sortConfig.field === "category" &&
                    (sortConfig?.direction === "asc" ? (
                      <ChevronUp />
                    ) : (
                      <ChevronDown />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end">
                  Amount{" "}
                  {sortConfig.field === "amount" &&
                    (sortConfig?.direction === "asc" ? (
                      <ChevronUp />
                    ) : (
                      <ChevronDown />
                    ))}
                </div>
              </TableHead>
              <TableHead className="flex justify-center items-center">
                Recurring
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No Transactions Found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedTransactions
                .slice(page * 10 - 10, page * 10)
                .map((transaction) => {
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Checkbox
                          onCheckedChange={() => handleSelect(transaction.id)}
                          checked={selectedId?.includes(transaction.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.date), "PP")}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="capitalize">
                        <span
                          style={{
                            background: categoryColors[transaction.category],
                          }}
                          className="px-2 py-1 rounded-sm text-white text-sm"
                        >
                          {transaction.category}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-right font-medium"
                        style={{
                          color:
                            transaction.type === "EXPENSE" ? "red" : "green",
                        }}
                      >
                        <span className="">
                          {transaction.type === "EXPENSE" ? "-" : "+"}
                          {`$${transaction.amount.toFixed(2)}`}
                        </span>
                      </TableCell>
                      <TableCell className="flex justify-center items-center">
                        {transaction.isRecurring ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant="outline"
                                  className="gap-1 bg-purple-500 hover:bg-purple-200 text-white"
                                >
                                  <RefreshCcw className="h-3 w-3" />
                                  {
                                    RECURRING_INTERVALS[
                                      transaction.recurringInterval
                                    ]
                                  }
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <div className="font-medium">Next Date: </div>
                                  <div>
                                    {format(
                                      new Date(transaction.nextRecurringDate),
                                      "PP"
                                    )}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            One-time
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              outline="none"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/transaction/create?edit=${transaction.id}`
                                )
                              }
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteFunc([transaction.id])}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controller */}
      <div className="py-10">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className="cursor-pointer"
                onClick={() => handlePages("prev")}
              />
            </PaginationItem>
            <PaginationItem className="mx-2">
              <PaginationLink href="#">{`${page} of ${Math.round(
                filteredAndSortedTransactions.length / 10
              )}`}</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                className="cursor-pointer"
                onClick={() => handlePages("next")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default TransactionTable;
