"use client";

import { useState } from "react";
import { CareCoordinationActivityType } from "@prisma/client";
import { ACTIVITY_TYPE_OPTIONS } from "@/lib/care-coordination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Calendar, AlertCircle } from "lucide-react";

export interface CareCoordinationFilters {
  activityType?: CareCoordinationActivityType;
  startDate?: string;
  endDate?: string;
  followUpNeeded?: boolean;
}

interface CareCoordinationFiltersProps {
  filters: CareCoordinationFilters;
  onChange: (filters: CareCoordinationFilters) => void;
}

export function CareCoordinationFiltersComponent({
  filters,
  onChange,
}: CareCoordinationFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  const clearFilters = () => {
    onChange({});
  };

  const setFilter = <K extends keyof CareCoordinationFilters>(
    key: K,
    value: CareCoordinationFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof CareCoordinationFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onChange(newFilters);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-auto p-1 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Activity Type */}
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select
                value={filters.activityType || ""}
                onValueChange={(value) =>
                  setFilter(
                    "activityType",
                    value as CareCoordinationActivityType | undefined
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {ACTIVITY_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Date Range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={filters.startDate || ""}
                    onChange={(e) => setFilter("startDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={filters.endDate || ""}
                    onChange={(e) => setFilter("endDate", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Follow-up Needed */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="follow-up-filter"
                checked={filters.followUpNeeded || false}
                onCheckedChange={(checked) =>
                  setFilter("followUpNeeded", checked ? true : undefined)
                }
              />
              <Label
                htmlFor="follow-up-filter"
                className="flex items-center gap-1 text-sm font-normal cursor-pointer"
              >
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Show only items needing follow-up
              </Label>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {filters.activityType && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {
                ACTIVITY_TYPE_OPTIONS.find((o) => o.value === filters.activityType)
                  ?.label
              }
              <button
                onClick={() => clearFilter("activityType")}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.startDate || filters.endDate) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.startDate && filters.endDate
                ? `${filters.startDate} - ${filters.endDate}`
                : filters.startDate
                ? `From ${filters.startDate}`
                : `To ${filters.endDate}`}
              <button
                onClick={() => {
                  clearFilter("startDate");
                  clearFilter("endDate");
                }}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.followUpNeeded && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Follow-up needed
              <button
                onClick={() => clearFilter("followUpNeeded")}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
