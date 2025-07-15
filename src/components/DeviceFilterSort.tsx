import React from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, ListFilter } from "lucide-react"

interface DeviceFilterSortProps {
  sortBy: "name" | "battery" | "brand" | "updated"
  setSortBy: (v: "name" | "battery" | "brand" | "updated") => void
  sortOrder: "asc" | "desc"
  setSortOrder: (v: "asc" | "desc") => void
  filterBrand: string
  setFilterBrand: (v: string) => void
  filterBattery: string
  setFilterBattery: (v: string) => void
  phoneModels: Record<string, any[]>
}

export const DeviceFilterSort: React.FC<DeviceFilterSortProps> = ({
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  filterBrand,
  setFilterBrand,
  filterBattery,
  setFilterBattery,
  phoneModels,
}) => (
  <div className="flex gap-4 mb-6">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          並び替え:{" "}
          {sortBy === "updated"
            ? "更新日時"
            : sortBy === "name"
            ? "デバイス名"
            : sortBy === "battery"
            ? "バッテリー残量"
            : "ブランド"}
          {sortOrder === "asc" ? " (昇順)" : " (降順)"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>並び替え</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setSortBy("updated")}>更新日時 {sortBy === "updated" && "✓"}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSortBy("name")}>デバイス名 {sortBy === "name" && "✓"}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSortBy("battery")}>バッテリー残量 {sortBy === "battery" && "✓"}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSortBy("brand")}>ブランド {sortBy === "brand" && "✓"}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>順序</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setSortOrder("desc")}>降順 {sortOrder === "desc" && "✓"}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSortOrder("asc")}>昇順 {sortOrder === "asc" && "✓"}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <ListFilter className="h-4 w-4 mr-2" />
          ブランド: {filterBrand === "all" ? "全て" : filterBrand}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>ブランドでフィルタ</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setFilterBrand("all")}>全て {filterBrand === "all" && "✓"}</DropdownMenuItem>
        {Object.keys(phoneModels).map((brand) => (
          <DropdownMenuItem key={brand} onClick={() => setFilterBrand(brand)}>
            {brand} {filterBrand === brand && "✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <ListFilter className="h-4 w-4 mr-2" />
          残量:{" "}
          {filterBattery === "all"
            ? "全て"
            : filterBattery === "high"
            ? "高 (50%以上)"
            : filterBattery === "medium"
            ? "中 (21-50%)"
            : "低 (20%以下)"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>バッテリー残量でフィルタ</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setFilterBattery("all")}>全て {filterBattery === "all" && "✓"}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setFilterBattery("high")}>高 (50%以上) {filterBattery === "high" && "✓"}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setFilterBattery("medium")}>中 (21-50%) {filterBattery === "medium" && "✓"}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setFilterBattery("low")}>低 (20%以下) {filterBattery === "low" && "✓"}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
) 