import React from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, ListFilter } from "lucide-react"
import { useFilterSettings } from "@/hooks/useFilterSettings"

interface DeviceFilterSortProps {
  phoneModels: Record<string, any[]>
}

export const DeviceFilterSort: React.FC<DeviceFilterSortProps> = ({
  phoneModels,
}) => {
  const { settings, updateSettings } = useFilterSettings();

  const handleSortByChange = (newSortBy: 'name' | 'battery_level' | 'last_updated') => {
    updateSettings({ sortBy: newSortBy });
  };

  const handleSortOrderChange = (newSortOrder: 'asc' | 'desc') => {
    updateSettings({ sortOrder: newSortOrder });
  };

  const handleFilterBrandChange = (newFilterBrand: string) => {
    updateSettings({ filterBrand: newFilterBrand });
  };

  const handleFilterBatteryChange = (newFilterBattery: string) => {
    updateSettings({ filterBattery: newFilterBattery });
  };

  const getSortByDisplayName = (sortBy: string) => {
    switch (sortBy) {
      case 'last_updated': return '更新日時';
      case 'name': return 'デバイス名';
      case 'battery_level': return 'バッテリー残量';
      default: return 'デバイス名';
    }
  };

  return (
    <div className="flex flex-wrap w-full gap-2 sm:gap-4 mb-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="sm:w-auto min-w-0">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            並び替え:{" "}
            {getSortByDisplayName(settings.sortBy)}
            {settings.sortOrder === "asc" ? " (昇順)" : " (降順)"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>並び替え</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleSortByChange("last_updated")}>
            更新日時 {settings.sortBy === "last_updated" && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSortByChange("name")}>
            デバイス名 {settings.sortBy === "name" && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSortByChange("battery_level")}>
            バッテリー残量 {settings.sortBy === "battery_level" && "✓"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>順序</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleSortOrderChange("desc")}>
            降順 {settings.sortOrder === "desc" && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSortOrderChange("asc")}>
            昇順 {settings.sortOrder === "asc" && "✓"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="sm:w-auto min-w-0">
            <ListFilter className="h-4 w-4 mr-2" />
            ブランド: {settings.filterBrand === "all" ? "全て" : settings.filterBrand}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>ブランドでフィルタ</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleFilterBrandChange("all")}>
            全て {settings.filterBrand === "all" && "✓"}
          </DropdownMenuItem>
          {Object.keys(phoneModels).map((brand) => (
            <DropdownMenuItem key={brand} onClick={() => handleFilterBrandChange(brand)}>
              {brand} {settings.filterBrand === brand && "✓"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="sm:w-auto min-w-0">
            <ListFilter className="h-4 w-4 mr-2" />
            残量:{" "}
            {settings.filterBattery === "all"
              ? "全て"
              : settings.filterBattery === "high"
              ? "高 (50%以上)"
              : settings.filterBattery === "medium"
              ? "中 (21-50%)"
              : "低 (20%以下)"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>バッテリー残量でフィルタ</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleFilterBatteryChange("all")}>
            全て {settings.filterBattery === "all" && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterBatteryChange("high")}>
            高 (50%以上) {settings.filterBattery === "high" && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterBatteryChange("medium")}>
            中 (21-50%) {settings.filterBattery === "medium" && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterBatteryChange("low")}>
            低 (20%以下) {settings.filterBattery === "low" && "✓"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 